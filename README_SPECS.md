# 📋 JOY FEE CHECK - COMPLETE TECHNICAL SPECIFICATION

**Project:** Joy Fee Check UI Redesign  
**Purpose:** Rebuild UI with Apple Flat design + Alpine.js while keeping all existing business logic intact  
**Created:** September 7, 2026  
**For:** Google AI Studio

---

## 🎯 QUICK START GUIDE

### Step 1: Read These Files in Order
1. `SPEC_01_OVERVIEW.md` — Project overview and requirements
2. `SPEC_02_DATA_STRUCTURE.md` — Data models and localStorage
3. `SPEC_03_UI_LAYOUT.md` — Page structure and navigation
4. `SPEC_04_TAB_IMPORT.md` — Import tab (drag-drop files)
5. `SPEC_05_TAB_REPORT.md` — Main reconciliation report
6. `SPEC_06_TAB_ACCOUNTING.md` — 7 accounting sub-tabs
7. `SPEC_07_TAB_SETTINGS.md` — Settings and configuration
8. `SPEC_08_COMPONENTS.md` — Reusable components

### Step 2: Understand the Architecture

```
┌─────────────────────────────────────────────────────────┐
│ NEW UI LAYER (Alpine.js + Apple Flat CSS)              │
│ ├── index-v2.html                                       │
│ ├── css/style-v2.css                                    │
│ └── js/app-v2.js                                        │
└─────────────────────────────────────────────────────────┘
                         ↓ calls
┌─────────────────────────────────────────────────────────┐
│ EXISTING BUSINESS LOGIC (DO NOT MODIFY)                │
│ ├── js/datamodel.js    — Constants & data structures   │
│ ├── js/utils.js        — Utility functions             │
│ ├── js/storage.js      — localStorage CRUD             │
│ ├── js/importer.js     — Excel parsers (SheetJS)       │
│ ├── js/matcher.js      — Payment matching algorithms   │
│ ├── js/reporter.js     — Report generation             │
│ ├── js/accounting.js   — Accounting logic (7 tabs)     │
│ └── js/exporter.js     — Excel export functions        │
└─────────────────────────────────────────────────────────┘
```

### Step 3: Implementation Strategy

**✅ DO:**
- Use Alpine.js for all reactive UI state
- Reference existing functions from `window.Matcher`, `window.Reporter`, etc.
- Follow Apple Flat design system exactly (colors, spacing, shadows)
- Build one tab at a time and test before moving to next
- Use exact color values from specs

**❌ DON'T:**
- Modify any of the 7 core JS files (datamodel, utils, storage, importer, matcher, reporter, accounting, exporter)
- Add npm, webpack, or build tools
- Use frameworks other than Alpine.js
- Change data flow or function signatures
- Invent new features not in specs

---

## 📊 SPECIFICATION SUMMARY

### File Sizes:
- SPEC_01: 5.2 KB — Overview
- SPEC_02: 7.9 KB — Data structures
- SPEC_03: 8.5 KB — UI layout
- SPEC_04: 11 KB — Import tab
- SPEC_05: 15 KB — Report tab
- SPEC_06: 15 KB — Accounting tabs
- SPEC_07: 19 KB — Settings tab
- SPEC_08: 18 KB — Components

**Total:** ~100 KB of detailed specifications

---

## 🎨 DESIGN SYSTEM QUICK REFERENCE

### Colors (Apple Flat)
```css
--bg-white: #ffffff
--bg-gray: #f5f5f7
--text-primary: #1d1d1f
--text-secondary: #86868b
--accent-blue: #0071e3
--success: #34c759
--error: #ff3b30
--warning: #ff9500
--info: #007aff
--purple: #af52de
```

### Typography
- Font: Inter (Google Fonts)
- Headings: 18-24px, weight 600
- Body: 13-15px, weight 400
- Small: 12-13px, weight 400

### Spacing
- Section gap: 40px
- Card padding: 24px
- Input padding: 12px
- Button padding: 12px 24px

### Shadows
- Light: `0 1px 3px rgba(0,0,0,0.08)`
- Medium: `0 4px 12px rgba(0,0,0,0.12)`
- Button: `0 4px 12px rgba(0,113,227,0.25)`

### Border Radius
- Cards: 16px
- Inputs: 8px
- Buttons: 980px (pill)
- Badges: 12px

---

## 📋 FEATURE CHECKLIST

### Tab 1: Import Dữ Liệu
- [ ] 5 drop zones (DS HS, VTB, TPBank, Cash, Prev Invoice)
- [ ] Drag-and-drop + click to browse
- [ ] Settings panel (month, default fee)
- [ ] Start button (enabled when DS + 1 source)
- [ ] Success/error toast notifications

### Tab 2: Ngoại lệ
- [ ] Unmapped STK table (VietinBank)
- [ ] Unidentified TPBank transactions
- [ ] Sync changes tracking
- [ ] Manual assignment modal
- [ ] Add family group button

### Tab 3: Báo cáo Đối soát
- [ ] 7 summary cards (dashboard)
- [ ] Filter bar (status, class, teacher, search)
- [ ] Report table with 13 columns
- [ ] **NEW COLUMN: Nguồn CK** (💵 Cash | 🏦 VTB | 🏦 TPBank)
- [ ] Expandable row details (transactions)
- [ ] Status badges (paid/unpaid/partial/overpaid/package)
- [ ] Export buttons (report, full, nhắc phí)
- [ ] Suspended students section
- [ ] Find student (🔍 scroll-to-row)

### Tab 4: Báo cáo Kế toán (7 sub-tabs)
- [ ] Sub-tab navigation (pills)
- [ ] Tab 1: DS HĐ Tháng trước
- [ ] Tab 2: DS CK VTB Tháng này
- [ ] Tab 3: Giảm bớt (with Nguồn CK column)
- [ ] Tab 4: Stop học nghỉ (radio selection + confirm)
- [ ] Tab 5: Tăng mới
- [ ] Tab 6: Chuyển tiền sai (family allocation table)
- [ ] Tab 7: Tổng hợp (editable HP, tag filter, sort, checkboxes)
- [ ] Export all (7-sheet Excel)

### Tab 5: Cài đặt
- [ ] STK Phụ table + CRUD
- [ ] Từ khóa TPBank table + CRUD
- [ ] Export/Import mapping buttons
- [ ] Nhóm gia đình table + CRUD
- [ ] Đóng gói học phí table + CRUD + discount %
- [ ] Điều chỉnh học phí table + CRUD
- [ ] Giới thiệu bạn mới table + alerts + CRUD
- [ ] Backup & restore section

### Tab 6: Hướng dẫn
- [ ] Step-by-step guide in Vietnamese
- [ ] FAQ section
- [ ] Algorithm explanation

### Global Components
- [ ] Header (logo, date)
- [ ] Tab bar (6 tabs, active indicator)
- [ ] Modal dialog
- [ ] Toast notifications
- [ ] Loading overlay
- [ ] Back-to-top button

---

## 🧪 TESTING CHECKLIST

### Functional Tests
- [ ] Import 4 Excel files successfully
- [ ] Run matching (button click → loading → results)
- [ ] View report with filters working
- [ ] Export Excel files (downloads correctly)
- [ ] Add family group → see in settings table
- [ ] Add STK/keyword → persists to localStorage
- [ ] Backup/restore → data preserved

### UI/UX Tests
- [ ] All colors match Apple Flat specs
- [ ] Buttons have hover/active states
- [ ] Modal opens/closes smoothly
- [ ] Toast appears/disappears with animation
- [ ] Tables scroll horizontally on mobile
- [ ] Cards have subtle shadows
- [ ] Typography uses Inter font

### Responsive Tests
- [ ] Desktop (>1024px): 3-column grids, full layout
- [ ] Tablet (768-1024px): 2-column grids
- [ ] Mobile (<768px): 1-column, horizontal scroll tables

### Data Flow Tests
- [ ] Import → data stored in Alpine store
- [ ] Matching → calls existing Matcher functions
- [ ] Report → calls Reporter.generateReport()
- [ ] Accounting → calls Accounting.computeInvoiceComparison()
- [ ] Export → calls Exporter.exportXXX()

---

## 🚨 COMMON PITFALLS TO AVOID

1. **Don't modify core JS files** — They work correctly, only UI needs rebuild
2. **Don't forget x-cloak** — Add to modals/toasts to prevent flash
3. **Don't use wrong color values** — Use exact hex codes from specs
4. **Don't skip responsive CSS** — Mobile users need horizontal scroll
5. **Don't forget Alpine.js CDN** — Load it AFTER existing JS files
6. **Don't change function signatures** — Existing code expects specific parameters
7. **Don't add build steps** — Pure HTML/CSS/JS, no npm/webpack
8. **Don't use emoji in Alpine expressions** — Use text indicators instead

---

## 📞 SUPPORT

**If you encounter issues:**
1. Re-read the relevant SPEC file
2. Check `js/app.js` (old version) for reference implementation
3. Console.log() data structures to verify format
4. Verify Alpine.js store is properly initialized
5. Check browser console for errors

**Questions to ask yourself:**
- Did I load Alpine.js AFTER the existing JS files?
- Did I use `x-data` at the root level?
- Did I call existing functions via `window.Matcher`, not rewrite them?
- Did I use exact color values from specs?
- Did I test on both desktop and mobile?

---

## 🎓 KEY CONCEPTS

### Alpine.js Store Pattern
```javascript
Alpine.store('appState', {
  activeTab: 'import-tab',
  students: [],
  reportRows: [],
  // ... all reactive state here
});

// Access in templates:
x-show="$store.appState.activeTab === 'import-tab'"
```

### Calling Existing Functions
```javascript
// In Alpine component method:
async runMatching() {
  const state = this.$store.appState;
  
  // Call existing matcher
  const result = Matcher.matchVietinBank(
    state.vtbTransactions,
    state.students,
    Storage.loadSTKPhu()
  );
  
  // Store results
  state.vtbMatched = result.matched;
}
```

### Currency Formatting
```javascript
// Always use Utils.formatCurrency()
x-text="Utils.formatCurrency(row.tongHocPhi)"

// Or create Alpine magic helper:
Alpine.magic('currency', () => (val) => Utils.formatCurrency(val));
// Then: x-text="$currency(row.tongHocPhi)"
```

---

## 🎉 SUCCESS CRITERIA

Your implementation is complete when:

✅ All 6 tabs render correctly  
✅ Import flow works (drag-drop → parsing → storage)  
✅ Matching produces correct report rows  
✅ All 7 accounting sub-tabs display data  
✅ Export downloads valid Excel files  
✅ Settings CRUD operations persist to localStorage  
✅ UI matches Apple Flat design (white bg, blue accents, subtle shadows)  
✅ Mobile responsive (horizontal scroll, stacked layout)  
✅ No errors in browser console  
✅ Existing JS files remain unchanged  

---

## 📦 DELIVERABLES

When finished, you should have:

1. **index-v2.html** — Main HTML file with Alpine.js
2. **css/style-v2.css** — Apple Flat design system
3. **js/app-v2.js** — Alpine.js components and methods

**Total new code:** ~2,000-3,000 lines (estimate)

**Existing code preserved:** 7,911 lines (js/*.js files)

---

## 🚀 READY TO START!

**Next steps:**
1. Copy all 8 SPEC files to Google AI Studio
2. Start with SPEC_01_OVERVIEW.md
3. Build one tab at a time
4. Test each tab before moving to next
5. Deploy to GitHub Pages when complete

**Good luck! The specs are comprehensive and you have everything you need.** 🎨✨

---

**Created by:** Hermes Agent  
**Date:** September 7, 2026  
**Version:** 1.0  
**Status:** ✅ Complete and ready for implementation
