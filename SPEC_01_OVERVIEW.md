# SPEC 01: PROJECT OVERVIEW

**Project Name:** Joy Fee Check  
**Purpose:** Monthly tuition fee reconciliation web app for Joy Language Center (Da Lat, Vietnam)  
**Tech Stack:** Pure HTML5 + CSS3 + Vanilla JavaScript + Alpine.js (CDN) + SheetJS (Excel handling)  
**Deployment:** GitHub Pages (static, no backend)  
**Language:** Vietnamese UI

---

## CRITICAL REQUIREMENTS

### 1. **KEEP ALL EXISTING LOGIC FILES UNCHANGED**
The following 7 JavaScript files contain **tested and verified business logic**. DO NOT modify them:

- `js/datamodel.js` — Constants and data structures
- `js/utils.js` — Utility functions (normalize, format, fuzzy match)
- `js/storage.js` — localStorage CRUD operations
- `js/importer.js` — Excel file parsers (4 types)
- `js/matcher.js` — Payment matching algorithms
- `js/reporter.js` — Report generation logic
- `js/accounting.js` — Accounting comparison logic (7-tab set operations)
- `js/exporter.js` — Excel export functions

**Total:** 6,012 lines of working code. These files must remain untouched.

### 2. **REBUILD ONLY THE UI LAYER**
Create NEW files:
- `index-v2.html` — Main HTML with Alpine.js integration
- `css/style-v2.css` — Apple Flat design system
- `js/app-v2.js` — Alpine.js components and UI controller

### 3. **DESIGN SYSTEM: Apple Flat (apple.com/vn style)**
- **NO** dark mode, glassmorphism, or gradients from current version
- **YES** to clean white backgrounds, subtle shadows, pill-shaped buttons
- Color palette:
  - Background: `#ffffff` (white), `#f5f5f7` (light gray sections)
  - Text: `#1d1d1f` (near black), `#86868b` (gray secondary)
  - Accent Blue: `#0071e3` (Apple blue for buttons/links)
  - Success: `#34c759`, Error: `#ff3b30`, Warning: `#ff9500`
- Typography: Inter or San Francisco, large bold headings, light body text
- Cards: White background, `border-radius: 16px`, subtle shadow `0 1px 3px rgba(0,0,0,0.08)`
- Buttons Primary: `background: #0071e3`, `border-radius: 980px` (pill), `padding: 12px 24px`

### 4. **ALPINE.JS INTEGRATION**
- CDN: `<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>`
- Use `x-data`, `x-show`, `x-for`, `@click`, `x-model` for reactivity
- NO Vue, React, or any build step
- State management via Alpine stores: `Alpine.store('appState', { ... })`

### 5. **EXISTING WORKFLOW MUST WORK IDENTICALLY**
User workflow (unchanged):
1. Open `index-v2.html` in browser
2. Drag-drop 4 Excel files into import zones
3. Click "Bắt đầu đối soát" (Start reconciliation)
4. View results in Report/Accounting tabs
5. Export Excel files

---

## PROJECT STRUCTURE

```
joyfeecheck/
├── index.html              ← OLD VERSION (keep as backup)
├── index-v2.html           ← NEW VERSION (Alpine.js + Apple Flat)
├── css/
│   ├── style.css           ← OLD (keep)
│   └── style-v2.css        ← NEW (Apple Flat)
├── js/
│   ├── datamodel.js        ← KEEP UNCHANGED ✓
│   ├── utils.js            ← KEEP UNCHANGED ✓
│   ├── storage.js          ← KEEP UNCHANGED ✓
│   ├── importer.js         ← KEEP UNCHANGED ✓
│   ├── matcher.js          ← KEEP UNCHANGED ✓
│   ├── reporter.js         ← KEEP UNCHANGED ✓
│   ├── accounting.js       ← KEEP UNCHANGED ✓
│   ├── exporter.js         ← KEEP UNCHANGED ✓
│   ├── app.js              ← OLD controller (keep)
│   └── app-v2.js           ← NEW Alpine.js controller
├── lib/
│   └── xlsx.full.min.js    ← SheetJS library
└── SPEC_*.md               ← These specification files
```

---

## DATA FLOW (UNCHANGED)

```
[4 Excel Files] 
    ↓ (drag-drop)
[Importer.parseXXX()] 
    ↓
[Matcher.matchVTB/TPBank()] → [Matcher.aggregateByMSHS()]
    ↓
[Reporter.generateReport()] → [Display in UI]
    ↓
[Accounting.computeInvoiceComparison()] → [7 accounting tabs]
    ↓
[Exporter.exportXXX()] → [Download Excel]
```

---

## NEXT STEPS

Read the following spec files in order:
1. ✅ **SPEC_01_OVERVIEW.md** (this file)
2. 📄 **SPEC_02_DATA_STRUCTURE.md** — Data models and localStorage keys
3. 🎨 **SPEC_03_UI_LAYOUT.md** — Overall page structure and navigation
4. 📥 **SPEC_04_TAB_IMPORT.md** — Import tab with 5 drop zones
5. 📊 **SPEC_05_TAB_REPORT.md** — Main reconciliation report tab
6. 📋 **SPEC_06_TAB_ACCOUNTING.md** — Accounting report with 7 sub-tabs
7. ⚙️ **SPEC_07_TAB_SETTINGS.md** — Settings and configuration
8. 🧩 **SPEC_08_COMPONENTS.md** — Reusable UI components

---

## IMPLEMENTATION GUIDELINES FOR GOOGLE AI STUDIO

### ✅ DO:
- Use Alpine.js for all UI state management
- Reference existing JS functions from `window.Matcher`, `window.Reporter`, etc.
- Copy color values and spacing exactly from this spec
- Test each tab independently before moving to next
- Ask clarifying questions if business logic is unclear

### ❌ DON'T:
- Modify any of the 7 core JS files listed above
- Add npm, webpack, or any build tools
- Use frameworks other than Alpine.js
- Change the data flow or function signatures
- Add features not described in specs

---

**Status:** This is specification file 1 of 8.  
**Next:** Read `SPEC_02_DATA_STRUCTURE.md`
