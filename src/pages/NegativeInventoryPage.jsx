import React, { useState, useMemo } from 'react'
import ReportCard from '../components/ReportCard'
import { negativeGroupSheets } from '../negativeInventory'
import { IconSearch, IconAlertCircle } from '../components/icons'

function NegativeTable({ rows }) {
  if (!rows || rows.length === 0) {
    return (
      <div className="empty-state-card">
        <IconAlertCircle size={28} className="text-muted" />
        <p>Không có SKU tồn âm nào phù hợp với bộ lọc tìm kiếm.</p>
      </div>
    )
  }

  return (
    <div className="table-responsive-wrapper max-h-500">
      <table className="enterprise-table">
        <thead>
          <tr>
            <th>SKU / TÊN SẢN PHẨM</th>
            <th>NGÀNH HÀNG</th>
            <th className="text-right">TỒN KHO HIỆN TẠI</th>
            <th className="text-right">BIẾN ĐỘNG (DELTA)</th>
            <th>NHÀ CUNG CẤP</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.sku}>
              <td>
                <div className="sku-item-cell">
                  <strong className="sku-code font-mono">{row.sku}</strong>
                  <span className="sku-name" title={row.name}>{row.name || 'Chưa có tên'}</span>
                </div>
              </td>
              <td>
                <span className="sheet-tag">{row.group || 'Chung'}</span>
              </td>
              <td className="text-right numeric-cell font-mono">
                <span className={row.stock < 0 ? 'negative-badge' : 'resolved-badge'}>
                  {row.stock} sp
                </span>
              </td>
              <td className="text-right numeric-cell font-mono">
                <span className={`delta-badge ${row.delta < 0 ? 'negative' : 'neutral'}`}>
                  {row.delta > 0 ? `+${row.delta}` : row.delta} sp
                </span>
              </td>
              <td>
                <span className="supplier-text" title={row.supplier}>{row.supplier || '-'}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function NegativeInventoryPage({
  negativeRows = [],
  rows = [],
  negativeGroupCounts = {},
  negativeCount = 0,
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('ALL')

  const baseRows = negativeRows.length ? negativeRows : rows.filter((row) => row.stock < 0)
  const totalNegativeCount = negativeRows.length || negativeCount || baseRows.length

  const filteredRows = useMemo(() => {
    return baseRows.filter((row) => {
      const sku = String(row.sku || '').toLowerCase()
      const name = String(row.name || '').toLowerCase()
      const supplier = String(row.supplier || '').toLowerCase()
      const group = String(row.group || '')
      const term = searchTerm.toLowerCase().trim()

      const matchesSearch = !term || sku.includes(term) || name.includes(term) || supplier.includes(term)
      const matchesGroup = selectedGroupFilter === 'ALL' || group === selectedGroupFilter

      return matchesSearch && matchesGroup
    })
  }, [baseRows, searchTerm, selectedGroupFilter])

  return (
    <section className="single-report-section">
      {/* Sheet Summary Grid */}
      {negativeRows.length > 0 && (
        <div className="sheet-summary-grid">
          <div
            className={`sheet-stat-card ${selectedGroupFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setSelectedGroupFilter('ALL')}
            role="button"
            tabIndex={0}
          >
            <div className="sheet-stat-header">
              <strong>SKU TON AM NEW</strong>
              <span className="stat-count-pill alert">{negativeRows.length}</span>
            </div>
            <span className="sheet-stat-sub">Tổng SKU còn âm kỳ này</span>
          </div>

          {Object.entries(negativeGroupSheets).map(([, sheet]) => {
            const count = negativeGroupCounts[sheet] || 0
            const isSelected = selectedGroupFilter === sheet

            return (
              <div
                key={sheet}
                className={`sheet-stat-card ${isSelected ? 'active' : ''}`}
                onClick={() => setSelectedGroupFilter(selectedGroupFilter === sheet ? 'ALL' : sheet)}
                role="button"
                tabIndex={0}
              >
                <div className="sheet-stat-header">
                  <strong>{sheet}</strong>
                  <span className={`stat-count-pill ${count > 0 ? 'highlight' : ''}`}>{count}</span>
                </div>
                <span className="sheet-stat-sub">Phân loại theo NH</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Main Report Table */}
      <ReportCard
        title={`Danh sách tồn kho âm (${filteredRows.length} / ${totalNegativeCount} SKU)`}
        subtitle="Đối chiếu chéo đầy đủ giữa ALL và SKU Ton Am Old, phân bổ theo từng nhóm ngành hàng"
        action={
          <div className="card-filter-toolbar">
            <div className="search-input-wrapper">
              <IconSearch size={15} className="search-icon" />
              <input
                type="text"
                placeholder="Tìm SKU, tên SP hoặc NCC..."
                className="table-search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {selectedGroupFilter !== 'ALL' && (
              <button
                type="button"
                className="btn btn-outline btn-sm clear-filter-btn"
                onClick={() => setSelectedGroupFilter('ALL')}
              >
                Xóa lọc ({selectedGroupFilter})
              </button>
            )}
          </div>
        }
      >
        <NegativeTable rows={filteredRows} />
      </ReportCard>
    </section>
  )
}
