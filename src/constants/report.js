export const sampleRows = [
  { sku: 'TPCN-1001', name: 'Omega 3 Premium', group: 'TPCN', sold: 128, sales: 38400000, cost: 24600000, stock: 42, delta: -8, supplier: 'NCC Minh Long' },
  { sku: 'HMP-2048', name: 'Kem chống nắng SPF50', group: 'HMP', sold: 94, sales: 28200000, cost: 16100000, stock: -6, delta: -12, supplier: 'NCC BCBH' },
  { sku: 'TPTS-3010', name: 'Sữa hạt hạnh nhân', group: 'TPTS', sold: 76, sales: 19000000, cost: 11400000, stock: 18, delta: 3, supplier: 'NCC An Khang' },
  { sku: 'DD-4112', name: 'Nồi chiên không dầu', group: 'DD', sold: 31, sales: 21700000, cost: 14200000, stock: -2, delta: -4, supplier: 'NCC Gia Dụng' },
  { sku: 'MM-5104', name: 'Bộ dao bếp 5 món', group: 'MM', sold: 22, sales: 6600000, cost: 3520000, stock: 11, delta: -1, supplier: 'NCC Bếp Việt' },
  { sku: 'BM-6320', name: 'Bình giữ nhiệt 600ml', group: 'BM', sold: 18, sales: 4500000, cost: 2160000, stock: 7, delta: 2, supplier: 'NCC BCBH' },
]

export const pageLabels = {
  overview: 'Tổng quan',
  upload: 'Nhập dữ liệu',
  margin: 'Báo cáo tỉ lệ lãi',
  negative: 'Báo cáo tồn âm',
  inventory: 'Báo cáo tồn kho',
}

export const marginSheets = { 1: 'TPTS', 2: 'TPCN', 3: 'HMP', 4: 'DD', 5: 'MM' }
export const inventoryGroupNames = { 1: 'TPTS', 2: 'TPCN', 3: 'HMP', 4: 'DD', 5: 'MM', 6: 'KHÁC' }
export const inventoryColumns = ['TPTS', 'TPCN', 'HMP', 'DD', 'MM', 'BM', 'Tucano + QUA TET', 'KHÁC']
export const negativeFileLabels = {
  negativeRate: 'Tỉ lệ tồn âm → TONG HOP',
  beginningStock: 'Tồn kho đầu ngày → ALL',
  apparelStock: 'Tồn kho may mặc → TON KHO MM',
  yesterdayStock: 'SKU tồn âm hôm qua → SKU Ton Am Old',
}
