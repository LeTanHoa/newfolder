import React from 'react'
import {
  IconCheck,
  IconAlertCircle,
  IconSpinner
} from './icons'

export default function ProcessBanner({ status, isProcessing }) {
  if (!status) return null

  const isError =
    status.includes('thất bại') ||
    status.includes('Chưa') ||
    status.includes('Không') ||
    status.includes('Thiếu') ||
    status.includes('lỗi') ||
    status.includes('Error')

  const isSuccess = status.includes('Hoàn tất') || status.includes('Xử lý xong') || status.includes('Đã')

  let tone = 'info'
  if (isProcessing) tone = 'working'
  else if (isError) tone = 'error'
  else if (isSuccess) tone = 'success'

  return (
    <div className={`process-banner-alert ${tone}`} role="alert">
      <div className="banner-icon-box">
        {isProcessing ? (
          <IconSpinner size={18} />
        ) : isError ? (
          <IconAlertCircle size={18} />
        ) : (
          <IconCheck size={18} />
        )}
      </div>
      <div className="banner-content">
        <strong className="banner-title">
          {isProcessing ? 'Đang xử lý dữ liệu...' : isError ? 'Cần kiểm tra lại' : 'Thông báo xử lý'}
        </strong>
        <p className="banner-message">{status}</p>
      </div>
    </div>
  )
}
