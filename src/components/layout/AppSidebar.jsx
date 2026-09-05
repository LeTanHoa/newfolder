const navigation = [
  // { page: 'overview', icon: '▦', label: 'Tổng quan' },
  // { page: 'upload', icon: '◌', label: 'Nhập dữ liệu', badge: '2' },
  { page: 'margin', icon: '▤', label: 'Báo cáo', section: true },
  { page: 'margin', icon: '◒', label: 'Tỉ lệ lãi', child: true },
  { page: 'negative', icon: '!', label: 'Tồn kho âm', child: true },
  { page: 'inventory', icon: '▥', label: 'Tồn kho theo ngày', child: true },
  // { page: 'overview', icon: '⌁', label: 'Lịch sử xử lý' },
]

export default function AppSidebar({ activePage, onNavigate }) {
  return (
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">↗</span><span>CM ĐÀ NẴNG<span className="brand-dot">.</span></span></div>
      <p className="workspace-label">WORKSPACE</p>
      <div className="workspace-switcher"><span className="workspace-avatar">ĐN</span><span><strong>Hệ thống báo cáo</strong><small>CO.OPMART ĐÀ NẴNG</small></span><span className="chevron">⌄</span></div>
      <nav className="nav-list">
        {navigation.map(({ page, icon, label, badge, section, child }) => (
          <button
            key={`${page}-${label}`}
            className={`nav-item ${section ? 'nav-section' : ''} ${child ? 'nav-child' : ''} ${activePage === page && !section ? 'active' : ''}`}
            onClick={() => onNavigate(page)}
          >
            <span>{icon}</span> {label} {badge && <em>{badge}</em>}
          </button>
        ))}
        {/* <p className="workspace-label nav-heading">QUẢN TRỊ</p>
        <button className={`nav-item ${activePage === 'mapping' ? 'active' : ''}`} onClick={() => onNavigate('mapping')}><span>⚙</span> Cấu hình mapping</button> */}
        {/* <button className="nav-item" onClick={() => onNavigate('overview')}><span>♙</span> Người dùng</button> */}
      </nav>
      {/* <div className="sidebar-bottom">
        <div className="help-box"><span className="help-icon">?</span><div><strong>Cần trợ giúp?</strong><small>Xem tài liệu hướng dẫn</small></div><span>→</span></div>
        <div className="user-row"><span className="user-avatar">LTH</span><span><strong>Lê Tấn Hòa</strong><small>Admin</small></span><span className="more">•••</span></div>
      </div> */}
    </aside>
  )
}
