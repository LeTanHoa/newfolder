export default function ReportCard({ title, subtitle, children }) {
  return (
    <div className="report-card">
      <div className="card-heading">
        <div><h2>{title}</h2><p>{subtitle}</p></div>
        <button className="ghost-button">Xem chi tiết <span>↗</span></button>
      </div>
      {children}
    </div>
  )
}
