import ReportCard from '../components/ReportCard'
import { inventoryColumns } from '../constants/report'
import { formatDate, getInventoryTotals, inventoryMoney } from '../utils/report'

function InventoryTemplateTable({ rows, date }) {
  const totals = getInventoryTotals(rows)
  const total = inventoryMoney(Object.values(totals).reduce((sum, value) => sum + value, 0))

  return (
    <div className="table-wrap">
      <table className="inventory-template">
        <thead><tr><th>Ngày</th>{inventoryColumns.map((group) => <th key={group}>{group}</th>)}<th>Tổng</th></tr></thead>
        <tbody><tr><td>{formatDate(date)}</td>{inventoryColumns.map((group) => <td key={group}>{inventoryMoney(totals[group]).toLocaleString('en-US')}</td>)}<td><strong>{total.toLocaleString('en-US')}</strong></td></tr></tbody>
      </table>
      <div className="inventory-note">Đã map {rows.length} dòng theo `Mã 5NH`; giá trị hiển thị là VND, bỏ phần thập phân.</div>
    </div>
  )
}

export default function InventoryReportPage({ rows, date }) {
  return <section className="single-report"><ReportCard title="Báo cáo tồn kho theo ngày" subtitle={`Đã gán giá trị tồn hiện tại vào ngày ${formatDate(date)}`}><InventoryTemplateTable rows={rows} date={date} /></ReportCard></section>
}
