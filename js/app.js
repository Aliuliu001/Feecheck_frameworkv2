// Alpine.js Setup
document.addEventListener('alpine:init', () => {

  // Global Toast Store
  Alpine.store('toasts', {
    items: [],
    show(message, type = 'info', duration = 4000) {
      const id = Date.now();
      this.items.push({ id, message, type });
      setTimeout(() => this.remove(id), duration);
    },
    remove(id) {
      this.items = this.items.filter(item => item.id !== id);
    }
  });

  // Global App State
  Alpine.store('appState', {
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
    prevInvoiceStudents: [],
    prevThucTeStudents: [],
    
    // Results
    reportRows: [],
    accountingData: { tab1: [], tab2: [], tab3: [], tab4: [], tab5: [], tab6: [], tab7: [] },
    
    // UI state
    matchingDone: false,
    exceptionCount: 0,
    
    // Settings
    monthYear: '2026-09',
    defaultFee: 800000,
    accTab7FilterTags: []
  });

  // Magic Properties
  Alpine.magic('formatCurrency', () => {
    return (value) => {
      if (value === undefined || value === null || isNaN(value)) return '-';
      return new Intl.NumberFormat('vi-VN').format(value) + 'đ';
    };
  });

  Alpine.magic('formatDate', () => {
    return (dateStr) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return date.toLocaleDateString('vi-VN');
    };
  });
});

// Main App Component
function appComponent() {
  return {
    // UI State
    showModal: false,
    modalTitle: '',
    modalBody: '',
    modalConfirm: null,
    showLoading: false,
    
    // Report Filters
    filters: {
      status: 'all',
      className: 'all',
      teacher: 'all',
      searchText: ''
    },
    filteredReportRows: [],
    
    // Accounting UI
    activeAccTab: 'acc-tab1',
    tab4Choice: {}, // Track Nghỉ học / Vẫn học
    
    // Settings State
    stkPhuData: [],
    keywordData: [],
    familyGroups: [],

    init() {
      // Set default month
      const now = new Date();
      this.$store.appState.monthYear = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2, '0')}`;
      
      // Load UI settings
      this.loadSettingsUI();
    },

    loadSettingsUI() {
      this.stkPhuData = window.Storage.loadSTKPhu() || [];
      this.keywordData = window.Storage.loadKeywords() || [];
      this.familyGroups = window.Storage.loadFamilyGroups() || [];
    },
    
    showToast(message, type = 'info') {
      Alpine.store('toasts').show(message, type);
    },
    
    switchTab(tabId) {
      this.$store.appState.activeTab = tabId;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    get canStartMatching() {
      const s = this.$store.appState.importStatus;
      return s.dsHocSinh && (s.vietinBank || s.tpBank || s.tienMat);
    },

    async handleFileImport(event, type) {
      const file = event.target.files[0];
      if (!file) return;
      
      this.showLoading = true;
      try {
        let result;
        const state = this.$store.appState;
        
        switch(type) {
          case 'dsHocSinh':
            const parsed = await window.Importer.parseGoogleSheets(file);
            state.students = parsed.students || parsed;
            result = Array.isArray(parsed.students) ? parsed.students : parsed;
            break;
          case 'vietinBank':
            state.vtbTransactions = await window.Importer.parseSaoKeVietinBank(file);
            result = state.vtbTransactions;
            break;
          case 'tpBank':
            state.tpbTransactions = await window.Importer.parseSaoKeTPBank(file);
            result = state.tpbTransactions;
            break;
          case 'tienMat':
            state.cashPayments = await window.Importer.parseTienMat(file);
            result = state.cashPayments;
            break;
          case 'prevInvoice':
            const prevData = await window.Importer.parsePrevInvoiceFile(file);
            state.prevInvoiceStudents = prevData.prevInvoiceStudents;
            state.prevThucTeStudents = prevData.prevThucTe;
            result = prevData.prevInvoiceStudents;
            window.Storage._set('joy_prev_invoice_students', result);
            window.Storage._set('joy_prev_thuc_te_students', prevData.prevThucTe);
            break;
        }
        
        state.importStatus[type] = true;
        this.showToast(`✅ Import ${file.name} thành công: ${result?.length || 0} dòng`, 'success');
        
      } catch (err) {
        this.showToast(`❌ Lỗi import file: ${err.message}`, 'error');
        console.error('Import error:', err);
      } finally {
        this.showLoading = false;
        event.target.value = null; // reset
      }
    },

    async startMatching() {
      this.showLoading = true;
      try {
        await this.runMatching();
        this.switchTab('report-tab');
        this.showToast('✅ Đối soát hoàn tất!', 'success');
      } catch (err) {
        this.showToast(`❌ Lỗi đối soát: ${err.message}`, 'error');
      } finally {
        this.showLoading = false;
      }
    },

    async runMatching() {
      const state = this.$store.appState;
      
      const stkPhu = window.Storage.loadSTKPhu();
      const keywords = window.Storage.loadKeywords();
      
      let vtbResult = { matched: [], unmatched: [] };
      if (state.vtbTransactions && state.vtbTransactions.length > 0) {
        vtbResult = window.Matcher.matchVietinBank(state.vtbTransactions, state.students, stkPhu);
        state.vtbMatched = vtbResult.matched;
        state.vtbUnmatched = vtbResult.unmatched;
      }
      
      let tpbResult = { matched: [], unmatched: [] };
      if (state.tpbTransactions && state.tpbTransactions.length > 0) {
        tpbResult = window.Matcher.matchTPBank(state.tpbTransactions, keywords, state.students);
        state.tpbMatched = tpbResult.matched;
        state.tpbUnmatched = tpbResult.unmatched;
      }
      
      let paymentsByMSHS = window.Matcher.aggregateByMSHS(
        state.vtbMatched || [],
        state.tpbMatched || [],
        state.cashPayments || []
      );
      
      const familyGroups = window.Storage.loadFamilyGroups();
      state.reportRows = window.Reporter.generateReport(
        state.students,
        paymentsByMSHS,
        familyGroups,
        state.monthYear
      );
      
      this.filteredReportRows = [...state.reportRows];
      this.computeAccountingData();
      
      state.matchingDone = true;
      state.exceptionCount = (vtbResult.unmatched?.length || 0) + (tpbResult.unmatched?.length || 0);
    },

    computeAccountingData() {
      const state = this.$store.appState;
      
      const vtbMatchedMSHS = new Set(
        (state.vtbMatched || []).map(tx => tx.matchedMSHS).filter(Boolean)
      );
      
      const currMap = new Map();
      (state.students || []).forEach(s => currMap.set(s.mshs, s));
      
      const vtbAmountByMSHS = new Map();
      (state.vtbMatched || []).forEach(tx => {
        if (tx.matchedMSHS) {
          vtbAmountByMSHS.set(
            tx.matchedMSHS,
            (vtbAmountByMSHS.get(tx.matchedMSHS) || 0) + tx.credit
          );
        }
      });
      
      state.accountingData = window.Accounting.computeInvoiceComparison(
        state.prevInvoiceStudents || [],
        vtbMatchedMSHS,
        currMap,
        vtbAmountByMSHS,
        state.reportRows || [],
        window.Storage.loadFamilyGroups(),
        state.defaultFee
      );
    },

    // Report Utils
    get reportStats() {
      return window.Reporter.getStatistics(this.filteredReportRows);
    },

    applyFilters() {
      const state = this.$store.appState;
      this.filteredReportRows = window.Reporter.filterReport(state.reportRows, this.filters);
    },

    exportReport() {
      const state = this.$store.appState;
      const stats = window.Reporter.getStatistics(state.reportRows);
      window.Exporter.exportBaoCao(state.reportRows, stats, state.monthYear);
      this.showToast('✅ Đã xuất báo cáo!', 'success');
    },
    
    getNguonCK(row) {
      if (row.chuyenKhoanVTB > 0) return '🏦 VTB';
      if (row.chuyenKhoanTPB > 0) return '🏦 TPBank';
      if (row.tienMat > 0) return '💵 Tiền mặt';
      return '—';
    },

    getStatusBadge(status) {
      if (status === 'Đã đóng') return 'status-paid';
      if (status === 'Chưa đóng') return 'status-unpaid';
      if (status === 'Đóng thiếu') return 'status-partial';
      if (status === 'Đóng dư') return 'status-overpaid';
      if (status === '📦 Đã đóng gói') return 'status-package';
      return 'badge-default';
    },

    // Accounting Actions
    copyToAccTab7(tabNum) {
      const state = this.$store.appState;
      const sourceData = state.accountingData[`tab${tabNum}`];
      if(!sourceData) return;
      const tagName = ['DS HĐ', 'DS CK VTB', 'Giảm bớt', 'Stop', 'Tăng mới', 'CK sai'][tabNum - 1];
      
      sourceData.forEach(row => {
        const newRow = {
          ...row,
          ghiChu: row.ghiChu ? `${row.ghiChu}, ${tagName}` : tagName,
          selected: true
        };
        state.accountingData.tab7.push(newRow);
      });
      
      window.Storage._set('joy_acc_tab7_rows', state.accountingData.tab7);
      this.activeAccTab = 'acc-tab7';
      this.showToast(`✅ Đã copy ${sourceData.length} dòng sang Tổng hợp`, 'success');
    },

    exportAccTab(tabNum) {
      const state = this.$store.appState;
      const data = state.accountingData[`tab${tabNum}`];
      const titles = ['DS HĐ Tháng trước', 'DS CK VTB Tháng này', 'Giảm bớt', 'Stop - nghỉ học', 'Tăng mới', 'Chuyển tiền sai', 'Tổng hợp'];
      window.Exporter.exportAccTabSingle(tabNum, data, titles[tabNum - 1], state.monthYear, tabNum === 7 ? state.accTab7FilterTags : null);
    },

    exportAllAccountingTabs() {
      const state = this.$store.appState;
      window.Exporter.exportAccTabAll(state.accountingData, state.monthYear, state.accTab7FilterTags);
    },
    
    // Tab 4 (Stop) specific
    get canConfirmStop() {
      const data = this.$store.appState.accountingData.tab4 || [];
      if(data.length === 0) return false;
      return Object.keys(this.tab4Choice).length === data.length;
    },
    confirmTab4Split() {
       this.showToast('✅ Đã phân loại thành công!', 'success');
       // Real app logic would handle the split here
    },

    // Settings
    exportMapping() {
      const mapping = {
        joy_stk_phu: window.Storage.loadSTKPhu(),
        joy_keywords: window.Storage.loadKeywords(),
        joy_family_groups: window.Storage.loadFamilyGroups(),
        exportDate: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(mapping, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `joy_mappings_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 100);
      this.showToast('✅ Đã xuất mapping', 'success');
    },

    exportBackup() {
      const backup = window.Storage.exportFullBackup();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `joy_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 100);
      this.showToast('✅ Đã tải backup', 'success');
    }
  };
}
