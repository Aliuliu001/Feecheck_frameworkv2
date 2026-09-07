# Joy Fee Check — UI/Layout Mô Tả Chi Tiết
## Prompt cho Google AI Studio — Redesign theo phong cách Apple Flat + Alpine.js

---

## 0. YÊU CẦU KỸ THUẬT (QUAN TRỌNG — Google AI Studio PHẢI tuân theo)

### Framework: Alpine.js
- **BẮT BUỘC** dùng Alpine.js (https://alpinejs.dev/) cho reactive state
- CDN: `<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>`
- KHÔNG dùng React, Vue, Angular — KHÔNG cần build step, KHÔNG cần npm
- Deploy trực tiếp lên GitHub Pages (static HTML files)
- Alpine.js viết trực tiếp trong HTML qua `x-data`, `x-show`, `x-for`, `@click`, `x-model`

### Excel Export: SheetJS
- GIỮ NGUYÊN SheetJS (XLSX) cho xuất Excel — KHÔNG thay thế
- CDN: `<script src="https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js"></script>`

### Output format
- Google AI Studio phải output: HTML file + CSS file + JS file riêng
- Mỗi tab = 1 section trong HTML (không SPA router)
- Tất cả functions hiện tại (matching, export, backup...) PHẢI giữ nguyên logic

### Backend: GitHub Pages (static only)
- KHÔNG có server/backend
- Dữ liệu lưu trên localStorage + file Excel import
- Service Worker: KHÔNG cần

---

## 0B. PHONG CÁCH THIẾT KẾ: APPLE FLAT (apple.com/vn)

### Design Principles
- **Flat design**: KHÔNG glassmorphism, KHÔNG gradient phức tạp, KHÔNG shadow lớn
- **Clean white background** với sections xen kẽ `#f5f5f7` (xám nhạt Apple)
- **Typography**: San Francisco / Inter, heading lớn bold, body text nhẹ
- **Whitespace rộng**: padding 24-48px giữa các sections, 16-24px giữa cards
- **Border-radius**: 12-16px cho cards, 8px cho buttons, 20px cho pills
- **Color palette Apple-like**:
  - Background: `#ffffff` (white), `#f5f5f7` (light gray sections)
  - Text chính: `#1d1d1f` (gần đen)
  - Text phụ: `#86868b` (xám)
  - Accent Blue: `#0071e3` (Apple blue — buttons, links)
  - Success: `#34c759` (Apple green)
  - Error: `#ff3b30` (Apple red)
  - Warning: `#ff9500` (Apple orange)
  - Info: `#5ac8fa` (Apple light blue)
  - Purple: `#af52de`
- **Icons**: SF Symbols style hoặc Lucide/Phosphor icons (thay emoji hiện tại)
- **Shadows**: rất nhẹ (0 1px 3px rgba(0,0,0,0.08)) hoặc KHÔNG shadow
- **Animations**: smooth 0.3s ease, subtle hover (scale 1.02 cho cards)
- **Dark mode**: KHÔNG — giữ light theme Apple

### Component Redesign Reference
- **Cards**: Nền trắng, border-radius 16px, shadow cực nhẹ, padding 24px
- **Buttons Primary**: Nền `#0071e3`, text trắng, border-radius 980px (pill), padding 12px 24px
- **Buttons Secondary**: Nền transparent, border 1px solid `#d2d2d7`, text `#1d1d1f`
- **Tables**: không viền, header background `#f5f5f7`, rows separator 1px `#d2d2d7`
- **Inputs**: border-radius 8px, border 1px `#d2d2d7`, padding 10px 14px
- **Tabs**: horizontal pill buttons, active = filled `#0071e3`, inactive = text only
- **Badges**: pill shape, background theo type, text trắng
- **Toast**: top-right corner, slide down animation, background theo type
- **Drop zones**: dashed border `#d2d2d7`, hover = solid `#0071e3`

---

## 1. TỔNG QUAN

**Joy Fee Check** là web app đối soát học phí cho Trung tâm Ngoại ngữ Joy (Đà Lạt, Việt Nam). Một giáo viên/dạyersử dụng app hàng tháng để:
- Import dữ liệu từ file Excel (danh sách HS, sao kê ngân hàng)
- Đối chiếu tự động: HS nào đã đóng, chưa đóng, đóng thiếu, đóng dư
- Xuất báo cáo kế toán cho giám đốc

**URL:** https://aliuliu001.github.io/joyfeecheck/
**Công nghệ:** Alpine.js (CDN) + SheetJS (xuất Excel) + Vanilla CSS
**Cổng:** GitHub Pages (static, không backend)
**Ngôn ngữ:** Tiếng Việt throughout

---

## 2. CẤU TRÚC TRANG

### Layout tổng thể
```
┌─────────────────────────────────────────────┐
│ HEADER: Logo "J" + "Joy Fee Check" + Date  │
├─────────────────────────────────────────────┤
│ TAB BAR: 6 nút tab (horizontal scroll)     │
│ 📥 Import | ⚠️ Ngoại lệ | 📊 Đối soát |   │
│ 📋 Kế toán | ⚙️ Cài đặt | 📖 Hướng dẫn    │
├─────────────────────────────────────────────┤
│ MAIN CONTENT: Hiển thị 1 tab tại 1 thời điểm│
│ (toàn bộ nội dung bên dưới)                │
│                                              │
│ [Back to Top button] ở góc dưới phải       │
└─────────────────────────────────────────────┘
```

### Color Scheme (Dark Theme)
- Background chính: `#0d1117` (rất tối, gần đen)
- Card/Box: `#161b22` (tối hơn một chút)
- Text chính: `#e6edf3` (trắng nhạt)
- Text phụ: `#8b949e` (xám)
- Border: `#30363d` (xám đậm)
- Accent Blue: `#58a6ff` (nút chính, link)
- Accent Green: `#3fb950` (thành công, đã đóng)
- Accent Red: `#f85149` (lỗi, chưa đóng)
- Accent Yellow: `#d29922` (cảnh báo, đóng thiếu)
- Accent Purple: `#a371f7` (đóng gói)
- Font: Inter (Google Fonts)
- Hiệu ứng: Glassmorphism (card trong suốt + blur)

---

## 3. HEADER

```
┌──────────────────────────────────────────────┐
│ [J]  Joy Fee Check  v1.0         04/09/2026 │
└──────────────────────────────────────────────┘
```
- Logo: Vi tròn màu blue với chữ "J" trắng, border-radius 50%
- Title: "Joy Fee Check" font-size 1.2rem, font-weight 700
- Badge version: "v1.0" nền xám nhỏ
- Ngày hiện tại: bên phải, font-size nhỏ, color xám

---

## 4. TAB BAR (Navigation)

```
┌──────────────────────────────────────────────────────┐
│ 📥 Import │ ⚠️ Ngoại lệ(3) │ 📊 Đối soát │ 📋 KT │ │
└──────────────────────────────────────────────────────┘
```

- Horizontal bar, nền `#161b22`, border-bottom 1px
- Mỗi tab: icon emoji + chữ, padding 12px 16px
- Tab đang active: text màu blue, có underline indicator (2px blue, sliding animation)
- Tab "Ngoại lệ" có counter badge (số đỏ) khi có ngoại lệ
- Responsive: trên mobile sẽ scroll ngang
- Tab indicator: div absolute, transition left/width smooth 0.3s

---

## 5. TAB 1: IMPORT DỮ LIỆU

### 5.1 Cài đặt đối soát (Settings panel)
```
┌─────────────────────────────────────────────┐
│ Cài đặt đối soát                           │
│ ┌──────────────┐ ┌──────────────────────┐   │
│ │ Tháng đối soát│ │ Học phí mặc định    │   │
│ │ [09/2026    ] │ │ [800000] VNĐ        │   │
│ └──────────────┘ └──────────────────────┘   │
└─────────────────────────────────────────────┘
```
- Card glassmorphism, border-radius 12px
- 2 input fields: tháng (type=month) và học phí mặc định (type=number)

### 5.2 Drop Zones Grid (5 zones)
```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ 👥           │ │ 🏦           │ │ 🏢           │
│ DS Học sinh  │ │ Sao kê VTB   │ │ Sao kê TPB   │
│ tổng         │ │              │ │              │
│ ⚠️ Chưa import│ │ ⚠️ Chưa import│ │ ⚠️ Chưa import│
└──────────────┘ └──────────────┘ └──────────────┘
┌──────────────┐ ┌──────────────┐
│ 💵           │ │ 📄           │
│ Tiền mặt    │ │ File K.Tốn   │
│ ⚠️ Chưa import│ │ THÁNG TRƯỚC  │
└──────────────┘ └──────────────┘ (border vàng)
```

- Grid 3 columns (desktop), 2 columns (tablet), 1 column (mobile)
- Mỗi zone: card glassmorphism, có icon lớn ở trên, tên, status text
- Status: "Chưa import" (màu đỏ/vàng), "Đã import ✓" (màu xanh)
- Click vào zone → mở file picker
- Zone "File Kế toán tháng TRƯỚC" có border vàng đặc biệt (tùy chọn)
- Khi import xong: status chuyển sang xanh, hiện tên file

### 5.3 Nút Bắt đầu
```
┌─────────────────────────────┐
│    [Bắt đầu đối soát]      │
│  Yêu cầu DS HS + 1 nguồn   │
└─────────────────────────────┘
```
- Button lớn, nền gradient blue, disabled khi chưa đủ data
- Text phụ bên dưới giải thích yêu cầu

---

## 6. TAB 2: NGOẠI LỆ

### 6.1 Section: STK mới chưa map
```
┌─────────────────────────────────────────────────┐
│ STK mới chưa map (3)        [➕ Nhóm gia đình] │
├─────────────────────────────────────────────────┤
│ STK      │ Tên TK    │ Tổng tiền │ Gợi ý │ HĐ  │
│ 123456.. │ Nguyễn A  │ 1,600,000 │ HV015  │[Gán]│
└─────────────────────────────────────────────────┘
```
- Table với columns: STK, Tên TK, Tổng tiền, Gợi ý, Hành động
- Counter badge cạnh tiêu đề section
- Nút "➕ Nhóm gia đình" góc phải

### 6.2 Section: GD TPBank chưa xác định
```
┌─────────────────────────────────────────────────┐
│ GD TPBank chưa xác định (2)    [➕ Nhóm gia đình]│
├─────────────────────────────────────────────────┤
│ Ngày   │ Nội dung      │ Số tiền  │ Gợi ý │ HĐ │
│ 01/09  │ CK 123456     │ 800,000  │ HV020 │[⚡] │
└─────────────────────────────────────────────────┘
```

### 6.3 Section: Thay đổi cần sync lên Google Sheets
```
┌─────────────────────────────────────────────────┐
│ Thay đổi cần sync lên Google Sheets (1)         │
├─────────────────────────────────────────────────┤
│ Loại    │ MSHS   │ Nội dung              │ Đã sync│
│ Keyword │ HV015  │ Thêm từ khóa "Trường" │ [✓]    │
└─────────────────────────────────────────────────┘
```

---

## 7. TAB 3: BÁO CÁO ĐỐI SOÁT (Tab chính)

### 7.1 Summary Cards (Dashboard)
```
┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│ 👥   │ │ ✅   │ │ ❌   │ │ ⚠️   │ │ 🔵   │ │ 📦   │ │ 💰   │
│Tổng  │ │Đã đóng│ │Chưa  │ │Đóng  │ │Đóng  │ │Đóng  │ │Tổng  │
│ HS   │ │  45  │ │đóng  │ │thiếu │ │dư    │ │gói   │ │thu   │
│  50  │ │      │ │  3   │ │  2   │ │  1   │ │  5   │ │150tri│
└──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘
```
- 7 cards nhỏ trên 1 hàng (scroll ngang trên mobile)
- Mỗi card: icon lớn + label + value số
- Background gradient riêng cho mỗi loại:
  - Tổng HS: default card
  - Đã đóng: green gradient
  - Chưa đóng: red gradient
  - Đóng thiếu: yellow gradient
  - Đóng dư: blue gradient
  - Đóng gói: purple gradient
  - Tổng thu: purple gradient

### 7.2 Filter Bar
```
┌──────────────────────────────────────────────────────┐
│ [Trạng thái ▾] [Lớp ▾] [GV ▾] [Tìm MSHS...]       │
│ [🔄 Refresh] [➕ Nhóm gia đình] [🔍 Find]            │
└──────────────────────────────────────────────────────┘
```
- Horizontal bar, card glassmorphism
- 3 dropdown selects + 1 search input + 3 action buttons
- Dropdowns: Trạng thái (Tất cả/Đã đóng/Chưa đóng/...), Lớp, Giáo viên
- Search: placeholder "Tìm MSHS, Tên..."
- Buttons: Refresh (outline), Nhóm gia đình (outline), Find (outline + kính lúp icon)

### 7.3 Report Table (Data Grid)
```
┌────┬───────┬───────────┬──────┬────┬────────┬────────┬────────┬────────┬────────┬──────────┬──────────┬───────┐
│ +  │ MSHS  │ Họ tên    │ Lớp  │ GV │Tổng HP │VietinB.│Tiền mặt│TPBank  │Tổng ĐC │ Nguồn CK│Trạng thái│Ghi chú│
├────┼───────┼───────────┼──────┼────┼────────┼────────┼────────┼────────┼────────┼──────────┼──────────┼───────┤
│ [+]│ HV015 │ Nguyễn A  │T1.001│Cô X│800,000 │800,000 │   0    │   0    │800,000 │ VTB:800K │ ✅ Đã đóng│      │
│ [+]│ HV020 │ Trần B    │T2.002│Cô Y│800,000 │   0    │   0    │   0    │   0    │          │❌ Chưa đóng│      │
└────┴───────┴───────────┴──────┴────┴────────┴────────┴────────┴────────┴────────┴──────────┴──────────┴───────┘
```
- Table compact, font-size nhỏ (12-13px)
- Cột "+" expandable: click để xem chi tiết (phân bổ gia đình, giao dịch gốc)
- Columns numeric: alignment phải, format VNĐ (1.600.000đ)
- Status column: colored badges (✅ green, ❌ red, ⚠️ yellow, 🔵 blue, 📦 purple)
- Rows có hover effect (background lighten)
- Warning rows: background vàng nhạt
- Sticky header khi scroll

### 7.4 Quick Actions (dưới bảng)
```
┌──────────────────────────────────────────────┐
│ ⏸️ Tạm ngưng Chưa đóng  │ ➕ Thêm thủ công  │
│                           [⏸️ Học sinh TT]    │
└──────────────────────────────────────────────┘
```

### 7.5 Suspended Students Section
```
┌──────────────────────────────────────────────────┐
│ ⏸️ Học sinh tạm ngưng tháng này    [+ Thêm thủ công]│
├──────────────────────────────────────────────────┤
│ MSHS    │ Họ tên     │ Lớp    │ Tháng  │ Lý do        │ HĐ    │
│ HV010   │ Lê C        │ T1.001 │ 09/2026│ Chưa đóng HP │[Bỏ ng]│
└──────────────────────────────────────────────────┘
```

### 7.6 Export Buttons
```
┌──────────────────────────────────────────────┐
│ [📥 Xuất Excel Báo cáo] [📥 Xuất Full]     │
│ [💾 Backup] [📂 Restore]                     │
└──────────────────────────────────────────────┘
```

---

## 8. TAB 4: BÁO CÁO KẾ TOÁN (7 Sub-tabs)

### 8.1 Sub-tab Navigation
```
┌──────────────────────────────────────────────────────┐
│ [1 DS HĐ] [2 DS CK VTB] [3 Giảm bớt] [4 Stop]     │
│ [5 Tăng mới] [6 CK sai] [7 Tổng hợp]               │
└──────────────────────────────────────────────────────┘
```
- Horizontal pill buttons hoặc tabs nhỏ
- Active tab: background blue
- Tab 7 "Tổng hợp" có thể là accent khác

### 8.2 Tab 1: DS HĐ Tháng trước
- Simple table: STT, MSHS, Họ tên, Lớp, Học phí
- Nút: "📥 Copy sang Tổng hợp" + "📥 Xuất Excel Tab này"

### 8.3 Tab 2: DS CK VTB Tháng này
- Table: STT, MSHS, Họ tên, Lớp, Học phí, Số tiền CK
- Nút: "📥 Copy sang Tổng hợp" + "📥 Xuất Excel Tab này"

### 8.4 Tab 3: Giảm bớt (Kế toán thêm vào)
- Subtitle: "(Kế toán thêm vào)"
- Table: STT, MSHS, Họ tên, Lớp, Học phí
- Nút: "📥 Copy sang Tổng hợp" + "📥 Xuất Excel Tab này"

### 8.5 Tab 4: Stop - nghỉ học
- **Radio buttons:** 🛑 Nghỉ học | 🔄 Vẫn học (mỗi dòng)
- **Select-all header:** ☑ 🛑Tất cả | ☑ 🔄Tất cả
- Confirm dialog: "Xác nhận chuyển [N] HS nghỉ học sang Tab 3?"
- Split layout: 2 cột (Nghỉ | Vẫn học) sau khi confirm
- Nút: "📋 Đưa qua Tab 3"

### 8.6 Tab 5: Tăng mới
- Table: STT, MSHS, Họ tên, Lớp, Học phí
- Nút: "📥 Copy sang Tổng hợp" + "📥 Xuất Excel Tab này"

### 8.7 Tab 6: Chuyển tiền sai
- Table: STT, MSHS, Họ tên, Lớp, HP quy định, Số tiền CK, Chênh lệch, Nguồn CK
- Chênh lệch: color red nếu thiếu, blue nếu dư
- Nguồn CK: chi tiết giao dịch VTB/TPB/TM

### 8.8 Tab 7: Tổng hợp (FEATURE-RICH)
```
┌──────────────────────────────────────────────────────────────────┐
│ Hiển thị Ghi chú: ☑Tất cả ☑DS HĐ ☑DS CK VTB ☑Giảm bớt     │
│ ☑Stop ☑Tăng thêm ☑CK sai         [Sắp xếp: Ngoại lệ lên đầu ▾]│
├──┬────┬───────┬──────┬───────────┬──────┬────────┬──────────┬─────┤
│✓ │STT │ MSHS  │ Lớp  │ Họ tên    │ GV   │Học phí │ Địa chỉ  │Ghi chú│
├──┼────┬───────┼──────┼───────────┼──────┼────────┼──────────┼─────┤
│☑ │ 1  │ HV015 │T1.001│ Nguyễn A  │Cô X  │[800000]│ Đà Lạt   │DS CK  │
│☑ │ 2  │ HV020 │T2.002│ Trần B    │Cô Y  │[800000]│ Đà Lạt   │Giảm  │
│☑ │ 3  │ HV025 │T1.001│ Lê C      │Cô X  │[600000]│ Đà Lạt   │Tăng   │
├──┴────┴───────┴──────┴───────────┴──────┴────────┴──────────┴─────┤
│ ☑ Đã chọn: 3 HS    💰 Tổng cộng: 2,200,000đ                    │
├──────────────────────────────────────────────────────────────────┤
│ [🗑️ Xoá tất cả] [📥 Xuất Excel Tab này]                        │
└──────────────────────────────────────────────────────────────────┘
```

**Features:**
- **Checkbox từng dòng (cột ✓):** Default checked. Bỏ tick = HS đó không xuất Excel.
- **Editable Học phí:** Ô input number, click để sửa. thay đổi tự tính lại tổng.
- **Tag filter:** Checkboxes để ẩn/hiện tag trong cột Ghi chú (cosmetic only).
- **Sort dropdown:** 7 tùy chọn (Mặc định, Ngoại lệ lên đầu, MSHS A→Z, Họ tên A→Z, Lớp A→Z, HP ↑, HP ↓)
- **Ngoại lệ highlight:** Rows có HP khác mặc định → background vàng nhạt.
- **Summary bar:** Tổng HS đã chọn + Tổng tiền cộng.

### 8.9 Export Buttons (Accounting)
```
┌──────────────────────────────────────────────┐
│ [📥 Xuất Excel Tab này] [📥 Xuất tất cả (7 tabs)] │
└──────────────────────────────────────────────┘
```

---

## 9. TAB 5: CÀI ĐẶT

### 9.1 Grid 2 columns
```
┌─────────────────────────┐ ┌─────────────────────────┐
│ Dữ liệu Mapping         │ │ Nhóm gia đình           │
│ [Xuất Mapping] [Nhập]  │ │                         │
│                         │ │ Tên│STK│PH│Thành viên│Xóa│
│ Từ khóa TPBank          │ │ ...                     │
│ [keyword] → [MSHS] [Tên]│ │                         │
│ [+ Thêm từ khóa]        │ │ [+ Thêm nhóm]           │
├─────────────────────────┤ └─────────────────────────┘
│ STK phụ (mapping)       │ ┌─────────────────────────┐
│ [+ Thêm STK]            │ │ Đóng gói học phí        │
│ [STK] [Mô tả] [Xóa]   │ │ [+ Thêm gói]            │
└─────────────────────────┘ │ [MSHS] [Tháng] [Xóa]    │
                             └─────────────────────────┘
```

---

## 10. TAB 6: HƯỚNG DẪN

- Simple text content with sections
- Hướng dẫn từng bước import
- Giải thích thuật toán matching
- FAQ

---

## 11. COMPONENTS CHUNG

### 11.1 Buttons
- **Primary:** Background blue gradient, white text, border-radius 8px
- **Secondary:** Background purple gradient
- **Danger:** Background red
- **Outline:** Border only, transparent background
- **Small (btn-sm):** Font-size 12px, padding 4px 10px
- **Large (btn-large):** Font-size 16px, padding 12px 24px
- Hover: slight darken + shadow glow

### 11.2 Cards (Glassmorphism)
- Background: `#161b22` với opacity 0.8
- Border: 1px solid `#30363d`
- Border-radius: 12px
- Padding: 24px
- Box-shadow: subtle

### 11.3 Tables
- Compact, font-size 12-13px
- Header: bold, border-bottom 2px
- Rows: hover effect (background lighten)
- Cells: padding 8px 12px
- Numeric columns: text-align right, font-variant-numeric tabular-nums
- Responsive: horizontal scroll on mobile

### 11.4 Forms
- Inputs: background `#0d1117`, border 1px solid `#30363d`, border-radius 6px
- Focus: border-color blue, slight glow
- Labels: font-size 13px, color secondary

### 11.5 Badges/Tags
- Status badges: colored background + white text, border-radius pill
- Tag badges (Tab 7): outlined, colored by type

### 11.6 Toast Notifications
- Position: bottom-right
- Types: success (green), error (red), warning (yellow), info (blue)
- Auto-dismiss: 3 seconds
- Animation: slide in from right

### 11.7 Modal/Dialog
- Overlay: dark transparent background
- Content: card centered, max-width 600px
- Header + Body + Footer (buttons)
- Animation: fade in + scale

### 11.8 Drop Zones
- Dashed border (2px)
- Icon large centered
- Text: title + status
- Hover: border-color blue, background lighten
- Drag over: solid border, stronger glow

### 11.9 Back to Top Button
- Fixed position: bottom-right corner
- Appears when scrolled past 300px
-圆形, blue background, white arrow icon
- Smooth scroll animation

---

## 12. RESPONSIVE BEHAVIOR

- **Desktop (>1024px):** Full layout, 3-column grids, side-by-side
- **Tablet (768-1024px):** 2-column grids, some stacking
- **Mobile (<768px):** Single column, horizontal scroll for tables and tab bar, smaller fonts

---

## 13. YÊU CẦU THIẾT KẾ LẠI

**Phong cách: Apple Flat (apple.com/vn) + Alpine.js**

### Google AI Studio cần output:
1. **`index.html`** — Alpine.js `x-data` cho toàn app state, `x-show` cho tab switching, `x-for` cho dynamic tables
2. **`css/style.css`** — Flat design Apple-like (xem section 0B ở trên)
3. **`js/app.js`** — Alpine.js store/component definitions
4. **Giữ nguyên** `js/matcher.js`, `js/reporter.js`, `js/accounting.js`, `js/exporter.js`, `js/storage.js`, `js/importer.js`, `js/datamodel.js`, `js/utils.js` — KHÔNG sửa logic

### Alpine.js Structure Example:
```html
<body x-data="joyFeeCheck()">
  <nav><!-- tab buttons with @click="switchTab('import')" --></nav>
  <main>
    <section x-show="currentTab === 'import'">
      <!-- Import content -->
    </section>
    <section x-show="currentTab === 'report'">
      <!-- Report content with x-for for table rows -->
    </section>
  </main>
</body>
```

### Constraints:
1. **KHÔNG thay đổi logic** — chỉ redesign visual/UI
2. **Responsive**: mobile-first, hoạt động tốt trên điện thoại
3. **Accessibility**: sufficient contrast, semantic HTML
4. **Deploy**: GitHub Pages (static files, không build step)
5. **Giữ nguyên tất cả features**: import, matching, report, accounting 7 tabs, backup/restore, export Excel
6. **Tab 7 Tổng hợp** giữ nguyên: checkbox, edit HP, sort dropdown, tag filter, auto-sum
