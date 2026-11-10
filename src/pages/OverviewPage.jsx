import React from 'react'
import {
  IconCalendar,
  IconCheck,
  IconInventory,
  IconMargin,
  IconNegative
} from '../components/icons'

const money = (value) => {
  if (!value && value !== 0) return '0 đ'
  return `${Math.round(value).toLocaleString('vi-VN')} đ`
}

function MetricCard({ title, value, tone = 'emerald', note, icon: Icon, badge }) {
  return (
    <div className={`kpi-card tone-${tone}`}>
      <div className="kpi-card-top">
        <span className="kpi-title">{title}</span>
        {Icon && (
          <div className="kpi-icon-bubble">
            <Icon size={18} />
          </div>
        )}
      </div>
      <div className="kpi-value-row">
        <h3 className="kpi-value">{value}</h3>
      </div>
      <div className="kpi-footer">
        {badge && <span className={`kpi-badge ${tone}`}>{badge}</span>}
        <span className="kpi-note">{note}</span>
      </div>
    </div>
  )
}

export default function OverviewPage({
  groups,
  metrics,
  statuses,
  dailyTotals,
  selectedDate,
  onDateChange,
}) {
  const statusItems = [
    {
      label: 'Tỉ lệ lãi âm',
      desc: 'Bóc tách SKU lãi âm theo ngành hàng',
      ready: statuses.margin,
      count: `${metrics.marginRows || 0} dòng`,
      icon: IconMargin
    },
    {
      label: 'Tồn kho theo ngày',
      desc: 'Tổng hợp số liệu tồn theo Mã 5NH',
      ready: statuses.inventory,
      count: `${metrics.inventoryRows || 0} dòng`,
      icon: IconInventory
    },
    {
      label: 'Báo cáo tồn kho âm',
      desc: 'Đối chiếu chéo ALL, TONG HOP, MM, BMI',
      ready: statuses.negative,
      count: `${metrics.negative.toLocaleString('vi-VN')} SKU`,
      icon: IconNegative
    }
  ]

  return (
    <div className="overview-container">
      {/* Date Filter & Quick Switch Bar */}
      <div className="overview-filter-bar">
        <div className="filter-intro">
          <h3>Số liệu vận hành ngày báo cáo</h3>
          <p>Xem số liệu tổng hợp tồn kho và doanh thu theo ngày được chọn bên dưới</p>
        </div>
        <div className="date-input-box">
          <IconCalendar size={16} className="date-icon" />
          <label htmlFor="overview-date" className="date-label">Chọn ngày:</label>
          <input
            id="overview-date"
            type="date"
            className="styled-date-picker"
            value={selectedDate}
            onChange={(event) => onDateChange(event.target.value)}
          />
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <MetricCard
          title="TỔNG TỒN KHO"
          value={money(metrics.stockValue)}
          tone="emerald"
          note={`${metrics.inventoryRows || 0} dòng dữ liệu tồn kho`}
          icon={IconInventory}
          badge="Kho Hiện Hữu"
        />
        <MetricCard
          title="TỔNG MM (MAY MẶC)"
          value={money(dailyTotals.totalMm)}
          tone="sky"
          note="Được trích xuất từ báo cáo tồn âm"
          icon={IconInventory}
          badge="May Mặc"
        />
        <MetricCard
          title="TỒN KHO BMI"
          value={money(dailyTotals.bmi)}
          tone="amber"
          note="Tổng giá trị kho theo Mã 5NH = 6"
          icon={IconMargin}
          badge="Kho BMI"
        />
        <MetricCard
          title="SKU TỒN KHO ÂM"
          value={`${(metrics.negative || 0).toLocaleString('vi-VN')} SKU`}
          tone="rose"
          note={metrics.negativeReady ? 'Đã tổng hợp hoàn tất' : 'Chờ nạp đủ 4 file dữ liệu'}
          icon={IconNegative}
          badge={metrics.negativeReady ? 'Sẵn sàng' : 'Chưa cập nhật'}
        />
      </div>

      {/* 2-Column Content Layout */}
      <div className="overview-content-split">
        {/* Main Table: Tổng hợp theo nhóm hàng */}
        <div className="main-report-column">
          <div className="report-card">
            <div className="card-heading">
              <div className="card-heading-info">
                <h2>Tổng hợp theo nhóm ngành hàng</h2>
                <p>Số liệu tồn kho, doanh số và lợi nhuận gộp theo từng ngành hàng</p>
              </div>
              <span className="card-counter-tag">{groups.length} nhóm ngành</span>
            </div>

            <div className="table-responsive-wrapper">
              <table className="enterprise-table">
                <thead>
                  <tr>
                    <th>NHÓM HÀNG</th>
                    <th className="text-right">GIÁ TRỊ TỒN</th>
                    <th className="text-right">DOANH SỐ</th>
                    <th className="text-right">GIÁ VỐN</th>
                    <th className="text-right">LỢI NHUẬN GỘP</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.length > 0 ? (
                    groups.map((item) => (
                      <tr key={item.group}>
                        <td>
                          <div className="group-name-cell">
                            <span className="group-color-bullet"></span>
                            <strong>{item.group}</strong>
                          </div>
                        </td>
                        <td className="text-right numeric-cell font-mono">{money(item.stockValue)}</td>
                        <td className="text-right numeric-cell font-mono">{money(item.sales)}</td>
                        <td className="text-right numeric-cell font-mono">{money(item.cost)}</td>
                        <td className="text-right numeric-cell font-mono text-emerald font-semibold">
                          {money(item.profit)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="empty-row-notice">
                        Chưa có dữ liệu cho ngày này. Vui lòng nạp file ERP hoặc chọn ngày khác.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Side Column: Pipeline Status & Quick Guide */}
        <div className="side-column">
          {/* Data Pipeline Status Card */}
          <div className="report-card status-summary-card">
            <div className="card-heading">
              <div className="card-heading-info">
                <h2>Tiến độ dữ liệu</h2>
                <p>Trạng thái các nguồn báo cáo hôm nay</p>
              </div>
            </div>

            <div className="status-pipeline-list">
              {statusItems.map((item) => (
                <div key={item.label} className="status-pipeline-row">
                  <div className="status-row-icon">
                    <item.icon size={18} />
                  </div>
                  <div className="status-row-info">
                    <div className="status-row-top">
                      <strong>{item.label}</strong>
                      <span className={`status-state-pill ${item.ready ? 'ready' : 'pending'}`}>
                        {item.ready ? (
                          <>
                            <IconCheck size={12} />
                            <span>Đã có dữ liệu</span>
                          </>
                        ) : (
                          <>
                            <span className="dot-pending"></span>
                            <span>Chưa nạp</span>
                          </>
                        )}
                      </span>
                    </div>
                    <div className="status-row-sub">
                      <span>{item.desc}</span>
                      <small className="status-count">{item.count}</small>
                    </div>
                    <div className="progress-bar-container">
                      <div
                        className={`progress-bar-fill ${item.ready ? 'filled' : 'empty'}`}
                        style={{ width: item.ready ? '100%' : '15%' }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Workflow Quick Help Card */}
          <div className="report-card workflow-card">
            <div className="workflow-card-inner">
              <div className="workflow-header">
                <span className="workflow-tag">Quy trình</span>
                <h4>Quy trình vận hành chuẩn</h4>
              </div>
              <ul className="workflow-steps">
                <li>
                  <span className="step-num">1</span>
                  <span>Vào <strong>Tồn kho theo ngày</strong> để nạp file TonKhoDauNgay.</span>
                </li>
                <li>
                  <span className="step-num">2</span>
                  <span>Vào <strong>Tồn kho âm</strong> nạp template và 4 file đối chiếu.</span>
                </li>
                <li>
                  <span className="step-num">3</span>
                  <span>Kiểm tra lại Dashboard và bấm <strong>Xuất báo cáo</strong>.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
