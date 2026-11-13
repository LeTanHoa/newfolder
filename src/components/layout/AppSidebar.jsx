import React from 'react'
import {
  IconDashboard,
  IconMargin,
  IconNegative,
  IconInventory,
  IconChevronRight
} from '../icons'

const navGroups = [
  {
    title: 'TỔNG QUAN',
    items: [
      { page: 'overview', icon: IconDashboard, label: 'Bảng tổng quan', badge: null }
    ]
  },
  {
    title: 'BÁO CÁO ERP',
    items: [
      { page: 'margin', icon: IconMargin, label: 'Tỉ lệ lãi âm', badge: null },
      { page: 'negative', icon: IconNegative, label: 'Tồn kho âm', badge: 'Mới' },
      { page: 'inventory', icon: IconInventory, label: 'Tồn kho theo ngày', badge: null }
    ]
  },
  // {
  //   title: 'HỆ THỐNG',
  //   items: [
  //     { page: 'mapping', icon: IconSettings, label: 'Cấu hình mapping', badge: null }
  //   ]
  // }
]

export default function AppSidebar({ activePage, onNavigate, isCollapsed, onToggleCollapse }) {
  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Brand Header */}
      <div className="brand-wrapper">
        <div className="brand" onClick={() => onNavigate('overview')} role="button" tabIndex={0} title="Về trang tổng quan">
          <div className="brand-logo">
            <img src="/logo.png" alt="Co.opmart Đà Nẵng" className="brand-logo-img" />
          </div>
          {!isCollapsed && (
            <div className="brand-text">
              <span className="brand-title">Co.opmart Đà Nẵng</span>
            </div>
          )}
        </div>
        <button 
          type="button" 
          className="collapse-toggle-btn"
          onClick={onToggleCollapse}
          title={isCollapsed ? "Mở rộng thanh menu" : "Thu gọn thanh menu"}
          aria-label="Toggle sidebar"
        >
          <span className={`toggle-arrow ${isCollapsed ? 'collapsed' : ''}`}>‹</span>
        </button>
      </div>

      {/* Navigation List */}
      <nav className="nav-container">
        {navGroups.map((group) => (
          <div key={group.title} className="nav-group">
            {!isCollapsed && <p className="nav-group-title">{group.title}</p>}
            <div className="nav-group-items">
              {group.items.map(({ page, icon: Icon, label, badge }) => {
                const isActive = activePage === page
                return (
                  <button
                    key={page}
                    type="button"
                    className={`nav-button ${isActive ? 'active' : ''}`}
                    onClick={() => onNavigate(page)}
                    title={isCollapsed ? label : undefined}
                  >
                    <span className="nav-button-icon">
                      <Icon size={18} />
                    </span>
                    {!isCollapsed && (
                      <>
                        <span className="nav-button-label">{label}</span>
                        {badge && <span className="nav-badge">{badge}</span>}
                        {isActive && <IconChevronRight size={14} className="nav-active-arrow" />}
                      </>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Sidebar Footer */}
      {!isCollapsed ? (
        <div className="sidebar-footer">
          <div className="system-status-card">
            <div className="status-header">
              <span className="status-dot-pulse"></span>
              <span className="status-title">Hệ thống sẵn sàng</span>
            </div>
            <p className="status-desc">Hỗ trợ ExcelJS, xlsx-js-style và ERP dump tự động.</p>
          </div>

          <div className="user-profile-bar">
            <div className="user-avatar-circle">AD</div>
            <div className="user-details">
              <strong>Admin Phân Tích</strong>
              <small>bophan.ketoan@cm.vn</small>
            </div>
          </div>
        </div>
      ) : (
        <div className="sidebar-footer-collapsed">
          <div className="status-dot-only" title="Hệ thống trực tuyến"></div>
        </div>
      )}
    </aside>
  )
}
