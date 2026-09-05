import ReportCard from '../components/ReportCard'
import { marginSheets } from '../constants/report'
import { getCode5, getMarginValue, getValue, isVisibleNegativeMargin } from '../utils/report'

function MarginTable({ rows }) {
  return (
    <div className="table-wrap margin-table-wrap">
      <table>
        <thead><tr><th>SKU / SẢN PHẨM</th><th>MÃ 5NH</th><th>TL.LÃI ĐÃ CHIA / 100</th><th>SHEET ĐÍCH</th></tr></thead>
        <tbody>{rows.map((row, index) => {
          const value = getMarginValue(row) / 100
          const code = getCode5(row)
          return <tr key={`${getValue(row, ['sku', 'mahang'])}-${index}`}><td><strong>{getValue(row, ['sku', 'mahang', 'masanpham']) || `DONG-${index + 1}`}</strong><small>{getValue(row, ['tenhang', 'tensanpham', 'ten']) || 'Chưa có tên'}</small></td><td>{code || '-'}</td><td className="negative-value">{value.toLocaleString('vi-VN', { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td><td><span className="group-tag">{marginSheets[code] || 'Tổng hợp'}</span></td></tr>
        })}</tbody>
      </table>
    </div>
  )
}

export default function MarginReportPage({ rows, rawRows }) {
  const negativeRows = rows.filter(isVisibleNegativeMargin).sort((left, right) => getMarginValue(left) - getMarginValue(right))

  return (
    <section className="single-report">
      <ReportCard  title="Báo cáo tỉ lệ lãi" subtitle={`Khac: ${rawRows.length || rows.length} dòng gốc · Tổng hợp: ${negativeRows.length} dòng lãi âm`}><MarginTable rows={negativeRows} /></ReportCard>
      <div className="sheet-summary">
        <div><strong>Khac</strong><span>{rawRows.length || rows.length} dòng raw</span></div>
        <div><strong>Tổng hợp</strong><span>{negativeRows.length} dòng</span></div>
        {Object.entries(marginSheets).map(([code, sheet]) => <div key={sheet}><strong>{sheet}</strong><span>{rows.filter((row) => isVisibleNegativeMargin(row) && getCode5(row) === code).length} dòng</span></div>)}
      </div>
    </section>
  )
}
