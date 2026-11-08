import { useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx-js-style'
import ExcelJS from 'exceljs'
import defaultNegativeTemplateUrl from '../template/SKU TON AM CM.xlsx'
import { processNegativeInventoryReport } from './negativeInventory'
import { inventoryColumns, inventoryGroupNames, marginSheets, negativeFileLabels } from './constants/report'
import {
  excelDateMatches,
  formatDate,
  getActiveSheetName,
  getCode5,
  getInventorySheet,
  getInventorySheetName,
  getInventoryTotals,
  getMarginValue,
  getSourceDate,
  isDateHeader,
  isGroupHeader,
  isInventoryRow,
  isInventorySheetName,
  isMarginHeader,
  isVisibleNegativeMargin,
  normalizeInventoryRow,
  normalizeKey,
  normalizeMarginRow,
} from './utils/report'
import {
  clearTemplateHandle,
  loadSupplierListHandle,
  loadTemplateHandle,
  saveTemplateHandle,
} from './services/fileHandleStorage'
import AppSidebar from './components/layout/AppSidebar'
import AppHeader from './components/layout/AppHeader'
import ProcessBanner from './components/ProcessBanner'
import UploadPanel from './components/UploadPanel'
import {
  InventoryReportPage as InventoryReportPageView,
  MappingPage as MappingPageView,
  MarginReportPage as MarginReportPageView,
  NegativeInventoryPage as NegativeInventoryPageView,
  OverviewPage as OverviewPageView,
} from './pages'
import './App.css'

const loadExcelJsWorkbook = async (file) => { if (!file.name.toLowerCase().endsWith('.xlsx')) throw new Error('ExcelJS chỉ hỗ trợ file .xlsx. Vui lòng lưu file Excel thành Excel Workbook (*.xlsx).'); const workbook = new ExcelJS.Workbook(); const buffer = await file.arrayBuffer(); if (!buffer || buffer.byteLength < 4) throw new Error('File Excel rỗng hoặc không đọc được.'); try { await workbook.xlsx.load(buffer); } catch (error) { throw new Error(`ExcelJS không đọc được file ${file.name}: ${error.message}`) } if (!workbook.worksheets || workbook.worksheets.length === 0) throw new Error(`ExcelJS không tìm thấy worksheet trong file ${file.name}.`); return { workbook, buffer } }

const downloadExcelFile = (buffer, fileName) => {
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

const inventoryDailyTotalsStorageKey = 'clarity-inventory-daily-totals'
const inventoryExcelNumberFormat = '#,##0'
const getInventoryValues = (rows, dailyTotals = {}) => {
  const totals = getInventoryTotals(rows)
  if (!Object.values(dailyTotals).some((value) => Number.isFinite(value))) return totals
  const bmi = dailyTotals.bmi || 0
  const bcbhMm = dailyTotals.bcbhMm || 0
  const totalMm = dailyTotals.totalMm || 0
  return {
    ...totals,
    BM: bmi,
    MM: totalMm - bcbhMm,
    'TỔNG MM': totalMm,
    'DANH SACH NCC BCBH - KO TÍNH TỒN KHO': bcbhMm,
  }
}

const inventoryRowFill = {
  header: 'FFFFFF00',
  tkdm: 'FF00B0F0',
  tkbq: 'FFFF0000',
}
const inventoryThinBorder = { style: 'thin', color: { argb: 'FF000000' } }
const applyInventoryTemplateColors = (sheet, columnCount) => {
  for (let column = 1; column <= columnCount; column += 1) {
    const cell = sheet.getCell(1, column)
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: inventoryRowFill.header } }
    cell.font = { ...cell.font, bold: true }
    cell.alignment = { ...cell.alignment, horizontal: 'center', vertical: 'middle', wrapText: true }
    cell.border = { top: inventoryThinBorder, left: inventoryThinBorder, bottom: inventoryThinBorder, right: inventoryThinBorder }
  }
  for (let row = 2; row <= Math.min(3, sheet.rowCount); row += 1) {
    const fill = row === 2 ? inventoryRowFill.tkdm : inventoryRowFill.tkbq
    for (let column = 1; column <= columnCount; column += 1) {
      const cell = sheet.getCell(row, column)
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill } }
      cell.font = { ...cell.font, bold: true }
      cell.border = { top: inventoryThinBorder, left: inventoryThinBorder, bottom: inventoryThinBorder, right: inventoryThinBorder }
    }
  }
  for (let row = 4; row <= sheet.rowCount; row += 1) {
    for (let column = 1; column <= columnCount; column += 1) {
      sheet.getCell(row, column).fill = { type: 'pattern', pattern: 'none' }
    }
  }
}

const getDateInputValue = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function App() {
  const [activePage, setActivePage] = useState('overview')
  const [rows, setRows] = useState([])
  const [marginReports, setMarginReports] = useState({})
  const [rawRows, setRawRows] = useState([])
  const [marginRows, setMarginRows] = useState([])
  const [inventoryRows, setInventoryRows] = useState([])
  const [inventoryReports, setInventoryReports] = useState({})
  const [inventoryDate, setInventoryDate] = useState(() => new Date())
  const [inventoryTemplate, setInventoryTemplate] = useState(null)
  const [inventoryTemplateBytes, setInventoryTemplateBytes] = useState(null)
  const [inventoryTemplateName, setInventoryTemplateName] = useState('template.xlsx')
  const [inventoryDataName, setInventoryDataName] = useState('')
  const [inventoryProcessStatus, setInventoryProcessStatus] = useState('')
  const [templateHandle, setTemplateHandle] = useState(null)
  const [negativeTemplateBytes, setNegativeTemplateBytes] = useState(null)
  const [negativeTemplateName, setNegativeTemplateName] = useState('')
  const [supplierListHandle, setSupplierListHandle] = useState(null)
  const [negativeFileNames, setNegativeFileNames] = useState({ negativeRate: '', beginningStock: '', apparelStock: '', yesterdayStock: '' })
  const [negativeFileBuffers, setNegativeFileBuffers] = useState({ negativeRate: null, beginningStock: null, apparelStock: null, yesterdayStock: null })
  const [bmiExcludedSuppliers, setBmiExcludedSuppliers] = useState('')
  const [negativeRows, setNegativeRows] = useState([])
  const [negativeGroupCounts, setNegativeGroupCounts] = useState({})
  const [negativeProcessStatus, setNegativeProcessStatus] = useState('')
  const [negativeExport, setNegativeExport] = useState(null)
  const [overviewDate, setOverviewDate] = useState(() => getDateInputValue(new Date()))
  const [inventoryDailyTotals, setInventoryDailyTotals] = useState(() => {
    try { return JSON.parse(window.localStorage.getItem(inventoryDailyTotalsStorageKey)) || {} } catch { return {} }
  })

  useEffect(() => { loadTemplateHandle().then(async (handle) => { if (!handle) return; setTemplateHandle(handle); setInventoryTemplateName(handle.name); setInventoryProcessStatus(`Đã nhớ file mẫu: ${handle.name}. Hãy import dữ liệu tồn kho để cập nhật.`) }).catch(() => {}) }, [])
  useEffect(() => {
    loadSupplierListHandle().then((supplierHandleResult) => {
      if (supplierHandleResult) setSupplierListHandle(supplierHandleResult)
    }).catch(() => {})
  }, [])
  useEffect(() => {
    fetch(defaultNegativeTemplateUrl)
      .then((response) => { if (!response.ok) throw new Error('Không tải được template mặc định'); return response.arrayBuffer() })
      .then((bytes) => {
        setNegativeTemplateBytes(bytes)
        setNegativeTemplateName('SKU TON AM CM.xlsx')
        setNegativeProcessStatus('Đã nạp template tồn âm mặc định. Hãy import các file dữ liệu.')
      })
      .catch(() => setNegativeProcessStatus('Không tải được template tồn âm mặc định.'))
  }, [])
  const handleOverviewDateChange = (date) => {
    setOverviewDate(date)
  }
  const [sourceDate, setSourceDate] = useState(new Date(2026, 7, 20))
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processStatus, setProcessStatus] = useState('')

  const overviewData = useMemo(() => {
    const selectedMarginRows = marginReports[overviewDate] || []
    const selectedInventoryRows = inventoryReports[overviewDate] || []
    const hasLocalMarginData = selectedMarginRows.length > 0
    const hasLocalInventoryData = selectedInventoryRows.length > 0
    const localSales = selectedMarginRows.reduce((sum, row) => sum + row.sales, 0)
    const localCost = selectedMarginRows.reduce((sum, row) => sum + row.cost, 0)
    const selectedGroups = new Map()
    selectedMarginRows.forEach((row) => {
      const group = inventoryGroupNames[row.code5] || 'KHÁC'
      const item = selectedGroups.get(group) || { group, sales: 0, cost: 0, profit: 0, stockValue: 0, negative: 0 }
      item.sales += row.sales
      item.cost += row.cost
      item.profit += row.sales - row.cost
      selectedGroups.set(group, item)
    })
    selectedInventoryRows.forEach((row) => {
      const group = row.group || inventoryGroupNames[row.code5] || 'KHÁC'
      const item = selectedGroups.get(group) || { group, sales: 0, cost: 0, profit: 0, stockValue: 0, negative: 0 }
      item.stockValue += row.value
      selectedGroups.set(group, item)
    })
    return {
      groups: [...selectedGroups.values()].filter((row) => row.sales || row.cost || row.stockValue),
      metrics: {
        sales: hasLocalMarginData ? localSales : 0,
        cost: hasLocalMarginData ? localCost : 0,
        profit: hasLocalMarginData ? localSales - localCost : 0,
        negative: negativeRows.length,
        stockValue: hasLocalInventoryData ? selectedInventoryRows.reduce((sum, row) => sum + row.value, 0) : 0,
        marginRows: selectedMarginRows.length,
        inventoryRows: selectedInventoryRows.length,
        negativeReady: negativeProcessStatus.startsWith('Hoàn tất:'),
      },
      statuses: {
        margin: hasLocalMarginData,
        inventory: hasLocalInventoryData,
        negative: negativeProcessStatus.startsWith('Hoàn tất:'),
      },
    }
  }, [marginReports, inventoryReports, negativeProcessStatus, negativeRows, overviewDate])
  const metrics = overviewData.metrics

  const handleFile = async (file) => {
    if (!file) return
    const detectedDate = getSourceDate(file.name)
    if (detectedDate) setSourceDate(detectedDate)
    setIsProcessing(true)
    setProcessStatus('Đang xử lý file...')
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true })
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      const originalRows = XLSX.utils.sheet_to_json(firstSheet, { defval: '' })
      if (originalRows[0] && isInventoryRow(originalRows[0])) {
        const parsedInventory = originalRows.map(normalizeInventoryRow)
        setInventoryRows(parsedInventory)
        setRawRows(originalRows)
        setInventoryProcessStatus(`Xử lý xong: ${parsedInventory.length} dòng tồn kho, đã tổng hợp theo Mã 5NH`)
        setActivePage('inventory')
        return
      }
      const parsed = originalRows.map(normalizeMarginRow)
      const negativeCount = originalRows.filter(isVisibleNegativeMargin).length
      setRawRows(originalRows)
      setMarginRows(originalRows)
      setRows(parsed)
      setActivePage('margin')
      const marginDate = detectedDate || new Date()
      const marginDateKey = getDateInputValue(marginDate)
      setMarginReports((current) => ({ ...current, [marginDateKey]: parsed }))
      setProcessStatus(`Xử lý xong: ${originalRows.length} dòng, ${negativeCount} dòng TL.Lãi < 0`)
    } catch (error) {
      setProcessStatus(`Xử lý thất bại: ${error.message || 'không đọc được file bảng tính'}`)
    } finally { setIsProcessing(false) }
  }

  const handleInventoryTemplate = async (file, selectedHandle = null) => {
    if (!file) return
    setTemplateHandle(selectedHandle)
    if (selectedHandle) await saveTemplateHandle(selectedHandle)
    else { setInventoryTemplateBytes(null); await clearTemplateHandle() }
    setInventoryTemplateName(file.name)
    setInventoryProcessStatus('Đang đọc file báo cáo template...')
    try {
      const fileBytes = await file.arrayBuffer()
      let sheetCount = 0
      try { const { workbook: excelJsWorkbook } = await loadExcelJsWorkbook(file); sheetCount = excelJsWorkbook.worksheets.length } catch { sheetCount = 0 }
      const workbook = XLSX.read(fileBytes, { type: 'array', cellStyles: true, cellDates: true })
      sheetCount ||= workbook.SheetNames.length
      setInventoryTemplateBytes(fileBytes)
      workbook.__activeSheetName = getActiveSheetName(workbook)
      setInventoryTemplate(workbook)
      setInventoryProcessStatus(`Đã đọc template bằng ArrayBuffer (${sheetCount} sheet), vui lòng import thêm file dữ liệu tồn kho.`)
    } catch (error) { setInventoryProcessStatus(`Không đọc được file template: ${error.message}`) }
  }

  const selectInventoryTemplate = async () => {
    if (!window.showOpenFilePicker) { document.getElementById('inventory-template-fallback')?.click(); return }
    try {
      const [handle] = await window.showOpenFilePicker({ types: [{ description: 'Excel template', accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'application/vnd.ms-excel': ['.xls'] } }], multiple: false })
      const file = await handle.getFile()
      await handleInventoryTemplate(file, handle)
    } catch { setInventoryProcessStatus('Chưa chọn file template.') }
  }

  const _updateInventoryTemplate = (workbook, rows, targetDate = inventoryDate, dailyTotals = inventoryDailyTotals) => {
    const sheetDate = new Date()
    const sheetName = Object.keys(workbook.Sheets).find((name) => isInventorySheetName(name, sheetDate))
    const sheet = sheetName ? workbook.Sheets[sheetName] : null
    if (!sheet) throw new Error(`Không tìm thấy sheet ${getInventorySheetName(sheetDate)} trong file template`)
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1')
    let headerRow = -1
    const dateColumn = 0
    let headers = []
    for (let rowIndex = range.s.r; rowIndex <= Math.min(range.e.r, 30); rowIndex += 1) {
      const rowHeaders = []
      for (let columnIndex = range.s.c; columnIndex <= range.e.c; columnIndex += 1) rowHeaders.push(String(sheet[XLSX.utils.encode_cell({ c: columnIndex, r: rowIndex })]?.v || ''))
      if (rowHeaders.some(isDateHeader) && rowHeaders.some((header) => isGroupHeader(header, 'TPTS'))) { headerRow = rowIndex; headers = rowHeaders; break }
    }
    if (headerRow < 0) throw new Error('Không tìm thấy dòng header Ngày/TPTS trong template')
    const totals = getInventoryValues(rows, dailyTotals)
    let targetRow = -1
    for (let rowIndex = headerRow + 1; rowIndex <= range.e.r; rowIndex += 1) {
      const value = sheet[XLSX.utils.encode_cell({ c: dateColumn, r: rowIndex })]?.v
      if (excelDateMatches(value, targetDate)) { targetRow = rowIndex; break }
    }
    if (targetRow < 0) throw new Error(`Không tìm thấy ngày ${formatDate(targetDate)} đã tạo sẵn trong cột A của sheet ${getInventorySheetName(sheetDate)}`)
    const dateAddress = XLSX.utils.encode_cell({ c: dateColumn, r: targetRow })
    sheet[dateAddress] = { ...(sheet[dateAddress] || {}), t: 's', v: formatDate(targetDate) }
    headers.forEach((header, columnIndex) => { const key = [...inventoryColumns, 'TỔNG MM', 'DANH SACH NCC BCBH - KO TÍNH TỒN KHO'].find((name) => normalizeKey(name) === normalizeKey(header)); if (!key) return; const address = XLSX.utils.encode_cell({ c: columnIndex, r: targetRow }); sheet[address] = { ...(sheet[address] || {}), t: 'n', v: totals[key] || 0, z: inventoryExcelNumberFormat } })
    const totalColumn = headers.findIndex((header) => normalizeKey(header) === 'tong')
    if (totalColumn >= 0) { const address = XLSX.utils.encode_cell({ c: totalColumn, r: targetRow }); sheet[address] = { ...(sheet[address] || {}), t: 'n', v: inventoryColumns.reduce((sum, key) => sum + (totals[key] || 0), 0), z: inventoryExcelNumberFormat } }
    range.e.r = Math.max(range.e.r, targetRow); sheet['!ref'] = XLSX.utils.encode_range(range)
    return workbook
  }

  const writeInventoryValuesWithoutChangingTemplate = async (bytes, rows, targetDate = inventoryDate, dailyTotals = inventoryDailyTotals) => {
    const workbook = new ExcelJS.Workbook()
    try { await workbook.xlsx.load(bytes) } catch {
      const fallbackWorkbook = XLSX.read(bytes, { type: 'array', cellStyles: true, cellDates: true })
      _updateInventoryTemplate(fallbackWorkbook, rows, targetDate, dailyTotals)
      return XLSX.write(fallbackWorkbook, { bookType: 'xlsx', type: 'array', cellStyles: true })
    }
    const sheet = getInventorySheet(workbook, new Date())
    if (!sheet) {
      try {
        const fallbackWorkbook = XLSX.read(bytes, { type: 'array', cellStyles: true, cellDates: true })
        _updateInventoryTemplate(fallbackWorkbook, rows, targetDate, dailyTotals)
        return XLSX.write(fallbackWorkbook, { bookType: 'xlsx', type: 'array', cellStyles: true })
      } catch (error) { throw new Error(`Không tìm thấy sheet ${getInventorySheetName(new Date())} trong template. ExcelJS đọc được: ${(workbook.worksheets || []).map((item) => item.name).join(', ') || 'không có sheet'}; XLSX fallback: ${error.message}`) }
    }
    let headerRow = 0; const dateColumn = 1; const headers = []
    for (let rowIndex = 1; rowIndex <= Math.min(sheet.rowCount, 30); rowIndex += 1) { const rowHeaders = sheet.getRow(rowIndex).values.slice(1).map((value) => String(value?.text || value?.result || value || '')); if (rowHeaders.some(isDateHeader) && rowHeaders.some((header) => isGroupHeader(header, 'TPTS'))) { headerRow = rowIndex; headers.push(...rowHeaders); break } }
    if (!headerRow) throw new Error(`Không tìm thấy dòng header Ngày/TPTS trong sheet ${getInventorySheetName(new Date())}`)
    applyInventoryTemplateColors(sheet, 11)
    let targetRow = 0
    for (let rowIndex = headerRow + 1; rowIndex <= sheet.rowCount; rowIndex += 1) { const value = sheet.getCell(rowIndex, dateColumn).value; const dateValue = value?.result ?? value; if (dateValue instanceof Date && formatDate(dateValue) === formatDate(targetDate)) { targetRow = rowIndex; break } if (typeof dateValue === 'number' && formatDate(new Date(Date.UTC(1899, 11, 30) + dateValue * 86400000)) === formatDate(targetDate)) { targetRow = rowIndex; break } if (String(dateValue).includes(formatDate(targetDate))) { targetRow = rowIndex; break } }
    if (!targetRow) throw new Error(`Không tìm thấy dòng ngày ${formatDate(targetDate)} trong sheet ${getInventorySheetName(new Date())}`)
    const totals = getInventoryValues(rows, dailyTotals)
    headers.forEach((header, columnIndex) => { const key = [...inventoryColumns, 'TỔNG MM', 'DANH SACH NCC BCBH - KO TÍNH TỒN KHO'].find((name) => normalizeKey(name) === normalizeKey(header)); if (key) { const cell = sheet.getCell(targetRow, columnIndex + 1); cell.value = totals[key] || 0; cell.numFmt = inventoryExcelNumberFormat } })
    const totalColumn = headers.findIndex((header) => normalizeKey(header) === 'tong'); if (totalColumn >= 0) { const cell = sheet.getCell(targetRow, totalColumn + 1); cell.value = inventoryColumns.reduce((sum, key) => sum + (totals[key] || 0), 0); cell.numFmt = inventoryExcelNumberFormat }
    return workbook.xlsx.writeBuffer()
  }

  const handleInventoryData = async (file) => {
    if (!file) return
    setInventoryDataName(file.name)
    const detectedInventoryDate = getSourceDate(file.name)
    if (detectedInventoryDate) setInventoryDate(detectedInventoryDate)
    setIsProcessing(true)
    setInventoryProcessStatus('Đang cập nhật báo cáo tồn kho...')
    try {
      const dataBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(dataBuffer, { type: 'array' })
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: '' }).map(normalizeInventoryRow)
      setInventoryRows(rows)
      const inventoryDateKey = getDateInputValue(detectedInventoryDate || inventoryDate)
      setInventoryReports((current) => ({ ...current, [inventoryDateKey]: rows }))
      setActivePage('inventory')
      setInventoryProcessStatus(`Đã tổng hợp ${rows.length} dòng dữ liệu theo Mã 5NH. Bạn có thể copy dòng ngang hoặc xuất Excel.`)
    } catch (error) { setInventoryProcessStatus(error.message || 'Cập nhật báo cáo thất bại.') }
    finally { setIsProcessing(false) }
  }

  const handleNegativeTemplateFile = async (file) => {
    if (!file) return
    setNegativeTemplateBytes(await file.arrayBuffer())
    setNegativeTemplateName(file.name)
    setNegativeProcessStatus(`Đã chọn template: ${file.name}. Hãy import 4 file dữ liệu.`)
  }

  const handleNegativeDataFile = async (key, file) => {
    if (!file) return
    const buffer = await file.arrayBuffer()
    setNegativeFileNames((current) => ({ ...current, [key]: file.name }))
    setNegativeFileBuffers((current) => ({ ...current, [key]: buffer }))
  }

  const processNegativeReport = async () => {
    setIsProcessing(true)
    setNegativeProcessStatus('Đang cập nhật báo cáo tồn kho âm...')
    try {
      if (!negativeTemplateBytes) throw new Error('Chưa chọn file template báo cáo tồn âm')
      const requiredNegativeFiles = ['beginningStock', 'yesterdayStock']
      const missing = requiredNegativeFiles.filter((key) => !negativeFileBuffers[key]).map((key) => negativeFileLabels[key])
      if (missing.length) throw new Error(`Thiếu file: ${missing.join(', ')}`)

      let supplierList = null
      if (supplierListHandle) {
        try { supplierList = await (await supplierListHandle.getFile()).arrayBuffer() } catch { supplierList = null }
      }
      const result = await processNegativeInventoryReport(negativeTemplateBytes, {
        negativeRate: negativeFileBuffers.negativeRate,
        beginningStock: negativeFileBuffers.beginningStock,
        apparelStock: negativeFileBuffers.apparelStock,
        yesterdayStock: negativeFileBuffers.yesterdayStock,
        yesterdayStockName: negativeFileNames.yesterdayStock,
        bmiExcludedSuppliers,
        supplierList,
      })
      setInventoryDailyTotals(result.inventoryDailyTotals)
      window.localStorage.setItem(inventoryDailyTotalsStorageKey, JSON.stringify(result.inventoryDailyTotals))

      setNegativeRows(result.negativeRows)
      setNegativeGroupCounts(result.groupCounts)
      setNegativeExport({ buffer: result.buffer, fileName: result.exportFileName })
      setActivePage('negative')
      setNegativeProcessStatus(`Hoàn tất: ${result.negativeCount} SKU còn tồn âm; đã cập nhật ALL, SKU Ton Am Old, SKU TON AM NEW, TONG HOP, TON KHO MM, TON KHO BMI và các sheet theo NH. Bấm “Xuất báo cáo” để tải ${result.exportFileName}.`)
    } catch (error) {
      setNegativeProcessStatus(error.message || 'Cập nhật báo cáo tồn âm thất bại.')
    } finally { setIsProcessing(false) }
  }

  const exportReport = () => {
    if (activePage === 'negative') {
      if (negativeExport) downloadExcelFile(negativeExport.buffer, negativeExport.fileName)
      else setNegativeProcessStatus('Hãy cập nhật báo cáo tồn kho âm trước khi xuất file.')
      return
    }
    if (activePage === 'inventory' && inventoryRows.length) {
      const totals = getInventoryValues(inventoryRows, inventoryDailyTotals)
      const columns = ['Ngày', 'TPTS', 'TPCN', 'HMP', 'DD', 'MM', 'BM', 'BO DAO + QUA TET', 'KHÁC', 'Tổng', 'TỔNG MM', 'Trừ tồn kho S-Dept 146-20', 'DANH SACH NCC BCBH - KO TÍNH TỒN KHO']
      const values = [formatDate(inventoryDate), totals.TPTS || 0, totals.TPCN || 0, totals.HMP || 0, totals.DD || 0, totals.MM || 0, totals.BM || 0, totals['Tucano + QUA TET'] || 0, totals.KHÁC || 0, ['TPTS', 'TPCN', 'HMP', 'DD', 'MM'].reduce((sum, key) => sum + (totals[key] || 0), 0), totals['TỔNG MM'] || 0, 0, totals['DANH SACH NCC BCBH - KO TÍNH TỒN KHO'] || 0]
      const workbook = XLSX.utils.book_new()
      const sheet = XLSX.utils.aoa_to_sheet([columns, values])
      sheet['!cols'] = columns.map(() => ({ wch: 18 }))
      XLSX.utils.book_append_sheet(workbook, sheet, 'Tồn kho theo ngày')
      XLSX.writeFile(workbook, `TON KHO ${formatDate(inventoryDate, false)}.xlsx`)
      return
    }
    const negativeRows = marginRows.filter(isVisibleNegativeMargin).sort((left, right) => getMarginValue(left) - getMarginValue(right))
    const workbook = XLSX.utils.book_new()
    const sourceRows = rawRows.length ? rawRows : marginRows
    const headers = Object.keys(sourceRows[0] || {})
    const toSheet = (data, transformMargin = false) => {
      const output = data.map((row) => Object.fromEntries(headers.map((header) => [header, transformMargin && isMarginHeader(header) ? getMarginValue(row) / 100 : row[header]])))
      const sheet = XLSX.utils.json_to_sheet(output, { header: headers })
      if (transformMargin) {
        const columnIndex = headers.findIndex(isMarginHeader)
        if (columnIndex >= 0) {
          for (let rowIndex = 0; rowIndex <= data.length; rowIndex += 1) { const address = XLSX.utils.encode_cell({ c: columnIndex, r: rowIndex }); if (sheet[address]) { sheet[address].s = { fill: { fgColor: { rgb: rowIndex === 0 ? 'FFD966' : 'FFF2CC' } } }; if (rowIndex > 0) sheet[address].z = '0.00%' } }
        }
      }
      headers.forEach((_header, columnIndex) => {
        const address = XLSX.utils.encode_cell({ c: columnIndex, r: 0 })
        if (!sheet[address]) return
        sheet[address].s = {
          ...(sheet[address].s || {}),
          fill: { fgColor: { rgb: '00B050' } },
          font: { bold: true, color: { rgb: 'FFFFFF' } },
        }
      })
      return sheet
    }
    XLSX.utils.book_append_sheet(workbook, toSheet(sourceRows), 'Khac')
    XLSX.utils.book_append_sheet(workbook, toSheet(negativeRows, true), 'Tổng hợp')
    Object.entries(marginSheets).forEach(([code, sheet]) => XLSX.utils.book_append_sheet(workbook, toSheet(negativeRows.filter((row) => getCode5(row) === code), true), sheet))
    const reportDate = new Date(sourceDate)
    reportDate.setDate(reportDate.getDate() - 1)
    XLSX.writeFile(workbook, `TY LE LAI AM.xlsx`)
  }

  const goTo = (page) => { setActivePage(page) }

  const currentStatus = activePage === 'inventory'
    ? inventoryProcessStatus
    : activePage === 'negative'
      ? negativeProcessStatus
      : activePage === 'margin'
        ? processStatus
        : ''

  const pageContent = activePage === 'overview'
    ? <OverviewPageView groups={overviewData.groups} metrics={metrics} statuses={overviewData.statuses} dailyTotals={inventoryDailyTotals} selectedDate={overviewDate} onDateChange={handleOverviewDateChange} />
    : activePage === 'margin'
      ? <MarginReportPageView rows={marginRows} rawRows={rawRows} />
      : activePage === 'negative'
        ? <NegativeInventoryPageView negativeRows={negativeRows} rows={rows} negativeGroupCounts={negativeGroupCounts} negativeCount={metrics.negative} />
        : activePage === 'inventory'
          ? <InventoryReportPageView rows={inventoryRows} date={inventoryDate} dailyTotals={inventoryDailyTotals} />
          : <MappingPageView />

  return (
    <div className="app-shell">
      <AppSidebar activePage={activePage} onNavigate={goTo} />
      <main className="main-content">
        <AppHeader activePage={activePage} sourceDate={sourceDate} inventoryDate={inventoryDate} onExport={exportReport} />
        {activePage !== 'overview' && <UploadPanel
          activePage={activePage}
          isDragging={isDragging}
          isProcessing={isProcessing}
          inventoryTemplateName={inventoryTemplateName}
          inventoryDataName={inventoryDataName}
          templateHandle={templateHandle}
          negativeTemplateName={negativeTemplateName}
          negativeFileNames={negativeFileNames}
          bmiExcludedSuppliers={bmiExcludedSuppliers}
          onDraggingChange={setIsDragging}
          onFile={handleFile}
          onSelectInventoryTemplate={selectInventoryTemplate}
          onInventoryTemplateFile={handleInventoryTemplate}
          onInventoryData={handleInventoryData}
          onInventoryPermissionDenied={() => setInventoryProcessStatus('Bạn chưa cấp quyền ghi file template')}
          onNegativeTemplateFile={handleNegativeTemplateFile}
          onNegativeDataFile={handleNegativeDataFile}
          onBmiExcludedSuppliersChange={setBmiExcludedSuppliers}
          onProcessNegativeReport={processNegativeReport}
        />}
   
        <ProcessBanner status={currentStatus} isProcessing={isProcessing} />
        {pageContent}
        <footer><span>© 2026 CM Đà Nẵng Reporting</span><span><i></i> Hệ thống hoạt động bình thường</span><span>v1.4.2</span></footer>
      </main>
    </div>
  )

}

export default App
