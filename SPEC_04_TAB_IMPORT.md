# SPEC 04: TAB IMPORT DỮ LIỆU

**Previous:** SPEC_03_UI_LAYOUT.md  
**Next:** SPEC_05_TAB_REPORT.md

---

## OVERVIEW

The Import tab is the first step in the workflow. Users drag-and-drop 4 Excel files into designated zones, configure settings, then click "Bắt đầu đối soát" to start reconciliation.

---

## LAYOUT

```
┌─────────────────────────────────────────────────────────┐
│ SETTINGS PANEL                                          │
│ [Tháng đối soát: 09/2026] [Học phí mặc định: 800000]  │
└─────────────────────────────────────────────────────────┘

┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ 👥           │ │ 🏦           │ │ 🏢           │
│ DS Học sinh  │ │ Sao kê VTB   │ │ Sao kê TPB   │
│ tổng         │ │              │ │              │
│ ⚠️ Chưa import│ │ ⚠️ Chưa import│ │ ⚠️ Chưa import│
└──────────────┘ └──────────────┘ └──────────────┘

┌──────────────┐ ┌──────────────┐
│ 💵           │ │ 📄           │
│ Tiền mặt     │ │ File KT      │
│              │ │ Tháng trước  │
│ ⚠️ Chưa import│ │ (Tùy chọn)   │
└──────────────┘ └──────────────┘

         ┌──────────────────────────┐
         │  [Bắt đầu đối soát]      │ (disabled initially)
         └──────────────────────────┘
         Yêu cầu DS HS + ít nhất 1 nguồn thu
```

---

## SETTINGS PANEL

**Card Style:**
- Background: `#f5f5f7` (light gray)
- Border-radius: `16px`
- Padding: `24px`
- Margin-bottom: `32px`

### Title:
```
Cài đặt đối soát
```
- Font: Inter, `18px`, weight `600`
- Color: `#1d1d1f`
- Margin-bottom: `20px`

### Form Layout (2 columns on desktop, 1 on mobile):

**Column 1: Tháng đối soát**
- Label: "Tháng đối soát"
  - Font: `14px`, weight `500`, color `#1d1d1f`
  - Margin-bottom: `8px`
- Input: `<input type="month">`
  - Width: `100%`
  - Height: `44px`
  - Border: `1px solid #d2d2d7`
  - Border-radius: `8px`
  - Padding: `0 12px`
  - Font: `15px`
  - Background: `#ffffff`
  - Default value: Current month (format: `YYYY-MM`)
  - Alpine.js: `x-model="$store.appState.monthYear"`

**Column 2: Học phí mặc định**
- Label: "Học phí mặc định (VNĐ)"
  - Font: `14px`, weight `500`, color `#1d1d1f`
  - Margin-bottom: `8px`
- Input: `<input type="number">`
  - Width: `100%`
  - Height: `44px`
  - Border: `1px solid #d2d2d7`
  - Border-radius: `8px`
  - Padding: `0 12px`
  - Font: `15px`
  - Background: `#ffffff`
  - Default value: `800000`
  - Alpine.js: `x-model="$store.appState.defaultFee"`

---

## DROP ZONES GRID

**Grid Layout:**
- Desktop: 3 columns
- Tablet: 2 columns
- Mobile: 1 column
- Gap: `20px`

### Drop Zone Card (5 total):

**Default State (not imported):**
```
┌────────────────────────┐
│       👥 (icon)        │
│                        │
│  DS Học sinh tổng      │
│  (Google Trang tính)   │
│                        │
│  ⚠️ Chưa import         │
└────────────────────────┘
```

**Card Style:**
- Min-height: `200px`
- Background: `#ffffff`
- Border: `2px dashed #d2d2d7`
- Border-radius: `16px`
- Padding: `32px 24px`
- Text-align: center
- Cursor: pointer
- Transition: `all 0.2s ease`

**Hover:**
- Border-color: `#0071e3`
- Background: `#f5f9ff` (very light blue)
- Transform: `translateY(-2px)`
- Box-shadow: `0 8px 16px rgba(0, 113, 227, 0.1)`

**Drag Over:**
- Border: `2px solid #0071e3` (solid, not dashed)
- Background: `#e6f2ff` (light blue)
- Box-shadow: `0 0 0 4px rgba(0, 113, 227, 0.1)`

**After Import (success):**
- Border: `2px solid #34c759` (green)
- Background: `#ffffff`
- Status text changes to: `✅ Đã import 150 dòng` (green color)

**Icon:**
- Font-size: `48px`
- Margin-bottom: `16px`
- Opacity: `0.8`

**Title:**
- Font: Inter, `16px`, weight `600`
- Color: `#1d1d1f`
- Margin-bottom: `8px`

**Subtitle (for Zone 1 & 5):**
- Font: `13px`, weight `400`
- Color: `#86868b`
- Margin-bottom: `16px`

**Status Text:**
- Font: `14px`, weight `500`
- Color (not imported): `#ff9500` (warning orange)
- Color (imported): `#34c759` (success green)

---

## 5 DROP ZONES DETAILS

### Zone 1: DS Học sinh tổng
- **Icon:** 👥
- **Title:** "DS Học sinh tổng"
- **Subtitle:** "(Google Trang tính)"
- **Help Text:** "Danh sách master học sinh. Nguồn gốc dữ liệu, cập nhật liên tục."
  - Font: `12px`, color `#86868b`, margin-top: `12px`
- **Accepted:** `.xlsx`, `.xls`, `.csv`
- **Parser:** `Importer.parseGoogleSheets(file)`
- **Alpine.js:** `@change="handleFileImport($event, 'dsHocSinh')"`

### Zone 2: Sao kê VietinBank
- **Icon:** 🏦
- **Title:** "Sao kê VietinBank"
- **Subtitle:** none
- **Accepted:** `.xlsx`, `.xls`, `.csv`
- **Parser:** `Importer.parseSaoKeVietinBank(file)`
- **Alpine.js:** `@change="handleFileImport($event, 'vietinBank')"`

### Zone 3: Sao kê TPBank (từ ABBYY)
- **Icon:** 🏢
- **Title:** "Sao kê TPBank"
- **Subtitle:** "(từ ABBYY)"
- **Accepted:** `.xlsx`, `.xls`, `.csv`
- **Parser:** `Importer.parseSaoKeTPBank(file)`
- **Alpine.js:** `@change="handleFileImport($event, 'tpBank')"`

### Zone 4: Tiền mặt
- **Icon:** 💵
- **Title:** "Tiền mặt"
- **Subtitle:** none
- **Accepted:** `.xlsx`, `.xls`, `.csv`
- **Parser:** `Importer.parseTienMat(file)`
- **Alpine.js:** `@change="handleFileImport($event, 'tienMat')"`

### Zone 5: File Kế toán tháng TRƯỚC
- **Icon:** 📄
- **Title:** "File Kế toán tháng TRƯỚC"
- **Subtitle:** "(Tùy chọn)"
- **Border-color:** `#ff9500` (warning yellow) when not imported
- **Help Text:** "File Excel Kế toán (2 sheet: DS Thực tế + DS Ghi HĐ). Dùng để so sánh: ai tăng/giảm so với tháng này."
  - Font: `12px`, color `#86868b`, margin-top: `12px`
- **Accepted:** `.xlsx`, `.xls`, `.csv`
- **Parser:** `Importer.parsePrevInvoiceFile(file)`
- **Alpine.js:** `@change="handleFileImport($event, 'prevInvoice')"`

---

## FILE INPUT HANDLING

### Hidden File Input (inside each drop zone):
```html
<input type="file" 
       accept=".xlsx, .xls, .csv" 
       style="display: none;"
       @change="handleFileImport($event, 'dsHocSinh')">
```

### Click Behavior:
- Click anywhere on drop zone card → trigger file input click
- Alpine.js: `@click="$el.querySelector('input[type=file]').click()"`

### Drag-and-Drop Events:
- `@dragover.prevent` — Allow drop
- `@dragleave` — Remove hover styling
- `@drop.prevent` — Handle dropped file

---

## START BUTTON

**Position:** Below drop zones, centered  
**Width:** `280px`  
**Height:** `52px`

**Button:**
```
┌──────────────────────────────┐
│    Bắt đầu đối soát          │
└──────────────────────────────┘
```

**Style (disabled):**
- Background: `#d2d2d7` (gray)
- Color: `#86868b`
- Cursor: `not-allowed`
- Opacity: `0.6`

**Style (enabled):**
- Background: `#0071e3` (Apple blue)
- Color: `#ffffff`
- Font: Inter, `16px`, weight `600`
- Border-radius: `980px` (pill)
- Box-shadow: `0 4px 12px rgba(0, 113, 227, 0.25)`
- Cursor: `pointer`
- Transition: `all 0.2s ease`

**Hover (enabled):**
- Background: `#005bb5` (darker blue)
- Box-shadow: `0 6px 16px rgba(0, 113, 227, 0.35)`
- Transform: `translateY(-2px)`

**Enabled Condition:**
- `importStatus.dsHocSinh === true` AND
- At least one of: `importStatus.vietinBank`, `importStatus.tpBank`, `importStatus.tienMat` is `true`

**Alpine.js:**
```javascript
:disabled="!canStartMatching"
@click="startMatching()"

// Computed property:
canStartMatching() {
  const s = this.$store.appState.importStatus;
  return s.dsHocSinh && (s.vietinBank || s.tpBank || s.tienMat);
}
```

### Help Text (below button):
```
Yêu cầu DS Học Sinh và ít nhất 1 nguồn thu để bắt đầu
```
- Font: `13px`, weight `400`
- Color: `#86868b`
- Text-align: center
- Margin-top: `12px`

---

## ALPINE.JS METHODS

### handleFileImport(event, type)
```javascript
async handleFileImport(event, type) {
  const file = event.target.files[0];
  if (!file) return;
  
  // Show loading
  this.showLoading = true;
  
  try {
    let result;
    const state = this.$store.appState;
    
    switch(type) {
      case 'dsHocSinh':
        const parsed = await Importer.parseGoogleSheets(file);
        state.students = parsed.students || parsed;
        result = Array.isArray(parsed.students) ? parsed.students : parsed;
        break;
      case 'vietinBank':
        state.vtbTransactions = await Importer.parseSaoKeVietinBank(file);
        result = state.vtbTransactions;
        break;
      case 'tpBank':
        state.tpbTransactions = await Importer.parseSaoKeTPBank(file);
        result = state.tpbTransactions;
        break;
      case 'tienMat':
        state.cashPayments = await Importer.parseTienMat(file);
        result = state.cashPayments;
        break;
      case 'prevInvoice':
        const prevData = await Importer.parsePrevInvoiceFile(file);
        state.prevInvoiceStudents = prevData.prevInvoiceStudents;
        state.prevThucTeStudents = prevData.prevThucTe;
        result = prevData.prevInvoiceStudents;
        Storage._set('joy_prev_invoice_students', result);
        Storage._set('joy_prev_thuc_te_students', prevData.prevThucTe);
        break;
    }
    
    // Update import status
    state.importStatus[type] = true;
    
    // Show success toast
    this.showToast(`✅ Import ${file.name} thành công: ${result.length} dòng`, 'success');
    
  } catch (err) {
    this.showToast(`❌ Lỗi import file: ${err.message}`, 'error');
    console.error('Import error:', err);
  } finally {
    this.showLoading = false;
  }
}
```

### startMatching()
```javascript
async startMatching() {
  this.showLoading = true;
  
  try {
    // Call existing matching logic from app.js
    await this.runMatching();
    
    // Switch to report tab
    this.$store.appState.activeTab = 'report-tab';
    
    this.showToast('✅ Đối soát hoàn tất!', 'success');
  } catch (err) {
    this.showToast(`❌ Lỗi đối soát: ${err.message}`, 'error');
  } finally {
    this.showLoading = false;
  }
}
```

---

**Status:** Specification file 4 of 8 complete.  
**Next:** Read `SPEC_05_TAB_REPORT.md` for the main reconciliation report tab.
