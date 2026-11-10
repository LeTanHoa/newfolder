import * as XLSX from 'xlsx-js-style'
import ExcelJS from 'exceljs'

// Chuẩn hoá tên cột: bỏ dấu, hoa/thường, và MỌI ký tự không phải chữ/số (khoảng trắng, dấu chấm,
// dấu gạch, ngoặc, %, ...). Nhờ vậy "Sub Dept." , "Tỷ lệ (%)", "Mã NCC" đều so khớp ổn định
// bất kể file gốc trình bày khác nhau chút ít.
const normalizeKey = (key) => String(key ?? '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]/g, '')

// Parse số "thông minh": tự nhận diện định dạng Việt Nam (1.234,56) lẫn định dạng quốc tế
// (1,234.56) tuỳ theo dữ liệu thực tế trong ô — vì các file ERP khác nhau xuất ra khác định dạng
// (ví dụ file "Tỷ lệ" dùng dấu phẩy làm phân cách nghìn kiểu quốc tế: "5,786" nghĩa là 5786).
export const toNumber = (value) => {
  if (typeof value === 'number') return value
  let text = String(value ?? '').trim()
  if (!text) return 0
  text = text.replace(/%/g, '').trim()
  const hasComma = text.includes(',')
  const hasDot = text.includes('.')
  if (hasComma && hasDot) {
    const lastComma = text.lastIndexOf(',')
    const lastDot = text.lastIndexOf('.')
    // Dấu xuất hiện sau cùng là dấu thập phân; dấu còn lại là phân cách nghìn.
    text = lastComma > lastDot ? text.replace(/\./g, '').replace(',', '.') : text.replace(/,/g, '')
  } else if (hasComma) {
    text = /^-?\d{1,3}(,\d{3})+$/.test(text) ? text.replace(/,/g, '') : text.replace(',', '.')
  } else if (hasDot) {
    text = /^-?\d{1,3}(\.\d{3})+$/.test(text) ? text.replace(/\./g, '') : text
  }
  const parsed = Number(text)
  return Number.isFinite(parsed) ? parsed : 0
}

const getCellText = (cell) => {
  const value = cell?.value
  if (value == null) return ''
  if (typeof value === 'object' && value.result != null) return String(value.result)
  if (typeof value === 'object' && value.richText) return value.richText.map((part) => part.text).join('')
  if (value instanceof Date) return value.toISOString()
  return String(value)
}

export const findReportSheet = (workbook, name) => {
  const wanted = normalizeKey(name)
  return workbook.worksheets.find((sheet) => normalizeKey(sheet.name) === wanted)
}

const findHeaderInSheet = (sheet, names, maxRows = 30) => {
  const wanted = names.map(normalizeKey)
  let lastRow = 1
  sheet.eachRow({ includeEmpty: false }, (_row, rowNumber) => { lastRow = rowNumber })
  for (let row = 1; row <= Math.min(maxRows, lastRow); row += 1) {
    const rowValues = sheet.getRow(row).values.slice(1)
    for (let col = 0; col < rowValues.length; col += 1) {
      const cellValue = normalizeKey(getCellText({ value: rowValues[col] }))
      if (wanted.includes(cellValue)) return { row, column: col + 1 }
    }
  }
  return null
}

const findColumnInSheet = (sheet, aliases, headerRow = 1) => {
  const wanted = aliases.map(normalizeKey)
  const row = sheet.getRow(headerRow)
  const maxCol = Math.max(row.cellCount || 0, sheet.columnCount || 0, 50)
  for (let col = 1; col <= maxCol; col += 1) {
    const cellValue = normalizeKey(getCellText(row.getCell(col)))
    if (wanted.includes(cellValue)) return col
  }
  return null
}

const getLastRow = (sheet) => {
  let last = 1
  sheet.eachRow({ includeEmpty: false }, (_row, rowNumber) => { last = rowNumber })
  return last
}

const clearSheetValues = (sheet) => {
  sheet.eachRow({ includeEmpty: true }, (row) => {
    row.eachCell({ includeEmpty: true }, (cell) => { cell.value = null })
  })
}

const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF5B9BD5' } }

const fillHeaderRow = (sheet, columnCount = sheet.columnCount || 1) => {
  for (let column = 1; column <= Math.max(columnCount, 1); column += 1) {
    sheet.getCell(1, column).fill = headerFill
  }
}

// Tách phần "DD/MM" ở CUỐI một chuỗi header, ví dụ "SL Tồn 23/08" -> { day: 23, month: 8 }.
// Không dùng normalizeKey ở đây vì normalizeKey đã loại bỏ dấu "/".
const extractDateSuffix = (text) => {
  const match = String(text ?? '').match(/(\d{1,2})\s*\/\s*(\d{1,2})\s*$/)
  if (!match) return null
  const day = Number(match[1])
  const month = Number(match[2])
  if (day < 1 || day > 31 || month < 1 || month > 12) return null
  return { day, month }
}

const pad2 = (value) => String(value).padStart(2, '0')
const formatDayMonth = (date) => `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}`
const formatFileDate = (date) => `${pad2(date.getDate())}${pad2(date.getMonth() + 1)}${date.getFullYear()}`
const parseDateFromFileName = (fileName) => {
  const match = String(fileName ?? '').match(/(?:^|\D)(\d{2})(\d{2})(\d{4})(?=\D|$)/)
  if (!match) return null
  const date = new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]))
  if (date.getFullYear() !== Number(match[3]) || date.getMonth() !== Number(match[2]) - 1 || date.getDate() !== Number(match[1])) return null
  return date
}

// Sheet "SKU Ton Am Old" là kết quả "SKU TON AM NEW" của lần chạy TRƯỚC, nên tên cột luôn có
// hậu tố ngày động (vd "Tồn 22/08", "SL Tồn 23/08"). Hàm này tìm đúng cột có ngày GẦN NHẤT
// (tức là cột phản ánh tồn kho "hôm qua" so với lần chạy hiện tại), đồng thời trả về luôn
// ngày đó để tự suy ra nhãn cột cho báo cáo hôm nay — không cần người dùng nhập ngày thủ công.
const findLatestDateColumn = (sheet, headerRow, basePrefixes) => {
  const bases = basePrefixes.map(normalizeKey)
  const row = sheet.getRow(headerRow)
  const maxCol = Math.max(row.cellCount || 0, sheet.columnCount || 0, 50)
  let best = null
  for (let col = 1; col <= maxCol; col += 1) {
    const raw = getCellText(row.getCell(col))
    if (!raw) continue
    const dateSuffix = extractDateSuffix(raw)
    const withoutDate = raw.replace(/(\d{1,2})\s*\/\s*(\d{1,2})\s*$/, '').trim()
    const normalizedBase = normalizeKey(withoutDate || raw)
    const matchesBase = bases.some((base) => normalizedBase.startsWith(base) || (normalizedBase && base.startsWith(normalizedBase)))
    if (!matchesBase) continue
    const score = dateSuffix ? dateSuffix.month * 100 + dateSuffix.day : -1
    if (!best || score > best.score) best = { column: col, score, date: dateSuffix }
  }
  return best
}

// Đọc 1 sheet từ file nguồn (buffer .xlsx/.xls). Nếu file có NHIỀU sheet (ví dụ người dùng lỡ
// upload nguyên file báo cáo tổng hợp của ngày hôm trước thay vì file xuất từ ERP), hàm sẽ tự
// tìm đúng sheet cần dùng theo tên, rồi theo việc sheet đó có chứa các cột header mong đợi hay
// không, thay vì luôn luôn lấy sheet đầu tiên (dễ lấy nhầm sheet).
const pickSourceSheet = (buffer, { preferredNames = [], requiredHeaderNames = [] } = {}) => {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
  const sheetNames = workbook.SheetNames
  if (sheetNames.length === 1) return workbook.Sheets[sheetNames[0]]

  const normalizedPreferred = preferredNames.map(normalizeKey)
  const byName = sheetNames.find((name) => normalizedPreferred.includes(normalizeKey(name)))
  if (byName) return workbook.Sheets[byName]

  if (requiredHeaderNames.length) {
    const normalizedRequired = requiredHeaderNames.map(normalizeKey)
    const byHeader = sheetNames.find((name) => {
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1, defval: '' })
      const headerRow = (rows.find((candidate) => candidate.some((cell) => String(cell ?? '').trim())) || [])
      return headerRow.some((cell) => normalizedRequired.includes(normalizeKey(cell)))
    })
    if (byHeader) return workbook.Sheets[byHeader]
  }
  return workbook.Sheets[sheetNames[0]]
}

const copySourceSheetTo = (sourceBuffer, targetSheet, options = {}) => {
  const sourceSheet = pickSourceSheet(sourceBuffer, options)
  const data = XLSX.utils.sheet_to_json(sourceSheet, { header: 1, defval: '' })
  clearSheetValues(targetSheet)
  data.forEach((row, rowIndex) => {
    row.forEach((value, colIndex) => {
      targetSheet.getCell(rowIndex + 1, colIndex + 1).value = value
    })
  })
  fillHeaderRow(targetSheet, data[0]?.length)
}

const findColumnInRow = (headers, aliases) => {
  const wanted = aliases.map(normalizeKey)
  return headers.findIndex((value) => {
    const normalized = normalizeKey(value)
    return normalized && wanted.some((name) => normalized === name || normalized.includes(name))
  })
}

const getNormalizedSupplierCode = (value) => {
  const text = String(value ?? '').trim()
  if (!text || normalizeKey(text) === 'na') return ''
  const numericValue = toNumber(text)
  return numericValue ? String(numericValue) : text.toUpperCase()
}

const findTabularSource = (buffer, requiredColumns) => {
  const sourceWorkbook = XLSX.read(buffer, { type: 'array', cellDates: true })
  for (const sheetName of sourceWorkbook.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(sourceWorkbook.Sheets[sheetName], { header: 1, defval: '' })
    for (let headerRow = 0; headerRow < Math.min(rows.length, 200); headerRow += 1) {
      const headers = rows[headerRow] || []
      const columns = Object.fromEntries(Object.entries(requiredColumns).map(([key, aliases]) => [key, findColumnInRow(headers, aliases)]))
      if (Object.values(columns).every((column) => column >= 0)) return { headers, rows, headerRow, ...columns }
    }
  }
  return null
}

const writeSourceHeaders = (sheet, headers, headerRow = 1) => {
  headers.forEach((value, column) => { sheet.getCell(headerRow, column + 1).value = value })
  if (headerRow === 1) fillHeaderRow(sheet, headers.length)
}

// Giữ export cũ để tương thích ngược nếu có chỗ khác đang import tên này.
export const copyWorkbookFirstSheetTo = (sourceBuffer, targetSheet) => copySourceSheetTo(sourceBuffer, targetSheet)

export const negativeGroupSheets = { 1: 'TPTS', 2: 'TPCN', 3: 'HMP', 4: 'DD', 5: 'MM', 6: 'BM' }

// Cấu hình loại trừ khớp với trang "Cấu hình mapping" của app:
// - excludedDepartments: các cặp "Dept-SubDept" bị loại khỏi tính tồn âm (mặc định "146-20" theo
//   cấu hình hiện có trên UI — ví dụ nhóm khẩu trang/hàng khuyến mãi không tính tồn).
// - excludedSupplierNames: NCC loại trừ theo TÊN (đối chiếu "Nhà cung cấp" nếu ALL có cột này).
//   Việc loại trừ theo NCC "BCBH" (mua bán ký gửi) đã được xử lý TỰ ĐỘNG bên dưới bằng cách đối
//   chiếu "Mã NCC" của ALL với cột VENDOR trong file "DS NCC TT THEO BCBH" — không cần cấu hình tay.
export const excludedDepartments = ['146-20']
export const excludedSupplierNames = []

const buildNote = (oldStock, current) => {
  if (oldStock < 0 && current >= 0) return 'Không còn tồn âm'
  if (oldStock === 0) return 'Mới phát sinh'
  if (current < oldStock) return 'Tăng'
  if (current > oldStock) return 'Giảm'
  return 'Không thay đổi'
}

export const processNegativeInventoryReport = async (templateBuffer, files) => {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(templateBuffer)

  const allSheet = findReportSheet(workbook, 'ALL')
  const oldSheet = findReportSheet(workbook, 'SKU Ton Am Old')
  const newSheet = findReportSheet(workbook, 'SKU TON AM NEW')
  const summarySheet = findReportSheet(workbook, 'TONG HOP')
  const mmSheet = findReportSheet(workbook, 'TON KHO MM')
  const bmiSheet = findReportSheet(workbook, 'TON KHO BMI')
  if (!allSheet || !oldSheet || !newSheet) {
    throw new Error('Template thiếu sheet ALL, SKU Ton Am Old hoặc SKU TON AM NEW')
  }

  // 1) Đổ dữ liệu thô vào các sheet nguồn. Dùng pickSourceSheet để tự tìm đúng sheet cần lấy
  //    ngay cả khi người dùng lỡ upload nguyên file báo cáo nhiều sheet của hôm trước.
  // Hai file người dùng chọn là hai báo cáo tồn âm. Ưu tiên đúng sheet SKU TON AM NEW,
  // kể cả khi file xuất có đồng thời sheet ALL.
  copySourceSheetTo(files.beginningStock, allSheet, { preferredNames: ['SKU TON AM NEW', 'SKU Ton Am New'], requiredHeaderNames: ['SKU'] })
  copySourceSheetTo(files.yesterdayStock, oldSheet, { preferredNames: ['SKU TON AM NEW', 'SKU Ton Am New', 'SKU Ton Am Old'], requiredHeaderNames: ['SKU'] })
  if (files.negativeRate && summarySheet) copySourceSheetTo(files.negativeRate, summarySheet, { preferredNames: ['TONG HOP'], requiredHeaderNames: ['Ngành hàng', 'Nganh hang'] })

  const supplierTarget = findReportSheet(workbook, 'DS NCC TT THEO BCBH')
  if (supplierTarget && files.supplierList) {
    copySourceSheetTo(files.supplierList, supplierTarget, { preferredNames: ['DS NCC TT THEO BCBH'], requiredHeaderNames: ['VENDOR'] })
  }

  // TON KHO MM chỉ lấy các NCC có trong DS NCC TT THEO BCBH. Giữ cả hàng tiêu đề,
  // bỏ NCC/giá trị "N/A" và cộng Trị Giá Tồn Hiện Tại ở cuối bảng.
  let bcbhMmInventoryTotal = 0
  let apparelInventoryTotal = 0
  if (files.apparelStock && mmSheet) {
    const mmSource = findTabularSource(files.apparelStock, {
      supplierCol: ['Mã NCC', 'Ma NCC', 'VENDOR'],
      valueCol: ['Trị Giá Tồn Hiện Tại', 'Tri Gia Ton Hien Tai'],
    })
    if (!mmSource) throw new Error('File Tồn kho may mặc thiếu cột Mã NCC/VENDOR hoặc Trị Giá Tồn Hiện Tại')

    const supplierCodes = new Set()
    if (supplierTarget) {
      const supplierHeader = findHeaderInSheet(supplierTarget, ['VENDOR'])
      const supplierColumn = supplierHeader && findColumnInSheet(supplierTarget, ['VENDOR'], supplierHeader.row)
      if (supplierColumn) {
        for (let row = supplierHeader.row + 1; row <= getLastRow(supplierTarget); row += 1) {
          const code = getNormalizedSupplierCode(getCellText(supplierTarget.getCell(row, supplierColumn)))
          if (code) supplierCodes.add(code)
        }
      }
    }

    clearSheetValues(mmSheet)
    writeSourceHeaders(mmSheet, mmSource.headers)
    let outputRow = 2
    let inventoryTotal = 0
    for (let row = mmSource.headerRow + 1; row < mmSource.rows.length; row += 1) {
      const sourceRow = mmSource.rows[row]
      const supplierCode = getNormalizedSupplierCode(sourceRow[mmSource.supplierCol])
      const rawValue = String(sourceRow[mmSource.valueCol] ?? '').trim()
      if (normalizeKey(rawValue) !== 'na') apparelInventoryTotal += toNumber(sourceRow[mmSource.valueCol])
      if (!supplierCode || !supplierCodes.has(supplierCode) || normalizeKey(rawValue) === 'na') continue
      sourceRow.forEach((value, column) => { mmSheet.getCell(outputRow, column + 1).value = value })
      inventoryTotal += toNumber(sourceRow[mmSource.valueCol])
      outputRow += 1
    }
    const labelColumn = mmSource.headers.findIndex((_value, column) => column !== mmSource.valueCol)
    if (labelColumn >= 0) mmSheet.getCell(outputRow, labelColumn + 1).value = 'TỔNG CỘNG'
    mmSheet.getCell(outputRow, mmSource.valueCol + 1).value = inventoryTotal
    mmSheet.getCell(outputRow, mmSource.valueCol + 1).numFmt = '#,##0'
    bcbhMmInventoryTotal = inventoryTotal
  }

  // 2) Xác định các cột cần dùng trong ALL.
  const allHeader = findHeaderInSheet(allSheet, ['SKU'])
  const oldHeader = findHeaderInSheet(oldSheet, ['SKU'])
  if (!allHeader || !oldHeader) throw new Error('Không tìm thấy cột SKU trong ALL hoặc SKU Ton Am Old')

  // File ERP có thể đặt tên cột là "SL Tồn" hoặc "SL Tồn DD/MM".
  const allStockCol = findColumnInSheet(allSheet, ['SL Tồn', 'SL Ton', 'Tồn kho', 'SL tồn hiện tại'], allHeader.row)
    || findLatestDateColumn(allSheet, allHeader.row, ['SL Tồn', 'Tồn'])?.column
  const allCodeCol = findColumnInSheet(allSheet, ['Mã 5NH', 'Ma 5NH', 'Mã 5 NH'], allHeader.row)
  if (!allStockCol || !allCodeCol) throw new Error('Không tìm thấy cột SL Tồn hoặc Mã 5NH trong sheet ALL')

  const nameCol = findColumnInSheet(allSheet, ['Tên hàng', 'Ten hang', 'Tên sản phẩm'], allHeader.row)
  const deptCol = findColumnInSheet(allSheet, ['Dept', 'Dept.', 'Phòng ban'], allHeader.row)
  const subDeptCol = findColumnInSheet(allSheet, ['Sub Dept', 'Sub Dept.'], allHeader.row)
  const classCol = findColumnInSheet(allSheet, ['Class'], allHeader.row)
  const subClassCol = findColumnInSheet(allSheet, ['Sub Class'], allHeader.row)
  const manccCol = findColumnInSheet(allSheet, ['Mã NCC', 'Ma NCC'], allHeader.row)
  const supplierNameCol = findColumnInSheet(allSheet, ['Nhà cung cấp', 'Ten NCC', 'Tên NCC'], allHeader.row)

  // TON KHO BMI lấy từ sheet ALL sau khi đổ dữ liệu của SKU TON AM NEW.
  // Chỉ Mã 5NH = 6, bỏ NCC 17203 và 22478, đồng thời bỏ thêm NCC người dùng nhập.
  let bmiInventoryTotal = 0
  if (bmiSheet) {
    const bmiHeader = findHeaderInSheet(allSheet, ['SKU'])
    const bmiCodeColumn = bmiHeader && findColumnInSheet(allSheet, ['Mã 5NH', 'Ma 5NH', 'Mã 5 NH'], bmiHeader.row)
    const bmiSupplierColumn = bmiHeader && findColumnInSheet(allSheet, ['Mã NCC', 'Ma NCC'], bmiHeader.row)
    const bmiValueColumn = bmiHeader && findColumnInSheet(allSheet, ['Trị Giá Tồn Hiện Tại', 'Tri Gia Ton Hien Tai'], bmiHeader.row)
    const bmiSource = bmiHeader && {
      headers: allSheet.getRow(bmiHeader.row).values.slice(1).map((value) => getCellText({ value })),
      rows: Array.from({ length: getLastRow(allSheet) }, (_, index) => allSheet.getRow(index + 1).values.slice(1)),
      headerRow: bmiHeader.row - 1,
      codeCol: bmiCodeColumn - 1,
      supplierCol: bmiSupplierColumn - 1,
      valueCol: bmiValueColumn - 1,
    }
    if (!bmiSource || bmiSource.codeCol < 0 || bmiSource.supplierCol < 0 || bmiSource.valueCol < 0) throw new Error('Sheet SKU TON AM NEW thiếu cột Mã 5NH, Mã NCC hoặc Trị Giá Tồn Hiện Tại')

    // Chép cả tiêu đề cột từ nguồn để tiêu đề luôn đồng nhất với dữ liệu xuất ra.
    clearSheetValues(bmiSheet)
    writeSourceHeaders(bmiSheet, bmiSource.headers)
    const sourceToTargetColumns = bmiSource.headers.map((_, sourceCol) => ({ sourceCol, targetCol: sourceCol + 1 }))
    const bmiValueCol = bmiSource.valueCol + 1

    const excludedBmiSuppliers = new Set(['17203', '22478', ...String(files.bmiExcludedSuppliers || '').split(/[\n,;]+/).map((supplier) => getNormalizedSupplierCode(supplier)).filter(Boolean)])
    let bmiOutputRow = 2
    for (let row = bmiSource.headerRow + 1; row < bmiSource.rows.length; row += 1) {
      const sourceRow = bmiSource.rows[row]
      const code5 = String(sourceRow[bmiSource.codeCol] ?? '').trim().toUpperCase().replace(/\s+/g, '')
      const supplierCode = getNormalizedSupplierCode(sourceRow[bmiSource.supplierCol])
      const isBmiCode = code5 === '6' || code5 === 'NH6' || toNumber(code5) === 6
      if (!isBmiCode || excludedBmiSuppliers.has(supplierCode)) continue
      sourceToTargetColumns.forEach(({ sourceCol, targetCol }) => {
        bmiSheet.getCell(bmiOutputRow, targetCol).value = sourceRow[sourceCol]
      })
      bmiInventoryTotal += toNumber(sourceRow[bmiSource.valueCol])
      bmiOutputRow += 1
    }
    const bmiTotalRow = bmiOutputRow
    const labelCol = sourceToTargetColumns.find(({ targetCol }) => targetCol !== bmiValueCol)?.targetCol
    if (labelCol) bmiSheet.getCell(bmiTotalRow, labelCol).value = 'TỔNG CỘNG'
    bmiSheet.getCell(bmiTotalRow, bmiValueCol).value = bmiInventoryTotal
    bmiSheet.getCell(bmiTotalRow, bmiValueCol).numFmt = '#,##0'
  }

  // 3) Tồn kho hôm qua: tra theo đúng cột SKU của SKU Ton Am Old (KHÔNG dùng cột SKU của ALL —
  //    đây là lỗi đã sửa so với bản trước). Đồng thời tự suy ra ngày báo cáo hôm nay/hôm qua từ
  //    chính tên cột ngày gần nhất có trong sheet này.
  const oldStockCol = findLatestDateColumn(oldSheet, oldHeader.row, ['SL Tồn', 'Tồn'])
  if (!oldStockCol) throw new Error('Không tìm thấy cột tồn kho (dạng "Tồn DD/MM") trong SKU Ton Am Old')

  let previousDate = parseDateFromFileName(files.yesterdayStockName) || new Date(Date.now() - 86400000)
  let currentDate = new Date()
  if (!files.yesterdayStockName && oldStockCol.date) {
    previousDate = new Date(new Date().getFullYear(), oldStockCol.date.month - 1, oldStockCol.date.day)
  }
  const previousLabel = formatDayMonth(previousDate)
  const currentLabel = formatDayMonth(currentDate)

  const getSheetValue = (sheet, row, column) => (column ? sheet.getCell(row, column).value : '')
  const getSkuKey = (sku) => String(sku ?? '').trim().toUpperCase()

  const oldCode5Col = findColumnInSheet(oldSheet, ['Mã 5NH', 'Ma 5NH', 'Mã 5 NH'], oldHeader.row)
  const oldDeptCol = findColumnInSheet(oldSheet, ['Dept', 'Dept.', 'Phòng ban'], oldHeader.row)
  const oldSubDeptCol = findColumnInSheet(oldSheet, ['Sub Dept', 'Sub Dept.'], oldHeader.row)
  const oldClassCol = findColumnInSheet(oldSheet, ['Class'], oldHeader.row)
  const oldSubClassCol = findColumnInSheet(oldSheet, ['Sub Class'], oldHeader.row)
  const oldSupplierCodeCol = findColumnInSheet(oldSheet, ['Mã NCC', 'Ma NCC'], oldHeader.row)
  const oldNameCol = findColumnInSheet(oldSheet, ['Tên hàng', 'Ten hang', 'Tên sản phẩm'], oldHeader.row)

  const oldEntriesBySku = new Map()
  for (let row = oldHeader.row + 1; row <= getLastRow(oldSheet); row += 1) {
    const sku = getCellText(oldSheet.getCell(row, oldHeader.column)).trim()
    if (!sku) continue
    const skuKey = getSkuKey(sku)
    const oldCode5Value = getCellText(oldSheet.getCell(row, oldCode5Col)).trim()
    const oldStock = toNumber(getCellText(oldSheet.getCell(row, oldStockCol.column)))
    const existingEntry = oldEntriesBySku.get(skuKey)
    if (existingEntry) {
      // Nếu file nguồn có nhiều dòng cho cùng SKU, phải cộng trước khi so sánh.
      existingEntry.current += oldStock
      continue
    }
    oldEntriesBySku.set(skuKey, {
      code5: String(toNumber(oldCode5Value) || oldCode5Value),
      dept: getSheetValue(oldSheet, row, oldDeptCol),
      subDept: getSheetValue(oldSheet, row, oldSubDeptCol),
      className: getSheetValue(oldSheet, row, oldClassCol),
      subClass: getSheetValue(oldSheet, row, oldSubClassCol),
      supplierCode: getSheetValue(oldSheet, row, oldSupplierCodeCol),
      sku,
      name: getSheetValue(oldSheet, row, oldNameCol),
      current: oldStock,
    })
  }

  const negativeEntries = []
  const currentEntriesBySku = new Map()
  for (let row = allHeader.row + 1; row <= getLastRow(allSheet); row += 1) {
    const sku = getCellText(allSheet.getCell(row, allHeader.column)).trim()
    const current = toNumber(getCellText(allSheet.getCell(row, allStockCol)))
    if (!sku) continue
    const skuKey = getSkuKey(sku)

    const supplierName = supplierNameCol ? getCellText(allSheet.getCell(row, supplierNameCol)).trim() : ''

    const existingEntry = currentEntriesBySku.get(skuKey)
    if (existingEntry) {
      existingEntry.current += current
      continue
    }
    const code5Value = getCellText(allSheet.getCell(row, allCodeCol)).trim()
    currentEntriesBySku.set(skuKey, {
      code5: String(toNumber(code5Value) || code5Value),
      dept: getSheetValue(allSheet, row, deptCol),
      subDept: getSheetValue(allSheet, row, subDeptCol),
      className: getSheetValue(allSheet, row, classCol),
      subClass: getSheetValue(allSheet, row, subClassCol),
      supplierCode: getSheetValue(allSheet, row, manccCol),
      sku,
      name: getSheetValue(allSheet, row, nameCol),
      current,
      supplierName,
    })
  }

  // Full join theo SKU: vừa có SKU âm mới, vừa giữ SKU âm hôm qua nhưng hiện tại đã hết âm.
  currentEntriesBySku.forEach((entry, skuKey) => {
    if (entry.current >= 0) return
    const oldStock = oldEntriesBySku.get(skuKey)?.current ?? 0
    negativeEntries.push({ ...entry, oldStock, note: buildNote(oldStock, entry.current) })
  })

  oldEntriesBySku.forEach((entry, skuKey) => {
    const currentEntry = currentEntriesBySku.get(skuKey)
    if (entry.current >= 0 || currentEntry?.current < 0) return
    const current = currentEntry?.current ?? 0
    negativeEntries.push({
      ...entry,
      oldStock: entry.current,
      current,
      note: buildNote(entry.current, current),
      supplierName: '',
    })
  })

  const currentNegativeCount = negativeEntries.filter((entry) => entry.current < 0).length
  const outputHeader = ['Mã 5NH', 'Dept.', 'Sub Dept.', 'Class', 'Sub Class', 'Mã NCC', 'SKU', 'Tên Hàng', `Tồn ${previousLabel}`, `Tồn ${currentLabel}`, 'PH BGD', 'Ghi chú']
  const buildRowValues = (entry) => [
    entry.code5,
    entry.dept,
    entry.subDept,
    entry.className,
    entry.subClass,
    entry.supplierCode,
    entry.sku,
    entry.name,
    entry.oldStock,
    entry.current,
    null,
    entry.note,
  ]
  const noteColors = {
    "Giảm": '92D050',
    "Không còn tồn âm": '00B050',
    "Không thay đổi": '00B0F0',
    "Mới phát sinh": 'FFFF00',
    "Tăng": 'FFC000',
  }
  const noteColumn = outputHeader.indexOf('Ghi chú') + 1
  const noFill = { type: 'pattern', pattern: 'none' }
  const applyNoteColor = (cell, note) => {
    const color = noteColors[note]
    if (!color) return

    // Tách style của ô để không ghi đè màu những ô khác có cùng style template.
    cell.style = {
      ...cell.style,
      fill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: color },
      },
    }
  }
  const clearNoteColor = (cell) => {
    cell.style = { ...cell.style, fill: noFill }
  }
  const clearNoteColumnDefaultFill = (sheet) => {
    // Cột Ghi chú trong template có fill xanh mặc định. Nếu không bỏ ở cấp cột,
    // mọi hàng trống phía dưới dữ liệu vẫn kế thừa màu này.
    const column = sheet.getColumn(noteColumn)
    column.style = { ...column.style, fill: noFill }
  }
  const sortedNegativeEntries = [...negativeEntries].sort((left, right) => (
    left.note.localeCompare(right.note, 'vi') || left.current - right.current
  ))

  const writeEntriesToSheet = (targetSheet, entries) => {
    // Giữ nguyên layout, định dạng, merge và công thức của template; chỉ thay dữ liệu đầu ra.
    const lastRow = Math.max(getLastRow(targetSheet), targetSheet.rowCount || 1)
    clearNoteColumnDefaultFill(targetSheet)
    for (let row = 2; row <= lastRow; row += 1) {
      for (let col = 1; col <= outputHeader.length; col += 1) targetSheet.getCell(row, col).value = null
    }
    outputHeader.forEach((title, col) => {
      const cell = targetSheet.getCell(1, col + 1)
      if (col === 8 || col === 9 || !getCellText(cell).trim()) cell.value = title
    })
    fillHeaderRow(targetSheet, outputHeader.length)
    entries.forEach((entry, index) => {
      const rowNumber = index + 2
      const values = buildRowValues(entry)
      values.forEach((value, col) => { targetSheet.getCell(rowNumber, col + 1).value = value })
      applyNoteColor(targetSheet.getCell(rowNumber, noteColumn), entry.note)
    })
    for (let row = entries.length + 2; row <= lastRow; row += 1) {
      clearNoteColor(targetSheet.getCell(row, noteColumn))
    }
  }

  // SKU TON AM NEW là nguồn dữ liệu và định dạng duy nhất. Các sheet ngành chỉ nhận
  // những dòng đã được sắp xếp trong sheet này, nên giá trị, màu nền và màu chữ luôn trùng khớp.
  const copyCellFromMaster = (sourceCell, targetCell) => {
    targetCell.value = sourceCell.value
    targetCell.style = sourceCell.style
  }

  const copyMasterRowsToGroupSheet = (targetSheet, code) => {
    const targetLastRow = Math.max(getLastRow(targetSheet), targetSheet.rowCount || 1)
    clearNoteColumnDefaultFill(targetSheet)
    for (let row = 1; row <= targetLastRow; row += 1) {
      for (let col = 1; col <= outputHeader.length; col += 1) targetSheet.getCell(row, col).value = null
    }

    // Luôn sao chép hàng tiêu đề từ SKU TON AM NEW trước.
    for (let col = 1; col <= outputHeader.length; col += 1) {
      copyCellFromMaster(newSheet.getCell(1, col), targetSheet.getCell(1, col))
    }
    targetSheet.getRow(1).height = newSheet.getRow(1).height

    let outputRow = 2
    for (let sourceRow = 2; sourceRow <= getLastRow(newSheet); sourceRow += 1) {
      const rawCode = getCellText(newSheet.getCell(sourceRow, 1)).trim()
      const sourceCode = String(toNumber(rawCode) || rawCode.replace(/^NH/i, '').trim())
      const targetCode = String(code).replace(/^NH/i, '').trim()
      if (sourceCode !== targetCode) continue
      for (let col = 1; col <= outputHeader.length; col += 1) {
        copyCellFromMaster(newSheet.getCell(sourceRow, col), targetSheet.getCell(outputRow, col))
      }
      // Gán lại màu ghi chú sau khi copy style để các sheet NH luôn dùng đúng bảng noteColors.
      const note = getCellText(newSheet.getCell(sourceRow, noteColumn)).trim()
      applyNoteColor(targetSheet.getCell(outputRow, noteColumn), note)
      targetSheet.getRow(outputRow).height = newSheet.getRow(sourceRow).height
      outputRow += 1
    }
    for (let row = outputRow; row <= targetLastRow; row += 1) {
      clearNoteColor(targetSheet.getCell(row, noteColumn))
    }
  }

  writeEntriesToSheet(newSheet, sortedNegativeEntries)
  Object.entries(negativeGroupSheets).forEach(([code, sheetName]) => {
    const target = findReportSheet(workbook, sheetName)
    if (!target) return
    copyMasterRowsToGroupSheet(target, code)
  })

  // TONG HOP: giữ số liệu theo từng ngành từ file nguồn, chỉ tính lại hàng Tổng cộng.
  // Tỷ lệ luôn bằng Tồn âm / Tổng số SKU, không cộng các tỷ lệ từng ngành.
  if (summarySheet) {
    const summaryHeader = findHeaderInSheet(summarySheet, ['Ngành hàng', 'Nganh hang'])
    if (summaryHeader) {
      const skuCol = findColumnInSheet(summarySheet, ['Tổng số SKU', 'Tong so SKU', 'SKU'], summaryHeader.row)
      const negativeCol = findColumnInSheet(summarySheet, ['Tồn âm', 'Ton am'], summaryHeader.row)
      const rateCol = findColumnInSheet(summarySheet, ['Tỷ lệ', 'Ty le', 'Tỷ lệ (%)'], summaryHeader.row)
      if (skuCol && negativeCol && rateCol) {
        let totalSku = 0
        let totalNegative = 0
        let totalRow = null
        for (let row = summaryHeader.row + 1; row <= getLastRow(summarySheet); row += 1) {
          const label = normalizeKey(getCellText(summarySheet.getCell(row, summaryHeader.column)))
          if (!label) continue
          if (['tong', 'tongcong', 'total'].includes(label)) { totalRow = row; continue }
          totalSku += toNumber(getCellText(summarySheet.getCell(row, skuCol)))
          totalNegative += toNumber(getCellText(summarySheet.getCell(row, negativeCol)))
        }
        if (!totalRow) totalRow = getLastRow(summarySheet) + 1
        summarySheet.getCell(totalRow, summaryHeader.column).value = summarySheet.getCell(totalRow, summaryHeader.column).value || 'TỔNG CỘNG'
        summarySheet.getCell(totalRow, skuCol).value = totalSku
        summarySheet.getCell(totalRow, negativeCol).value = totalNegative
        summarySheet.getCell(totalRow, rateCol).value = totalSku ? totalNegative / totalSku : 0
        summarySheet.getCell(totalRow, rateCol).numFmt = '0.00%'
      }
    }
  }

  // 8) Xóa bỏ các dòng "Không còn tồn âm" trong sheet SKU Ton Am Old sau khi xử lý xong
  const resolvedSkuKeys = new Set(
    negativeEntries
      .filter((entry) => entry.note === 'Không còn tồn âm')
      .map((entry) => getSkuKey(entry.sku))
  )
  const oldNoteCol = findColumnInSheet(oldSheet, ['Ghi chú', 'Ghi chu', 'Note'], oldHeader.row)
  const lastOldRow = getLastRow(oldSheet)
  for (let row = lastOldRow; row >= oldHeader.row + 1; row -= 1) {
    const sku = getCellText(oldSheet.getCell(row, oldHeader.column)).trim()
    const noteText = oldNoteCol ? getCellText(oldSheet.getCell(row, oldNoteCol)).trim() : ''
    const isNoteResolved = normalizeKey(noteText).includes('khongcontonam')
    const isSkuResolved = sku && resolvedSkuKeys.has(getSkuKey(sku))

    if (isNoteResolved || isSkuResolved) {
      oldSheet.spliceRows(row, 1)
    }
  }

  // 9) Tên NCC để hiển thị trên UI (không ghi vào các sheet Excel vì template không có cột này) —
  //    tra theo Mã NCC qua chính file DS NCC TT THEO BCBH nếu có (best-effort, có thể để trống
  //    với NCC không nằm trong danh sách BCBH).
  const supplierDisplayMap = new Map()
  if (supplierTarget) {
    const header = findHeaderInSheet(supplierTarget, ['VENDOR'])
    if (header) {
      const codeCol = findColumnInSheet(supplierTarget, ['VENDOR'], header.row)
      const nameColSupplier = findColumnInSheet(supplierTarget, ['TÊN NHÀ CUNG CẤP', 'Ten nha cung cap'], header.row)
      if (codeCol && nameColSupplier) {
        for (let row = header.row + 1; row <= getLastRow(supplierTarget); row += 1) {
          const code = getCellText(supplierTarget.getCell(row, codeCol)).trim()
          if (code) supplierDisplayMap.set(code, getCellText(supplierTarget.getCell(row, nameColSupplier)).trim())
        }
      }
    }
  }

  const negativeRows = sortedNegativeEntries.map((entry) => ({
    sku: entry.sku,
    name: entry.name,
    group: negativeGroupSheets[String(entry.code5).replace(/^NH/i, '').trim()] || 'KHÁC',
    stock: entry.current,
    delta: entry.current - entry.oldStock,
    code5: entry.code5,
    note: entry.note,
    supplier: entry.supplierName || supplierDisplayMap.get(entry.supplierCode) || '',
  }))

  return {
    buffer: await workbook.xlsx.writeBuffer(),
    exportFileName: `SKU TON AM CM ${formatFileDate(new Date())}.xlsx`,
    negativeCount: currentNegativeCount,
    negativeRows,
    groupCounts: Object.fromEntries(
      Object.entries(negativeGroupSheets).map(([code, name]) => [
        name,
        negativeRows.filter((row) => String(row.code5).replace(/^NH/i, '').trim() === String(code)).length
      ]),
    ),
    previousLabel,
    currentLabel,
    inventoryDailyTotals: {
      bmi: bmiInventoryTotal,
      bcbhMm: bcbhMmInventoryTotal,
      totalMm: apparelInventoryTotal,
    },
  }
}
