# 📋 TASK — Danh sách công việc chi tiết

> Cập nhật: 28/08/2026
> **Dành cho model kế tiếp**: Đọc file này + `PROCESS.md` + `BUGS.md` + `README.md` để nắm toàn bộ context.

---

## 🎯 TRẠNG THÁI HIỆN TẠI (CURRENT STATUS)

- **ĐÃ HOÀN THÀNH**: Toàn bộ nghiệp vụ tính toán, UI/UX, logic import/export, chia tiền nhóm gia đình, xử lý ngoại lệ (Phase 0 đến Phase 5A).
- **ĐANG DANG DỞ**: Đang tạm ngưng ở **Phase 5B: Test tổng thể**. (Chưa test thử nghiệm với dữ liệu thật trên trình duyệt).
- **CẦN LÀM TIẾP THEO**: User mở `index.html` → Nạp 4 file từ thư mục `test_data/` → Chạy đối soát → Cung cấp phản hồi.

---

## 🔴 PHASE 0: Fix Known Issues (Làm trước khi thêm tính năng mới)

### Task 0.1: Fix `exportFullExcel()` key mapping
- **File**: `js/app.js` dòng ~225 (setupButtons) và `js/exporter.js` dòng ~225-227
- **Vấn đề**: `Exporter.exportFullExcel(this.state)` truyền `this.state` nhưng `exportFullExcel()` destructure: `{ students, vtb, tpb, cash, ... }`. Trong khi state dùng tên: `vtbTransactions`, `tpbTransactions`, `cashPayments`.
- **Fix**: Trong `setupButtons()`, đổi thành truyền object đúng key:
  ```js
  document.getElementById('btn-export-full')?.addEventListener('click', () => {
    Exporter.exportFullExcel({
      students: this.state.students,
      vtb: this.state.vtbTransactions,
      tpb: this.state.tpbTransactions,
      cash: this.state.cashPayments,
      reportRows: this.state.reportRows,
      stats: Reporter.getStatistics(this.state.reportRows),
      stkPhu: Storage.loadSTKPhu(),
      keywords: Storage.loadKeywords(),
      monthYear: document.getElementById('month-selector')?.value || ''
    });
  });
  ```
- [x] **Đã làm**

### Task 0.2: Fix `exportKeToan()` format đúng mẫu
- **File**: `js/exporter.js` → hàm `exportKeToan()`
- **Vấn đề**: Sheet "DS viết HĐ" chưa đúng mẫu kế toán thực tế (thiếu footer tổng + "Giám đốc" + tên)
- **Mẫu đúng** (đã đọc từ file `Ds hoc Phi - 07.2026 - Done.xlsx`):
  - Sheet 1 "Thực Tế": Header row 1, data từ row 2, cuối = dòng tổng HP
  - Sheet 2 "Danh sách viết HĐ":
    - Row 1: `CONG TY TNHH TRUNG TAM NGOAI NGU JOY`
    - Row 2: `5801527284`
    - Row 3: `Hẻm 3b, Hồ Tùng Mậu, Phường Xuân Hương - Đà Lạt, Tỉnh Lâm Đồng`
    - Row 4: (trống)
    - Row 5: `DANH SACH HỌC SINH THÁNG [MM.YYYY]`
    - Row 6: (trống)
    - Row 7: Header cột (STT | Mã HS | Mã lớp | Họ tên | GV | Học phí | Địa chỉ | Ghi chú)
    - Row 8+: Data
    - Sau data: Tổng HP | "Số tiền bằng chữ:" | (trống) | "Giám đốc" | (trống) | "TRUONG TUAN NGOC"
  - **8 cột giống nhau cả 2 sheet**: STT | Mã học sinh | Mã lớp | Họ tên học sinh | Giáo viên | Học phí | Địa chỉ | Ghi chú
  - Cột Ghi chú sheet 2: tự động ghi `"Tang moi"` cho HS mới thêm
- [x] **Đã làm**

---

## 🟡 PHASE 1: Thêm Nhóm Gia đình (NHOM_GIA_DINH)

### Task 1.1: Cập nhật Data Model
- **File**: `js/datamodel.js`
- Thêm struct `NHOM_GIA_DINH` vào phần documentation:
  ```js
  NHOM_GIA_DINH: {
    groupId: String,       // "GD001" — auto-generate
    groupName: String,     // "Nhà Cô Lan" — tên gợi nhớ
    members: [String],     // ["HV011", "HV012", "HV045"] — danh sách MSHS
    stkDaiDien: String,    // "5491205278990" — STK phụ huynh đại diện
    tenPH: String          // "CAN HOANG LAN PHUONG"
  }
  ```
- Thêm `STORAGE_KEYS.FAMILY_GROUPS: 'joy_family_groups'`
- [x] **Đã làm**

### Task 1.2: Storage CRUD cho Nhóm GĐ
- **File**: `js/storage.js`
- Thêm 5 hàm:
  - `loadFamilyGroups()` → return `[]` nếu chưa có
  - `saveFamilyGroups(data)` → ghi vào localStorage
  - `addFamilyGroup(group)` → auto-gen `groupId = 'GD' + Date.now()`, push vào list, save
  - `removeFamilyGroup(groupId)` → filter ra, save
  - `mergeFamilyGroups(newList)` → gộp theo `groupId`, không ghi đè, return count
- [x] **Đã làm**

### Task 1.3: UI quản lý Nhóm GĐ
- **File**: `index.html` → Tab Cài đặt (id `settings-tab`)
- Thêm section "Nhóm Gia đình" gồm:
  - Bảng hiển thị: Tên nhóm | MSHS (cách nhau dấu phẩy) | STK đại diện | Nút Xóa
  - Nút "➕ Thêm nhóm" → mở modal:
    - Input: Tên nhóm (text)
    - Input: Danh sách MSHS (text, cách nhau dấu phẩy: "HV011, HV012, HV045")
    - Input: STK đại diện (text)
    - Input: Tên PH (text)
- **File**: `js/app.js`
  - Hàm `addFamilyGroupUI()` → đọc modal → gọi `Storage.addFamilyGroup()` → reload UI
  - Hàm `deleteFamilyGroup(groupId)` → gọi `Storage.removeFamilyGroup()` → reload UI
  - Cập nhật `loadSettingsUI()` → render bảng nhóm GĐ
- [x] **Đã làm**

---

## 🟡 PHASE 2: Phân bổ tiền theo Nhóm Gia đình

### Task 2.1: Cập nhật Matcher — logic phân bổ
- **File**: `js/matcher.js` → sau hàm `aggregateByMSHS()`
- Thêm hàm mới: `distributeByFamily(aggregated, students, familyGroups)`
- **Thuật toán**:
  1. Duyệt mỗi `familyGroup`
  2. Tìm STK đại diện trong `aggregated` (key = MSHS đầu tiên có STK trùng, HOẶC tìm trực tiếp)
  3. Gom tổng tiền CK từ **tất cả nguồn** cho STK đại diện
  4. Lấy học phí riêng (tongHocPhi) của từng member → tính tỉ lệ
  5. Phân bổ tiền theo tỉ lệ HP
  6. Nếu member đã có tiền mặt (ghi rõ MSHS) → trừ trước, phần CK chia cho phần còn lại
  7. Cập nhật lại `aggregated` Map
- **Lưu ý**: Không ghi đè tiền mặt đã gán trực tiếp cho member. Chỉ phân bổ phần CK.
- [x] **Đã làm**

### Task 2.2: Tích hợp vào flow matching
- **File**: `js/app.js` → hàm `runMatching()`
- Sau dòng gọi `Matcher.aggregateByMSHS(...)`, thêm:
  ```js
  const familyGroups = Storage.loadFamilyGroups();
  if (familyGroups.length > 0) {
    paymentsByMSHS = Matcher.distributeByFamily(paymentsByMSHS, this.state.students, familyGroups);
  }
  ```
- [x] **Đã làm**

---

## 🟡 PHASE 3: Auto-detect ghi chú bất thường

### Task 3.1: Thêm logic ghi chú trong Reporter
- **File**: `js/reporter.js` → hàm `generateReport()`
- Sau khi tính `trangThai`, bổ sung block tạo `ghiChu`:
  ```
  Quy tắc (ưu tiên từ trên xuống, gộp bằng " · "):
  1. Nếu CK VietinBank > 0 VÀ ≠ tongHocPhi → "⚠ CK TK CT: [số tiền]đ (HP: [số tiền]đ)"
  2. Nếu có khoản CK gần giống bội 800k nhưng lệch (80k, 900k, 8M...) → "⚠ Nghi nhầm: [số tiền]đ"
  3. Nếu số lớp > 1 → "Học [N] lớp"
  4. Nếu thuộc nhóm GĐ → "GĐ: [tên nhóm]"
  5. Nếu Đóng thiếu → "Thiếu: [số tiền]đ"
  6. Nếu Đóng dư → "Dư: [số tiền]đ"
  ```
- Cần truyền thêm `familyGroups` vào `generateReport()`
- [x] **Đã làm**

### Task 3.2: Hiển thị ghi chú trên giao diện
- **File**: `js/app.js` → hàm render báo cáo
- Đảm bảo cột "Ghi chú" trong bảng báo cáo hiển thị `row.ghiChu` (không phải `ghiChuGiaDinh`)
- Nếu có cảnh báo `⚠` → highlight dòng đó bằng CSS class `.warning-row`
- [x] **Đã làm**

---

## 🟡 PHASE 4: Xuất DS Kế toán đúng mẫu + Ghi chú "Tang moi" / "Giam bot"

### Task 4.1: Bổ sung logic "Giam bot" trong `exporter.js`
- **File**: `js/exporter.js` → hàm `exportKeToan()`
- **Yêu cầu mới (user 05/08)**:
  - `"Tang moi"`: HS tháng trước KHÔNG CÓ, tháng này CÓ (đã có sẵn)
  - `"Giam bot"`: HS tháng trước CÓ trong DS ghi HĐ, tháng này KHÔNG CÒN trong DS (nghỉ học)
  - Cần truyền thêm `changeRows` (đã có) để detect `QUIT`
  - Cần truyền thêm `prevMonthHD` để biết HS nào tháng trước có ghi HĐ
- **Logic cụ thể**:
  - Với mỗi HS trong `ghiHDRows`, nếu `newStudents.has(mshs)` → ghi `"Tang moi"`
  - Tạo thêm 1 block sau data chính: liệt kê các MSHS thuộc `prevMonthHD` mà không còn trong `ghiHDRows` → ghi `"Giam bot"` hoặc ghi vào sheet "Thay đổi"
- [x] **Đã làm**

### Task 4.2: Cập nhật giao diện tab Kế toán
- **File**: `js/app.js` + `index.html`
- Khi DS Ghi HĐ hiện bảng → thêm cột "Ghi chú" hiển thị:
  - "Tang moi" nếu HS không có trong DS tháng trước
  - "Giam bot" nếu HS tháng trước ghi HĐ nhưng giờ mất
  - "CK TK CT" nếu có CK VietinBank
  - Ghi chú bất thường (từ Phase 3)
- [x] **Đã làm**

---

## 🟢 PHASE 5A: Fix Gaps trước khi Test

### Task 5A.1: Thêm nút "Xuất DS Nhắc Phí"
- **File**: `index.html` (tab Báo cáo, dòng 276-286) + `js/app.js` (setupButtons + hàm mới)
- Thêm nút "📋 Xuất DS Nhắc Phí" vào nhóm nút xuất ở tab Báo cáo
- Tạo hàm `exportNhacPH()` trong app.js gọi `Accounting.generateNhacPH()` → `Exporter.exportNhacPH()`
- [x] **Đã làm**

### Task 5A.2: Family Groups vào Mapping Export/Import
- **File**: `js/app.js` → hàm `exportMapping()` + `importMapping()`
- Bổ sung `joy_family_groups` vào file JSON khi xuất mapping
- Khi nhập mapping, gọi `Storage.mergeFamilyGroups()` để gộp nhóm GĐ
- [x] **Đã làm**

### Task 5A.3: CORS warning cho autoLoadMappings
- Đã có try/catch bảo vệ — chấp nhận ở mức hiện tại (user dùng nút Nhập Mapping thủ công)
- [x] **Đã làm** (workaround)

---

## 🟢 PHASE 5B: Test tổng thể

### Task 5.1: Tách 4 file test từ Excel gốc
- **Cách 1** (khuyến nghị): User mở file `Mr. Check VAT 7 - Tháng 7 - Copy.xlsm`, chuột phải vào từng sheet → Move/Copy → New Book → Save As `.xlsx`
- **Cách 2**: Fix script `extract_test_data.ps1` (hiện bị treo vì Excel COM prompt)
- 4 file cần tạo: `test_DsHocSinh.xlsx`, `test_SaoKeVTB.xlsx`, `test_SaoKeTPB.xlsx`, `test_TienMat.xlsx`
- Lưu vào `test_data/`
- [x] **Đã làm** (user tự tách)

### Task 5.2: Test import + matching + báo cáo
- Import 4 file → kiểm tra số bản ghi
- Chạy đối soát → kiểm tra dashboard
- So sánh với sheet `BAO_CAO` trong file gốc
- [ ] **Chưa làm**

### Task 5.3: Test xuất file kế toán
- Xuất Excel kế toán → mở file → so sánh format với file mẫu `Ds hoc Phi - 07.2026 - Done.xlsx`
- [ ] **Chưa làm**

### Task 5.4: Test nhóm gia đình
- Tạo 1 nhóm GĐ thử → import data → kiểm tra phân bổ tiền
- [ ] **Chưa làm**

### Task 5.5: Xuất file Full Excel → Gửi đồng nghiệp double-check
- Xuất `JoyFeeCheck_Full_[Tháng].xlsx` → đồng nghiệp mở Excel kiểm tra chéo (VLOOKUP/Filter)
- [ ] **Chưa làm**

---

## Hướng dẫn cho Model mới

> **⚠️ QUAN TRỌNG: Đọc kỹ trước khi code**

1. **Đọc 4 file docs**: `README.md`, `PROCESS.md`, `TASK.md` (file này), `BUGS.md`
2. **Làm theo thứ tự**: Phase 0 → 1 → 2 → 3 → 4 → 5
3. **Mỗi lần chỉ làm 1 task**, liệt kê chi tiết → chờ user duyệt → code
4. **Không dùng PowerShell để đọc file Excel** — script COM hay bị treo. Nếu cần tách file, nhờ user làm thủ công
5. **Test trên trình duyệt** (chưa test lần nào!) — mở `index.html` trên Chrome/Edge
6. **Stack**: Thuần HTML/CSS/JS + SheetJS. KHÔNG dùng Node.js, npm, framework nào cả
7. **File mẫu kế toán** tại: `D:\Joy\Chương trình SGK\Văn phòng\Lương hàng tháng\Backup Ds Hang Thang Ke Toan\Ds hoc Phi - 07.2026 - Done.xlsx`
8. **File Excel gốc** tại: `D:\Joy\Chương trình SGK\Văn phòng\Check HD VAT\Mr. Check VAT 7 - Tháng 7 - Copy.xlsm`
