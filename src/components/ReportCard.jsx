import React from 'react'

export default function ReportCard({ title, subtitle, action, children }) {
  return (
    <div className="report-card">
      <div className="card-heading">
        <div className="card-heading-info">
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {action && <div className="card-heading-action">{action}</div>}
      </div>
      <div className="card-content">
        {children}
      </div>
    </div>
  )
}
