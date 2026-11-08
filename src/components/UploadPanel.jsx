import { negativeFileLabels } from '../constants/report'

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
    return (
      <section className="upload-panel inventory-upload">
        <div className="upload-copy"><div className="upload-icon">↑</div><div><h2>Cập nhật báo cáo tồn kho theo ngày</h2><p>Chỉ cần import file dữ liệu, hệ thống tự tổng hợp theo Mã 5NH</p></div></div>
        <label className="drop-zone">
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(event) => onInventoryData(event.target.files[0])}
          />
          <span>↑ {inventoryDataName ? 'Đổi file dữ liệu' : 'Import dữ liệu tồn kho'}</span>
          <small>{inventoryDataName || 'TonKhoDauNgay_128_260823 (.XLSX, .XLS, .CSV)'}</small>
        </label>
      </section>
    )
  }

  if (activePage === 'negative') {
    return (
      <section className="upload-panel negative-upload">
        <div className="upload-copy"><div className="upload-icon">↑</div><div><h2>Cập nhật báo cáo tồn kho âm</h2><p>Import 4 file dữ liệu và template báo cáo</p></div></div>
        <div className="negative-upload-grid">
          <label className="drop-zone">
            <input type="file" accept=".xlsx" onChange={(event) => onNegativeTemplateFile(event.target.files[0])} />
            <span>▣ {negativeTemplateName ? 'Đổi template' : 'Chọn template báo cáo'}</span>
            <small>{negativeTemplateName || 'File .XLSX có sheet ALL, TONG HOP...'}</small>
          </label>
          {Object.entries(negativeFileLabels).map(([key, label]) => (
            <label key={key} className="drop-zone">
              <input type="file" accept=".xlsx,.xls,.csv" onChange={(event) => onNegativeDataFile(key, event.target.files[0])} />
              <span>↑ {negativeFileNames[key] ? 'Đổi file' : label.split(' → ')[0]}</span>
              <small>{negativeFileNames[key] || label}</small>
            </label>
          ))}
          <label className="negative-sku-exclusion">
            <span>NCC loại khỏi TON KHO BMI</span>
            <input
              type="text"
              value={bmiExcludedSuppliers}
              onChange={(event) => onBmiExcludedSuppliersChange(event.target.value)}
              placeholder="Nhập NCC, phân cách bằng dấu phẩy hoặc xuống dòng"
            />
            <small>Mặc định vẫn loại NCC 17203 và 22478; nhập thêm NCC nếu cần.</small>
          </label>
        </div>
        <button type="button" className="export-button negative-run-button" disabled={isProcessing} onClick={onProcessNegativeReport}>Cập nhật báo cáo tồn âm</button>
      </section>
    )
  }

  return (
    <section className="upload-panel">
      <div className="upload-copy"><div className="upload-icon">↑</div><div><h2>Cập nhật dữ liệu mới</h2><p>Kéo thả file ERP dump vào đây hoặc chọn từ máy tính</p></div></div>
      <label
        className={`drop-zone ${isDragging ? 'dragging' : ''}`}
        onDragOver={(event) => { event.preventDefault(); onDraggingChange(true) }}
        onDragLeave={() => onDraggingChange(false)}
        onDrop={(event) => { event.preventDefault(); onDraggingChange(false); onFile(event.dataTransfer.files[0]) }}
      >
        <input type="file" accept=".csv,.xlsx,.xls" onChange={(event) => onFile(event.target.files[0])} />
        <span>{isProcessing ? 'Đang phân tích dữ liệu...' : 'Chọn file'}</span>
        <small>.XLSX, .XLS hoặc .CSV · Tối đa 100MB</small>
      </label>
    </section>
  )
}
