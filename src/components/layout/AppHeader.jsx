import { pageLabels } from '../../constants/report'
import { formatDate } from '../../utils/report'

export default function AppHeader({ activePage, inventoryDate, onExport }) {
  const reportDate = activePage === 'inventory' ? inventoryDate : new Date()
  const pageTitle = pageLabels[activePage] || 'Cấu hình mapping'
  const isOverview = activePage === 'overview'

  return (
    <>
      <header className="topbar">
        <div className="breadcrumbs"><span>Workspace</span><b>/</b><strong> {pageTitle}</strong></div>
        <div className="top-actions">
          <span className="last-sync"><i></i> Đồng bộ lần cuối: 2 phút trước</span>
          <button className="icon-button" title="Thông báo">♧<span className="notification-dot"></span></button>
          {activePage !== 'inventory' && <button className="export-button" onClick={onExport}><span>↓</span> Xuất báo cáo</button>}
        </div>
      </header>
      <section className="page-heading">
        <div>
          <p className="eyebrow">BÁO CÁO NGÀY {formatDate(reportDate).toUpperCase()}</p>
          <h1>{isOverview ? <>Xin Chào ! <span>✦</span></> : pageTitle}</h1>
          <p className="heading-subtitle">{isOverview ? 'Đây là tình hình vận hành của bạn hôm nay.' : 'Dữ liệu được tổng hợp từ file ERP dump mới nhất.'}</p>
        </div>
        <div className="date-picker"><span>▣</span> {formatDate(reportDate)} <b>⌄</b></div>
      </section>
    </>
  )
}
