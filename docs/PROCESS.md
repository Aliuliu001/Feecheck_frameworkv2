# 📝 PROCESS — Tiến trình & Bối cảnh

> Cập nhật: 04/08/2026 17:00
> Conversation gốc: `071e7db4-5cef-45b7-9a78-5c5d156a89bb`
> Conversation hiện tại: `cce1c9b1-7298-48d5-a160-172acb6961a4`

---

## Lịch sử công việc

### Session 1 (30/07 – 02/08/2026) — Conv `071e7db4`
- Phỏng vấn user → xác nhận 100% yêu cầu nghiệp vụ
- Code toàn bộ 10 file (HTML + CSS + 9 JS modules)
- Tạo file `handoff.md` chi tiết để bàn giao

### Session 2 (03/08/2026) — Conv `cce1c9b1` (hiện tại)
- Đọc `handoff.md`, bắt đầu Phase 1 (Test & Fix)
- **Đã fix:**
  - `utils.js`: Sửa `showModal()` dùng đúng `#global-modal` thay vì tạo DOM mới
  - `storage.js`: Fix `mergeSTKPhu()` + `mergeKeywords()` — lỗi duplicate khi merge (không update `currentMap` trong loop), return `undefined` thay vì `0`
  - `utils.js`: Fix `formatDate()` — không parse được ngày 2 chữ số năm (DD-MM-YY)
  - `reporter.js`: Fix `filterReport()` — filter "all" lọc ẩn TOÀN BỘ dữ liệu thay vì hiện tất cả
  - `app.js`: Fix 8 bug:
    - Nút `btn-export-full` chưa được gắn event listener
    - `suggestMatch()` truyền sai format (array thay vì object)
    - TPBank unmatched bị hard-code "Chưa có gợi ý" thay vì gọi `suggestMatch()`
    - Nút "Gán MSHS" crash nếu tên chứa dấu nháy đơn (unescaped quotes)
    - Sau khi gán STK/keyword, UI không re-render (thiếu gọi `runMatching()`)
    - `lastBackupDate` sai tên biến (đúng: `lastHistoryDate`)
    - Modal đóng trước khi validate input → sửa `showModal()` chỉ đóng khi `onConfirm()` không return false
  - `importer.js`: Fix 4 vấn đề:
    - Hardcode học phí mặc định thay vì đọc từ ô `#default-fee`
    - Thiếu keyword cột VietinBank/TPBank (thêm alias)
    - Hard-code tên chủ tài khoản TPBank cá nhân → comment ra
    - MSHS tiền mặt không uppercase → thêm `.toUpperCase()`
  - `matcher.js`: Fix 2 vấn đề:
    - `keyword.length` crash nếu keyword undefined → dùng `(b.keyword || '').length`
    - Aggregation case-sensitive → thêm `.toUpperCase()` cho MSHS
- **Đã thêm tính năng:**
  - Tab "📖 Hướng dẫn" trong `index.html`
  - Nút Xuất/Nhập Mapping JSON + merge logic
  - Auto-load `shared_data/joy_mappings.json` khi mở app
  - Hàm `exportFullExcel()` — xuất file Excel 7 sheets
- **Đã trích xuất mapping:**
  - Script `extract_mappings.ps1` chạy thành công: 34 STK Phụ + 101 Từ khóa → `shared_data/joy_mappings.json`

### Session 2 (04/08/2026) — Phân tích yêu cầu mới
- User nêu 4 vấn đề nghiệp vụ → phân tích chi tiết → user xác nhận
- Đọc file mẫu kế toán: `Ds hoc Phi - 07.2026 - Done.xlsx` → nắm rõ cấu trúc 2 sheet
- Tạo implementation plan cho 4 tính năng mới → user duyệt
- **CHƯA CODE** các tính năng mới — đang tạo tài liệu bàn giao

---

## Quyết định thiết kế quan trọng

1. **100% client-side**: Không server, không DB. localStorage là storage chính. Portable: copy folder → mở trên máy bất kỳ.
2. **Mapping tích lũy**: STK_PHU + MAP_TU_KHOA lưu vĩnh viễn trong localStorage, tích lũy qua các tháng. Export/import qua JSON.
3. **SheetJS (xlsx.full.min.js)**: Đọc/ghi Excel offline, không cần internet.
4. **Sync thủ công**: Google Sheets vẫn là master. App chỉ đọc file download. User cập nhật ngược lên GG Sheets bằng tay.
5. **Nhóm Gia đình (SẮP THÊM)**: 1 PH đóng tiền cho nhiều HS → phân bổ theo tỉ lệ HP riêng từng cháu.

---

## Xác nhận từ user (04/08)

- **Q1**: Mỗi MSHS mặc định 800.000đ, có thể custom. HS học kèm 2 lớp có thể HP ≠ 1.600.000đ mà là 1.300.000đ chẳng hạn (tính theo buổi). HP riêng đã có sẵn trong file DS Học sinh (mỗi dòng = 1 lớp, 1 mức HP).
- **Q2**: Mọi khoản CK VietinBank (TK công ty) nếu khác số mặc định → ghi chú cảnh báo.
- **Q3**: File mẫu kế toán tại `D:\Joy\...\Backup Ds Hang Thang Ke Toan\Ds hoc Phi - 07.2026 - Done.xlsx`
- **Câu hỏi thêm**: Về cột tick/ghi chú trong file tổng → đề xuất KHÔNG CẦN, vì tab Kế toán trên web đã có checkbox. User không rành phần này nên chấp nhận đề xuất.

### Session 3 (05/08/2026) — Triển khai logic tính toán
- **Hoàn thành Phase 0**: Fix lỗi missing keys ở export tổng hợp, viết lại hàm xuất kế toán Excel khớp định dạng file mẫu.
- **Hoàn thành Phase 1**: Đã thêm cấu trúc `NHOM_GIA_DINH` vào CSDL, làm Storage methods, render bảng quản lý nhóm ở UI, thêm popup nhập Nhóm.
- **Hoàn thành Phase 2**: Hoàn tất thuật toán phân bổ tiền theo gia đình (`distributeByFamily` ở matcher.js) và tích hợp vào quy trình Matcher. Đã có thể chia tiền học phí chung cho các cháu trong nhóm.
- **Hoàn thành Phase 3**: Thêm logic ghi chú tự động trong `reporter.js` — cảnh báo CK TK CT lệch HP, phát hiện HS nhiều lớp, gắn nhóm GĐ, hiển thị thiếu/dư. Highlight dòng ⚠ trên UI.
- **Hoàn thành Phase 4**: Bổ sung `"Tang moi"` + `"Giam bot"` vào exporter kế toán. `"Giam bot"`: HS tháng trước có ghi HĐ mà tháng này biến mất → liệt kê trong sheet "Thay đổi". Truyền `prevMonthHD` từ `app.js` vào `exporter.js`. Cập nhật UI tab Kế toán hiển thị badge `Tang moi` / `CK TK CT`.
- Đang chuẩn bị Phase 5 (Test tổng thể).
