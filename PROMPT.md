# SYSTEM PROMPT / PROJECT SPECIFICATION: HỆ THỐNG BÁO CÁO & XỬ LÝ DỮ LIỆU ERP BÁN LẺ (CO.OPMART ĐÀ NẴNG)

## 1. MỤC TIÊU VÀ BỐI CẢNH DỰ ÁN
Xây dựng ứng dụng web chạy hoàn toàn ở phía client (Client-side Web App) nhằm tự động hóa quy trình phân tích, đối chiếu và tổng hợp các file Excel/CSV xuất từ hệ thống ERP bán lẻ của siêu thị Co.opmart Đà Nẵng (CM Đà Nẵng). Ứng dụng giải quyết bài toán xử lý dữ liệu phức tạp hàng ngày của bộ phận Kế toán / Vận hành:
- Xử lý bảng tính dung lượng lớn ngay trên trình duyệt mà không cần gửi dữ liệu lên server backend (bảo mật dữ liệu kinh doanh tuyệt đối).
- Tự động nhận diện định dạng số tiếng Việt (1.234,56) và quốc tế (1,234.56).
- Tự động chuẩn hóa header cột (bỏ dấu tiếng Việt, ký tự đặc biệt, hoa/thường).
- Tự động bóc tách SKU lãi âm, đối chiếu dữ liệu tồn kho đa chiều, tính toán tồn kho May Mặc (MM), tồn kho BMI và điền dữ liệu tự động vào template Excel đa sheet chuẩn mẫu.

---

## 2. CÔNG NGHỆ & THƯ VIỆN SỬ DỤNG
- **Framework & Runtime**: React 19 (functional components + hooks), Vite 8.
- **Xử lý Bảng tính Excel**:
  - `exceljs`: Đọc/ghi file `.xlsx` giữ nguyên cấu trúc sheet, màu sắc (fill), viền (border), công thức và định dạng số (`numFmt`).
  - `xlsx` (SheetJS) & `xlsx-js-style`: Phân tích nhanh dữ liệu dạng mảng JSON/AOA, xử lý styles ô tính cho báo cáo lãi âm.
- **Lưu trữ & File Access**:
  - Web File System Access API (`window.showOpenFilePicker`): Ghi nhớ handle của template mẫu.
  - IndexedDB / LocalStorage: Lưu vết file template và các giá trị tổng hàng ngày (`inventoryDailyTotals`).
- **Giao diện & Styling**:
  - Thiết kế Enterprise ERP Dashboard hiện đại, font `Plus Jakarta Sans` (UI) và `JetBrains Mono` (mã SKU / số tài chính).
  - Không dùng thư viện UI nặng (như AntD hay MUI), sử dụng hệ thống CSS variables và icon SVG thuần để tối ưu tốc độ tải.

---

## 3. QUY TẮC MÃ HÀNG HÓA VÀ NHÓM NGÀNH (MÃ 5NH)
Hệ thống phân loại theo `Mã 5NH` (1 chữ số hoặc prefix `NH`):
- `1`: **TPTS** — Thực phẩm tươi sống
- `2`: **TPCN** — Thực phẩm công nghệ
- `3`: **HMP** — Hóa mỹ phẩm
- `4`: **DD** — Đồ dùng gia đình
- `5`: **MM** — May mặc
- `6`: **KHÁC** / **BMI** — Bách hóa mới / Hàng khác

---

## 4. CHI TIẾT CÁC PHÂN HỆ NGHIỆP VỤ (CORE PIPELINES)

### Phân hệ 1: Báo Cáo Tỉ Lệ Lãi (Margin Report)
- **Nguồn dữ liệu**: File ERP dump doanh số và giá vốn (`tt_lai_t1`, `tl_lai`, `ttban`, `ttvon`...).
- **Xử lý**:
  1. Trích xuất các SKU có tỉ lệ lãi gộp âm: `isVisibleNegativeMargin(row) <=> tlLai < 0`.
  2. Giá trị tỉ lệ lãi hiển thị và ghi vào Excel phải chia cho 100 (`value / 100`) và áp dụng định dạng phần trăm `0.00%`.
  3. Phân bổ các dòng lãi âm vào các Sheet tương ứng với Mã 5NH (Sheet `TPTS`, `TPCN`, `HMP`, `DD`, `MM`).
  4. Tạo sheet `Tổng hợp` chứa toàn bộ SKU lãi âm (sắp xếp tăng dần theo mức độ âm) và sheet `Khac` chứa toàn bộ dữ liệu raw từ file gốc.
- **Xuất file**: `TY LE LAI AM.xlsx`.

### Phân hệ 2: Báo Cáo Tồn Kho Theo Ngày (Inventory Daily Report)
- **Nguồn dữ liệu**: File `TonKhoDauNgay_xxx.xlsx`.
- **Xử lý**:
  1. Gom nhóm tổng giá trị tồn kho (`Trị Giá Tồn Hiện Tại`) theo Mã 5NH.
  2. Bóc tách và kết hợp các số liệu đặc thù từ báo cáo tồn âm:
     - `totalMm`: Tổng trị giá tồn kho May Mặc.
     - `bcbhMm`: Trị giá tồn kho các nhà cung cấp thuộc diện Bán Cung Bán Hàng (BCBH - mua bán ký gửi, không tính tồn kho).
     - `bmi`: Tồn kho BMI (Mã 5NH = 6, sau khi đã loại trừ các NCC đặc biệt như `17203`, `22478`).
     - Tính cột `MM` thực tế = `totalMm - bcbhMm`.
     - Tính cột `BO DAO + QUA TET` = `(KHÁC || 0) - bmi`.
     - Tính cột `Tổng` = tổng cộng của 5 nhóm chính: `TPTS + TPCN + HMP + DD + MM`.
  3. Xếp thành 1 dòng dữ liệu ngang chuẩn 12 cột:
     `[Ngày, TPTS, TPCN, HMP, DD, MM, BM, BO DAO + QUA TET, KHÁC, Tổng, TỔNG MM, Trừ tồn kho S-Dept 146-20, DANH SACH NCC BCBH - KO TÍNH TỒN KHO]`.
  4. Cung cấp tính năng **"Copy dòng số liệu"** (Tab-separated values) để người dùng dán (paste) trực tiếp vào file Excel quản lý của ban giám đốc.
- **Xuất file**: `TON KHO DDMMYYYY.xlsx` hoặc ghi đè trực tiếp vào sheet tháng (ví dụ sheet `08`, `09`) của template mẫu.

### Phân hệ 3: Báo Cáo Tồn Kho Âm (Negative Inventory Reconciliation)
Xử lý đối chiếu chéo phức hợp giữa **1 Template Excel mẫu** (`SKU TON AM CM.xlsx`) và **4 File dữ liệu nguồn**:
1. **Template mẫu**: Chứa các sheet `ALL`, `SKU Ton Am Old`, `SKU TON AM NEW`, `TONG HOP`, `TON KHO MM`, `TON KHO BMI`, `DS NCC TT THEO BCBH`, `TPTS`, `TPCN`, `HMP`, `DD`, `MM`.
2. **File nguồn 1 (Tồn kho đầu ngày)**: Đổ dữ liệu thô vào sheet `ALL`.
3. **File nguồn 2 (SKU tồn âm hôm qua)**: Đổ vào sheet `SKU Ton Am Old`. Tự động quét tìm cột có hậu tố ngày gần nhất (dạng `Tồn DD/MM` hoặc `SL Tồn DD/MM`) để làm mốc đối chiếu hôm qua. **Hệ thống tự động loại bỏ ngay các dòng không còn tồn âm (ghi chú "Không còn tồn âm" hoặc số tồn >= 0) trong file tồn âm cũ trước khi đưa vào tập dữ liệu so sánh**.
4. **File nguồn 3 (Tỉ lệ tồn âm)**: Đổ vào sheet `TONG HOP`.
5. **File nguồn 4 (Tồn kho may mặc)**: Đổ vào sheet `TON KHO MM`. Lọc lấy các NCC có mã nằm trong danh sách VENDOR của sheet `DS NCC TT THEO BCBH`, bỏ các dòng "N/A", cộng tổng dòng `TỔNG CỘNG` ở cuối bảng để lấy ra giá trị `bcbhMmInventoryTotal`.
- **Tạo Sheet `SKU TON AM NEW`**:
  - Duyệt qua từng SKU trong sheet `ALL` và `SKU Ton Am Old`.
  - Loại trừ các mã Dept thuộc diện không tính tồn âm (mặc định Dept `146-20`).
  - Gắn nhãn biến động tồn (`buildNote`):
    * `oldStock < 0 && current >= 0` -> *"Không còn tồn âm"* (giá trị tồn của ngày hôm nay so với hôm trước **không được để số dương mà phải ghi là 0**)
    * `oldStock === 0` -> *"Mới phát sinh"*
    * `current < oldStock` -> *"Tăng"*
    * `current > oldStock` -> *"Giảm"*
    * Ngược lại -> *"Không thay đổi"*
  - Phân bổ SKU còn tồn âm vào các sheet ngành hàng:
    * Mã 1 -> sheet `TPTS`
    * Mã 2 -> sheet `TPCN`
    * Mã 3 -> sheet `HMP`
    * Mã 4 -> sheet `DD`
    * Mã 5 -> sheet `MM`
    * Mã 6 -> sheet `BM` (Bách hóa mới)
- **Tạo Sheet `TON KHO BMI`**:
  - Trích xuất từ sheet `ALL` các dòng có `Mã 5NH = 6`.
  - Tự động loại trừ các NCC: `17203`, `22478` và các mã NCC do người dùng nhập thêm trên giao diện.
  - Tính tổng cộng giá trị tồn BMI và lưu vào bộ nhớ cache.
- **Dọn dẹp Sheet `SKU Ton Am Old` sau khi thực hiện xong**:
  - Tự động quét và xóa bỏ toàn bộ các dòng có ghi chú hoặc trạng thái *"Không còn tồn âm"* (các SKU hôm qua âm nhưng hôm nay tồn kho đã >= 0) để làm sạch sheet cho các kỳ đối chiếu tiếp theo.
- **Xuất file**: `TON KHO AM DDMMYYYY.xlsx`.

### Phân hệ 4: Dashboard Tổng Quan & Cấu Hình Mapping
- **Dashboard**:
  - Bộ lọc chọn ngày linh hoạt.
  - 4 Thẻ KPI: Tổng Tồn Kho, Tổng May Mặc (MM), Tồn Kho BMI, Số lượng SKU Tồn Âm.
  - Bảng tổng hợp giá trị tồn kho, doanh số, giá vốn và lợi nhuận gộp theo từng ngành hàng.
  - Thanh tiến độ dữ liệu (*Pipeline Status*) kiểm tra xem các báo cáo đã được nạp đủ hay chưa.
- **Cấu hình Mapping**: Cho phép xem và lưu danh sách nhóm ngành, danh sách NCC loại trừ khỏi tồn kho và mã phòng ban đặc thù.

---

## 5. ĐẶC TẢ GIAO DIỆN & TRẢI NGHIỆM NGƯỜI DÙNG (UI/UX)
1. **Sidebar Navigation**:
   - Header hiển thị logo Co.opmart Đà Nẵng, nhãn workspace, trạng thái hệ thống (*Live Pulse*).
   - Nút thu gọn/mở rộng sidebar (*Collapse Toggle*) để tối ưu không gian hiển thị cho bảng tính nhiều cột.
   - Menu điều hướng phân nhóm rõ ràng (Tổng quan, Báo cáo ERP, Cấu hình hệ thống).
2. **Topbar & Header**:
   - Breadcrumb phân cấp theo trang.
   - Chỉ báo trạng thái máy chủ/tính toán.
   - Nút hành động chính: *Xuất báo cáo Excel*.
3. **Upload Panels**:
   - Dạng Dropzone kéo thả tệp tin với viền nét đứt (*dashed*), có phản hồi trực quan khi di chuột (*dragging state*).
   - Hiển thị badge tick xanh và tên file khi đã nạp thành công.
4. **Data Tables**:
   - Bảng hiển thị dạng bảng tính Enterprise, có thanh cuộn ngang/dọc với sticky header.
   - Các cột số tiền và phần trăm được căn phải (*text-right*) và hiển thị font monospace.
   - Tích hợp thanh tìm kiếm tức thời theo SKU / Tên SP / Nhà cung cấp và bộ lọc theo Sheet ngành hàng.

---

## 6. YÊU CẦU PHI CHỨC NĂNG & HIỆU NĂNG
- Không được làm mất hay rò rỉ dữ liệu của người dùng ra internet.
- Chịu tải tốt với file Excel từ 10.000 đến 100.000 dòng dữ liệu ERP.
- Toàn bộ thuật toán parse chuỗi, định dạng tiền tệ và regex phải hỗ trợ đầy đủ Unicode tiếng Việt có dấu.
