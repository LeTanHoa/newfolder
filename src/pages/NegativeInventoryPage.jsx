import ReportCard from '../components/ReportCard'
import { negativeGroupSheets } from '../negativeInventory'

function NegativeTable({ rows }) {
  return (
    <div className="table-wrap negative-table-wrap">
      <table>
        <thead><tr><th>SKU / SẢN PHẨM</th><th>NGÀNH</th><th>TỒN KHO</th><th>THAY ĐỔI</th><th>NHÀ CUNG CẤP</th><th></th></tr></thead>
        <tbody>{rows.map((row) => <tr key={row.sku}><td><strong>{row.sku}</strong><small>{row.name}</small></td><td><span className="group-tag">{row.group}</span></td><td className="negative-value">{row.stock} sp</td><td className="negative-value">{row.delta} sp</td><td>{row.supplier}</td><td className="row-more">•••</td></tr>)}</tbody>
      </table>
    </div>
  )
}

export default function NegativeInventoryPage({ negativeRows, rows, negativeGroupCounts, negativeCount }) {
  const displayedRows = negativeRows.length ? negativeRows : rows.filter((row) => row.stock < 0)

  return (
    <section className="single-report">
      <ReportCard title={`Báo cáo tồn kho âm (${negativeRows.length || negativeCount} SKU)`} subtitle="Đối chiếu đầy đủ SKU giữa ALL và SKU Ton Am Old, gồm cả SKU đã hết âm; phân loại theo Mã 5NH"><NegativeTable rows={displayedRows} /></ReportCard>
      {negativeRows.length > 0 && <div className="sheet-summary"><div><strong>SKU TON AM NEW</strong><span>{negativeRows.length} SKU</span></div>{Object.entries(negativeGroupSheets).map(([, sheet]) => <div key={sheet}><strong>{sheet}</strong><span>{negativeGroupCounts[sheet] || 0} SKU</span></div>)}</div>}
    </section>
  )
}
