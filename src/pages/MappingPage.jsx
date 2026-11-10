import React, { useState } from 'react'
import {
  IconCheck
} from '../components/icons'

export default function MappingPage() {
  const [saved, setSaved] = useState(false)
  const [categories, setCategories] = useState(
    'TPCN = Thực phẩm chức năng\nHMP = Hóa mỹ phẩm\nTPTS = Thực phẩm tươi sống\nDD = Đồ dùng\nMM = May mặc\nBM = Bánh mì'
  )
  const [excludedSuppliers, setExcludedSuppliers] = useState(
    '17203 = NCC BCBH\n22478 = NCC Hàng khuyến mãi / Trưng bày'
  )
  const [excludedDept, setExcludedDept] = useState('146-20')

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <section className="single-report-section">
      <div className="report-card mapping-settings-card">
        <div className="card-heading">
          <div className="card-heading-info">
            <h2>Cấu hình quy tắc Mapping & Ngoại lệ ERP</h2>
            <p>Quản lý phân loại mã ngành 5NH, danh sách nhà cung cấp không tính tồn kho và mã phòng ban đặc thù.</p>
          </div>
          <button
            type="button"
            className={`btn ${saved ? 'btn-success' : 'btn-primary'}`}
            onClick={handleSave}
          >
            {saved ? (
              <>
                <IconCheck size={16} />
                <span>Đã lưu thành công!</span>
              </>
            ) : (
              <span>Lưu cấu hình</span>
            )}
          </button>
        </div>

        {saved && (
          <div className="mapping-save-alert">
            <IconCheck size={16} />
            <span>Cấu hình quy tắc mapping đã được ghi nhận trên hệ thống và sẵn sàng áp dụng.</span>
          </div>
        )}

        <div className="mapping-form-grid">
          {/* Group mapping */}
          <div className="mapping-form-field">
            <label className="field-label" htmlFor="categories-input">
              <span className="field-title">Nhóm ngành hàng (Mã 5NH → Tên ngành)</span>
              <span className="field-hint">Mỗi dòng tương ứng một quy tắc phân loại ngành hàng</span>
            </label>
            <textarea
              id="categories-input"
              className="styled-textarea font-mono"
              rows={7}
              value={categories}
              onChange={(e) => setCategories(e.target.value)}
            />
          </div>

          {/* Supplier Exclusion */}
          <div className="mapping-form-field">
            <label className="field-label" htmlFor="suppliers-input">
              <span className="field-title">Danh sách Nhà Cung Cấp không tính tồn kho (BCBH)</span>
              <span className="field-hint">Các mã NCC này sẽ được tách riêng ra khỏi cột MM và báo cáo tồn</span>
            </label>
            <textarea
              id="suppliers-input"
              className="styled-textarea font-mono"
              rows={7}
              value={excludedSuppliers}
              onChange={(e) => setExcludedSuppliers(e.target.value)}
            />
          </div>

          {/* Department Exclusion */}
          <div className="mapping-form-field full-width">
            <label className="field-label" htmlFor="dept-input">
              <span className="field-title">Mã S-Dept loại trừ (Trừ tồn kho)</span>
              <span className="field-hint">Mã phòng ban trừ tồn kho theo mẫu báo cáo ngày</span>
            </label>
            <div className="dept-input-container">
              <input
                id="dept-input"
                type="text"
                className="styled-text-input font-mono"
                value={excludedDept}
                onChange={(e) => setExcludedDept(e.target.value)}
              />
              <span className="dept-helper">Giá trị mặc định cho cột S-Dept: 146-20</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
