import React from 'react'
import { negativeFileLabels } from '../constants/report'
import {
  IconUpload,
  IconFileSpreadsheet,
  IconCheck,
  IconSpinner
} from './icons'

export default function UploadPanel({
  activePage,
  isDragging,
  isProcessing,
  inventoryDataName,
  negativeTemplateName,
  negativeFileNames,
  bmiExcludedSuppliers,
  onDraggingChange,
  onFile,
  onInventoryData,
  onNegativeTemplateFile,
  onNegativeDataFile,
  onBmiExcludedSuppliersChange,
  onProcessNegativeReport,
}) {
  if (activePage === 'inventory') {
    const hasData = Boolean(inventoryDataName)

    return (
      <section className="upload-section inventory-upload-card">
        <div className="upload-header-row">
          <div className="upload-header-icon-box primary">
            <IconFileSpreadsheet size={22} />
          </div>
          <div className="upload-header-text">
            <h3>Cập nhật báo cáo tồn kho theo ngày</h3>
            <p>Hệ thống tự động đọc và tổng hợp số liệu ngang theo Mã 5NH (TPTS, TPCN, HMP, DD, MM, BM, KHÁC)</p>
          </div>
        </div>

        <div className="upload-action-row">
          <label className={`file-drop-card ${hasData ? 'has-file' : ''}`}>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(event) => {
                if (event.target.files?.[0]) {
                  onInventoryData(event.target.files[0])
                }
              }}
            />
            <div className="drop-card-icon">
              {hasData ? <IconCheck size={20} className="text-emerald" /> : <IconUpload size={20} />}
            </div>
            <div className="drop-card-body">
              <span className="drop-card-title">
                {hasData ? 'Đã tải lên file tồn kho' : 'Chọn hoặc thả file dữ liệu'}
              </span>
              <span className="drop-card-desc">
                {inventoryDataName || 'Ví dụ: TonKhoDauNgay_128_260823 (.xlsx, .xls, .csv)'}
              </span>
            </div>
            <div className="drop-card-badge">
              {hasData ? 'Đổi file' : 'Chọn file'}
            </div>
          </label>
        </div>
      </section>
    )
  }

  if (activePage === 'negative') {
    const hasTemplate = Boolean(negativeTemplateName)

    return (
      <section className="upload-section negative-upload-section">
        <div className="upload-header-row">
          <div className="upload-header-icon-box warning">
            <IconUpload size={22} />
          </div>
          <div className="upload-header-text">
            <h3>Cập nhật & đối chiếu dữ liệu tồn kho âm</h3>
            <p>Nạp template báo cáo cùng 4 file dữ liệu nguồn để tự động xử lý và trích xuất dữ liệu đa sheet</p>
          </div>
        </div>

        <div className="negative-grid-layout">
          {/* File Template Card */}
          <div className="upload-grid-block">
            <label className="block-label">1. File Template Mẫu (.XLSX)</label>
            <label className={`file-drop-card ${hasTemplate ? 'has-file' : ''}`}>
              <input
                type="file"
                accept=".xlsx"
                onChange={(event) => {
                  if (event.target.files?.[0]) {
                    onNegativeTemplateFile(event.target.files[0])
                  }
                }}
              />
              <div className="drop-card-icon">
                {hasTemplate ? <IconCheck size={18} className="text-emerald" /> : <IconFileSpreadsheet size={18} />}
              </div>
              <div className="drop-card-body">
                <span className="drop-card-title">
                  {hasTemplate ? 'Template mẫu đã sẵn sàng' : 'Chọn template báo cáo'}
                </span>
                <span className="drop-card-desc" title={negativeTemplateName || 'File .xlsx gồm các sheet ALL, TONG HOP, TON KHO MM...'}>
                  {negativeTemplateName || 'File .xlsx gồm sheet ALL, TONG HOP...'}
                </span>
              </div>
              <span className="drop-card-badge">{hasTemplate ? 'Đổi' : 'Chọn'}</span>
            </label>
          </div>

          {/* 4 Source Data Files */}
          {Object.entries(negativeFileLabels).map(([key, label], idx) => {
            const fileName = negativeFileNames[key]
            const isLoaded = Boolean(fileName)
            const [shortTitle, sheetDest] = label.split(' → ')

            return (
              <div key={key} className="upload-grid-block">
                <label className="block-label">{idx + 2}. {shortTitle} {sheetDest ? `(Sheet: ${sheetDest})` : ''}</label>
                <label className={`file-drop-card ${isLoaded ? 'has-file' : ''}`}>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={(event) => {
                      if (event.target.files?.[0]) {
                        onNegativeDataFile(key, event.target.files[0])
                      }
                    }}
                  />
                  <div className="drop-card-icon">
                    {isLoaded ? <IconCheck size={18} className="text-emerald" /> : <IconUpload size={18} />}
                  </div>
                  <div className="drop-card-body">
                    <span className="drop-card-title">
                      {isLoaded ? 'Đã nạp file thành công' : `Tải lên ${shortTitle}`}
                    </span>
                    <span className="drop-card-desc" title={fileName || `File ERP dump (${shortTitle})`}>
                      {fileName || 'File .xlsx, .xls, .csv'}
                    </span>
                  </div>
                  <span className="drop-card-badge">{isLoaded ? 'Đổi' : 'Chọn'}</span>
                </label>
              </div>
            )
          })}

          {/* Supplier Exclusion Filter */}
          <div className="upload-grid-block full-width">
            <label className="block-label" htmlFor="bmi-exclusion-input">
              Quy tắc ngoại lệ: Danh sách NCC loại khỏi "TON KHO BMI"
            </label>
            <div className="exclusion-input-wrapper">
              <input
                id="bmi-exclusion-input"
                type="text"
                className="styled-text-input"
                value={bmiExcludedSuppliers}
                onChange={(event) => onBmiExcludedSuppliersChange(event.target.value)}
                placeholder="Nhập mã nhà cung cấp bổ sung (phân tách bởi dấu phẩy hoặc khoảng trắng)"
              />
              <span className="input-helper-text">
                Hệ thống mặc định luôn tự động loại NCC <strong>17203</strong> và <strong>22478</strong>.
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="negative-action-footer">
          <button
            type="button"
            className="btn btn-primary btn-lg run-negative-btn"
            disabled={isProcessing}
            onClick={onProcessNegativeReport}
          >
            {isProcessing ? (
              <>
                <IconSpinner size={18} />
                <span>Đang xử lý & tính toán dữ liệu...</span>
              </>
            ) : (
              <>
                <IconFileSpreadsheet size={18} />
                <span>Bắt đầu xử lý báo cáo tồn âm</span>
              </>
            )}
          </button>
        </div>
      </section>
    )
  }

  // Margin Report or Default File Drag & Drop
  return (
    <section className="upload-section default-upload-section">
      <div className="upload-header-row">
        <div className="upload-header-icon-box success">
          <IconUpload size={22} />
        </div>
        <div className="upload-header-text">
          <h3>Nhập file ERP mới để phân tích</h3>
          <p>Kéo và thả file bảng tính ERP từ máy tính hoặc bấm chọn file để tiến hành xử lý</p>
        </div>
      </div>

      <label
        className={`main-dropzone ${isDragging ? 'dragging' : ''} ${isProcessing ? 'disabled' : ''}`}
        onDragOver={(event) => {
          event.preventDefault()
          onDraggingChange(true)
        }}
        onDragLeave={() => onDraggingChange(false)}
        onDrop={(event) => {
          event.preventDefault()
          onDraggingChange(false)
          if (event.dataTransfer.files?.[0]) {
            onFile(event.dataTransfer.files[0])
          }
        }}
      >
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={(event) => {
            if (event.target.files?.[0]) {
              onFile(event.target.files[0])
            }
          }}
          disabled={isProcessing}
        />
        <div className="dropzone-center-content">
          <div className="dropzone-circle-icon">
            {isProcessing ? <IconSpinner size={24} /> : <IconUpload size={24} />}
          </div>
          <div className="dropzone-instructions">
            <strong>
              {isProcessing ? 'Đang phân tích cấu trúc dữ liệu...' : 'Kéo thả file vào đây hoặc bấm để tải lên'}
            </strong>
            <p>Hỗ trợ định dạng Microsoft Excel (.XLSX, .XLS) và .CSV dung lượng tối đa 100MB</p>
          </div>
        </div>
      </label>
    </section>
  )
}
