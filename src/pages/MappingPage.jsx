export default function MappingPage() {
  return (
    <section className="single-report">
      <div className="report-card mapping-card">
        <div className="card-heading"><div><h2>Cấu hình mapping</h2><p>Quản lý nhóm ngành hàng và quy tắc loại trừ dữ liệu.</p></div><button className="export-button" onClick={() => window.alert('Cấu hình đã được lưu trên giao diện mẫu.')}>Lưu cấu hình</button></div>
        <div className="mapping-grid"><label>Nhóm ngành hàng<textarea defaultValue={'TPCN = Thực phẩm chức năng\nHMP = Hóa mỹ phẩm\nTPTS = Thực phẩm tươi sống\nDD = Đồ dùng'} /></label><label>NCC không tính tồn kho<textarea defaultValue={'NCC BCBH\nNCC hàng khuyến mãi'} /></label><label>Dept loại trừ<input defaultValue="146-20" /></label></div>
      </div>
    </section>
  )
}
