# SPEC 08: REUSABLE COMPONENTS & UTILITIES

**Previous:** SPEC_07_TAB_SETTINGS.md  
**This is the final specification file (8 of 8)**

---

## OVERVIEW

This document describes reusable UI components, utility functions, and Alpine.js patterns used throughout the application.

---

## COMPONENT 1: BUTTON STYLES

### Primary Button
```html
<button class="btn btn-primary">
  Xác nhận
</button>
```

**CSS:**
```css
.btn-primary {
  background: #0071e3;
  color: #ffffff;
  border: none;
  border-radius: 980px; /* pill shape */
  padding: 12px 24px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 113, 227, 0.2);
}

.btn-primary:hover {
  background: #005bb5;
  box-shadow: 0 4px 12px rgba(0, 113, 227, 0.3);
  transform: translateY(-1px);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-primary:disabled {
  background: #d2d2d7;
  color: #86868b;
  cursor: not-allowed;
  opacity: 0.6;
  box-shadow: none;
}
```

### Secondary Button
```css
.btn-secondary {
  background: #f5f5f7;
  color: #1d1d1f;
  border: 1px solid #d2d2d7;
  border-radius: 980px;
  padding: 12px 24px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: #e8e8ed;
  border-color: #86868b;
}
```

### Outline Button
```css
.btn-outline {
  background: transparent;
  color: #1d1d1f;
  border: 1px solid #d2d2d7;
  border-radius: 980px;
  padding: 12px 24px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-outline:hover {
  background: #f5f5f7;
  border-color: #1d1d1f;
}
```

### Danger Button
```css
.btn-danger {
  background: transparent;
  color: #ff3b30;
  border: 1px solid #ff3b30;
  border-radius: 980px;
  padding: 12px 24px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-danger:hover {
  background: #ff3b30;
  color: #ffffff;
}
```

### Small Button (btn-sm)
```css
.btn-sm {
  padding: 6px 14px;
  font-size: 13px;
}
```

---

## COMPONENT 2: STATUS BADGES

### HTML Template
```html
<span class="status-badge status-paid">✅ Đã đóng</span>
<span class="status-badge status-unpaid">❌ Chưa đóng</span>
<span class="status-badge status-partial">⚠️ Đóng thiếu</span>
<span class="status-badge status-overpaid">🔵 Đóng dư</span>
<span class="status-badge status-package">📦 Đóng gói</span>
```

### CSS
```css
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.status-paid {
  background: #d1f2dd;
  color: #1e7e34;
}

.status-unpaid {
  background: #ffe5e5;
  color: #d32f2f;
}

.status-partial {
  background: #fff4e5;
  color: #e67700;
}

.status-overpaid {
  background: #e5f2ff;
  color: #0066cc;
}

.status-package {
  background: #f3e5ff;
  color: #7b1fa2;
}
```

---

## COMPONENT 3: CARD CONTAINER

### HTML
```html
<div class="card">
  <h3>Card Title</h3>
  <p>Card content...</p>
</div>
```

### CSS
```css
.card {
  background: #ffffff;
  border: 1px solid #d2d2d7;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
}

.card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.card h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1d1d1f;
  margin-bottom: 16px;
}
```

---

## COMPONENT 4: FORM INPUTS

### Text Input
```html
<div class="form-group">
  <label for="input-name">Họ tên</label>
  <input type="text" id="input-name" placeholder="Nhập họ tên...">
</div>
```

### CSS
```css
.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #1d1d1f;
  margin-bottom: 8px;
}

input[type="text"],
input[type="number"],
input[type="month"],
select,
textarea {
  width: 100%;
  height: 44px;
  padding: 0 12px;
  border: 1px solid #d2d2d7;
  border-radius: 8px;
  font-size: 15px;
  color: #1d1d1f;
  background: #ffffff;
  transition: all 0.2s ease;
}

input:focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: #0071e3;
  box-shadow: 0 0 0 4px rgba(0, 113, 227, 0.1);
}

textarea {
  height: auto;
  min-height: 80px;
  padding: 12px;
  resize: vertical;
}

::placeholder {
  color: #86868b;
}
```

---

## COMPONENT 5: DATA TABLE

### HTML Template
```html
<div class="table-container">
  <table class="data-table">
    <thead>
      <tr>
        <th>Column 1</th>
        <th>Column 2</th>
        <th class="text-right">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Data 1</td>
        <td>Data 2</td>
        <td class="text-right">1,000,000</td>
      </tr>
    </tbody>
  </table>
</div>
```

### CSS
```css
.table-container {
  overflow-x: auto;
  border: 1px solid #d2d2d7;
  border-radius: 12px;
  background: #ffffff;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.data-table thead {
  background: #f5f5f7;
  position: sticky;
  top: 0;
  z-index: 10;
}

.data-table th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #1d1d1f;
  border-bottom: 2px solid #d2d2d7;
  white-space: nowrap;
}

.data-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #e5e5e7;
  color: #1d1d1f;
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

.data-table tbody tr:hover {
  background: #f9f9f9;
}

.text-right {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.text-center {
  text-align: center;
}
```

---

## COMPONENT 6: MODAL DIALOG

### Alpine.js Template
```html
<div x-show="showModal" 
     x-cloak
     @click.self="showModal = false"
     class="modal-overlay">
  <div class="modal-content" @click.stop>
    <!-- Header -->
    <div class="modal-header">
      <h3 x-text="modalTitle"></h3>
      <button @click="showModal = false" class="modal-close">×</button>
    </div>
    
    <!-- Body -->
    <div class="modal-body" x-html="modalBody"></div>
    
    <!-- Footer -->
    <div class="modal-footer">
      <button @click="showModal = false" class="btn-secondary">Hủy</button>
      <button @click="modalConfirm()" class="btn-primary">Xác nhận</button>
    </div>
  </div>
</div>
```

### CSS
```css
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.2s ease-out;
}

.modal-content {
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
  max-width: 560px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  animation: scaleIn 0.2s ease-out;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 24px 16px 24px;
  border-bottom: 1px solid #e5e5e7;
}

.modal-header h3 {
  font-size: 20px;
  font-weight: 600;
  color: #1d1d1f;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 28px;
  color: #86868b;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background: #f5f5f7;
  color: #1d1d1f;
}

.modal-body {
  padding: 24px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px 24px 24px;
  border-top: 1px solid #e5e5e7;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

[x-cloak] {
  display: none !important;
}
```

---

## COMPONENT 7: TOAST NOTIFICATION

### Alpine.js Store
```javascript
Alpine.store('toasts', {
  items: [],
  
  show(message, type = 'info', duration = 4000) {
    const id = Date.now();
    this.items.push({ id, message, type });
    
    setTimeout(() => {
      this.remove(id);
    }, duration);
  },
  
  remove(id) {
    this.items = this.items.filter(item => item.id !== id);
  }
});
```

### HTML Template
```html
<div class="toast-container">
  <template x-for="toast in $store.toasts.items" :key="toast.id">
    <div :class="`toast toast-${toast.type}`" 
         x-show="true"
         x-transition:enter="toast-enter"
         x-transition:leave="toast-leave">
      <span x-text="toast.message"></span>
      <button @click="$store.toasts.remove(toast.id)" class="toast-close">×</button>
    </div>
  </template>
</div>
```

### CSS
```css
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9998;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none;
}

.toast {
  min-width: 320px;
  max-width: 480px;
  padding: 16px 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 14px;
  font-weight: 500;
  color: #ffffff;
  pointer-events: auto;
}

.toast-success { background: #34c759; }
.toast-error { background: #ff3b30; }
.toast-warning { background: #ff9500; }
.toast-info { background: #0071e3; }

.toast-close {
  background: none;
  border: none;
  color: #ffffff;
  font-size: 20px;
  cursor: pointer;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.toast-close:hover {
  opacity: 1;
}

.toast-enter {
  transition: all 0.3s ease-out;
}

.toast-enter-start {
  opacity: 0;
  transform: translateY(20px);
}

.toast-enter-end {
  opacity: 1;
  transform: translateY(0);
}

.toast-leave {
  transition: all 0.3s ease-in;
}

.toast-leave-start {
  opacity: 1;
  transform: translateY(0);
}

.toast-leave-end {
  opacity: 0;
  transform: translateY(20px);
}
```

---

## UTILITY FUNCTIONS (Alpine.js Magic Properties)

### Currency Formatter
```javascript
Alpine.magic('formatCurrency', () => {
  return (value) => {
    if (isNaN(value)) return '0';
    return new Intl.NumberFormat('vi-VN').format(value);
  };
});

// Usage: x-text="$formatCurrency(row.tongHocPhi)"
```

### Date Formatter
```javascript
Alpine.magic('formatDate', () => {
  return (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN');
  };
});
```

### Debounce Helper
```javascript
Alpine.directive('debounce', (el, { expression, modifiers }) => {
  let timeout;
  const wait = Object.keys(modifiers)[0] || 300;
  
  el.addEventListener('input', (e) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      Alpine.evaluate(el, expression);
    }, wait);
  });
});

// Usage: @input.debounce.300ms="applyFilters()"
```

---

## RESPONSIVE UTILITIES

### CSS Media Queries
```css
/* Mobile First Approach */

/* Small devices (phones) */
@media (max-width: 767px) {
  .hide-mobile { display: none; }
  
  .table-container {
    font-size: 11px;
  }
  
  .card {
    padding: 16px;
  }
  
  .btn {
    width: 100%;
  }
  
  .modal-content {
    width: 95%;
    margin: 0 auto;
  }
}

/* Medium devices (tablets) */
@media (min-width: 768px) and (max-width: 1023px) {
  .hide-tablet { display: none; }
}

/* Large devices (desktops) */
@media (min-width: 1024px) {
  .hide-desktop { display: none; }
}
```

### Grid System
```css
.grid-2col {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.grid-3col {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

@media (max-width: 767px) {
  .grid-2col,
  .grid-3col {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 768px) and (max-width: 1023px) {
  .grid-3col {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

---

## ALPINE.JS GLOBAL METHODS

### Main App Component
```javascript
function appComponent() {
  return {
    // State
    showModal: false,
    modalTitle: '',
    modalBody: '',
    modalConfirm: null,
    showLoading: false,
    
    // Init
    init() {
      this.setupDefaults();
      this.loadFromLocalStorage();
    },
    
    // Toast wrapper
    showToast(message, type = 'info') {
      this.$store.toasts.show(message, type);
    },
    
    // Modal wrapper
    openModal(title, body, onConfirm) {
      this.modalTitle = title;
      this.modalBody = body;
      this.modalConfirm = onConfirm;
      this.showModal = true;
    },
    
    closeModal() {
      this.showModal = false;
      this.modalConfirm = null;
    },
    
    // Call existing JS functions
    async runMatching() {
      const state = this.$store.appState;
      
      // Call existing matching logic from js/matcher.js
      const stkPhu = Storage.loadSTKPhu();
      const keywords = Storage.loadKeywords();
      
      if (state.vtbTransactions.length > 0) {
        const vtbResult = Matcher.matchVietinBank(
          state.vtbTransactions,
          state.students,
          stkPhu
        );
        state.vtbMatched = vtbResult.matched;
        state.vtbUnmatched = vtbResult.unmatched;
      }
      
      if (state.tpbTransactions.length > 0) {
        const tpbResult = Matcher.matchTPBank(
          state.tpbTransactions,
          keywords,
          state.students
        );
        state.tpbMatched = tpbResult.matched;
        state.tpbUnmatched = tpbResult.unmatched;
      }
      
      let paymentsByMSHS = Matcher.aggregateByMSHS(
        state.vtbMatched,
        state.tpbMatched,
        state.cashPayments
      );
      
      const familyGroups = Storage.loadFamilyGroups();
      state.reportRows = Reporter.generateReport(
        state.students,
        paymentsByMSHS,
        familyGroups,
        state.monthYear
      );
      
      // Compute accounting data
      this.computeAccountingData();
      
      state.matchingDone = true;
      state.exceptionCount = state.vtbUnmatched.length + state.tpbUnmatched.length;
    },
    
    computeAccountingData() {
      const state = this.$store.appState;
      
      const vtbMatchedMSHS = new Set(
        state.vtbMatched.map(tx => tx.matchedMSHS).filter(Boolean)
      );
      
      const currMap = new Map();
      state.students.forEach(s => currMap.set(s.mshs, s));
      
      const vtbAmountByMSHS = new Map();
      state.vtbMatched.forEach(tx => {
        if (tx.matchedMSHS) {
          vtbAmountByMSHS.set(
            tx.matchedMSHS,
            (vtbAmountByMSHS.get(tx.matchedMSHS) || 0) + tx.credit
          );
        }
      });
      
      state.accountingData = Accounting.computeInvoiceComparison(
        state.prevInvoiceStudents,
        vtbMatchedMSHS,
        currMap,
        vtbAmountByMSHS,
        state.reportRows,
        Storage.loadFamilyGroups(),
        state.defaultFee
      );
    }
  };
}
```

---

## INTEGRATION EXAMPLE

### Complete index-v2.html Structure
```html
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Joy Fee Check</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/style-v2.css">
</head>
<body>
  <div x-data="appComponent()" x-init="init()">
    
    <!-- Header -->
    <header>...</header>
    
    <!-- Tab Bar -->
    <nav>...</nav>
    
    <!-- Main Content -->
    <main>
      <!-- Tab Import -->
      <div x-show="$store.appState.activeTab === 'import-tab'">
        ...
      </div>
      
      <!-- Other tabs... -->
    </main>
    
    <!-- Global Components -->
    <div x-show="showModal" class="modal-overlay">...</div>
    <div class="toast-container">...</div>
    <div x-show="showLoading" class="loading-overlay">...</div>
    
  </div>
  
  <!-- Libraries -->
  <script src="lib/xlsx.full.min.js"></script>
  
  <!-- Existing Logic (DO NOT MODIFY) -->
  <script src="js/datamodel.js"></script>
  <script src="js/utils.js"></script>
  <script src="js/storage.js"></script>
  <script src="js/importer.js"></script>
  <script src="js/matcher.js"></script>
  <script src="js/reporter.js"></script>
  <script src="js/accounting.js"></script>
  <script src="js/exporter.js"></script>
  
  <!-- Alpine.js (load last) -->
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
  
  <!-- New Alpine.js Controller -->
  <script src="js/app-v2.js"></script>
</body>
</html>
```

---

## FINAL CHECKLIST FOR GOOGLE AI STUDIO

### ✅ Before Starting:
- [ ] Read all 8 specification files in order
- [ ] Understand that 7 core JS files must remain UNCHANGED
- [ ] Review Apple Flat design reference (apple.com/vn)
- [ ] Confirm Alpine.js CDN version (3.x)

### ✅ During Implementation:
- [ ] Build one tab at a time (Import → Report → Accounting → Settings)
- [ ] Test each function call to existing JS modules
- [ ] Use exact color values from specs
- [ ] Follow spacing/padding guidelines
- [ ] Implement responsive breakpoints

### ✅ After Completion:
- [ ] Test file import flow (4 files → matching → display)
- [ ] Verify all 7 accounting sub-tabs display correctly
- [ ] Test export functions (Excel downloads)
- [ ] Check mobile responsiveness
- [ ] Verify no errors in browser console

---

## SUPPORT & RESOURCES

**If Stuck:**
1. Re-read the relevant spec file
2. Check existing code in `js/app.js` for reference
3. Console.log() the data structures to verify format
4. Ask clarifying questions with specific examples

**Common Pitfalls:**
- Don't modify the 7 core JS files
- Don't forget `x-cloak` directive for modals/toasts
- Remember to call existing functions from `window.Matcher`, etc.
- Use `Utils.formatCurrency()` for all money displays
- Always set `x-data` at the root level for Alpine.js

---

**Status:** All 8 specification files complete! ✅  

**Files Created:**
1. ✅ SPEC_01_OVERVIEW.md
2. ✅ SPEC_02_DATA_STRUCTURE.md
3. ✅ SPEC_03_UI_LAYOUT.md
4. ✅ SPEC_04_TAB_IMPORT.md
5. ✅ SPEC_05_TAB_REPORT.md
6. ✅ SPEC_06_TAB_ACCOUNTING.md
7. ✅ SPEC_07_TAB_SETTINGS.md
8. ✅ SPEC_08_COMPONENTS.md

**Total Lines:** ~1,800 lines of detailed specifications  
**Ready for:** Google AI Studio implementation

**Next Step:** Copy these 8 files to Google AI Studio and start building the new UI!
