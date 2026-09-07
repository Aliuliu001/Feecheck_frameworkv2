# SPEC 03: UI LAYOUT & NAVIGATION

**Previous:** SPEC_02_DATA_STRUCTURE.md  
**Next:** SPEC_04_TAB_IMPORT.md

---

## PAGE STRUCTURE

```
┌─────────────────────────────────────────────────────────┐
│ HEADER: Logo + "Joy Fee Check" + Date                  │
├─────────────────────────────────────────────────────────┤
│ TAB BAR: 6 navigation tabs (horizontal)                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ MAIN CONTENT AREA                                       │
│ (one tab visible at a time)                             │
│                                                         │
│                                                         │
└─────────────────────────────────────────────────────────┘
                    [Back to Top ↑] (bottom-right, fixed)
```

---

## HEADER

**Height:** `64px`  
**Background:** `#ffffff`  
**Border-bottom:** `1px solid #d2d2d7`  
**Position:** `sticky`, `top: 0`, `z-index: 100`

### Layout (flex, space-between):

**Left side:**
```
[J] Joy Fee Check  v1.0
```
- **Logo "J"**: 
  - Size: `40px × 40px`
  - Background: `linear-gradient(135deg, #0071e3, #5e5ce6)`
  - Color: white
  - Border-radius: `8px`
  - Font: Bold, `20px`
  - Center-aligned text
  
- **App Name**: 
  - Font: Inter, `20px`, weight `600`
  - Color: `#1d1d1f`
  - Margin-left: `12px`
  
- **Version Badge**:
  - Text: "v1.0"
  - Background: `#f5f5f7`
  - Color: `#86868b`
  - Font-size: `12px`
  - Padding: `2px 8px`
  - Border-radius: `12px`
  - Margin-left: `8px`

**Right side:**
```
Thứ Bảy, 07 tháng 9, 2026
```
- Font: Inter, `14px`, weight `400`
- Color: `#86868b`
- Format: Vietnamese full date (via `toLocaleDateString('vi-VN')`)

---

## TAB BAR

**Height:** `48px`  
**Background:** `#ffffff`  
**Border-bottom:** `1px solid #d2d2d7`  
**Position:** `sticky`, `top: 64px`, `z-index: 99`

### 6 Tabs (horizontal, equal width on desktop):

1. **📥 Import Dữ Liệu**
2. **⚠️ Ngoại lệ** `(badge: exception count)`
3. **📊 Báo cáo Đối soát**
4. **📋 Báo cáo Kế toán**
5. **⚙️ Cài đặt**
6. **📖 Hướng dẫn**

### Tab Button Style:

**Default (inactive):**
- Background: transparent
- Color: `#86868b`
- Font: Inter, `14px`, weight `500`
- Padding: `12px 20px`
- Border: none
- Cursor: pointer
- Transition: `color 0.2s ease`

**Hover:**
- Color: `#1d1d1f`

**Active:**
- Color: `#0071e3` (Apple blue)
- Border-bottom: `2px solid #0071e3`
- Font-weight: `600`

**Badge (for "Ngoại lệ"):**
- Background: `#ff3b30` (Apple red)
- Color: white
- Font-size: `11px`
- Padding: `2px 6px`
- Border-radius: `10px`
- Margin-left: `6px`
- Font-weight: `600`
- Display: `none` when count = 0

### Responsive Behavior:
- **Desktop (>1024px):** All tabs visible, equal width
- **Tablet (768-1024px):** All tabs visible, horizontal scroll if needed
- **Mobile (<768px):** Horizontal scroll, tabs shrink to content width

---

## MAIN CONTENT AREA

**Max-width:** `1400px`  
**Margin:** `0 auto`  
**Padding:** `40px 24px`  
**Background:** `#ffffff`

### Tab Content Switching:
- Only ONE tab content visible at a time
- Alpine.js: `x-show="activeTab === 'import-tab'"`
- Fade-in animation: `opacity 0→1` over `0.3s ease-out`

---

## BACK TO TOP BUTTON

**Position:** `fixed`, `bottom: 32px`, `right: 32px`, `z-index: 999`  
**Size:** `56px × 56px`  
**Background:** `#0071e3` (Apple blue)  
**Border-radius:** `50%` (perfect circle)  
**Box-shadow:** `0 4px 12px rgba(0, 113, 227, 0.3)`  
**Display:** `none` until user scrolls past `300px`

**Icon:** `↑` (up arrow)  
- Font-size: `24px`
- Color: white
- Center-aligned

**Hover:**
- Background: `#005bb5` (darker blue)
- Box-shadow: `0 6px 16px rgba(0, 113, 227, 0.4)`
- Transform: `translateY(-2px)`
- Transition: `all 0.2s ease`

**Click:** Smooth scroll to top (`behavior: 'smooth'`)

---

## ALPINE.JS STATE MANAGEMENT

### Global App State (Alpine Store):

```javascript
Alpine.store('appState', {
  // Navigation
  activeTab: 'import-tab',
  
  // Import status
  importStatus: {
    dsHocSinh: false,
    vietinBank: false,
    tpBank: false,
    tienMat: false,
    prevInvoice: false
  },
  
  // Data
  students: [],
  vtbTransactions: [],
  tpbTransactions: [],
  cashPayments: [],
  reportRows: [],
  accountingData: null,
  
  // UI state
  matchingDone: false,
  exceptionCount: 0,
  
  // Settings
  monthYear: '2026-09',
  defaultFee: 800000
})
```

### Tab Switching Method:

```javascript
switchTab(tabId) {
  this.activeTab = tabId;
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  // Update URL hash (optional)
  window.location.hash = tabId;
}
```

---

## LOADING OVERLAY

**When:** During "Bắt đầu đối soát" (matching process)  
**Position:** `fixed`, covers entire viewport  
**Background:** `rgba(255, 255, 255, 0.95)`  
**Z-index:** `9999`

**Content (centered):**
```
  [Spinner: 40px circle, rotating]
  
  Đang xử lý...
```

**Spinner:**
- Width/height: `40px`
- Border: `4px solid #f5f5f7`
- Border-top-color: `#0071e3`
- Border-radius: `50%`
- Animation: `spin 1s linear infinite`

**Text:**
- Font: Inter, `16px`, weight `500`
- Color: `#1d1d1f`
- Margin-top: `16px`

---

## MODAL DIALOG

**Overlay:**
- Background: `rgba(0, 0, 0, 0.4)` (semi-transparent black)
- Position: `fixed`, covers viewport
- Z-index: `10000`
- Click to close (click outside modal)

**Modal Box:**
- Max-width: `560px`
- Background: `#ffffff`
- Border-radius: `16px`
- Box-shadow: `0 20px 40px rgba(0, 0, 0, 0.25)`
- Padding: `32px`
- Position: `fixed`, centered (50% top/left, transform translate -50%)
- Animation: Fade + scale in (`0.2s ease-out`)

**Structure:**
```
┌────────────────────────────────────┐
│ [×]                    Modal Title │
├────────────────────────────────────┤
│                                    │
│ Modal Body Content                 │
│ (forms, text, tables, etc.)        │
│                                    │
├────────────────────────────────────┤
│         [Cancel]  [Confirm]        │
└────────────────────────────────────┘
```

**Close Button (×):**
- Position: `absolute`, `top: 16px`, `right: 16px`
- Size: `32px × 32px`
- Font-size: `24px`
- Color: `#86868b`
- Hover: color changes to `#1d1d1f`

**Title:**
- Font: Inter, `20px`, weight `600`
- Color: `#1d1d1f`

**Footer Buttons:**
- Cancel: Secondary style (gray border)
- Confirm: Primary style (blue background)
- Spacing: `12px` gap

---

## TOAST NOTIFICATIONS

**Position:** `fixed`, `bottom: 24px`, `right: 24px`, `z-index: 9998`  
**Stacking:** Multiple toasts stack vertically with `12px` gap

**Toast Box:**
- Background: Based on type (success/error/warning/info)
- Border-radius: `12px`
- Padding: `16px 20px`
- Box-shadow: `0 4px 12px rgba(0, 0, 0, 0.15)`
- Min-width: `320px`
- Max-width: `480px`
- Font: Inter, `14px`, weight `500`
- Color: white

**Colors by Type:**
- Success: `#34c759`
- Error: `#ff3b30`
- Warning: `#ff9500`
- Info: `#0071e3`

**Animation:**
- Enter: Slide up + fade in (`0.3s ease-out`)
- Stay: 4 seconds
- Exit: Slide down + fade out (`0.3s ease-in`)

**Icon (optional):**
- Success: ✓
- Error: ✕
- Warning: ⚠
- Info: ℹ

---

## RESPONSIVE BREAKPOINTS

```css
/* Mobile */
@media (max-width: 767px) {
  - Single column layouts
  - Horizontal scroll for tables
  - Stacked forms
  - Smaller fonts (14px → 13px)
  - Reduced padding (24px → 16px)
}

/* Tablet */
@media (min-width: 768px) and (max-width: 1023px) {
  - 2-column grids where appropriate
  - Full tables (scroll if needed)
  - Normal fonts
}

/* Desktop */
@media (min-width: 1024px) {
  - 3-column grids
  - All features visible
  - Max-width: 1400px container
}
```

---

**Status:** Specification file 3 of 8 complete.  
**Next:** Read `SPEC_04_TAB_IMPORT.md` for the Import tab detailed design.
