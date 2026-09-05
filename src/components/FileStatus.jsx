export default function FileStatus({ activePage, fileName, negativeTemplateName, negativeRows, rawRows, isProcessing, onClear }) {
  const isNegative = activePage === 'negative'
  const displayedFile = isNegative ? negativeTemplateName : fileName

  return (
    <div className="file-status">
      <span className="file-type">{displayedFile.split('.').pop()?.toUpperCase() || 'XLSX'}</span>
      <strong>{displayedFile || (isNegative ? 'Chưa chọn template tồn âm' : 'Chưa chọn file')}</strong>
      <span className={`status-pill ${isProcessing ? 'processing-pill' : ''}`}>{isProcessing ? '◌ Đang xử lý' : '✓ Sẵn sàng'}</span>
      <span className="file-meta">{isNegative ? `${negativeRows.length || 0} SKU tồn âm` : `${rawRows.length || 6248} dòng`}</span>
      {activePage !== 'inventory' && !isNegative && <button title="Xóa dữ liệu" onClick={onClear}>×</button>}
    </div>
  )
}
