import React, { useState } from 'react'
import ReportCard from '../components/ReportCard'
import { formatDate, getInventoryTotals, inventoryMoney } from '../utils/report'
import {
  IconCopy,
  IconCheck,
  IconCalendar,
  IconFileSpreadsheet
} from '../components/icons'

function InventoryTemplateTable({ rows, date, dailyTotals }) {
  const [copied, setCopied] = useState(false)
  const rawTotals = getInventoryTotals(rows)
  const bmi = Number.isFinite(dailyTotals?.bmi) ? dailyTotals.bmi : 0
  const bcbhMm = Number.isFinite(dailyTotals?.bcbhMm) ? dailyTotals.bcbhMm : 0
  const totalMm = Number.isFinite(dailyTotals?.totalMm) ? dailyTotals.totalMm : (rawTotals.MM || 0)

  const totals = {
    ...rawTotals,
    BM: bmi,
    MM: totalMm - bcbhMm,
    'Tucano + QUA TET': (rawTotals.KHÁC || 0) - bmi,
    'TỔNG MM': totalMm,
    'Trừ tồn kho S-Dept 146-20': 0,
    'DANH SACH NCC BCBH - KO TÍNH TỒN KHO': bcbhMm,
  }

  const total = ['TPTS', 'TPCN', 'HMP', 'DD', 'MM'].reduce((sum, group) => sum + (totals[group] || 0), 0)

  const columns = [
    'TPTS',
    'TPCN',
    'HMP',
    'DD',
    'MM',
    'BM',
    'BO DAO + QUA TET',
    'KHÁC',
    'Tổng',
    'TỔNG MM',
    'Trừ tồn kho S-Dept 146-20',
    'DANH SACH NCC BCBH - KO TÍNH TỒN KHO'
  ]

  const values = [
    date,
    ...columns.map((column) => {
      if (column === 'BO DAO + QUA TET') return totals['Tucano + QUA TET']
      if (column === 'Tổng') return total
      return totals[column]
    })
  ]

  const copyValues = values.slice(1).map((value) => inventoryMoney(value))

  const handleCopyRow = async () => {
    try {
      await navigator.clipboard.writeText(copyValues.join('\t'))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="inventory-report-block">
      {/* Quick Metric Snapshot */}
      <div className="inventory-snapshot-grid">
        <div className="snapshot-box">
          <span className="snapshot-label">TỔNG TỒN (5 NHÓM)</span>
          <strong className="snapshot-value font-mono">{inventoryMoney(total).toLocaleString('en-US')} đ</strong>
        </div>
        <div className="snapshot-box">
          <span className="snapshot-label">TỔNG MAY MẶC (MM)</span>
          <strong className="snapshot-value font-mono">{inventoryMoney(totalMm).toLocaleString('en-US')} đ</strong>
        </div>
        <div className="snapshot-box">
          <span className="snapshot-label">TỒN KHO BMI</span>
          <strong className="snapshot-value font-mono">{inventoryMoney(bmi).toLocaleString('en-US')} đ</strong>
        </div>
        <div className="snapshot-box">
          <span className="snapshot-label">TRỪ NCC BCBH (MM)</span>
          <strong className="snapshot-value font-mono">{inventoryMoney(bcbhMm).toLocaleString('en-US')} đ</strong>
        </div>
      </div>

      {/* Excel Sheet Horizontal View */}
      <div className="excel-preview-panel">
        <div className="excel-preview-header">
          <div className="excel-tab-badge">
            <IconFileSpreadsheet size={15} />
            <span>DÒNG SỐ LIỆU TỔNG HỢP THEO NGÀY</span>
          </div>
          <button
            type="button"
            className={`btn btn-copy ${copied ? 'copied' : ''}`}
            onClick={handleCopyRow}
          >
            {copied ? (
              <>
                <IconCheck size={16} />
                <span>Đã sao chép vào Clipboard!</span>
              </>
            ) : (
              <>
                <IconCopy size={16} />
                <span>Sao chép dòng số liệu (Copy Tab)</span>
              </>
            )}
          </button>
        </div>

        <div className="table-responsive-wrapper horizontal-excel-wrapper">
          <table className="enterprise-table excel-horizontal-table">
            <thead>
              <tr>
                <th className="sticky-col header-col">NGÀY</th>
                {columns.map((col) => (
                  <th key={col} className={`text-right ${col === 'Tổng' ? 'col-highlight' : ''}`}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="sticky-col font-semibold">
                  <div className="date-cell">
                    <IconCalendar size={13} />
                    <span>{formatDate(date)}</span>
                  </div>
                </td>
                {values.slice(1).map((val, idx) => {
                  const isTotalCol = columns[idx] === 'Tổng'
                  return (
                    <td
                      key={columns[idx]}
                      className={`text-right numeric-cell font-mono ${isTotalCol ? 'total-cell font-bold' : ''}`}
                    >
                      {inventoryMoney(val).toLocaleString('en-US')}
                    </td>
                  )
                })}
              </tr>
            </tbody>
          </table>
        </div>

        <div className="excel-panel-footer">
          <span className="footer-guide">
            ✓ Đã xử lý <strong>{rows.length}</strong> dòng tồn kho. Nhấn nút <strong>Sao chép dòng số liệu</strong> để dán trực tiếp vào file Excel mẫu của báo cáo ngày.
          </span>
        </div>
      </div>
    </div>
  )
}

export default function InventoryReportPage({ rows = [], date, dailyTotals = {} }) {
  return (
    <section className="single-report-section">
      <ReportCard
        title={`Báo cáo tồn kho theo ngày (${formatDate(date)})`}
        subtitle="Tổng hợp giá trị kho ngang theo từng cột mã ngành chuẩn mẫu báo cáo"
      >
        <InventoryTemplateTable rows={rows} date={date} dailyTotals={dailyTotals} />
      </ReportCard>
    </section>
  )
}
