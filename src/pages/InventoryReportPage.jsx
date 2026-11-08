import ReportCard from '../components/ReportCard'
import { formatDate, getInventoryTotals, inventoryMoney } from '../utils/report'

function InventoryTemplateTable({ rows, date, dailyTotals }) {
  const rawTotals = getInventoryTotals(rows)
  const bmi = Number.isFinite(dailyTotals.bmi) ? dailyTotals.bmi : 0
  const bcbhMm = Number.isFinite(dailyTotals.bcbhMm) ? dailyTotals.bcbhMm : 0
  const totalMm = Number.isFinite(dailyTotals.totalMm) ? dailyTotals.totalMm : (rawTotals.MM || 0)
  const totals = {
    ...rawTotals,
    BM: bmi,
    MM: totalMm - bcbhMm,
    'Tucano + QUA TET': (rawTotals.KHÁC || 0) - bmi,
    'TỔNG MM': totalMm,
    'Trừ tồn kho S-Dept 146-20': 0,
    'DANH SACH NCC BCBH - KO TÍNH TỒN KHO': bcbhMm,
  }
  const total = ['TPTS', 'TPCN', 'HMP', 'DD', 'MM'].reduce((sum, group) => sum + (totals[group] || 0), 0)
  const columns = ['TPTS', 'TPCN', 'HMP', 'DD', 'MM', 'BM', 'BO DAO + QUA TET', 'KHÁC', 'Tổng', 'TỔNG MM', 'Trừ tồn kho S-Dept 146-20', 'DANH SACH NCC BCBH - KO TÍNH TỒN KHO']
  const values = [date, ...columns.map((column) => column === 'BO DAO + QUA TET' ? totals['Tucano + QUA TET'] : column === 'Tổng' ? total : totals[column])]
  const copyValues = values.slice(1).map((value) => inventoryMoney(value))
  const copyRow = async () => {
    try {
      await navigator.clipboard.writeText(copyValues.join('\t'))
      return true
    } catch {
      return false
    }
  }

  return (
    <div className="table-wrap">
      <table className="inventory-template">
        <thead><tr>{['Ngày', ...columns].map((column) => <th key={column}>{column}</th>)}</tr></thead>
        <tbody><tr>{values.map((value, index) => <td key={columns[index - 1] || 'date'}><strong>{index === 0 ? formatDate(value) : inventoryMoney(value).toLocaleString('en-US')}</strong></td>)}</tr></tbody>
      </table>
      <div className="inventory-note inventory-copy-row"><span>Đã map {rows.length} dòng theo Mã 5NH; NH1–NH4 vào nhóm ngành, NH5 vào TỔNG MM, NH6 vào KHÁC.</span><button type="button" className="copy-button" onClick={async (event) => { const copied = await copyRow(); event.currentTarget.dataset.copied = copied ? 'true' : 'false'; if (copied) setTimeout(() => { event.currentTarget.dataset.copied = '' }, 1200) }}>⧉ <span>Copy số liệu</span></button></div>
    </div>
  )
}

export default function InventoryReportPage({ rows, date, dailyTotals = {} }) {
  return <section className="single-report"><ReportCard title="Báo cáo tồn kho theo ngày" subtitle={`Đã tổng hợp dữ liệu ngang cho ngày ${formatDate(date)}`}><InventoryTemplateTable rows={rows} date={date} dailyTotals={dailyTotals} /></ReportCard></section>
}
