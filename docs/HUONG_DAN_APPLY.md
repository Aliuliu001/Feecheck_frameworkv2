# 📘 HƯỚNG DẪN: Apply Patch & Sử dụng Joy Fee Check

> Viết ngày 28/08/2026. Dành cho user (không cần biết code vẫn làm được).

---

## PHẦN 1 — APPLY PATCH (áp dụng bản sửa lỗi)

Patch `joyfeecheck_fixes.patch` chứa 6 bug đã sửa (xem `BUGS.md` mục B21–B26).
Apply lên **repo gốc từ GitHub** (bản chưa sửa).

### Cách A — Dùng Git (khuyên dùng, nếu đã cài Git)

1. Mở terminal (CMD/PowerShell trên Windows, Terminal trên Mac).
2. Vào thư mục repo:
   ```bash
   cd đường_dẫn_tới_joyfeecheck
   ```
3. Copy file `joyfeecheck_fixes.patch` vào thư mục đó.
4. Chạy:
   ```bash
   git apply joyfeecheck_fixes.patch
   ```
5. Nếu hiện dòng mới không báo lỗi → **thành công**. Kiểm tra:
   ```bash
   git diff --stat
   ```
   Phải thấy 5 file thay đổi: `app.js, exporter.js, importer.js, matcher.js, reporter.js`.

### Cách B — Nếu lỗi "patch does not apply"

Thử apply mềm (tự động giải quyết xung đột nhẹ):
```bash
git apply --3way joyfeecheck_fixes.patch
```
Hoặc dùng lệnh `patch` (có sẵn trên Mac/Linux, Windows tải Git Bash):
```bash
patch -p1 < joyfeecheck_fixes.patch
```

### Cách C — Không có Git / không rành (thủ công)

Mở từng file trong danh sách dưới, tìm đoạn `OLD` (gạch đầu dòng `-`) và thay bằng `NEW` (gạch `+`).
Nhưng cách này dễ sai → **khuyên dùng Cách A**. Nếu cần, nhờ người rành Git 5 phút là xong.

### Sau khi apply
Mở `index.html` bằng Chrome/Edge là dùng được ngay (100% client-side, không cần cài gì thêm).

---

## PHẦN 2 — CHỨC NĂNG CỦA APP

Joy Fee Check giúp **thay thế tra soát Excel thủ công** bằng web app. Luồng:

```
4 file đầu vào → Web app đối soát → Báo cáo → Xuất file Kế toán + Nhắc nợ
```

### Các tab chính
| Tab | Chức năng |
|:--|:--|
| 📥 **Import** | Kéo thả 4 file Excel, chọn tháng, nhập học phí mặc định |
| ⚠️ **Ngoại lệ** | Xử lý GD chưa nhận diện (gán MSHS cho STK mới / tạo từ khóa) |
| 📊 **Báo cáo** | Bảng tổng hợp: ai đóng đủ/thiếu/dư, dòng ⚠ cảnh báo |
| 📋 **Kế toán** | DS Thực tế + DS Ghi HĐ (có checkbox) + Bảng thay đổi |
| ⚙️ **Cài đặt** | Quản lý STK phụ, Từ khóa, Nhóm GĐ, lưu tháng tham chiếu, backup |
| 📖 **Hướng dẫn** | Trợ giúp nhanh |

### 4 file đầu vào
1. **DS Học Sinh** (Google Sheets export) — mỏ neo, chứa MSHS + STK_PH + học phí.
2. **Sao kê VietinBank** (TK công ty) — match theo STK đối ứng.
3. **Sao kê TPBank** (TK cá nhân) — match theo từ khóa trong nội dung CK.
4. **Tiền mặt** — đã có sẵn MSHS.

### Nghiệp vụ quan trọng (đã xử lý đúng sau khi sửa)
- **1 STK có nhiều con**: hệ thống tự chia tiền theo tỉ lệ học phí (vd STK `107872880087` có 6 con → mỗi con nhận đúng phần).
- **Nhóm Gia đình**: 1 PH chuyển 1 cục → chia cho các con trong nhóm.
- **Cảnh báo ⚠**: CK VietinBank lệch học phí → báo "⚠ CK TK CT" (nguy cơ hụt HĐ).
- **Detect changes**: Tăng mới / Giảm bớt / Đổi lớp / CK TK công ty so với tháng trước.

---

## PHẦN 3 — THAO TÁC TỪNG BƯỚC (quy trình hàng tháng)

### Bước 1 — Chuẩn bị file
Tải 4 file từ nguồn, để sẵn trên máy:
- DS Học sinh (từ Google Sheets → File → Tải xuống → .xlsx)
- Sao kê VietinBank (export .xlsx)
- Sao kê TPBank (từ ABBYY → .xlsx)
- Tiền mặt (.xlsx)

### Bước 2 — Import
1. Mở `index.html` (Chrome/Edge).
2. Tab **Import**: kéo thả từng file vào ô tương ứng (hoặc click để chọn).
3. Chọn **Tháng đối soát** (vd `2026-07`).
4. Kiểm tra **Học phí mặc định** (thường 800.000đ).
5. Nút **"Bắt đầu đối soát"** sáng lên → bấm.

### Bước 3 — Xử lý ngoại lệ (lần đầu / tháng có GD lạ)
1. Sang tab **Ngoại lệ**.
2. Mục **"STK mới chưa map"**: với mỗi dòng, bấm **"Gán MSHS"** → nhập MSHS → hệ thống tự học.
3. Mục **"TPBank chưa xác định"**: bấm **"Gán MSHS"** → nhập MSHS + **Từ khóa** nhận diện (vd tên PH) → lưu.
4. Hệ thống tự chạy lại đối soát. Lần sau tháng mới không cần gán lại (đã lưu).

> 💡 **Lưu ý tháng 7:** 2 GD TPB của HV329, HV339 chưa có từ khóa → sang tab Ngoại lệ gán là khớp 100%.

### Bước 4 — Kiểm tra báo cáo
1. Tab **Báo cáo Đối soát**:
   - Xem thẻ tổng: Đã đóng / Chưa đóng / Thiếu / Dư / Tổng thu.
   - Dòng có **⚠ đỏ** = cần chú ý (CK TK CT lệch HP, thiếu, dư).
   - Lọc theo lớp / GV / trạng thái / tìm tên.

### Bước 5 — Xuất file
1. Tab **Báo cáo** → **"Xuất Báo cáo"** (Excel tổng hợp).
2. Tab **Kế toán**:
   - Bấm **"Tự động chọn HĐ"** (chọn những ai có CK TK CT hoặc đã ghi HĐ tháng trước).
   - Tick tay thêm/bớt nếu cần.
   - **"Xuất Kế toán"** → file 3 sheet (Thực tế, DS viết HĐ, Thay đổi) gửi Kế toán.
   - **"Xuất DS Nhắc Phí"** → gửi Giáo viên đòi các bé thiếu.

### Bước 6 — Lưu & đồng bộ
1. Tab **Cài đặt** → **"Lưu DS tháng tham chiếu"** (để tháng sau detect Tăng mới/Giảm bớt).
2. **"Xuất Mapping JSON"** → gửi đồng nghiệp (chứa STK + Từ khóa đã tích lũy).
3. Đồng nghiệp bấm **"Nhập Mapping JSON"** để có chung dữ liệu.

---

## PHẦN 4 — KIỂM TRA SAU KHI APPLY (tùy chọn)

Để chắc chắn patch đúng, mở `index.html` → nạp 4 file test trong `test_data/` → chạy đối soát.
Kết quả chuẩn (đã verify):
- 185 HS, VTB 86 GD, TPB 46 GD, Tiền mặt 27 GD.
- So với file master `Mr. Check VAT 7`: khớp 98.3% (3 HS lệch do thiếu keyword).

---

## ❓ LỖI THƯỜNG GẶP
- **App trắng / không load:** Mở bằng Chrome/Edge, không mở trực tiếp từ Zalo (dùng "Save as" rồi mở file).
- **Không đọc được file:** Đảm bảo file .xlsx (không phải .pdf). Sao kê phải có dòng tiêu đề chuẩn (chứa "STK đối ứng" / "đối ứng").
- **Thiếu tiền 1 HS:** Vào tab Ngoại lệ xem có STK/từ khóa chưa gán không.
