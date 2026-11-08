const money = (value) => `${Math.round(value || 0).toLocaleString('vi-VN')} đ`

function Metric({ label, value, tone = 'green', note }) {
  return <article className="metric-card"><p>{label}</p><h3>{value}</h3><div className="metric-footer"><span className={`metric-change ${tone}`}>●</span><small>{note}</small></div></article>
}

export default function OverviewPage({ groups, metrics, statuses, dailyTotals, selectedDate, onDateChange }) {
  return (
    <section className="dashboard-page">
      <div className="page-heading"><div><p className="eyebrow">DASHBOARD</p><h1>Tổng quan vận hành <span>✦</span></h1><p className="heading-subtitle">Theo dõi nhanh tồn kho, doanh số và tình trạng báo cáo.</p></div><div className="overview-date-filter"><label htmlFor="overview-date">Ngày hiển thị</label><input id="overview-date" type="date" value={selectedDate} onChange={(event) => onDateChange(event.target.value)} /></div></div>
      <div className="metric-grid">
        <Metric label="TỔNG TỒN KHO" value={money(metrics.stockValue)} tone="blue" note={`${metrics.inventoryRows} dòng dữ liệu`} />
        <Metric label="TỔNG MM" value={money(dailyTotals.totalMm)} tone="orange" note="Theo báo cáo tồn âm" />
        <Metric label="TỒN KHO BMI" value={money(dailyTotals.bmi)} tone="green" note="Mã 5NH = 6" />
        <Metric label="SKU TỒN ÂM" value={`${metrics.negative.toLocaleString('vi-VN')} SKU`} tone="red" note={metrics.negativeReady ? 'Đã cập nhật' : 'Chưa cập nhật'} />
      </div>
      <div className="content-grid">
        <section className="report-card"><div className="card-heading"><div><h2>Tổng hợp theo nhóm hàng</h2><p>Giá trị tồn kho và kết quả kinh doanh theo ngày đã chọn.</p></div></div><div className="table-wrap"><table><thead><tr><th>NHÓM HÀNG</th><th>GIÁ TRỊ TỒN</th><th>DOANH SỐ</th><th>GIÁ VỐN</th><th>LỢI NHUẬN</th></tr></thead><tbody>{groups.length ? groups.map((group) => <tr key={group.group}><td><strong>{group.group}</strong></td><td>{money(group.stockValue)}</td><td>{money(group.sales)}</td><td>{money(group.cost)}</td><td className="profit">{money(group.profit)}</td></tr>) : <tr><td colSpan="5">Chưa có dữ liệu cho ngày này.</td></tr>}</tbody></table></div></section>
        <section className="side-card"><div className="card-heading"><div><h2>Trạng thái dữ liệu</h2><p>Tình trạng các báo cáo.</p></div></div>{[['Tỉ lệ lãi', statuses.margin], ['Tồn kho theo ngày', statuses.inventory], ['Tồn kho âm', statuses.negative]].map(([label, ready]) => <div className="progress-item" key={label}><div><span>{label}</span><strong className={ready ? '' : 'pending'}>{ready ? 'Sẵn sàng' : 'Chưa có dữ liệu'}</strong></div><div className="progress-track"><i className={ready ? '' : 'orange-progress'} style={{ width: ready ? '100%' : '25%' }} /></div></div>)}</section>
      </div>
    </section>
  )
}
