import { inventoryGroupNames } from '../constants/report'

export const money = (value) => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(value)
export const normalizeKey = (key) => String(key ?? '').toLowerCase().replace(/[\s._-]/g, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
export const getValue = (row, aliases) => {
  const key = Object.keys(row).find((name) => aliases.includes(normalizeKey(name)))
  return key ? row[key] : ''
}
export const toNumber = (value) => {
  if (typeof value === 'number') return value
  const parsed = Number(String(value ?? '').replace(/[%\s]/g, '').replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : 0
}
export const getMarginKey = (row) => Object.keys(row).find((name) => ['ttlait1', 'tllai', 'tlai'].includes(normalizeKey(name)))
export const getMarginValue = (row) => {
  const key = getMarginKey(row)
  return toNumber(key ? row[key] : row.tlLai)
}
export const isVisibleNegativeMargin = (row) => Math.round(getMarginValue(row) * 100) < 0
export const isMarginHeader = (header) => ['ttlait1', 'tllai', 'tlai'].includes(normalizeKey(header))
export const getSourceDate = (fileName) => {
  const match = fileName.match(/(?:^|_)(\d{6})(?:_|\.)/)
  if (!match) return null
  const token = match[1]
  return new Date(2000 + Number(token.slice(0, 2)), Number(token.slice(2, 4)) - 1, Number(token.slice(4, 6)))
}
export const formatDate = (date, withSeparators = true) => {
  if (!date) return ''
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return withSeparators ? `${day}/${month}/${year}` : `${day}${month}${year}`
}
export const getCode5 = (row) => String(getValue(row, ['ma5nh', 'ma5nhomnganhhang']) || row.code5 || '')
export const marginAmount = (value) => toNumber(value) * 1000
export const isInventoryRow = (row) => Object.keys(row).some((key) => ['trigiatonhientai', 'trigiatontaihientai', 'tennganhhang'].includes(normalizeKey(key)))
export const normalizeInventoryRow = (row, index) => {
  const rawDate = getValue(row, ['ngay', 'date', 'ngayton', 'ngaybaocao', 'kybaocao', 'thoigian', 'ngaythang'])
  return {
    id: index,
    code5: getCode5(row),
    group: getValue(row, ['tennganhhang']) || inventoryGroupNames[getCode5(row)] || 'KHÁC',
    value: toNumber(getValue(row, ['trigiatonhientai', 'trigiatontaihientai', 'giatritonkho', 'trigiaton'])),
    date: rawDate,
  }
}
export const normalizeMarginRow = (row, index) => ({
  ...row,
  id: index,
  sku: getValue(row, ['sku', 'mahang', 'masanpham']) || `DONG-${index + 1}`,
  name: getValue(row, ['tenhang', 'tensanpham', 'ten']) || 'Chưa có tên',
  code5: toNumber(getValue(row, ['ma5nh', 'ma5nhomnganhhang'])),
  tlLai: toNumber(getValue(row, ['tllai', 'tylelai', 'tyleloinhuan'])),
  sold: toNumber(getValue(row, ['slban', 'soluongban', 'soluong'])),
  sales: marginAmount(getValue(row, ['ttban'])),
  cost: marginAmount(getValue(row, ['ttvon'])),
  stock: toNumber(getValue(row, ['tonkho', 'slton', 'soluongton'])),
})
// Báo cáo tồn kho theo ngày: Không cộng dồn qua các ngày mà chỉ lấy dữ liệu mới nhất
export const getInventoryTotals = (rows) => {
  if (!Array.isArray(rows) || !rows.length) return {}

  // 1) Nếu file có cột ngày, lọc lấy các dòng thuộc ngày mới nhất
  const rowsWithDate = rows.filter((r) => r.date)
  let targetRows = rows
  if (rowsWithDate.length > 0) {
    const parseRowTime = (d) => {
      if (d instanceof Date) return d.getTime()
      if (typeof d === 'number') return d
      const str = String(d ?? '').trim()
      const match = str.match(/(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{2,4}))?/)
      if (match) {
        const year = match[3] ? (match[3].length === 2 ? 2000 + Number(match[3]) : Number(match[3])) : new Date().getFullYear()
        return new Date(year, Number(match[2]) - 1, Number(match[1])).getTime()
      }
      return 0
    }

    let maxTime = -1
    rowsWithDate.forEach((r) => {
      const t = parseRowTime(r.date)
      if (t > maxTime) maxTime = t
    })

    if (maxTime > 0) {
      targetRows = rowsWithDate.filter((r) => parseRowTime(r.date) === maxTime)
    }
  }

  // 2) Lấy dữ liệu mới nhất của từng nhóm ngành (ghi đè thay vì cộng dồn)
  return targetRows.reduce((result, row) => {
    const group = inventoryGroupNames[row.code5] || 'KHÁC'
    result[group] = row.value
    return result
  }, {})
}
// Giữ nguyên giá trị từ file import và làm tròn về số nguyên để hiển thị.
export const inventoryMoney = (value) => Math.round(value || 0)
export const isDateHeader = (value) => normalizeKey(value).includes('ngay')
export const isGroupHeader = (value, group) => normalizeKey(value).includes(normalizeKey(group))
export const excelDateMatches = (value, date) => {
  if (value instanceof Date) return formatDate(value) === formatDate(date)
  if (typeof value === 'number') {
    const excelDate = new Date(Date.UTC(1899, 11, 30) + value * 86400000)
    return excelDate.getUTCDate() === date.getDate() && excelDate.getUTCMonth() === date.getMonth() && excelDate.getUTCFullYear() === date.getFullYear()
  }
  return String(value).includes(formatDate(date))
}
export const getActiveSheetName = (workbook) => {
  const activeIndex = workbook.Workbook?.Views?.[0]?.activeTab ?? workbook.Workbook?.WBProps?.activeTab ?? 0
  return workbook.SheetNames[activeIndex] || workbook.SheetNames[0]
}
export const getInventorySheetName = (date) => String(date.getMonth() + 1).padStart(2, '0')
export const isInventorySheetName = (name, date) => {
  const normalized = String(name ?? '').replace(/[\u200B-\u200D\uFEFF]/g, '').trim()
  return normalized === getInventorySheetName(date) || normalized === String(date.getMonth() + 1)
}
export const getInventorySheet = (workbook, date) => (
  workbook.worksheets?.find((sheet) => isInventorySheetName(sheet.name, date))
  || workbook.getWorksheet?.(getInventorySheetName(date))
)
