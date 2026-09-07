# SPEC 05: TAB BÁO CÁO ĐỐI SOÁT

**Previous:** SPEC_04_TAB_IMPORT.md  
**Next:** SPEC_06_TAB_ACCOUNTING.md

---

## OVERVIEW

The Report tab displays the main reconciliation results after matching. It shows payment status for each student with filters, search, and export options.

---

## LAYOUT

```
┌─────────────────────────────────────────────────────────┐
│ SUMMARY CARDS (7 cards in horizontal row)              │
│ [Tổng HS] [Đã đóng] [Chưa đóng] [Thiếu] [Dư] [Gói] [Thu]│
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ FILTER BAR                                              │
│ [Trạng thái ▾] [Lớp ▾] [GV ▾] [Tìm...] [🔄] [➕] [🔍]│
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ REPORT TABLE                                            │
│ [+] MSHS  Họ tên  Lớp  GV  HP  VTB  Cash  TPB  Total   │
│ ...                                                     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ ACTION BUTTONS                                          │
│ [📥 Xuất Excel] [📋 Nhắc phí] [💾 Backup] [📂 Restore] │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ ⏸️ HỌC SINH TẠM NGƯNG                                   │
│ [Table of suspended students]                           │
└─────────────────────────────────────────────────────────┘
```

---

## SUMMARY CARDS

**Grid Layout:**
- Desktop: 7 cards in 1 row
- Tablet: 4 + 3 split
- Mobile: Horizontal scroll

**Card Size:**
- Min-width: `140px`
- Height: `100px`
- Padding: `16px`

### Card 1: Tổng HS (Total Students)
```
┌──────────────┐
│ 👥           │
│ Tổng HS      │
│ 150          │
└──────────────┘
```
- Background: `#f5f5f7` (light gray)
- Border: `1px solid #d2d2d7`
- Border-radius: `12px`

### Card 2: Đã đóng (Paid)
- Background: `linear-gradient(135deg, #34c759 0%, #2fb550 100%)`
- Color: `#ffffff`
- Icon: ✅
- Label: "Đã đóng"
- Value: Count from `stats.daDong`

### Card 3: Chưa đóng (Unpaid)
- Background: `linear-gradient(135deg, #ff3b30 0%, #e6332a 100%)`
- Color: `#ffffff`
- Icon: ❌
- Label: "Chưa đóng"
- Value: Count from `stats.chuaDong`

### Card 4: Đóng thiếu (Partial)
- Background: `linear-gradient(135deg, #ff9500 0%, #e68600 100%)`
- Color: `#ffffff`
- Icon: ⚠️
- Label: "Đóng thiếu"
- Value: Count from `stats.dongThieu`

### Card 5: Đóng dư (Overpaid)
- Background: `linear-gradient(135deg, #007aff 0%, #006ee6 100%)`
- Color: `#ffffff`
- Icon: 🔵
- Label: "Đóng dư"
- Value: Count from `stats.dongDu`

### Card 6: Đóng gói (Package)
- Background: `linear-gradient(135deg, #af52de 0%, #9d42c8 100%)`
- Color: `#ffffff`
- Icon: 📦
- Label: "Đóng gói"
- Value: Count from `stats.dongGoi`

### Card 7: Tổng thu (Total Revenue)
- Background: `linear-gradient(135deg, #5e5ce6 0%, #4e4cd1 100%)`
- Color: `#ffffff`
- Icon: 💰
- Label: "Tổng thu"
- Value: `Utils.formatCurrency(stats.tongThu) + ' ₫'`

**Card Structure:**
```html
<div class="summary-card">
  <div class="card-icon">👥</div>
  <div class="card-label">Tổng HS</div>
  <div class="card-value">150</div>
</div>
```

**Card Styles:**
- Icon: `font-size: 32px`, `margin-bottom: 8px`
- Label: `font-size: 13px`, `font-weight: 500`, `opacity: 0.9`, `margin-bottom: 4px`
- Value: `font-size: 24px`, `font-weight: 700`

---

## FILTER BAR

**Card Style:**
- Background: `#ffffff`
- Border: `1px solid #d2d2d7`
- Border-radius: `12px`
- Padding: `16px 20px`
- Display: `flex`, gap: `12px`, wrap on mobile

### Filter 1: Trạng thái (Status)
**Dropdown:**
```html
<select x-model="filters.status" @change="applyFilters()">
  <option value="all">Tất cả trạng thái</option>
  <option value="Đã đóng">Đã đóng</option>
  <option value="Chưa đóng">Chưa đóng</option>
  <option value="Đóng thiếu">Đóng thiếu</option>
  <option value="Đóng dư">Đóng dư</option>
</select>
```
- Width: `180px`
- Height: `40px`
- Border: `1px solid #d2d2d7`
- Border-radius: `8px`
- Padding: `0 12px`
- Font: `14px`
- Background: `#ffffff`

### Filter 2: Lớp (Class)
- Populated dynamically from `students` array
- Extract unique `className` values
- Width: `160px`

### Filter 3: Giáo viên (Teacher)
- Populated dynamically from `students` array
- Extract unique `teacher` values
- Width: `160px`

### Filter 4: Search Input
```html
<input type="text" 
       placeholder="Tìm MSHS, Tên..."
       x-model="filters.searchText"
       @input.debounce.300ms="applyFilters()">
```
- Width: `240px`
- Height: `40px`
- Border: `1px solid #d2d2d7`
- Border-radius: `8px`
- Padding: `0 12px 0 36px` (space for icon)
- Icon: 🔍 (position absolute, left 12px)

### Action Buttons:
**🔄 Refresh** — Re-run matching with current data
- Style: Outline button (gray border)
- Width: `auto`, padding: `0 16px`
- Height: `40px`

**➕ Nhóm gia đình** — Add family group
- Style: Outline button
- Opens modal to create family group

**🔍 Find** — Find student by MSHS
- Style: Outline button
- Opens modal with search and scroll-to-row

---

## REPORT TABLE

**Container:**
- Background: `#ffffff`
- Border: `1px solid #d2d2d7`
- Border-radius: `12px`
- Overflow: `auto` (horizontal scroll on mobile)

### Table Structure:
```
┌──┬──────┬──────────┬──────┬────┬────────┬────────┬────────┬────────┬──────┬──────────┬──────────┬────────┐
│+ │MSHS  │Họ tên    │Lớp   │GV  │Tổng HP │VietinB │Tiền mặt│TPBank  │Tổng ĐC│Nguồn CK │Trạng thái│Ghi chú │
└──┴──────┴──────────┴──────┴────┴────────┴────────┴────────┴────────┴──────┴──────────┴──────────┴────────┘
```

**Header Row:**
- Background: `#f5f5f7`
- Font: `13px`, weight `600`, color `#1d1d1f`
- Padding: `12px 16px`
- Border-bottom: `2px solid #d2d2d7`
- Sticky: `position: sticky`, `top: 0`, `z-index: 10`

**Data Rows:**
- Font: `13px`, weight `400`, color `#1d1d1f`
- Padding: `12px 16px`
- Border-bottom: `1px solid #e5e5e7`
- Hover: Background `#f9f9f9`

**Column Widths:**
- `+`: `40px` (expand icon)
- MSHS: `80px`
- Họ tên: `180px`
- Lớp: `120px`
- GV: `100px`
- Tổng HP: `100px` (right-aligned)
- VietinBank: `100px` (right-aligned)
- Tiền mặt: `100px` (right-aligned)
- TPBank: `100px` (right-aligned)
- Tổng đã đóng: `120px` (right-aligned)
- Nguồn CK: `100px`
- Trạng thái: `120px`
- Ghi chú: `200px` (min-width, can expand)

### Column: Expand (+)
- Icon: `+` or `▶` (collapsed), `−` or `▼` (expanded)
- Cursor: pointer
- Click: Toggle row expansion to show transaction details

### Column: Nguồn CK (NEW REQUIREMENT)
Display payment source:
- `💵 Tiền mặt` — if no VTB/TPB transfer
- `🏦 VTB` — if has VietinBank transfer
- `🏦 TPBank` — if has TPBank transfer
- Font: `13px`
- Logic:
```javascript
getNguonCK(row) {
  if (row.chuyenKhoanVTB > 0) return '🏦 VTB';
  if (row.chuyenKhoanTPB > 0) return '🏦 TPBank';
  if (row.tienMat > 0) return '💵 Tiền mặt';
  return '—';
}
```

### Column: Trạng thái (Status Badge)
```html
<span class="status-badge status-paid">✅ Đã đóng</span>
```

**Badge Styles:**
- Padding: `4px 10px`
- Border-radius: `12px`
- Font: `12px`, weight `600`
- Display: inline-block

**Colors by Status:**
- `Đã đóng`: Background `#d1f2dd`, color `#1e7e34`
- `Chưa đóng`: Background `#ffe5e5`, color `#d32f2f`
- `Đóng thiếu`: Background `#fff4e5`, color `#e67700`
- `Đóng dư`: Background `#e5f2ff`, color `#0066cc`
- `📦 Đã đóng gói`: Background `#f3e5ff`, color `#7b1fa2`

### Column: Ghi chú (Notes)
- Wrap text if long
- Font: `12px`
- Color: `#86868b`
- Show auto-generated notes from `row.ghiChu`

**Special Styling:**
- If contains `⚠`: Color `#ff9500` (warning)
- If contains `👨‍👩‍👧‍👦`: Color `#0071e3` (info)

---

## EXPANDABLE ROW DETAILS

When user clicks `+` button, show additional details below the row:

**Expanded Content:**
```
┌─────────────────────────────────────────────────────────┐
│ CHI TIẾT GIAO DỊCH                                      │
│ ┌──────┬────────────┬──────────┬────────┬────────────┐ │
│ │Nguồn │Ngày        │Số tiền   │STK     │Tên chủ TK  │ │
│ ├──────┼────────────┼──────────┼────────┼────────────┤ │
│ │VTB   │05/09/2026  │800,000   │549120..│CAN HOANG..│ │
│ └──────┴────────────┴──────────┴────────┴────────────┘ │
│                                                         │
│ PHÂN BỔ GIA ĐÌNH (if applicable)                        │
│ - Tổng tiền GĐ: 2,400,000đ                             │
│ - Phân bổ cho HV011: 800,000đ                          │
│ - Thành viên khác: HV012 (800k), HV045 (800k)         │
└─────────────────────────────────────────────────────────┘
```

**Styling:**
- Background: `#f9f9f9`
- Padding: `20px`
- Border-top: `1px solid #d2d2d7`
- Font: `13px`

**Transaction List:**
- Mini table with 5 columns
- Data from `row.txList` array
- Each transaction shows: type, date, amount, account, holder name

**Family Allocation (if `row.familySplit` exists):**
- Show family total, this student's allocation, other members
- Font: `13px`, color `#86868b`
- Use bullet points

---

## ACTION BUTTONS (Below Table)

**Layout:** Horizontal row, centered, gap: `12px`, wrap on mobile

### Button 1: 📥 Xuất Excel Báo cáo
- Primary style (blue background)
- Width: `auto`, padding: `12px 24px`
- Click: `Exporter.exportBaoCao(reportRows, stats, monthYear)`

### Button 2: 📥 Xuất Báo cáo Full
- Secondary style (gray border)
- Click: Export 7-sheet Excel with all data

### Button 3: 📋 Xuất DS Nhắc Phí
- Outline style with warning color border (`#ff9500`)
- Click: Export list of unpaid/partial students

### Button 4: 💾 Backup
- Small outline button
- Click: Download JSON backup of current session

### Button 5: 📂 Restore
- Small outline button
- Click: Open file picker to restore from JSON backup

---

## SUSPENDED STUDENTS SECTION

**Position:** Below action buttons  
**Margin-top:** `48px`

**Header:**
```
⏸️ Học sinh tạm ngưng tháng này    [📋 DS Chưa đóng → Tạm ngưng] [➕ Thêm thủ công]
```

**Description:**
```
HS tạm ngưng sẽ KHÔNG hiện trong báo cáo chính và KHÔNG báo "Chưa đóng".
```
- Font: `13px`, color `#86868b`, margin-bottom: `16px`

**Table:**
```
┌────────┬────────────┬────────────┬─────────┬─────────┬────┐
│MSHS    │Họ tên      │Lớp tạm ng. │Tháng    │Ghi chú  │    │
├────────┼────────────┼────────────┼─────────┼─────────┼────┤
│HV010   │Lê C        │T1.001      │09/2026  │Chưa HP  │[Xóa]│
└────────┴────────────┴────────────┴─────────┴─────────┴────┘
```

**Buttons:**
- `📋 DS Chưa đóng → Tạm ngưng`: Warning style (yellow), opens modal with checkbox list
- `➕ Thêm thủ công`: Primary style, opens search modal

---

## ALPINE.JS METHODS

### applyFilters()
```javascript
applyFilters() {
  const state = this.$store.appState;
  const filtered = Reporter.filterReport(
    state.reportRows,
    this.filters
  );
  this.filteredReportRows = filtered;
}
```

### exportReport()
```javascript
exportReport() {
  const state = this.$store.appState;
  const stats = Reporter.getStatistics(state.reportRows);
  Exporter.exportBaoCao(
    state.reportRows,
    stats,
    state.monthYear
  );
}
```

---

**Status:** Specification file 5 of 8 complete.  
**Next:** Read `SPEC_06_TAB_ACCOUNTING.md` for the 7-tab accounting report.
