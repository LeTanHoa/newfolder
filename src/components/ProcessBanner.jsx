export default function ProcessBanner({ status, isProcessing }) {
  if (!status) return null
  const isError = status.includes('thất bại') || status.includes('Chưa') || status.includes('Không') || status.includes('Thiếu')

  return <div className={`process-banner ${isError ? 'error' : isProcessing ? 'working' : ''}`}><span>{isProcessing ? '◌' : isError ? '!' : '✓'}</span>{status}</div>
}
