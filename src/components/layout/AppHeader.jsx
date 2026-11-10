import React from 'react'
import { pageLabels } from '../../constants/report'
import { formatDate } from '../../utils/report'
import {
  IconDownload,
  IconCalendar,
  IconBell,
  IconFileSpreadsheet
} from '../icons'

export default function AppHeader({ activePage, onExport }) {
  const currentDate = new Date()
  const displayCurrentDate = formatDate(currentDate)
  const pageTitle = pageLabels[activePage] || (activePage === 'mapping' ? 'Cấu hình mapping' : 'Báo cáo')
  const isOverview = activePage === 'overview'

  const getSubtitle = () => {
    switch (activePage) {
      case 'overview':
        return 'Tổng quan số liệu tồn kho, doanh số, tỉ lệ lãi và trạng thái các luồng báo cáo.'
      case 'margin':
        return 'Tự động tính tỉ lệ lãi thực tế, trích xuất dòng lãi âm và phân bổ các sheet ngành hàng.'
      case 'negative':
        return 'Đối chiếu chéo dữ liệu tồn âm giữa ALL và kỳ trước, bóc tách tồn MM, BMI và 6 nhóm ngành.'
      case 'inventory':
        return 'Tổng hợp số liệu tồn kho theo Mã 5NH, tính tồn BM, MM và chuẩn hóa dòng báo cáo ngày.'
      case 'mapping':
        return 'Tùy chỉnh quy tắc nhóm ngành, danh sách nhà cung cấp loại trừ và mã phòng ban.'
      default:
        return 'Dữ liệu được xử lý từ các file ERP dump.'
    }
  }

  return (
    <div className="header-container">
      {/* Top utility bar */}
      <header className="topbar">
        <div className="topbar-left">
          <div className="breadcrumbs">
            <span className="crumb-root">Hệ thống CM</span>
            <span className="crumb-separator">/</span>
            <span className="crumb-parent">Báo cáo</span>
            <span className="crumb-separator">/</span>
            <span className="crumb-current">{pageTitle}</span>
          </div>
        </div>

        <div className="top-actions">
          <div className="sync-pill" title="Dữ liệu xử lý trực tiếp trên trình duyệt bằng WebAssembly & JS">
            <span className="sync-dot"></span>
            <span>Bộ máy tính toán: Sẵn sàng</span>
          </div>

          <button type="button" className="icon-action-btn" title="Thông báo hệ thống">
            <IconBell size={18} />
            <span className="notification-badge-dot"></span>
          </button>

          {activePage !== 'overview' && (
            <button
              type="button"
              className="btn btn-primary export-button"
              onClick={onExport}
            >
              <IconDownload size={16} />
              <span>Xuất báo cáo Excel</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Page Title Header Banner */}
      <section className="page-heading">
        <div className="page-heading-content">
          <div className="page-heading-badge">
            <IconFileSpreadsheet size={13} />
            <span>KỲ BÁO CÁO: {displayCurrentDate.toUpperCase()}</span>
          </div>
          <h1 className="page-title">
            {isOverview ? (
              <>
                Bảng Điều Khiển Tổng Quan <span className="title-sparkle">✦</span>
              </>
            ) : (
              pageTitle
            )}
          </h1>
          <p className="heading-subtitle">{getSubtitle()}</p>
        </div>

        <div className="heading-meta">
          <div className="date-chip">
            <IconCalendar size={15} className="date-chip-icon" />
            <span className="date-chip-label">Ngày xử lý:</span>
            <strong className="date-chip-value">{displayCurrentDate}</strong>
          </div>
        </div>
      </section>
    </div>
  )
}
