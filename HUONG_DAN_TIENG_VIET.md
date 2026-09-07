# 🇻🇳 HƯỚNG DẪN SỬ DỤNG CÁC FILE SPEC

**Dự án:** Joy Fee Check - Thiết kế lại giao diện  
**Ngày tạo:** 07/09/2026  
**Dành cho:** Google AI Studio

---

## 📁 CÁC FILE ĐÃ TẠO

Mình đã tạo **9 files** cho bạn:

### 8 Files Specification (tiếng Anh):
1. `SPEC_01_OVERVIEW.md` (5.2 KB) — Tổng quan dự án
2. `SPEC_02_DATA_STRUCTURE.md` (7.9 KB) — Cấu trúc dữ liệu
3. `SPEC_03_UI_LAYOUT.md` (8.5 KB) — Bố cục trang
4. `SPEC_04_TAB_IMPORT.md` (11 KB) — Tab Import
5. `SPEC_05_TAB_REPORT.md` (15 KB) — Tab Báo cáo
6. `SPEC_06_TAB_ACCOUNTING.md` (15 KB) — Tab Kế toán (7 sub-tabs)
7. `SPEC_07_TAB_SETTINGS.md` (19 KB) — Tab Cài đặt
8. `SPEC_08_COMPONENTS.md` (18 KB) — Components tái sử dụng

### File hướng dẫn:
9. `README_SPECS.md` (11 KB) — Tổng hợp + hướng dẫn nhanh

**Tổng cộng:** ~110 KB văn bản chi tiết

---

## 🎯 CÁCH SỬ DỤNG

### Bước 1: Copy toàn bộ sang Google AI Studio

**Cách 1: Copy từng file**
```bash
# Trên máy của bạn, mở từng file và copy nội dung:
D:\Joy\joyfeecheck\SPEC_01_OVERVIEW.md
D:\Joy\joyfeecheck\SPEC_02_DATA_STRUCTURE.md
...và 7 file còn lại
```

**Cách 2: Copy tất cả vào 1 file lớn**
Mở `README_SPECS.md` trước để hiểu tổng quan, sau đó copy từng SPEC file vào Google AI Studio.

### Bước 2: Hướng dẫn Google AI Studio

Khi paste vào Google AI Studio, bạn viết prompt như sau:

```
Tôi có 8 file specification để xây dựng lại giao diện web app.
Đây là file đầu tiên (SPEC_01_OVERVIEW.md):

[paste nội dung SPEC_01 vào đây]

Hãy đọc kỹ và xác nhận bạn đã hiểu. Sau đó tôi sẽ gửi 7 file còn lại.
```

Sau khi AI xác nhận hiểu SPEC_01, tiếp tục gửi SPEC_02, rồi SPEC_03... cho đến SPEC_08.

### Bước 3: Yêu cầu AI bắt đầu code

Sau khi gửi đủ 8 files, viết prompt:

```
Bây giờ hãy bắt đầu viết code theo thứ tự:
1. Tạo file index-v2.html với cấu trúc cơ bản (header, tab bar, main content)
2. Tạo file css/style-v2.css với Apple Flat design system
3. Implement Tab 1: Import Dữ Liệu

Làm từng bước, sau mỗi bước hỏi tôi xem có đúng chưa trước khi làm tiếp.
QUAN TRỌNG: KHÔNG được sửa 7 file JS hiện có (datamodel, utils, storage, 
importer, matcher, reporter, accounting, exporter).
```

---

## ⚠️ LƯU Ý QUAN TRỌNG

### ✅ Được làm:
- Tạo file mới: `index-v2.html`, `css/style-v2.css`, `js/app-v2.js`
- Dùng Alpine.js (CDN) để quản lý UI state
- Gọi các hàm hiện có từ `window.Matcher`, `window.Reporter`, etc.
- Thiết kế theo phong cách Apple Flat (nền trắng, đổ bóng nhẹ, button tròn)

### ❌ KHÔNG được làm:
- **TUYỆT ĐỐI KHÔNG sửa** 7 file JS hiện có:
  - `js/datamodel.js`
  - `js/utils.js`
  - `js/storage.js`
  - `js/importer.js`
  - `js/matcher.js`
  - `js/reporter.js`
  - `js/accounting.js`
  - `js/exporter.js`
- Không thêm npm, webpack, hay build tools
- Không dùng framework khác ngoài Alpine.js
- Không thay đổi logic tính toán

---

## 🎨 THIẾT KẾ APPLE FLAT

### Màu sắc chính:
```css
Nền:           #ffffff (trắng)
Nền phụ:       #f5f5f7 (xám nhạt)
Chữ chính:     #1d1d1f (đen)
Chữ phụ:       #86868b (xám)
Màu nổi bật:   #0071e3 (xanh Apple)
Thành công:    #34c759 (xanh lá)
Lỗi:           #ff3b30 (đỏ)
Cảnh báo:      #ff9500 (cam)
```

### Đặc điểm:
- **KHÔNG** dùng glassmorphism, gradient phức tạp
- **CÓ** nền trắng sạch, đổ bóng rất nhẹ
- Button dạng viên thuốc (border-radius: 980px)
- Card bo tròn 16px
- Khoảng cách rộng rãi (padding 24-40px)

---

## 🔧 YÊU CẦU KỸ THUẬT MỚI

### Cột "Nguồn CK" (mới thêm hôm nay)

**Vị trí:** 
- Tab 3 (Báo cáo Đối soát) — cột thứ 11
- Tab 4 → Sub-tab 3 (Giảm bớt) — cột thứ 6

**Hiển thị:**
```
💵 Tiền mặt   — nếu không có VTB/TPBank
🏦 VTB        — nếu có chuyển khoản VietinBank
🏦 TPBank     — nếu có chuyển khoản TPBank
—             — nếu không có nguồn nào
```

**Logic:**
```javascript
getNguonCK(row) {
  if (row.chuyenKhoanVTB > 0) return '🏦 VTB';
  if (row.chuyenKhoanTPB > 0) return '🏦 TPBank';
  if (row.tienMat > 0) return '💵 Tiền mặt';
  return '—';
}
```

**Mục đích:** Giúp kế toán biết học sinh đóng tiền qua kênh nào, tránh nhầm lẫn.

---

## 📋 CHECKLIST KIỂM TRA

Sau khi Google AI Studio code xong, kiểm tra:

### Chức năng cơ bản:
- [ ] Mở `index-v2.html` trên Chrome/Edge
- [ ] Kéo thả 4 file Excel vào tab Import → hiện "✅ Đã import"
- [ ] Bấm "Bắt đầu đối soát" → loading → chuyển sang tab Báo cáo
- [ ] Thấy bảng dữ liệu hiển thị đầy đủ 13 cột
- [ ] Cột "Nguồn CK" hiển thị đúng (💵 Cash / 🏦 VTB / 🏦 TPBank)
- [ ] Lọc theo trạng thái → bảng thay đổi
- [ ] Bấm "Xuất Excel" → tải file về được

### Giao diện:
- [ ] Nền màu trắng, không có glassmorphism
- [ ] Button màu xanh #0071e3, bo tròn kiểu viên thuốc
- [ ] Card có đổ bóng nhẹ `0 1px 3px rgba(0,0,0,0.08)`
- [ ] Font chữ Inter (từ Google Fonts)
- [ ] Responsive: trên mobile bảng scroll ngang được

### Tab Kế toán (7 sub-tabs):
- [ ] Tab 1: DS HĐ tháng trước — hiển thị danh sách
- [ ] Tab 2: DS CK VTB — hiển thị danh sách
- [ ] Tab 3: Giảm bớt — có cột "Nguồn CK" ✅
- [ ] Tab 4: Stop học nghỉ — có radio button chọn
- [ ] Tab 5: Tăng mới — hiển thị danh sách
- [ ] Tab 6: CK sai tiền — hiển thị bảng phân bổ gia đình
- [ ] Tab 7: Tổng hợp — có checkbox, filter tag, sort

### LocalStorage:
- [ ] Sau khi import, F5 refresh → dữ liệu vẫn còn
- [ ] Thêm nhóm gia đình → F5 → vẫn thấy trong bảng
- [ ] Xuất backup JSON → Nhập lại → dữ liệu khôi phục đúng

---

## 🚨 NẾU GẶP LỖI

### Lỗi 1: "Matcher is not defined"
**Nguyên nhân:** Alpine.js load trước các file JS logic  
**Sửa:** Đảm bảo thứ tự script trong HTML:
```html
<!-- 1. SheetJS -->
<script src="lib/xlsx.full.min.js"></script>

<!-- 2. Logic cũ (7 files) -->
<script src="js/datamodel.js"></script>
<script src="js/utils.js"></script>
<script src="js/storage.js"></script>
<script src="js/importer.js"></script>
<script src="js/matcher.js"></script>
<script src="js/reporter.js"></script>
<script src="js/accounting.js"></script>
<script src="js/exporter.js"></script>

<!-- 3. Alpine.js -->
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>

<!-- 4. App mới (cuối cùng) -->
<script src="js/app-v2.js"></script>
```

### Lỗi 2: Modal/Toast nhấp nháy khi load
**Nguyên nhân:** Thiếu `x-cloak`  
**Sửa:** Thêm directive và CSS:
```html
<div x-show="showModal" x-cloak>...</div>

<style>
[x-cloak] { display: none !important; }
</style>
```

### Lỗi 3: Bảng không scroll trên mobile
**Nguyên nhân:** Thiếu `overflow-x: auto`  
**Sửa:**
```css
.table-container {
  overflow-x: auto;
}
```

### Lỗi 4: Màu sắc không giống Apple
**Nguyên nhân:** Dùng sai màu  
**Sửa:** Kiểm tra lại file SPEC, dùng chính xác:
- Primary button: `#0071e3`
- Nền: `#ffffff` và `#f5f5f7`
- Chữ: `#1d1d1f` và `#86868b`

---

## 📞 HỖ TRỢ

**Nếu bạn gặp khó khăn:**
1. Đọc lại file `README_SPECS.md` (file tổng hợp)
2. Đọc lại SPEC tương ứng với phần đang làm
3. Xem code cũ trong `js/app.js` để tham khảo
4. Console.log() để kiểm tra dữ liệu
5. Hỏi lại mình qua Telegram này

---

## ✅ KẾT QUẢ MONG ĐỢI

Khi hoàn thành, bạn sẽ có:

### 3 file mới:
1. `index-v2.html` — Giao diện mới với Alpine.js
2. `css/style-v2.css` — Thiết kế Apple Flat
3. `js/app-v2.js` — Controller Alpine.js

### 7 file cũ giữ nguyên:
- `js/datamodel.js` ✓
- `js/utils.js` ✓
- `js/storage.js` ✓
- `js/importer.js` ✓
- `js/matcher.js` ✓
- `js/reporter.js` ✓
- `js/accounting.js` ✓
- `js/exporter.js` ✓

### Kết quả:
- ✅ Giao diện đẹp, hiện đại (Apple Flat style)
- ✅ Logic tính toán 100% giữ nguyên
- ✅ Không cần build tools, mở file HTML là chạy
- ✅ Responsive, chạy tốt trên mobile
- ✅ Có cột "Nguồn CK" mới theo yêu cầu

---

## 🎉 CHÚC MỪNG!

Bạn đã có đủ tài liệu để Google AI Studio xây dựng lại giao diện!

**Thời gian ước tính:**
- Đọc specs: 30 phút
- Code HTML/CSS: 2-3 giờ
- Implement Alpine.js: 3-4 giờ
- Test và fix bugs: 1-2 giờ

**Tổng:** ~7-10 giờ làm việc

**Chúc bạn thành công!** 🚀✨

---

**Được tạo bởi:** Hermes Agent  
**Ngày:** 07/09/2026, 11:49 GMT+7  
**Trạng thái:** ✅ Hoàn thành và sẵn sàng sử dụng
