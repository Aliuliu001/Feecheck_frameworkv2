# SPEC 06: TAB BÁO CÁO KẾ TOÁN (7 SUB-TABS)

**Previous:** SPEC_05_TAB_REPORT.md  
**Next:** SPEC_07_TAB_SETTINGS.md

---

## OVERVIEW

The Accounting tab contains 7 sub-tabs for comparing current month data with previous month invoices. Each sub-tab displays a specific student list based on set operations.

---

## LAYOUT

```
┌─────────────────────────────────────────────────────────┐
│ SUB-TAB NAVIGATION (7 pills)                            │
│ [1 DS HĐ] [2 CK VTB] [3 Giảm] [4 Stop] [5 Tăng] ...   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ SUMMARY CARDS (7 cards showing counts)                  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ ACTIVE SUB-TAB CONTENT                                  │
│ (table + action buttons)                                │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ EXPORT ALL BUTTON                                       │
│ [📥 Xuất tất cả (7 tabs)]                               │
└─────────────────────────────────────────────────────────┘
```

---

## SUB-TAB NAVIGATION

**Style:** Horizontal pill buttons with wrapping

**Button Style (inactive):**
- Background: transparent
- Color: `#86868b`
- Border: `1px solid #d2d2d7`
- Border-radius: `20px`
- Padding: `8px 16px`
- Font: `14px`, weight `500`
- Margin: `4px`

**Button Style (active):**
- Background: `#0071e3` (Apple blue)
- Color: `#ffffff`
- Border: `1px solid #0071e3`
- Font-weight: `600`

### 7 Sub-tabs:
1. `📋 DS HĐ Tháng trước`
2. `🏦 DS CK VTB Tháng này`
3. `📉 Giảm bớt`
4. `🛑 Stop - nghỉ học`
5. `📈 Tăng mới`
6. `⚠️ Chuyển tiền sai`
7. `📋 Tổng hợp`

---

## SUMMARY CARDS

**Same layout as Report tab, but showing counts for each accounting sub-tab:**

```
[DS HĐ: 130] [CK VTB: 128] [Giảm: 15] [Stop: 8] [Tăng: 13] [CK sai: 5] [Tổng hợp: 45]
```

**Card Styles:**
- Min-width: `120px`, height: `80px`
- Background colors match the sub-tab theme
- Font-size: Value `20px`, Label `12px`

---

## SUB-TAB 1: DS HĐ THÁNG TRƯỚC

**Purpose:** Display all students from previous month's invoice list

**Data Source:** `accountingData.tab1` (from `Accounting.computeInvoiceComparison()`)

**Table Columns:**
```
STT | MSHS | Họ tên | Lớp | Học phí
```

**Table Style:**
- Same as Report tab table
- 5 columns, compact layout
- Font-size: `13px`

**Action Buttons (below table):**
- `📥 Copy sang Tổng hợp` — Copy all rows to Tab 7
- `📥 Xuất Excel Tab này` — Export this tab only

**Alpine.js:**
```html
<div x-show="activeAccTab === 'acc-tab1'">
  <table>
    <thead>...</thead>
    <tbody>
      <template x-for="(row, index) in accountingData.tab1" :key="row.mshs">
        <tr>
          <td x-text="index + 1"></td>
          <td x-text="row.mshs"></td>
          <td x-text="row.fullName"></td>
          <td x-text="row.className"></td>
          <td x-text="formatCurrency(row.hocPhi)"></td>
        </tr>
      </template>
    </tbody>
  </table>
</div>
```

---

## SUB-TAB 2: DS CK VTB THÁNG NÀY

**Purpose:** Students who transferred to company VietinBank account this month

**Data Source:** `accountingData.tab2`

**Table Columns:**
```
STT | MSHS | Họ tên | Lớp | Học phí
```

**Description:**
```
Học sinh đã chuyển khoản vào TK Công ty VietinBank tháng này.
```
- Font: `13px`, color `#86868b`, margin-bottom: `16px`

**Action Buttons:**
- `📥 Copy sang Tổng hợp`
- `📥 Xuất Excel Tab này`

---

## SUB-TAB 3: GIẢM BỚT

**Purpose:** Students from last month who haven't paid this month YET (still in master list, HP > 0)

**Data Source:** `accountingData.tab3`

**Logic:** `(Tab1 - Tab2) ∩ (IN master) ∩ (HP > 0)`

**Table Columns:**
```
STT | MSHS | Họ tên | Lớp | Học phí | Nguồn CK
```

**NEW COLUMN: Nguồn CK**
- Display: `💵 Tiền mặt` | `🏦 VTB` | `🏦 TPBank` | `—`
- Logic: Check if student paid via cash/TPBank (even though not in VTB CK list)

**Description:**
```
Tháng trước có, tháng này chưa CK. Vẫn còn trong DS Tổng và HP > 0 → cần nhắc/nhắc nợ.
(Kế toán thêm vào)
```
- First line: `13px`, color `#86868b`
- Second line: `13px`, color `#ff9500` (warning yellow), font-weight `500`

**Action Buttons:**
- `📥 Copy sang Tổng hợp`
- `📥 Xuất Excel Tab này`

---

## SUB-TAB 4: STOP - NGHỈ HỌC

**Purpose:** Students from last month who are no longer in system or have HP=0

**Data Source:** `accountingData.tab4`

**Logic:** `(Tab1 - Tab2) ∩ (NOT in master OR HP = 0)`

**SPECIAL UI:** Radio button selection + confirm dialog

### Phase 1: Selection (before confirm)

**Table Columns:**
```
☑ | STT | MSHS | Họ tên | Lớp | Học phí | Lý do | 🛑 Nghỉ | 🔄 Vẫn học
```

**Radio Buttons:**
- Each row has 2 radio buttons: `🛑 Nghỉ học` | `🔄 Vẫn học`
- Default: All unchecked (user must choose)
- Name: `choice-{mshs}` (to group per row)

**Header Row Controls:**
- `☑ Chọn tất cả 🛑` — Check all "Nghỉ học" radios
- `☑ Chọn tất cả 🔄` — Check all "Vẫn học" radios

**Lý do Column:**
- Display reason from `row.lyDo`:
  - `🚫 Không còn trong DS Tổng`
  - `💰 HP = 0`
  - `⚠️ Cần rà tay`

**Confirm Button (below table):**
```
[Xác nhận phân loại]
```
- Primary style (blue)
- Disabled until all rows have a choice selected
- Click: Show confirmation dialog

### Confirmation Dialog:
```
┌────────────────────────────────────────────┐
│ Xác nhận phân loại                         │
├────────────────────────────────────────────┤
│ Bạn đã chọn:                               │
│ • 🛑 Nghỉ học: 8 HS                       │
│ • 🔄 Vẫn học: 7 HS                        │
│                                            │
│ HS "Vẫn học" sẽ chuyển sang Tab 3 (Giảm   │
│ bớt). Xác nhận?                            │
├────────────────────────────────────────────┤
│         [Hủy]  [Xác nhận]                  │
└────────────────────────────────────────────┘
```

### Phase 2: After Confirm (split view)

**Layout:** 2 columns

**Left Column: 🛑 Nghỉ học**
```
STT | MSHS | Họ tên | Lớp | HP | Lý do
```
- Background: `#ffe5e5` (light red tint)

**Right Column: 🔄 Vẫn học (chuyển sang Tab 3)**
```
STT | MSHS | Họ tên | Lớp | HP | Lý do
```
- Background: `#e5f2ff` (light blue tint)

**Action Button:**
- `📋 Đưa "Vẫn học" sang Tab 3` — Move right column students to Tab 3

---

## SUB-TAB 5: TĂNG MỚI

**Purpose:** Students who paid VTB this month but were NOT in last month's invoice

**Data Source:** `accountingData.tab5`

**Logic:** `Tab2 - Tab1`

**Table Columns:**
```
STT | MSHS | Họ tên | Lớp | Học phí
```

**Description:**
```
Học sinh CK VTB tháng này nhưng KHÔNG có trong DS HĐ tháng trước → HS mới.
```

**Action Buttons:**
- `📥 Copy sang Tổng hợp`
- `📥 Xuất Excel Tab này`

---

## SUB-TAB 6: CHUYỂN TIỀN SAI

**Purpose:** Families/students where VTB transfer amount doesn't match expected amount

**Data Source:** `accountingData.tab6`

**Algorithm:** Allocate-then-remainder per family (INDEPENDENT from Report tab)

**Table Columns:**
```
STT | Thành viên (số tiền được cấp) | Tổng CK thực tế | Tổng HP kỳ vọng | Chênh lệch | Lý do
```

**Column Widths:**
- STT: `50px`
- Thành viên: `300px` (expandable, shows member allocation details)
- Tổng CK: `120px` (right-aligned)
- HP kỳ vọng: `120px` (right-aligned)
- Chênh lệch: `100px` (right-aligned, colored: red if negative, blue if positive)
- Lý do: `250px` (wrap text)

**Description:**
```
Thuật toán "Dò và chia tiền" — mỗi gia đình 1 dòng. Dùng HP_default cho mọi thành viên 
(không biết học mấy lớp). Tab này CẢNH BÁO để kế toán soát tay, không phải kết luận cuối cùng. 
Kết quả có thể khác Tab Đối soát (vì Đối soát dùng HP thực tế).
```
- Font: `13px`, color `#ff9500` (warning)

**Row Example:**
```
1 | HV015 (800k), HV151 (800k) | 2,400,000 | 1,600,000 | +800,000 | Dư 800K — có thể gộp tiền sách
```

**Member Details Cell Format:**
```
HV015 - Nguyễn A (800k ✓)
HV151 - Trần B (800k ✓)
```
- Each member on new line
- Amount allocated + checkmark if sufficient
- Font: `12px`

**Chênh lệch Styling:**
- Positive (surplus): Color `#007aff`, prefix `+`
- Negative (shortage): Color `#ff3b30`, prefix `−`
- Zero: Color `#34c759`, text `✓ Đúng`

**Action Button:**
- `📥 Xuất Excel Tab này`

---

## SUB-TAB 7: TỔNG HỢP

**Purpose:** User-curated collection from other tabs for final invoice export

**Data Source:** `accountingData.tab7` (persisted to localStorage: `joy_acc_tab7_rows`)

**FEATURES:**
1. Checkbox per row (default checked)
2. Editable HP field
3. Tag filter (cosmetic, hide/show by tag)
4. Sort options
5. Summary bar
6. Export to formal invoice format

### Tag Filter (above table):
```
Hiển thị Ghi chú: ☑ Tất cả  ☑ DS HĐ  ☑ DS CK VTB  ☑ Giảm bớt  ☑ Stop  ☑ Tăng thêm  ☑ CK sai
```

**Checkbox Style:**
- Display: inline-flex, gap: `8px`
- Font: `13px`
- Padding: `6px 12px`
- Border: `1px solid #d2d2d7`
- Border-radius: `16px`
- Cursor: pointer
- Checked: Background `#0071e3`, color white

**Sort Dropdown (right side):**
```
Sắp xếp: [Mặc định ▾]
```

**Options:**
1. Mặc định (insertion order)
2. Ngoại lệ lên đầu (HP ≠ default)
3. MSHS A→Z
4. Họ tên A→Z
5. Lớp A→Z
6. HP tăng dần ↑
7. HP giảm dần ↓

### Table Columns:
```
✓ | STT | MSHS | Lớp | Họ tên | Giáo viên | Học phí | Địa chỉ | Ghi chú
```

**Column: ✓ (Checkbox)**
- Width: `40px`
- Header: Checkbox "Select All"
- Default: All checked
- Alpine.js: `x-model="row.selected"`

**Column: Học phí (Editable)**
- Click to edit (contenteditable or input)
- Right-aligned, monospace font
- Format: `800,000` (with thousands separator)
- Alpine.js: `@blur="updateHP(row, $event.target.textContent)"`

**Column: Ghi chú (Tags)**
- Display filtered tags based on tag filter selection
- Font: `12px`, color `#86868b`
- Multiple tags separated by ", "

**Row Highlighting (Ngoại lệ):**
- If `HP ≠ default`: Background `#fff4e5` (light yellow), border-left `3px solid #ff9500`

### Summary Bar (below table):
```
☑ Đã chọn: 42 HS    💰 Tổng cộng: 33,600,000đ
```
- Background: `#f5f5f7`
- Padding: `16px`
- Border-radius: `8px`
- Font: `14px`, weight `600`

### Action Buttons:
- `🗑️ Xoá tất cả` — Clear Tab 7 (danger style, red border)
- `📥 Xuất Excel Tab này` — Export Tab 7 with formal invoice format

---

## EXPORT ALL BUTTON

**Position:** Below sub-tab content, centered, margin-top: `32px`

**Button:**
```
┌──────────────────────────────┐
│  📥 Xuất tất cả (7 tabs)     │
└──────────────────────────────┘
```

**Style:**
- Width: `280px`
- Height: `48px`
- Background: `#0071e3`
- Color: white
- Font: `16px`, weight `600`
- Border-radius: `24px`
- Box-shadow: `0 4px 12px rgba(0, 113, 227, 0.25)`

**Click:** Export 7-sheet Excel file with all accounting tabs

**Alpine.js:**
```javascript
exportAllAccountingTabs() {
  const state = this.$store.appState;
  Exporter.exportAccTabAll(
    state.accountingData,
    state.monthYear,
    state.accTab7FilterTags
  );
}
```

---

## ALPINE.JS METHODS

### copyToAccTab7(tabNum)
```javascript
copyToAccTab7(tabNum) {
  const state = this.$store.appState;
  const sourceData = state.accountingData[`tab${tabNum}`];
  
  // Add tag to ghiChu
  const tagName = ['DS HĐ', 'DS CK VTB', 'Giảm bớt', 'Stop', 'Tăng mới', 'CK sai'][tabNum - 1];
  
  sourceData.forEach(row => {
    const newRow = {
      ...row,
      ghiChu: row.ghiChu ? `${row.ghiChu}, ${tagName}` : tagName,
      selected: true
    };
    state.accountingData.tab7.push(newRow);
  });
  
  // Persist to localStorage
  Storage._set('joy_acc_tab7_rows', state.accountingData.tab7);
  
  // Switch to Tab 7
  this.activeAccTab = 'acc-tab7';
  
  this.showToast(`✅ Đã copy ${sourceData.length} dòng sang Tổng hợp`, 'success');
}
```

### exportAccTab(tabNum)
```javascript
exportAccTab(tabNum) {
  const state = this.$store.appState;
  const data = state.accountingData[`tab${tabNum}`];
  const titles = [
    'DS HĐ Tháng trước',
    'DS CK VTB Tháng này',
    'Giảm bớt',
    'Stop - nghỉ học',
    'Tăng mới',
    'Chuyển tiền sai',
    'Tổng hợp'
  ];
  
  Exporter.exportAccTabSingle(
    tabNum,
    data,
    titles[tabNum - 1],
    state.monthYear,
    tabNum === 7 ? state.accTab7FilterTags : null
  );
}
```

---

**Status:** Specification file 6 of 8 complete.  
**Next:** Read `SPEC_07_TAB_SETTINGS.md` for the settings and configuration tab.
