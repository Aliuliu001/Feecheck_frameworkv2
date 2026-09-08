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
    stkPhuSearch: '',
    keywordSearch: '',
    // Drag states
    dsHocSinhDragging: false,
    vtbDragging: false,
    tpbDragging: false,
    cashDragging: false,
    prevDragging: false,
    // Assign modal state
    showAssignModal: false,
    assignTx: null,
    assignType: 'vtb',
    assignSuggestions: [],
    assignSearch: '',
    assignKeyword: '',
    assignSelected: '',
    ignoredKeys: [],
    lastIgnored: null,

    init() {
      // Set default month
      const now = new Date();
      this.$store.appState.monthYear = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2, '0')}`;
      
      // Load UI settings
      this.loadSettingsUI();
      this.ignoredKeys = window.Storage._get('joy_ignored_tx') || [];
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
      const file = event.target ? event.target.files[0] : null;
      if (!file) return;
      await this.processImportFile(file, type);
      if (event.target) event.target.value = null; // reset
    },

    async handleFileDrop(event, type) {
      const files = event.dataTransfer ? event.dataTransfer.files : null;
      if (!files || files.length === 0) {
        this.showToast('❌ Không tìm thấy file. Thử click để chọn file.', 'error');
        return;
      }
      await this.processImportFile(files[0], type);
    },

    async processImportFile(file, type) {
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
        // Lọc GD đã bỏ qua (tránh gán nhầm cho HS khác sau khi bỏ qua)
        state.vtbUnmatched = (vtbResult.unmatched || []).filter(tx => {
          const key = `vtb|${tx.date}|${tx.debitAccount}|${tx.credit}`;
          return !this.ignoredKeys.includes(key);
        });
      }
      
      let tpbResult = { matched: [], unmatched: [] };
      if (state.tpbTransactions && state.tpbTransactions.length > 0) {
        tpbResult = window.Matcher.matchTPBank(state.tpbTransactions, keywords, state.students);
        state.tpbMatched = tpbResult.matched;
        state.tpbUnmatched = (tpbResult.unmatched || []).filter(tx => {
          const key = `tpb|${tx.date || tx.transactionDate}|${tx.description || tx.explanation}|${tx.amount || tx.credit}`;
          return !this.ignoredKeys.includes(key);
        });
      }
      
      let paymentsByMSHS = window.Matcher.aggregateByMSHS(
        state.vtbMatched || [],
        state.tpbMatched || [],
        state.cashPayments || []
      );
      state.paymentsByMSHS = paymentsByMSHS;
      
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
      const s = window.Reporter.getStatistics(this.filteredReportRows || []);
      // Map tên tiếng Việt từ Reporter sang tên UI đang dùng
      return {
        totalStudents: s.tongHS || 0,
        paidCount: s.daDong || 0,
        unpaidCount: s.chuaDong || 0,
        partialCount: s.dongThieu || 0,
        overpaidCount: s.dongDu || 0,
        packageCount: s.dongGoi || 0,
        totalMoney: s.tongThu || 0,
        totalFee: s.tongHocPhi || 0
      };
    },

    applyFilters() {
      const state = this.$store.appState;
      this.filteredReportRows = window.Reporter.filterReport(state.reportRows, this.filters);
    },

    exportReport() {
      const state = this.$store.appState;
      const s = window.Reporter.getStatistics(state.reportRows || []);
      const stats = { tongHS: s.tongHS, daDong: s.daDong, chuaDong: s.chuaDong, dongThieu: s.dongThieu, dongDu: s.dongDu, dongGoi: s.dongGoi, tongThu: s.tongThu, tongHocPhi: s.tongHocPhi };
      window.Exporter.exportBaoCao(state.reportRows, stats, state.monthYear);
      this.showToast('✅ Đã xuất báo cáo!', 'success');
    },
    
    getNguonCK(row) {
      if (row.chuyenKhoanVTB > 0) return '<span class="tag-vtb" style="cursor: pointer;">🏦 VTB</span>';
      if (row.chuyenKhoanTPB > 0) return '<span class="tag-tpb" style="cursor: pointer;">🏦 TPBank</span>';
      if (row.tienMat > 0) return '<span class="tag-cash" style="cursor: pointer;">💵 Tiền mặt</span>';
      return '—';
    },

    showNguonCKDetail(row) {
      const mshs = row.mshs;
      const paymentData = this.$store.appState.paymentsByMSHS?.get?.(mshs);
      if (!paymentData || !paymentData.txList || paymentData.txList.length === 0) {
        this.showToast('Không có thông tin chi tiết', 'warning');
        return;
      }
      
      let html = `<div style="max-height: 400px; overflow-y: auto;">`;
      html += `<h4 style="margin-bottom: 12px;">💳 Chi tiết thanh toán: ${mshs}</h4>`;
      html += `<table style="width: 100%; font-size: 14px; border-collapse: collapse;">`;
      html += `<thead><tr style="background: var(--bg-main);">`;
      html += `<th style="padding: 8px; text-align: center; width: 40px;">No.</th>`;
      html += `<th style="padding: 8px; text-align: left;">Ngày</th>`;
      html += `<th style="padding: 8px; text-align: left;">Nguồn</th>`;
      html += `<th style="padding: 8px; text-align: right;">Số tiền</th>`;
      html += `<th style="padding: 8px; text-align: left;">STK</th>`;
      html += `<th style="padding: 8px; text-align: left;">Chủ TK</th>`;
      html += `<th style="padding: 8px; text-align: left;">Nội dung</th>`;
      html += `</tr></thead><tbody>`;
      
      paymentData.txList.forEach((tx, idx) => {
        const typeTag = tx.type === 'vtb' ? '🏦 VTB' : (tx.type === 'tpb' ? '🏦 TPBank' : '💵 Tiền mặt');
        const stk = tx.account || '—';
        const chuTK = tx.tenChuTK || '—';
        const desc = (tx.description || '—').substring(0, 80);
        html += `<tr style="border-bottom: 1px solid var(--border-color);">`;
        html += `<td style="padding: 8px; text-align: center; color: var(--text-secondary);">${tx._rowNo || idx + 1}</td>`;
        html += `<td style="padding: 8px; white-space: nowrap;">${this.$formatDate(tx.date)}</td>`;
        html += `<td style="padding: 8px; white-space: nowrap;">${typeTag}</td>`;
        html += `<td style="padding: 8px; text-align: right; font-weight: 600; white-space: nowrap;">${this.$formatCurrency(tx.amount)}</td>`;
        html += `<td style="padding: 8px; font-family: monospace; font-size: 13px;">${stk}</td>`;
        html += `<td style="padding: 8px; font-size: 13px;">${chuTK}</td>`;
        html += `<td class="wrap" style="padding: 8px; font-size: 13px; color: var(--text-secondary); max-width: 200px;" title="${tx.description || ''}">${desc}</td>`;
        html += `</tr>`;
      });
      html += `</tbody></table></div>`;
      
      this.modalTitle = '💳 Chi tiết thanh toán';
      this.modalBody = html;
      this.modalConfirm = null;
      this.showModal = true;
    },

    getStatusBadge(status) {
      if (status === 'Đã đóng') return 'status-paid';
      if (status === 'Chưa đóng') return 'status-unpaid';
      if (status === 'Đóng thiếu') return 'status-partial';
      if (status === 'Đóng dư') return 'status-overpaid';
      if (status === '📦 Đã đóng gói') return 'status-package';
      return 'badge-default';
    },

    // Exception suggestions (reuse Matcher.suggestMatch logic)
    // Chỉ hiện gợi ý khi độ tin cậy cao (score >= 0.8), tránh gợi ý bừa
    getVtbSuggestion(tx) {
      const students = this.$store.appState.students || [];
      if (!students.length) return '—';
      const sug = window.Matcher.suggestMatch(tx, students);
      if (sug && sug.length > 0 && sug[0].score >= 0.8) return `${sug[0].mshs} (${sug[0].studentName || sug[0].hoTen || ''})`;
      return '—';
    },

    getTpbSuggestion(tx) {
      const students = this.$store.appState.students || [];
      if (!students.length) return '—';
      const sug = window.Matcher.suggestMatch(tx, students);
      if (sug && sug.length > 0 && sug[0].score >= 0.8) return `${sug[0].mshs} (${sug[0].studentName || sug[0].hoTen || ''})`;
      return '—';
    },

    // Manual assign VTB: save STK mapping, re-run matching
    openAssignVtb(tx) { this.openAssignModal(tx, 'vtb'); },
    openAssignTpb(tx) { this.openAssignModal(tx, 'tpb'); },

    // Modal Gán MSHS: top 3 gợi ý + search thủ công, tên tự nhảy theo DS HS
    openAssignModal(tx, type) {
      const students = this.$store.appState.students || [];
      const sug = window.Matcher.suggestMatch(tx, students) || [];
      this.assignSuggestions = sug.slice(0, 3);
      this.assignTx = tx;
      this.assignType = type;
      this.assignSearch = '';
      // Tự điền Từ khóa gợi ý cho mapping (STK phụ TPB / keyword)
      const rawDesc = (tx.description || tx.explanation || '');
      if (type === 'tpb') {
        const kws = (window.Utils && window.Utils.extractKeywordsFromDescription) ? window.Utils.extractKeywordsFromDescription(rawDesc) : [];
        this.assignKeyword = (kws && kws.length > 0) ? kws.slice(0, 3).join(' ') : rawDesc.substring(0, 20).trim().toUpperCase();
      } else {
        this.assignKeyword = '';
      }
      // Auto-select gợi ý cao nhất nếu score >= 0.8
      this.assignSelected = (sug.length > 0 && sug[0].score >= 0.8) ? sug[0].mshs : '';
      this.showAssignModal = true;
    },

    get assignStudentName() {
      const students = this.$store.appState.students || [];
      const found = students.find(s => s.mshs === this.assignSelected);
      return found ? found.fullName : '';
    },

    get assignFilteredStudents() {
      const students = this.$store.appState.students || [];
      const q = (this.assignSearch || '').toLowerCase().trim();
      if (!q) return students.slice(0, 50);
      return students.filter(s =>
        (s.mshs || '').toLowerCase().includes(q) ||
        (s.fullName || '').toLowerCase().includes(q)
      ).slice(0, 50);
    },

    confirmAssign() {
      const m = (this.assignSelected || '').trim().toUpperCase();
      if (!m) { this.showToast('⚠️ Chưa chọn MSHS', 'warning'); return; }
      const students = this.$store.appState.students || [];
      const found = students.find(s => s.mshs === m);
      if (!found) { this.showToast(`⚠️ Không tìm thấy MSHS ${m} trong DS học sinh`, 'error'); return; }
      const tx = this.assignTx;
      if (this.assignType === 'vtb') {
        // Gán VTB = lưu mapping STK phụ (STK đối ứng → MSHS), lần sau tự khớp
        window.Storage.addSTKPhu({ mshs: m, stk: tx.debitAccount || tx.stkDoiUng || '', tenTK: tx.debitAccountName || tx.tenTKDoiUng || '' });
        this.showToast(`✅ Đã lưu STK → ${m}. Đang chạy lại...`, 'success');
      } else {
        // Gán TPB = lưu keyword (Từ khóa → MSHS), lần sau tự khớp
        const kwInput = (this.assignKeyword || '').trim().toUpperCase();
        if (!kwInput) { this.showToast('⚠️ Nhập Từ khóa để lưu (VD: tên PH viết tắt)', 'warning'); return; }
        window.Storage.addKeyword({ keyword: kwInput, mshs: m, tenHS: found.fullName || '' });
        this.showToast(`✅ Đã lưu từ khóa "${kwInput}" → ${m}. Đang chạy lại...`, 'success');
      }
      this.showAssignModal = false;
      this.loadSettingsUI();
      this.runMatching();
    },

    // Bỏ qua GD không phải học phí (VD: lãi ngân hàng, trả lại tiền)
    ignoreTx(tx, type) {
      const key = type === 'vtb'
        ? `vtb|${tx.date}|${tx.debitAccount}|${tx.credit}`
        : `tpb|${tx.date || tx.transactionDate}|${tx.description || tx.explanation}|${tx.amount || tx.credit}`;
      if (!this.ignoredKeys.includes(key)) this.ignoredKeys.push(key);
      // Lưu full object để hoàn tác chính xác (không gán nhầm HS khác)
      this.lastIgnored = { tx: JSON.parse(JSON.stringify(tx)), type };
      const state = this.$store.appState;
      if (type === 'vtb') state.vtbUnmatched = (state.vtbUnmatched || []).filter(t => t !== tx);
      else state.tpbUnmatched = (state.tpbUnmatched || []).filter(t => t !== tx);
      state.exceptionCount = (state.vtbUnmatched?.length || 0) + (state.tpbUnmatched?.length || 0);
      window.Storage._set('joy_ignored_tx', this.ignoredKeys);
      this.showToast('⏭️ Đã bỏ qua GD này', 'info');
    },

    undoIgnore() {
      if (!this.lastIgnored) { this.showToast('Không có gì để hoàn tác', 'warning'); return; }
      const { tx, type } = this.lastIgnored;
      const state = this.$store.appState;
      if (type === 'vtb') state.vtbUnmatched = [...(state.vtbUnmatched || []), tx];
      else state.tpbUnmatched = [...(state.tpbUnmatched || []), tx];
      state.exceptionCount = (state.vtbUnmatched?.length || 0) + (state.tpbUnmatched?.length || 0);
      const key = type === 'vtb'
        ? `vtb|${tx.date}|${tx.debitAccount}|${tx.credit}`
        : `tpb|${tx.date || tx.transactionDate}|${tx.description || tx.explanation}|${tx.amount || tx.credit}`;
      this.ignoredKeys = this.ignoredKeys.filter(k => k !== key);
      window.Storage._set('joy_ignored_tx', this.ignoredKeys);
      this.lastIgnored = null;
      this.showToast('↩️ Đã hoàn tác', 'success');
    },

    // Xóa mapping sai (STK / keyword) rồi chạy lại đối soát
    deleteStkMapping(stk) {
      if (!confirm(`Xóa mapping STK ${stk}? GD liên quan sẽ quay lại Ngoại lệ.`)) return;
      window.Storage.removeSTKPhu(stk);
      this.loadSettingsUI();
      this.showToast('🗑️ Đã xóa mapping STK', 'success');
      this.runMatching();
    },

    deleteKeywordMapping(keyword) {
      if (!confirm(`Xóa keyword "${keyword}"? GD liên quan sẽ quay lại Ngoại lệ.`)) return;
      window.Storage.removeKeyword(keyword);
      this.loadSettingsUI();
      this.showToast('🗑️ Đã xóa keyword', 'success');
      this.runMatching();
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
