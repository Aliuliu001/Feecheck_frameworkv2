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
      try {
        if (window.Utils && window.Utils.formatDate) return window.Utils.formatDate(dateStr);
      } catch (e) { /* fallback */ }
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
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
    reportClassOptions: [],
    reportTeacherOptions: [],
    suspendedData: [],
    adjustmentData: [],
    filteredReportRows: [],
    
    // Accounting UI
    activeAccTab: 'acc-tab1',
    tab4Choice: {}, // Track Nghỉ học / Vẫn học
    
    // Settings State
    stkPhuData: [],
    keywordData: [],
    familyGroups: [],
    packageData: [],
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
      const stk = window.Storage.loadSTKPhu() || [];
      const kw = window.Storage.loadKeywords() || [];
      // Mới gán nhất lên đầu → dễ phát hiện gán nhầm mấy ngày gần đây
      const byDate = (a, b) => new Date(b.addedDate || 0) - new Date(a.addedDate || 0);
      this.stkPhuData = [...stk].sort(byDate);
      this.keywordData = [...kw].sort(byDate);
      this.familyGroups = window.Storage.loadFamilyGroups() || [];
      this.packageData = window.Storage.loadPackages() || [];
      this.adjustmentData = window.Storage.loadFeeAdjustments ? (window.Storage.loadFeeAdjustments() || []) : [];
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
      this.populateReportFilters();
      this.loadSuspendedUI();
      this.computeAccountingData();

      state.matchingDone = true;
      state.exceptionCount = (state.vtbUnmatched?.length || 0) + (state.tpbUnmatched?.length || 0);

      // Nhắc gói sắp hết / vừa hết hạn (VD: gói 7,8,9 → đối soát tháng 9 báo để tháng 10 thu HP)
      try {
        const exp = window.Storage.getExpiringPackages ? window.Storage.getExpiringPackages(state.monthYear, state.students) : [];
        state.packageAlerts = exp;
        if (exp && exp.length) {
          const lines = exp.map(e => `• ${(e.pkg.packageName || e.pkg.groupName || 'Gói')} (${(e.pkg.members || []).join(', ')}) ${e.msg}`).join('\n');
          setTimeout(() => this.showToast(`⏰ Gói hết hạn:\n${lines}`, 'warning'), 600);
        }
      } catch (e) { console.error('package alert error:', e); }
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
      // Reporter.filterReport đọc field trangThai — map từ filters.status của UI
      this.filteredReportRows = window.Reporter.filterReport(state.reportRows, {
        trangThai: this.filters.status,
        className: this.filters.className,
        teacher: this.filters.teacher,
        searchText: this.filters.searchText
      });
    },

    // Nạp danh sách Lớp + GV vào 2 ô lọc (bản cũ có, bản Alpine làm rơi)
    populateReportFilters() {
      const state = this.$store.appState;
      this.reportClassOptions = [...new Set((state.students || []).map(s => s.className).filter(Boolean))].sort();
      this.reportTeacherOptions = [...new Set((state.students || []).map(s => s.teacher).filter(Boolean))].sort();
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

    // Thêm nhóm Gia đình (khôi phục từ bản cũ — bản Alpine viết lại làm rơi mất)
    addFamilyGroupUI() {
      const name = prompt('Tên nhóm (gợi nhớ, VD: Nhà Cô Lan):');
      if (name === null) return;
      const membersRaw = prompt('Danh sách MSHS các con, cách nhau dấu phẩy (VD: HV011, HV012):');
      if (!membersRaw) { this.showToast('⚠️ Chưa nhập MSHS', 'warning'); return; }
      const members = membersRaw.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
      if (members.length < 2) { this.showToast('⚠️ Nhóm gia đình cần ít nhất 2 MSHS', 'error'); return; }
      const tenPH = prompt('Tên PH / Chủ tài khoản (bỏ trống nếu không biết):') || '';
      const stk = prompt('STK đại diện (bỏ trống nếu CK qua TPBank/Zalo):') || '';
      window.Storage.addFamilyGroup({ groupName: (name || '').trim() || ('Nhóm ' + members.join(',')), stkDaiDien: stk.trim() || tenPH.trim() || members[0], tenPH: tenPH.trim(), members });
      this.loadSettingsUI();
      this.runMatching();
      this.showToast('✅ Đã thêm nhóm gia đình', 'success');
    },

    deleteFamilyGroup(groupId) {
      if (!confirm('Xóa nhóm gia đình này?')) return;
      window.Storage.removeFamilyGroup(groupId);
      this.loadSettingsUI();
      this.runMatching();
      this.showToast('🗑️ Đã xóa nhóm gia đình', 'success');
    },

    // Thêm gói đóng trước nhiều tháng (khôi phục từ bản cũ)
    addPackageUI() {
      const state = this.$store.appState;
      const defMonth = state.monthYear || new Date().toISOString().slice(0, 7);
      const packageName = prompt('Tên gói (gợi nhớ, VD: Gói 6 tháng Nhà Cô Lan):');
      if (!packageName) return;
      const membersRaw = prompt('Danh sách MSHS, cách nhau dấu phẩy (VD: HV011, HV012):');
      if (!membersRaw) { this.showToast('⚠️ Chưa nhập MSHS', 'warning'); return; }
      const members = membersRaw.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
      if (!members.length) { this.showToast('⚠️ Chưa nhập MSHS', 'warning'); return; }
      const months = parseInt(prompt('Số tháng đóng trước (6 hoặc 12):', '6') || '6', 10) || 6;
      const startMonth = (prompt(`Tháng bắt đầu (YYYY-MM):`, defMonth) || defMonth).trim();
      if (!/^\d{4}-\d{2}$/.test(startMonth)) { this.showToast('⚠️ Tháng phải dạng YYYY-MM (VD: 2026-08)', 'error'); return; }
      const discountPercent = parseFloat(prompt(months >= 12 ? 'Giảm % cho gói 12 tháng (VD: 12):' : 'Giảm % cho gói 6 tháng (VD: 6):', months >= 12 ? '12' : '6') || '0') || 0;
      const [sy, sm] = startMonth.split('-').map(Number);
      const endD = new Date(sy, sm - 1 + months);
      const endMonth = `${endD.getFullYear()}-${String(endD.getMonth() + 1).padStart(2, '0')}`;
      window.Storage.addPackage({ packageName: packageName.trim(), members, months, startMonth, endMonth, discountPercent });
      this.loadSettingsUI();
      this.runMatching();
      this.showToast(`✅ Đã thêm gói "${packageName.trim()}" (${months} tháng, giảm ${discountPercent}%)`, 'success');
    },

    deletePackage(packageId) {
      if (!confirm('Xóa gói này? HS trong gói sẽ đối soát như bình thường.')) return;
      window.Storage.removePackage(packageId);
      this.loadSettingsUI();
      this.runMatching();
      this.showToast('🗑️ Đã xóa gói', 'success');
    },

    // Thêm điều chỉnh học phí (khôi phục từ bản cũ — VD: giới thiệu bạn mới -400k)
    addAdjustmentUI() {
      const state = this.$store.appState;
      const mshs = prompt('MSHS của HS được điều chỉnh:');
      if (!mshs) return;
      const student = (state.students || []).find(s => s.mshs === mshs.trim().toUpperCase());
      if (!student) { this.showToast(`⚠️ Không tìm thấy MSHS ${mshs} trong DS học sinh`, 'error'); return; }
      const type = prompt('Loại điều chỉnh (gõ đúng 1 trong 4):\n1. Giới thiệu bạn mới\n2. Tạm ngưng lớp\n3. Hỗ trợ hoàn cảnh\n4. Ưu đãi khác', 'Giới thiệu bạn mới') || 'Ưu đãi khác';
      const amount = parseInt(prompt('Số tiền (giảm = số âm, VD: -400000):', '-400000') || '0', 10) || 0;
      if (!amount) { this.showToast('⚠️ Số tiền phải khác 0', 'error'); return; }
      const adjMonth = (prompt('Tháng áp dụng (YYYY-MM):', state.monthYear) || state.monthYear).trim();
      if (!/^\d{4}-\d{2}$/.test(adjMonth)) { this.showToast('⚠️ Tháng phải dạng YYYY-MM', 'error'); return; }
      const note = prompt('Ghi chú (bỏ trống nếu không có):') || '';
      window.Storage.addFeeAdjustment({ mshs: student.mshs, studentName: student.fullName || '', type: type.trim(), amount, monthYear: adjMonth, note: note.trim() });
      this.loadSettingsUI();
      this.runMatching();
      this.showToast(`✅ Đã thêm điều chỉnh ${type.trim()} cho ${student.mshs}`, 'success');
    },

    deleteAdjustment(adjId) {
      if (!confirm('Xóa điều chỉnh này?')) return;
      window.Storage.removeFeeAdjustment(adjId);
      this.loadSettingsUI();
      this.runMatching();
      this.showToast('🗑️ Đã xóa điều chỉnh', 'success');
    },

    // HS tạm ngưng tháng này: nạp bảng, thêm thủ công, thêm từ DS chưa đóng, bỏ ngưng
    loadSuspendedUI() {
      const state = this.$store.appState;
      this.suspendedData = window.Storage.getSuspendedForMonth ? (window.Storage.getSuspendedForMonth(state.monthYear) || []) : [];
    },

    suspendStudentUI() {
      const state = this.$store.appState;
      const mshs = prompt('MSHS của HS cần tạm ngưng:');
      if (!mshs) return;
      const student = (state.students || []).find(s => s.mshs === mshs.trim().toUpperCase());
      if (!student) { this.showToast(`⚠️ Không tìm thấy MSHS ${mshs} trong DS học sinh`, 'error'); return; }
      const classes = (student.className || '').split(',').map(c => c.trim()).filter(Boolean);
      const className = classes.length > 1 ? (prompt(`HS học ${classes.length} lớp. Tạm ngưng lớp nào? (${classes.join(' / ')})`, classes[0]) || '').trim() : (classes[0] || '');
      if (!className) { this.showToast('⚠️ Chưa chọn lớp', 'warning'); return; }
      const note = prompt('Lý do (bỏ trống nếu không có):') || '';
      const result = window.Storage.addSuspended({ mshs: student.mshs, studentName: student.fullName || '', className, monthYear: state.monthYear, note: note.trim() });
      if (result && result.error) { this.showToast(result.error, 'error'); return; }
      this.loadSuspendedUI();
      this.runMatching();
      this.showToast(`⏸️ Đã tạm ngưng ${student.mshs} - lớp ${className}`, 'success');
    },

    suspendUnpaidStudents() {
      const state = this.$store.appState;
      const suspended = window.Storage.getSuspendedForMonth ? (window.Storage.getSuspendedForMonth(state.monthYear) || []) : [];
      const susSet = new Set(suspended.map(s => `${s.mshs}_${s.className}`));
      const unpaid = (state.reportRows || []).filter(r => {
        if (r.trangThai !== 'Chưa đóng') return false;
        const classes = (r.className || '').split(',').map(c => c.trim()).filter(Boolean);
        return classes.some(c => !susSet.has(`${r.mshs}_${c}`));
      });
      if (!unpaid.length) { this.showToast('Không có HS "Chưa đóng" nào cần tạm ngưng', 'info'); return; }
      const list = unpaid.map(r => `${r.mshs} (${r.fullName})`).join('\n');
      if (!confirm(`Tạm ngưng ${unpaid.length} HS chưa đóng tháng ${state.monthYear}?\n\n${list.slice(0, 800)}${list.length > 800 ? '\n...' : ''}`)) return;
      let count = 0;
      unpaid.forEach(r => {
        const classes = (r.className || '').split(',').map(c => c.trim()).filter(Boolean);
        classes.forEach(c => {
          if (susSet.has(`${r.mshs}_${c}`)) return;
          const res = window.Storage.addSuspended({ mshs: r.mshs, studentName: r.fullName || '', className: c, monthYear: state.monthYear, note: `Chưa đóng HP — tháng ${state.monthYear}` });
          if (res && !res.error) { count++; susSet.add(`${r.mshs}_${c}`); }
        });
      });
      this.loadSuspendedUI();
      this.runMatching();
      this.showToast(`⏸️ Đã tạm ngưng ${count} lượt lớp`, 'success');
    },

    unsuspendStudent(susId) {
      window.Storage.removeSuspended(susId);
      this.loadSuspendedUI();
      this.runMatching();
      this.showToast('▶️ Đã bỏ tạm ngưng', 'success');
    },

    quickSuspend(mshs, fullName) {
      const state = this.$store.appState;
      const student = (state.students || []).find(s => s.mshs === mshs);
      const classes = ((student && student.className) || '').split(',').map(c => c.trim()).filter(Boolean);
      const suspended = window.Storage.getSuspendedForMonth ? (window.Storage.getSuspendedForMonth(state.monthYear) || []) : [];
      const susSet = new Set(suspended.filter(s => s.mshs === mshs).map(s => s.className));
      const available = classes.filter(c => !susSet.has(c));
      if (!available.length) { this.showToast(`${fullName} đã tạm ngưng tất cả lớp tháng này`, 'warning'); return; }
      const className = available.length > 1 ? (prompt(`Tạm ngưng lớp nào của ${fullName}? (${available.join(' / ')})`, available[0]) || '').trim() : available[0];
      if (!className) return;
      const note = prompt('Lý do (bỏ trống nếu không có):') || '';
      const result = window.Storage.addSuspended({ mshs, studentName: fullName || '', className, monthYear: state.monthYear, note: note.trim() });
      if (result && result.error) { this.showToast(result.error, 'error'); return; }
      this.loadSuspendedUI();
      this.runMatching();
      this.showToast(`⏸️ Đã tạm ngưng ${fullName} - lớp ${className}`, 'success');
    },

    addFamilyGroupForStudent(mshs, fullName) {
      const membersRaw = prompt(`Thêm nhóm gia đình cho ${fullName} (${mshs}).\nNhập MSHS các con còn lại, cách nhau dấu phẩy:`);
      if (!membersRaw) return;
      const members = [mshs.trim().toUpperCase(), ...membersRaw.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)];
      const uniq = [...new Set(members)];
      if (uniq.length < 2) { this.showToast('⚠️ Nhóm gia đình cần ít nhất 2 MSHS', 'error'); return; }
      const groupName = prompt('Tên nhóm (gợi nhớ, VD: Nhà Cô Lan):', `Nhóm ${uniq.join(', ')}`) || '';
      window.Storage.addFamilyGroup({ groupName: groupName.trim() || ('Nhóm ' + uniq.join(',')), stkDaiDien: uniq[0], tenPH: '', members: uniq });
      this.loadSettingsUI();
      this.runMatching();
      this.showToast('✅ Đã thêm nhóm gia đình', 'success');
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
      const state = this.$store.appState;
      const nghiRows = (state.accountingData.tab4 || []).filter(r => this.tab4Choice[r.mshs] === 'stop' || this.tab4Choice[r.mshs] === 'nghi');
      const vanhocRows = (state.accountingData.tab4 || []).filter(r => this.tab4Choice[r.mshs] === 'continue' || this.tab4Choice[r.mshs] === 'vanhoc');
      // HS chọn "Vẫn học" → chuyển sang Tab 3 Giảm bớt để nhắc nợ
      if (vanhocRows.length) {
        const existing = new Set((state.accountingData.tab3 || []).map(r => r.mshs));
        vanhocRows.forEach(r => { if (!existing.has(r.mshs)) { state.accountingData.tab3.push({ ...r }); existing.add(r.mshs); } });
        state.accountingData.tab3.sort((a, b) => String(a.mshs).localeCompare(String(b.mshs)));
      }
      // Tab 4 chỉ giữ HS "Nghỉ"
      const moved = new Set(vanhocRows.map(r => r.mshs));
      state.accountingData.tab4 = (state.accountingData.tab4 || []).filter(r => !moved.has(r.mshs));
      vanhocRows.forEach(r => { delete this.tab4Choice[r.mshs]; });
      this.showToast(`✅ Đã phân loại: ${nghiRows.length} nghỉ, ${vanhocRows.length} chuyển sang Giảm bớt`, 'success');
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
      // Backup TẤT CẢ dữ liệu quan trọng — quét sạch mọi key joy_* trong localStorage
      // → sau này thêm key mới cũng tự vào backup, không bao giờ sót
      const backup = {
        version: 2,
        exportDate: new Date().toISOString(),
        keys: {}
      };
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('joy_')) {
            try { backup.keys[k] = JSON.parse(localStorage.getItem(k)); }
            catch (e) { backup.keys[k] = localStorage.getItem(k); }
          }
        }
      } catch (e) { console.error('Backup scan error:', e); }
      // Giữ field phẳng cho file backup cũ vẫn đọc được
      const K = backup.keys;
      backup.joy_stk_phu = K.joy_stk_phu || [];
      backup.joy_keywords = K.joy_keywords || [];
      backup.joy_family_groups = K.joy_family_groups || [];
      backup.joy_ignored_tx = K.joy_ignored_tx || [];
      backup.joy_packages = K.joy_packages || [];
      backup.joy_suspended = K.joy_suspended || [];
      backup.joy_fee_adjustments = K.joy_fee_adjustments || [];
      backup.joy_referrals = K.joy_referrals || [];
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `joy_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 100);
      const nKeys = Object.keys(backup.keys).length;
      this.showToast(`✅ Đã tải backup (${nKeys} nhóm dữ liệu: mapping + Bỏ qua + gia đình + gói...)`, 'success');
    },

    exportBackupExcel() {
      // Backup đọc được bằng Excel: 1 file nhiều sheet (STK Phụ / Từ khóa / Gia đình / Bỏ qua / Gói...)
      // → để mở coi, in, lưu Drive. Không khôi phục ngược (muốn khôi phục dùng file JSON).
      try {
        const wb = XLSX.utils.book_new();
        const fdate = (v) => { try { return window.Utils ? window.Utils.formatDate(v) : v; } catch (e) { return v; } };
        // Sheet 1: STK Phụ
        const stk = window.Storage.loadSTKPhu() || [];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(stk.map(s => ({
          'MSHS': s.mshs || '', 'STK': s.stk || '', 'Tên TK': s.tenTK || '', 'Ngày gán': fdate(s.addedDate)
        }))), 'STK Phu');
        // Sheet 2: Từ khóa TPBank
        const kw = window.Storage.loadKeywords() || [];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(kw.map(s => ({
          'Từ khóa': s.keyword || '', 'MSHS': s.mshs || '', 'Tên HS': s.tenHS || s.studentName || '', 'Ngày gán': fdate(s.addedDate)
        }))), 'Tu khoa TPB');
        // Sheet 3: Nhóm gia đình
        const fam = window.Storage.loadFamilyGroups() || [];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(fam.map(g => ({
          'Tên nhóm': g.name || g.groupName || '', 'MSHS thành viên': (g.members || []).join(', '),
          'STK đại diện': g.stk || g.stkDaiDien || '', 'PH đại diện': g.parentName || g.tenPH || '', 'Ngày tạo': fdate(g.addedDate)
        }))), 'Nhom Gia dinh');
        // Sheet 4: Bỏ qua
        const ig = window.Storage._get('joy_ignored_tx', []) || [];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ig.map(k => ({ 'Mã GD đã bỏ qua': k }))), 'Bo qua');
        // Sheet 5: Gói (đóng trước nhiều tháng)
        const pkg = window.Storage._get('joy_packages', []) || window.Storage.loadPackages?.() || [];
        if (pkg.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(pkg), 'Dong goi');
        // Các sheet còn lại: vét sạch mọi key joy_* khác chưa lên sheet
        try {
          const done = new Set(['joy_stk_phu', 'joy_keywords', 'joy_family_groups', 'joy_ignored_tx', 'joy_packages']);
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith('joy_') && !done.has(k)) {
              let v = null;
              try { v = JSON.parse(localStorage.getItem(k)); } catch (e) { v = localStorage.getItem(k); }
              const rows = Array.isArray(v) ? v : [{ 'Giá trị': typeof v === 'object' ? JSON.stringify(v) : String(v ?? '') }];
              if (rows.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), k.replace('joy_', '').slice(0, 28) || 'Khac');
            }
          }
        } catch (e) { console.error('Excel backup extra keys:', e); }
        XLSX.writeFile(wb, `joy_backup_${new Date().toISOString().split('T')[0]}.xlsx`);
        this.showToast('✅ Đã tải backup Excel (để coi/in/lưu trữ)', 'success');
      } catch (err) { this.showToast('❌ Lỗi xuất Excel: ' + err.message, 'error'); }
    },

    importBackup(event) {
      const file = event.target ? event.target.files[0] : null;
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          // File mới (v2): khôi phục TẤT CẢ key joy_* đã quét lúc backup → không sót loại nào
          if (data.keys && typeof data.keys === 'object') {
            Object.keys(data.keys).forEach(k => {
              if (k.startsWith('joy_')) window.Storage._set(k, data.keys[k]);
            });
            this.ignoredKeys = window.Storage._get('joy_ignored_tx', []);
            this.loadSettingsUI();
            this.runMatching();
            const nKeys = Object.keys(data.keys).length;
            this.showToast(`✅ Đã khôi phục backup (${nKeys} nhóm dữ liệu, giữ nguyên dữ liệu tháng này nếu trùng)`, 'success');
            return;
          }
          // File cũ (v1): GỘP (merge) thay vì ghi đè → không mất dữ liệu mới nhập tháng này
          let c1 = 0, c2 = 0, c3 = 0;
          const flat = data.joy_mappings || data.mappings || null;
          const stkList = data.joy_stk_phu || (flat && flat.joy_stk_phu) || [];
          const kwList = data.joy_keywords || (flat && flat.joy_keywords) || [];
          const famList = data.joy_family_groups || (flat && flat.joy_family_groups) || [];
          if (stkList.length) c1 = window.Storage.mergeSTKPhu(stkList);
          if (kwList.length) c2 = window.Storage.mergeKeywords(kwList);
          if (famList.length) c3 = window.Storage.mergeFamilyGroups(famList);
          // Bỏ qua: gộp 2 danh sách, loại trùng
          const oldIgnored = window.Storage._get('joy_ignored_tx', []);
          const fileIgnored = data.joy_ignored_tx || [];
          const mergedIgnored = [...new Set([...oldIgnored, ...fileIgnored])];
          window.Storage._set('joy_ignored_tx', mergedIgnored);
          this.ignoredKeys = mergedIgnored;
          // Các loại khác: gộp theo id, giữ cả cũ + mới
          const mergeById = (key, arr, idField) => {
            if (!Array.isArray(arr) || !arr.length) return 0;
            const cur = window.Storage._get(key, []);
            const ids = new Set(cur.map(x => x && x[idField]));
            let added = 0;
            arr.forEach(x => { if (x && !ids.has(x[idField])) { cur.push(x); added++; } });
            if (added) window.Storage._set(key, cur);
            return added;
          };
          mergeById('joy_packages', data.joy_packages, 'packageId');
          mergeById('joy_suspended', data.joy_suspended, 'id');
          mergeById('joy_fee_adjustments', data.joy_fee_adjustments, 'id');
          mergeById('joy_referrals', data.joy_referrals, 'id');
          const addedIgnored = mergedIgnored.length - oldIgnored.length;
          this.loadSettingsUI();
          this.runMatching();
          this.showToast(`✅ Đã gộp backup: +${c1} STK, +${c2} từ khóa, +${c3} gia đình, +${addedIgnored} bỏ qua (giữ nguyên dữ liệu tháng này)`, 'success');
        } catch (err) {
          this.showToast('❌ File backup lỗi: ' + err.message, 'error');
        }
      };
      reader.readAsText(file);
      event.target.value = null;
    }
  };
}
