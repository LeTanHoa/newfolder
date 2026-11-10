import React, { useState, useMemo } from 'react'
import ReportCard from '../components/ReportCard'
import { marginSheets } from '../constants/report'
import { getCode5, getMarginValue, getValue, isVisibleNegativeMargin } from '../utils/report'
import { IconSearch, IconAlertCircle } from '../components/icons'

function MarginTable({ rows }) {
  if (!rows || rows.length === 0) {
    return (
      <div className="empty-state-card">
        <IconAlertCircle size={28} className="text-muted" />
        <p>Không tìm thấy dòng lãi âm nào phù hợp với bộ lọc.</p>
      </div>
    )
  }

  return (
    <div className="table-responsive-wrapper max-h-500">
      <table className="enterprise-table">
        <thead>
          <tr>
            <th>SKU / SẢN PHẨM</th>
            <th>MÃ 5NH</th>
            <th className="text-right">TL. LÃI THỰC TẾ</th>
            <th>SHEET PHÂN BỔ</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const rawValue = getMarginValue(row)
            const percentValue = rawValue / 100
            const code = getCode5(row)
            const skuCode = getValue(row, ['sku', 'mahang', 'masanpham']) || `SKU-${index + 1}`
            const productName = getValue(row, ['tenhang', 'tensanpham', 'ten']) || 'Chưa có tên sản phẩm'
            const targetSheet = marginSheets[code] || 'Tổng hợp'

            return (
              <tr key={`${skuCode}-${index}`}>
                <td>
                  <div className="sku-item-cell">
                    <strong className="sku-code font-mono">{skuCode}</strong>
                    <span className="sku-name" title={productName}>{productName}</span>
                  </div>
                </td>
                <td>
                  <span className="code-pill font-mono">{code || '-'}</span>
                </td>
                <td className="text-right numeric-cell font-mono">
                  <span className="negative-badge">
                    {percentValue.toLocaleString('vi-VN', {
                      style: 'percent',
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </td>
                <td>
                  <span className="sheet-tag">{targetSheet}</span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function MarginReportPage({ rows = [], rawRows = [] }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSheetFilter, setSelectedSheetFilter] = useState('ALL')

  const negativeRows = useMemo(() => {
    return rows
      .filter(isVisibleNegativeMargin)
      .sort((left, right) => getMarginValue(left) - getMarginValue(right))
  }, [rows])

  // Filtered rows for table view
  const filteredRows = useMemo(() => {
    return negativeRows.filter((row) => {
      const code = getCode5(row)
      const targetSheet = marginSheets[code] || 'Tổng hợp'
      const skuCode = String(getValue(row, ['sku', 'mahang', 'masanpham']) || '').toLowerCase()
      const productName = String(getValue(row, ['tenhang', 'tensanpham', 'ten']) || '').toLowerCase()
      const term = searchTerm.toLowerCase().trim()

      const matchesSearch = !term || skuCode.includes(term) || productName.includes(term)
      const matchesSheet = selectedSheetFilter === 'ALL' || targetSheet === selectedSheetFilter

      return matchesSearch && matchesSheet
    })
  }, [negativeRows, searchTerm, selectedSheetFilter])

  const totalRawCount = rawRows.length || rows.length
  const totalNegativeCount = negativeRows.length

  return (
    <section className="single-report-section">
      {/* Summary KPI Cards across all target sheets */}
      <div className="sheet-summary-grid">
        <div 
          className={`sheet-stat-card ${selectedSheetFilter === 'ALL' ? 'active' : ''}`}
          onClick={() => setSelectedSheetFilter('ALL')}
          role="button"
          tabIndex={0}
        >
          <div className="sheet-stat-header">
            <strong>Tất Cả Lãi Âm</strong>
            <span className="stat-count-pill alert">{totalNegativeCount}</span>
          </div>
          <span className="sheet-stat-sub">Tổng số SKU lãi âm</span>
        </div>

        <div className="sheet-stat-card raw-stat">
          <div className="sheet-stat-header">
            <strong>Dữ Liệu Gốc (Khac)</strong>
            <span className="stat-count-pill">{totalRawCount}</span>
          </div>
          <span className="sheet-stat-sub">Tổng dòng dữ liệu ERP</span>
        </div>

        {Object.entries(marginSheets).map(([code, sheet]) => {
          const count = negativeRows.filter((row) => getCode5(row) === code).length
          const isSelected = selectedSheetFilter === sheet

          return (
            <div
              key={sheet}
              className={`sheet-stat-card ${isSelected ? 'active' : ''}`}
              onClick={() => setSelectedSheetFilter(selectedSheetFilter === sheet ? 'ALL' : sheet)}
              role="button"
              tabIndex={0}
            >
              <div className="sheet-stat-header">
                <strong>{sheet} (NH{code})</strong>
                <span className={`stat-count-pill ${count > 0 ? 'highlight' : ''}`}>{count}</span>
              </div>
              <span className="sheet-stat-sub">Sheet phân bổ ngành</span>
            </div>
          )
        })}
      </div>

      {/* Main Report Table with Search and Filter Toolbar */}
      <ReportCard
        title={`Chi tiết SKU tỉ lệ lãi âm (${filteredRows.length} / ${totalNegativeCount} SKU)`}
        subtitle="Hệ thống đã tự động chia 100 theo đúng định dạng % của báo cáo kế toán."
        action={
          <div className="card-filter-toolbar">
            <div className="search-input-wrapper">
              <IconSearch size={15} className="search-icon" />
              <input
                type="text"
                placeholder="Tìm mã SKU hoặc tên SP..."
                className="table-search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {selectedSheetFilter !== 'ALL' && (
              <button
                type="button"
                className="btn btn-outline btn-sm clear-filter-btn"
                onClick={() => setSelectedSheetFilter('ALL')}
              >
                Xóa lọc ({selectedSheetFilter})
              </button>
            )}
          </div>
        }
      >
        <MarginTable rows={filteredRows} />
      </ReportCard>
    </section>
  )
}
