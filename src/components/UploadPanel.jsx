import { negativeFileLabels } from '../constants/report'

export default function UploadPanel({
  activePage,
  isDragging,
  isProcessing,
  inventoryTemplateName,
  inventoryDataName,
  templateHandle,
  negativeTemplateName,
  supplierListName,
  negativeFileNames,
  onDraggingChange,
  onFile,
  onSelectInventoryTemplate,
  onInventoryTemplateFile,
  onInventoryData,
  onInventoryPermissionDenied,
  onSelectNegativeTemplate,
  onSelectSupplierList,
  onNegativeDataFile,
  onProcessNegativeReport,
  onNegativeTemplateFallback,
  onSupplierListFallback,
}) {
  if (activePage === 'inventory') {
    return (
      <section className="upload-panel inventory-upload">
        <div className="upload-copy"><div className="upload-icon">↑</div><div><h2>Cập nhật báo cáo tồn kho theo ngày</h2><p>File mẫu được nhớ lại; import thêm dữ liệu để cập nhật trực tiếp</p></div></div>
        <button type="button" className="drop-zone" onClick={onSelectInventoryTemplate}><span>▣ {inventoryTemplateName ? 'Đổi file template' : 'Chọn file báo cáo'}</span><small>{inventoryTemplateName || 'Chọn file template .XLSX hoặc .XLS'}</small></button>
        <input id="inventory-template-fallback" hidden type="file" accept=".xlsx,.xls" onChange={(event) => onInventoryTemplateFile(event.target.files[0])} />
        <label className="drop-zone">
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onClick={async () => {
              if (!templateHandle?.requestPermission) return
              const permission = await templateHandle.requestPermission({ mode: 'readwrite' })
              if (permission !== 'granted') onInventoryPermissionDenied()
            }}
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
        <div className="upload-copy"><div className="upload-icon">↑</div><div><h2>Cập nhật báo cáo tồn kho âm</h2><p>Import 4 file dữ liệu + template và file cố định DS NCC TT THEO BCBH</p></div></div>
        <div className="negative-upload-grid">
          <button type="button" className="drop-zone" onClick={onSelectNegativeTemplate}><span>▣ {negativeTemplateName ? 'Đổi template' : 'Chọn template báo cáo'}</span><small>{negativeTemplateName || 'File .XLSX có sheet ALL, TONG HOP...'}</small></button>
          <button type="button" className="drop-zone" onClick={onSelectSupplierList}><span>▣ {supplierListName ? 'Đổi DS NCC' : 'DS NCC TT THEO BCBH'}</span><small>{supplierListName || 'File cố định, chỉ chọn 1 lần'}</small></button>
          {Object.entries(negativeFileLabels).map(([key, label]) => (
            <label key={key} className="drop-zone">
              <input type="file" accept=".xlsx,.xls,.csv" onChange={(event) => onNegativeDataFile(key, event.target.files[0])} />
              <span>↑ {negativeFileNames[key] ? 'Đổi file' : label.split(' → ')[0]}</span>
              <small>{negativeFileNames[key] || label}</small>
            </label>
          ))}
        </div>
        <button type="button" className="export-button negative-run-button" disabled={isProcessing} onClick={onProcessNegativeReport}>Cập nhật báo cáo tồn âm</button>
        <input id="negative-template-fallback" hidden type="file" accept=".xlsx" onChange={(event) => onNegativeTemplateFallback(event.target.files[0])} />
        <input id="supplier-list-fallback" hidden type="file" accept=".xlsx,.xls" onChange={(event) => onSupplierListFallback(event.target.files[0])} />
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
