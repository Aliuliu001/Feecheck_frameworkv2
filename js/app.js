/**
 * App.js - Controller chính Joy Fee Check
 * Kết nối tất cả modules: Importer, Matcher, Reporter, Accounting, Exporter, Storage
 */

window.App = {
  // ========================
  // STATE
  // ========================
  state: {
    students: [],
    vtbTransactions: [],
    tpbTransactions: [],
    cashPayments: [],
    vtbMatched: [],
    vtbUnmatched: [],
    tpbMatched: [],
    tpbUnmatched: [],
    reportRows: [],
    thucTeRows: [],
    ghiHDRows: [],
    accountingData: null, // { tab1, tab2, tab3, tab4, tab5, tab6 }
    accTab4Choices: {}, // { mshs: 'nghi' | 'vanhoc' }
    accTab4Confirmed: false,
    accTab7Rows: [], // accumulated rows from other tabs
    accTab7FilterTags: null, // null = show all; Set of tag strings to show (each has { source, mshs, fullName, className, hocPhi, ... })
    changeRecords: [],
    prevInvoiceStudents: [],
    prevThucTeStudents: [],
    monthYear: '',
    importStatus: {
      dsHocSinh: false,
      vietinBank: false,
      tpBank: false,
      tienMat: false,
      prevInvoice: false
    },
    matchingDone: false
  },

  // ========================
  // INIT
  // ========================
  init: function() {
    console.log('Joy Fee Check v1.0 - Initializing...');
    this.setupDate();
    this.setupTabs();
    this.setupSubTabs();
    this.setupDropZones();
    this.setupButtons();
    this.setupFilters();
    this.loadSettingsUI();
    this.autoLoadMappings();
    this.checkExpiringPackages();
    this.checkPendingReferrals();
    // Load prev invoice students from storage
    this.state.prevInvoiceStudents = Storage._get('joy_prev_invoice_students', []);
    this.state.prevThucTeStudents = Storage._get('joy_prev_thuc_te_students', []);
    // Load Tab 7 (Tổng hợp) from storage
    this.state.accTab7Rows = Storage._get('joy_acc_tab7_rows', []);
    console.log('Joy Fee Check initialized successfully.');
  },

  autoLoadMappings: async function() {
    try {
      const response = await fetch('shared_data/joy_mappings.json');
      if (response.ok) {
        const data = await response.json();
        let addedSTK = 0;
        let addedKw = 0;
        if (data.joy_stk_phu) addedSTK = Storage.mergeSTKPhu(data.joy_stk_phu);
        if (data.joy_keywords) addedKw = Storage.mergeKeywords(data.joy_keywords);
        
        if (addedSTK > 0 || addedKw > 0) {
          Utils.showToast(`Đã tự động tải mapping: thêm mới ${addedSTK} STK, ${addedKw} từ khóa`, 'success');
          this.loadSettingsUI();
        }
      }
    } catch (e) {
      console.log('Không tìm thấy file shared_data/joy_mappings.json hoặc có lỗi đọc file');
    }
  },

  // Kiểm tra gói đóng sắp hết hạn
  checkExpiringPackages: function() {
    const packages = Storage.loadPackages() || [];
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    packages.forEach(pkg => {
      if (!pkg.endMonth) return;
      const [endYear, endMon] = pkg.endMonth.split('-').map(Number);
      const endDate = new Date(endYear, endMon);
      const monthsLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24 * 30));
      
      if (monthsLeft <= 1 && monthsLeft >= 0) {
        // Gói sắp hết hạn - hiển thị cảnh báo
        const memberNames = pkg.members.join(', ');
        Utils.showToast(`⚠ Gói "${pkg.packageName}" sắp hết hạn (${pkg.endMonth})! Thành viên: ${memberNames}. Phụ huynh cần đóng thêm.`, 'warning');
      }
    });
  },

  checkPendingReferrals: function() {
    const monthYear = this.state.monthYear || document.getElementById('month-selector')?.value || '';
    if (!monthYear) return;
    const pending = Storage.getPendingReferrals(monthYear);
    if (pending.length > 0) {
      const students = this.state.students || [];
      pending.forEach(r => {
        const ph = students.find(s => s.mshs === r.mshs);
        const hs = students.find(s => s.mshs === r.referredMSHS);
        Utils.showToast(`🎁 ${ph?.fullName || r.mshs}: Đã giới thiệu ${hs?.fullName || r.referredMSHS} đủ 3 tháng! Cần trừ ${Utils.formatCurrency(r.amount)}. Vào Cài đặt để xác nhận.`, 'warning', 10000);
      });
    }
  },

  setupDate: function() {
    const now = new Date();
    document.getElementById('current-date').textContent =
      now.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    // Set default month
    const monthInput = document.getElementById('month-selector');
    if (monthInput) {
      monthInput.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      this.state.monthYear = monthInput.value;
      // Update state when month changes
      monthInput.addEventListener('change', (e) => {
        this.state.monthYear = e.target.value;
      });
    }
  },

  // ========================
  // TAB NAVIGATION
  // ========================
  setupTabs: function() {
    const tabBtns = document.querySelectorAll('#tab-bar .tab-btn');
    const indicator = document.querySelector('.tab-indicator');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        // Remove active from all
        tabBtns.forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        // Activate clicked
        btn.classList.add('active');
        const tabId = btn.getAttribute('data-tab');
        document.getElementById(tabId).classList.add('active');
        // Move indicator
        if (indicator) {
          indicator.style.left = btn.offsetLeft + 'px';
          indicator.style.width = btn.offsetWidth + 'px';
        }
        // Render undo button when exception tab is shown
        if (tabId === 'exception-tab') {
          this.renderUndoButton();
        }
        // Re-render report + suspended table when report tab is shown
        if (tabId === 'report-tab') {
          this.applyReportFilters();
          this.renderSuspendedTable();
        }
      });
    });

    // Set initial indicator
    const activeBtn = document.querySelector('#tab-bar .tab-btn.active');
    if (activeBtn && indicator) {
      indicator.style.left = activeBtn.offsetLeft + 'px';
      indicator.style.width = activeBtn.offsetWidth + 'px';
    }
  },

  setupSubTabs: function() {
    const subTabBtns = document.querySelectorAll('.sub-tab-btn');
    subTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const parent = btn.closest('.tab-content');
        parent.querySelectorAll('.sub-tab-btn').forEach(b => b.classList.remove('active'));
        parent.querySelectorAll('.sub-tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        const subTabId = btn.getAttribute('data-subtab');
        document.getElementById(subTabId).classList.add('active');
      });
    });
  },

  // ========================
  // DROP ZONES
  // ========================
  setupDropZones: function() {
    const zones = [
      { id: 'drop-ds-hs', type: 'dsHocSinh', parser: 'parseGoogleSheets' },
      { id: 'drop-vietinbank', type: 'vietinBank', parser: 'parseSaoKeVietinBank' },
      { id: 'drop-tpbank', type: 'tpBank', parser: 'parseSaoKeTPBank' },
      { id: 'drop-cash', type: 'tienMat', parser: 'parseTienMat' },
      { id: 'drop-prev-invoice', type: 'prevInvoice', parser: 'parsePrevInvoice' }
    ];

    zones.forEach(zone => {
      const el = document.getElementById(zone.id);
      if (!el) return;
      const fileInput = el.querySelector('input[type="file"]');

      // Click to browse
      el.addEventListener('click', (e) => {
        if (e.target.tagName !== 'INPUT') fileInput.click();
      });

      // Drag events
      el.addEventListener('dragover', (e) => {
        e.preventDefault();
        el.classList.add('drag-over');
      });
      el.addEventListener('dragleave', () => {
        el.classList.remove('drag-over');
      });
      el.addEventListener('drop', (e) => {
        e.preventDefault();
        el.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file) this.handleFileImport(file, zone.type, zone.parser, el);
      });

      // File input change
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) this.handleFileImport(file, zone.type, zone.parser, el);
      });
    });
  },

  handleFileImport: async function(file, type, parserName, dropZoneEl) {
    const statusEl = dropZoneEl.querySelector('.status-text');
    statusEl.textContent = 'Đang đọc...';
    statusEl.className = 'status-text info';

    try {
      let result;
      if (type === 'dsHocSinh') {
        const parsed = await Importer.parseGoogleSheets(file);
        this.state.students = parsed.students || parsed;
        result = Array.isArray(parsed.students) ? parsed.students : parsed;
        // Re-validate keywords against new master list
        this._revalidateKeywords();
      } else if (type === 'vietinBank') {
        this.state.vtbTransactions = await Importer.parseSaoKeVietinBank(file);
        result = this.state.vtbTransactions;
      } else if (type === 'tpBank') {
        this.state.tpbTransactions = await Importer.parseSaoKeTPBank(file);
        result = this.state.tpbTransactions;
      } else if (type === 'tienMat') {
        this.state.cashPayments = await Importer.parseTienMat(file);
        result = this.state.cashPayments;
      } else if (type === 'prevInvoice') {
        const prevData = await Importer.parsePrevInvoiceFile(file);
        this.state.prevInvoiceStudents = prevData.prevInvoiceStudents;
        this.state.prevThucTeStudents = prevData.prevThucTe;
        result = prevData.prevInvoiceStudents;
        // Save to storage for comparison
        if (result && result.length > 0) {
          Storage._set('joy_prev_invoice_students', result);
        }
        if (prevData.prevThucTe && prevData.prevThucTe.length > 0) {
          Storage._set('joy_prev_thuc_te_students', prevData.prevThucTe);
        }
      }

      const count = result ? result.length : 0;
      statusEl.textContent = `✅ Đã import ${count} dòng`;
      statusEl.className = 'status-text success';
      dropZoneEl.classList.add('imported');
      this.state.importStatus[type] = true;
      Utils.showToast(`Import ${file.name} thành công: ${count} dòng`, 'success');
      this.checkStartButton();
    } catch (err) {
      statusEl.textContent = '❌ Lỗi import';
      statusEl.className = 'status-text error';
      Utils.showToast(`Lỗi import file: ${err.message}`, 'error');
      console.error('Import error:', err);
    }
  },

  checkStartButton: function() {
    const btn = document.getElementById('btn-start-matching');
    const hasDS = this.state.importStatus.dsHocSinh;
    const hasSource = this.state.importStatus.vietinBank || 
                      this.state.importStatus.tpBank || 
                      this.state.importStatus.tienMat;
    btn.disabled = !(hasDS && hasSource);
  },

  // ========================
  // BUTTONS
  // ========================
  setupButtons: function() {
    // Start matching
    document.getElementById('btn-start-matching')?.addEventListener('click', () => this.runMatching());
    
    // Export buttons
    document.getElementById('btn-export-report')?.addEventListener('click', () => this.exportReport());
    document.getElementById('btn-export-full')?.addEventListener('click', () => {
      Exporter.exportFullExcel({
        students: this.state.students,
        vtb: this.state.vtbTransactions,
        tpb: this.state.tpbTransactions,
        cash: this.state.cashPayments,
        reportRows: this.state.reportRows,
        stats: Reporter.getStatistics(this.state.reportRows),
        stkPhu: Storage.loadSTKPhu(),
        keywords: Storage.loadKeywords(),
        monthYear: document.getElementById('month-selector')?.value || ''
      });
    });
    // Accounting export removed — tab deleted
    document.getElementById('btn-export-nhac-ph')?.addEventListener('click', () => this.exportNhacPH());
    // Accounting report export (new 5-tab)
    document.getElementById('btn-export-accounting')?.addEventListener('click', () => this.exportAccountingReport());



    // Settings buttons
    document.getElementById('btn-set-prev-month')?.addEventListener('click', () => this.savePrevMonth());
    document.getElementById('btn-export-stkphu')?.addEventListener('click', () => this.exportSTKPhu());
    document.getElementById('btn-export-backup')?.addEventListener('click', () => this.exportBackup());
    document.getElementById('btn-import-backup')?.addEventListener('click', () => this.importBackup());
    
    // Settings - Mapping buttons
    document.getElementById('btn-export-mapping')?.addEventListener('click', () => this.exportMapping());
    document.getElementById('btn-import-mapping')?.addEventListener('click', () => this.importMapping());

    // Family Group button
    document.getElementById('btn-add-family')?.addEventListener('click', () => this.addFamilyGroupUI());
    document.getElementById('btn-add-package')?.addEventListener('click', () => this.addPackageUI());
    document.getElementById('btn-add-adjustment')?.addEventListener('click', () => this.addAdjustmentUI());
    document.getElementById('btn-add-referral')?.addEventListener('click', () => this.addReferralUI());
  },

  // ========================
  // FIND STUDENT
  // ========================
  findStudent: function() {
    const students = this.state.students || [];
    if (students.length === 0) {
      Utils.showToast('Chưa có dữ liệu học sinh', 'warning');
      return;
    }
    Utils.showModal(
      '🔍 Tìm Học sinh',
      `<div class="form-group mb-3">
        <label>Nhập MSHS hoặc tên HS:</label>
        <input type="text" id="input-find-student" class="form-control" placeholder="VD: HV015 hoặc Nguyễn..." autofocus
          oninput="App._findStudentSuggest(this.value)">
      </div>
      <div id="find-suggest-list" style="max-height:250px; overflow-y:auto;"></div>`,
      null, // no confirm button needed
      true  // wide modal
    );
    setTimeout(() => document.getElementById('input-find-student')?.focus(), 100);
  },

  _findStudentSuggest: function(query) {
    const list = document.getElementById('find-suggest-list');
    if (!list) return;
    if (!query || query.length < 1) { list.innerHTML = ''; return; }
    const q = Utils.normalizeText(query);
    const matches = this.state.students.filter(s => {
      const mshs = Utils.normalizeText(s.mshs || '');
      const name = Utils.normalizeText(s.fullName || '');
      return mshs.includes(q) || name.includes(q);
    }).slice(0, 20);

    if (matches.length === 0) {
      list.innerHTML = '<p class="text-sm text-secondary" style="padding:8px;">Không tìm thấy</p>';
      return;
    }
    list.innerHTML = matches.map(s => {
      return `<div style="padding:6px 8px; cursor:pointer; border-bottom:1px solid var(--border-color); font-size:0.85rem;"
        onmouseover="this.style.background='var(--bg-secondary)'"
        onmouseout="this.style.background=''"
        onclick="App._scrollToStudent('${s.mshs}')">
        <strong>${s.mshs}</strong> — ${s.fullName} (${s.className || ''})
      </div>`;
    }).join('');
  },

  _scrollToStudent: function(mshs) {
    // Close modal first
    const modal = document.getElementById('modal-overlay');
    if (modal) modal.style.display = 'none';
    // Find the row in the report table
    const tbody = document.querySelector('#table-report tbody');
    if (!tbody) return;
    const rows = tbody.querySelectorAll('tr');
    for (const row of rows) {
      const cells = row.querySelectorAll('td');
      for (const cell of cells) {
        if (cell.textContent.trim().toUpperCase() === mshs.toUpperCase()) {
          row.scrollIntoView({ behavior: 'smooth', block: 'center' });
          row.style.background = 'var(--accent-yellow)';
          row.style.transition = 'background 0.3s';
          setTimeout(() => { row.style.background = ''; }, 2000);
          return;
        }
      }
    }
    Utils.showToast(`Không tìm thấy ${mshs} trong bảng (thử Refresh)`, 'info');
  },

  // ========================
  // FILTERS
  // ========================
  setupFilters: function() {
    const applyFilters = Utils.debounce(() => this.applyReportFilters(), 200);
    const statusSelect = document.getElementById('filter-status');
    if (statusSelect) {
      statusSelect.addEventListener('change', applyFilters);
      // Fix: after applying, reset to "all" so same-option click works next time
      statusSelect.addEventListener('change', () => {
        setTimeout(() => { statusSelect.value = 'all'; }, 300);
      });
    }
    document.getElementById('filter-class')?.addEventListener('change', applyFilters);
    document.getElementById('filter-teacher')?.addEventListener('change', applyFilters);
    document.getElementById('search-report')?.addEventListener('input', applyFilters);
  },

  applyReportFilters: function(filters) {
    // If filters not passed, read from DOM
    if (!filters) {
      filters = {
        trangThai: document.getElementById('filter-status')?.value || 'all',
        className: document.getElementById('filter-class')?.value || 'all',
        teacher: document.getElementById('filter-teacher')?.value || 'all',
        searchText: document.getElementById('search-report')?.value || ''
      };
    }
    const filtered = Reporter.filterReport(this.state.reportRows, filters);
    this.renderReportTable(filtered);
  },

  // ========================
  // CORE: MATCHING
  // ========================
  runMatching: async function(switchToReport) {
    // switchToReport: true = nhảy sang Báo cáo (khi bấm "Bắt đầu đối soát");
    //                     false = giữ nguyên tab hiện tại (khi gán tay từ tab Ngoại lệ)
    if (typeof switchToReport === 'undefined') switchToReport = true;
    Utils.showLoading(true);
    
    try {
      const stkPhu = Storage.loadSTKPhu() || [];
      const keywords = Storage.loadKeywords() || [];

      // 1. Match VietinBank
      if (this.state.vtbTransactions.length > 0) {
        const vtbResult = Matcher.matchVietinBank(this.state.vtbTransactions, this.state.students, stkPhu);
        this.state.vtbMatched = vtbResult.matched;
        this.state.vtbUnmatched = vtbResult.unmatched;
      }

      // 2. Match TPBank  
      if (this.state.tpbTransactions.length > 0) {
        const tpbResult = Matcher.matchTPBank(this.state.tpbTransactions, keywords, this.state.students);
        this.state.tpbMatched = tpbResult.matched;
        this.state.tpbUnmatched = tpbResult.unmatched;
      }

      // 3. Aggregate payments by MSHS
      let paymentsByMSHS = Matcher.aggregateByMSHS(
        this.state.vtbMatched,
        this.state.tpbMatched,
        this.state.cashPayments
      );

      // 3.5. Family split is handled in Reporter.generateReport() using fee ratio
      const familyGroups = Storage.loadFamilyGroups();

      // 4. Generate report
      this.state.reportRows = Reporter.generateReport(this.state.students, paymentsByMSHS, familyGroups, this.state.monthYear || '');

      // Filter out suspended students for stats + table display
      const monthYear = this.state.monthYear || '';
      const suspended = Storage.getSuspendedForMonth(monthYear);
      const suspendedSet = new Set(suspended.map(s => `${s.mshs}_${s.className}`));
      const visibleRows = this.state.reportRows.filter(r => {
        const classes = r.className ? r.className.split(',').map(c => c.trim()) : [];
        return classes.some(c => !suspendedSet.has(`${r.mshs}_${c}`));
      });

      const stats = Reporter.getStatistics(visibleRows);

      // 5. Generate accounting — DS Master Tổng
      this.state.thucTeRows = Accounting.generateThucTe(this.state.students);
      
      // 5.5. Compute accounting comparison (5-tab set operations)
      this.computeAccountingData();

      // 7. Get new STKs
      const newSTKs = Matcher.getNewSTKs(this.state.vtbTransactions, this.state.students, stkPhu);

      // RENDER ALL
      this.renderSummaryCards(stats);
      this.populateFilterDropdowns();
      this.renderReportTable(this.state.reportRows);
      this.renderExceptions(newSTKs, this.state.tpbUnmatched);
      // Render accounting tabs
      this.renderAccountingTabs();
      this.renderSyncChanges();

      this.state.matchingDone = true;
      Utils.showToast('Đối soát hoàn tất!', 'success');

      // Chỉ nhảy sang Báo cáo khi được yêu cầu (bấm "Bắt đầu đối soát")
      // và không còn ngoại lệ. Nếu còn STK/từ khóa chưa gán -> ở lại tab Ngoại lệ.
      const stillHasExceptions = (newSTKs && newSTKs.length > 0) ||
                                 (this.state.tpbUnmatched && this.state.tpbUnmatched.length > 0);
      if (switchToReport && !stillHasExceptions) {
        document.querySelector('[data-tab="report-tab"]').click();
      } else if (stillHasExceptions) {
        Utils.showToast('Còn ' + ((newSTKs ? newSTKs.length : 0) + (this.state.tpbUnmatched ? this.state.tpbUnmatched.length : 0)) + ' ngoại lệ cần xử lý', 'warning');
      }

    } catch (err) {
      Utils.showToast(`Lỗi đối soát: ${err.message}`, 'error');
      console.error('Matching error:', err);
    } finally {
      Utils.showLoading(false);
    }
  },

  // ========================
  // RENDER: Summary Cards
  // ========================
  renderSummaryCards: function(stats) {
    document.getElementById('sum-total-hs').textContent = stats.tongHS || 0;
    document.getElementById('sum-paid').textContent = stats.daDong || 0;
    document.getElementById('sum-unpaid').textContent = stats.chuaDong || 0;
    document.getElementById('sum-partial').textContent = stats.dongThieu || 0;
    document.getElementById('sum-overpaid').textContent = stats.dongDu || 0;
    document.getElementById('sum-package').textContent = stats.dongGoi || 0;
    document.getElementById('sum-total-money').textContent = Utils.formatCurrency(stats.tongThu || 0) + ' ₫';
  },

  // ========================
  // RENDER: Filter Dropdowns
  // ========================
  populateFilterDropdowns: function() {
    const classes = [...new Set(this.state.students.map(s => s.className).filter(Boolean))].sort();
    const teachers = [...new Set(this.state.students.map(s => s.teacher).filter(Boolean))].sort();

    const classSelect = document.getElementById('filter-class');
    const teacherSelect = document.getElementById('filter-teacher');

    if (classSelect) {
      classSelect.innerHTML = '<option value="all">Tất cả lớp</option>';
      classes.forEach(c => {
        classSelect.innerHTML += `<option value="${c}">${c}</option>`;
      });
    }
    if (teacherSelect) {
      teacherSelect.innerHTML = '<option value="all">Tất cả GV</option>';
      teachers.forEach(t => {
        teacherSelect.innerHTML += `<option value="${t}">${t}</option>`;
      });
    }
  },

  // ========================
  // RENDER: Report Table
  // ========================
  renderReportTable: function(rows) {
    const tbody = document.querySelector('#table-report tbody');
    if (!tbody) return;

    if (!rows || rows.length === 0) {
      tbody.innerHTML = '<tr><td colspan="12" style="text-align:center; padding:20px; color:var(--text-secondary)">Chưa có dữ liệu. Hãy import file và bấm "Bắt đầu đối soát".</td></tr>';
      return;
    }

    // Filter out suspended students
    const monthYear = this.state.monthYear || '';
    const suspended = Storage.getSuspendedForMonth(monthYear);
    const suspendedSet = new Set(suspended.map(s => `${s.mshs}_${s.className}`));
    const filteredRows = rows.filter(r => {
      const classes = r.className ? r.className.split(',').map(c => c.trim()) : [];
      // Keep row if at least one class is NOT suspended
      return classes.some(c => !suspendedSet.has(`${r.mshs}_${c}`));
    });

    tbody.innerHTML = filteredRows.map(r => {
      const statusClass = this.getStatusClass(r.trangThai);
      const isWarning = (r.ghiChu || '').includes('⚠');
      const isOverpaid = r.trangThai === APP_CONFIG.STATUS.OVERPAID;
      const safeName = (r.fullName || '').replace(/'/g, "\\'");
      const safeMshs = (r.mshs || '').replace(/'/g, "\\'");
      return `<tr class="${isWarning ? 'warning-row' : ''}">
        <td>
          <button class="btn btn-xs btn-outline" title="Thêm gia đình" onclick="App.addFamilyGroupForStudent('${safeMshs}', '${safeName}')">➕</button>
          <button class="btn btn-xs btn-outline" title="Tạm ngưng" onclick="App.quickSuspend('${safeMshs}', '${safeName}')">⏸️</button>
        </td>
        <td>${r.mshs || ''}</td>
        <td>${r.fullName || ''}</td>
        <td>${r.className || ''}</td>
        <td>${r.teacher || ''}</td>
        <td class="number">${Utils.formatCurrency(r.tongHocPhi)}</td>
        <td class="number">${Utils.formatCurrency(r.chuyenKhoanVTB)}</td>
        <td class="number">${Utils.formatCurrency(r.tienMat)}</td>
        <td class="number">${Utils.formatCurrency(r.chuyenKhoanTPB)}</td>
        <td class="number">${Utils.formatCurrency(r.tongDaDong)}</td>
        <td>${this.renderTxSource(r)}</td>
        <td><span class="badge ${statusClass}">${r.trangThai || ''}</span>${(r.trangThai === APP_CONFIG.STATUS.UNPAID || r.trangThai === APP_CONFIG.STATUS.PARTIAL) ? '<br><button class="btn btn-xs btn-outline mt-1" onclick="App.adjustFeeFromReport(\'' + safeMshs + '\', \'' + safeName + '\')">📝 Điều chỉnh</button>' : ''}</td>
        <td style="${isWarning ? 'color: var(--danger-color); font-weight: 500;' : ''}">${r.ghiChu || ''}${isOverpaid ? '<br><button class="btn btn-xs btn-outline mt-1" onclick="App.markBookFee(\'' + safeMshs + '\')">📚 Tiền sách</button>' : ''}</td>
      </tr>`;
    }).join('');
  },

  // Render nguồn CK: hiển thị nguồn + nút xem chi tiết
  renderTxSource: function(r) {
    const txList = r.txList || [];
    if (txList.length === 0) return '<span class="text-secondary">—</span>';
    const safeMshs = (r.mshs || '').replace(/'/g, "\\'");
    const sourceLabels = { vtb: '🏦 VTB', tpb: '🏦 TPB', cash: '💵 TM' };
    const summary = txList.map(tx => {
      let label = `${sourceLabels[tx.type] || tx.type}: ${Utils.formatCurrency(tx.amount)}`;
      if (tx.type === 'vtb' && tx.tenChuTK) label += ` (${tx.tenChuTK})`;
      return label;
    }).join('<br>');
    return `<span class="text-sm" style="cursor:pointer; text-decoration:underline; color:var(--accent-color);" onclick="App.showTxDetail('${safeMshs}')" title="Xem chi tiết">${txList.length} giao dịch</span>
    <div class="text-sm text-secondary">${summary}</div>`;
  },

  // Modal chi tiết giao dịch
  showTxDetail: function(mshs) {
    const reportRow = (this.state.reportRows || []).find(r => r.mshs === mshs);
    if (!reportRow || !reportRow.txList || reportRow.txList.length === 0) {
      Utils.showToast('Không có giao dịch nào cho học sinh này', 'info');
      return;
    }
    const txList = reportRow.txList;
    const typeLabels = { vtb: '🏦 VietinBank', tpb: '🏦 TPBank', cash: '💵 Tiền mặt' };
    const hasTenChuTK = txList.some(tx => tx.tenChuTK);
    const rows = txList.map((tx, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${typeLabels[tx.type] || tx.type}</td>
        <td>${tx.date}</td>
        <td class="number" style="color: var(--color-success); font-weight:600;">${Utils.formatCurrency(tx.amount)}</td>
        <td class="text-sm">${tx.description}</td>
        <td class="text-sm">${tx.account || '—'}</td>
        ${hasTenChuTK ? `<td class="text-sm">${tx.tenChuTK || '—'}</td>` : ''}
      </tr>
    `).join('');
    const totalAmount = txList.reduce((sum, tx) => sum + tx.amount, 0);
    Utils.showModal(
      `🔍 Chi tiết giao dịch — ${reportRow.fullName} (${mshs})`,
      `<div class="table-container" style="max-height:400px; overflow-y:auto;">
        <table class="compact-table">
          <thead><tr><th>#</th><th>Nguồn</th><th>Ngày</th><th>Số tiền</th><th>Nội dung</th><th>STK</th>${hasTenChuTK ? '<th>Tên chủ TK</th>' : ''}</tr></thead>
          <tbody>${rows}</tbody>
          <tfoot><tr><td colspan="3" style="text-align:right; font-weight:600;">Tổng:</td><td class="number" style="font-weight:700; color:var(--color-success);">${Utils.formatCurrency(totalAmount)}</td><td colspan="${hasTenChuTK ? 3 : 2}"></td></tr></tfoot>
        </table>
      </div>
      <p class="text-sm text-secondary mt-2">HP: ${Utils.formatCurrency(reportRow.tongHocPhi)} — Trạng thái: ${reportRow.trangThai}</p>`
    );
  },

  getStatusClass: function(status) {
    switch (status) {
      case APP_CONFIG.STATUS.PAID: return 'success';
      case APP_CONFIG.STATUS.UNPAID: return 'error';
      case APP_CONFIG.STATUS.PARTIAL: return 'warning';
      case APP_CONFIG.STATUS.OVERPAID: return 'info';
      case APP_CONFIG.STATUS.PACKAGE: return 'purple';
      case 'MIỄN PHÍ': return 'success';
      default: return '';
    }
  },

  // ========================
  // RENDER: Exceptions
  // ========================
  renderExceptions: function(newSTKs, unmatchedTPB) {
    // Filter out skipped transactions
    const skippedSTK = Storage._get('joy_skipped_stk', []);
    const skippedSTKSet = new Set(skippedSTK.map(s => s.stk));
    const skippedTPB = Storage._get('joy_skipped_tpb', []);
    const skippedTPBSet = new Set(skippedTPB.map(s => s.key));
    
    // Filter newSTKs to exclude skipped
    newSTKs = newSTKs.filter(s => !skippedSTKSet.has(s.stk));
    
    // Filter unmatchedTPB to exclude skipped (use state directly)
    // unmatchedTPB is already filtered in skipTPB, no need to filter again

    // New STKs
    const stkTbody = document.querySelector('#table-unmapped-stk tbody');
    const stkCount = document.getElementById('unmapped-stk-count');
    if (stkTbody) {
      if (newSTKs.length === 0) {
        stkTbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-secondary)">Không có STK mới</td></tr>';
      } else {
        stkTbody.innerHTML = newSTKs.map(s => {
          // Get suggestions
          const suggestions = Matcher.suggestMatch(
            { description: s.tenTK, stkDoiUng: s.stk, tenTKDoiUng: s.tenTK }, 
            this.state.students
          );
          const suggestText = suggestions.length > 0
            ? suggestions.map(sg => `${sg.mshs} - ${sg.studentName} (${Math.round(sg.score * 100)}%)`).join('<br>')
            : '<span style="color:var(--text-secondary)">Không có gợi ý</span>';

          return `<tr>
            <td><code>${s.stk}</code></td>
            <td>${s.tenTK}</td>
            <td class="number">${Utils.formatCurrency(s.totalAmount)}</td>
            <td class="suggestion">${suggestText}</td>
            <td>
              <button class="btn btn-sm btn-primary" onclick="App.assignSTKToMSHS('${s.stk.replace(/'/g, "\\'")}', '${s.tenTK.replace(/'/g, "\\'")}', '${(suggestions[0]?suggestions[0].mshs:'').replace(/'/g, "\\'")}', '${(suggestions[0]?suggestions[0].studentName:'').replace(/'/g, "\\'")}', false)">Gán MSHS</button>
              <button class="btn btn-sm btn-warning" onclick="App.assignSTKToMSHS('${s.stk.replace(/'/g, "\\'")}', '${s.tenTK.replace(/'/g, "\\'")}', '${(suggestions[0]?suggestions[0].mshs:'').replace(/'/g, "\\'")}', '${(suggestions[0]?suggestions[0].studentName:'').replace(/'/g, "\\'")}', true)">📅 Tháng trước</button>
              <button class="btn btn-sm btn-outline" onclick="App.skipSTK('${s.stk.replace(/'/g, "\\'")}', '${s.tenTK.replace(/'/g, "\\'")}')">Bỏ qua</button>
            </td>
          </tr>`;
        }).join('');
      }
      if (stkCount) stkCount.textContent = newSTKs.length;
    }

    // Unmatched TPBank — use state directly (already filtered in skipTPB)
    const tpbTbody = document.querySelector('#table-unidentified-tpb tbody');
    const tpbCount = document.getElementById('unidentified-tpb-count');
    if (tpbTbody) {
      if (!unmatchedTPB || unmatchedTPB.length === 0) {
        tpbTbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-secondary)">Không có giao dịch chưa xác định</td></tr>';
      } else {
        tpbTbody.innerHTML = unmatchedTPB.map((t, idx) => {
          const txKey = `${t.date}_${t.credit}_${t.explanation}`;
          const suggestions = Matcher.suggestMatch(t, this.state.students);
          const suggestText = suggestions.length > 0
            ? suggestions.map(sg => `${sg.mshs} - ${sg.studentName} (${Math.round(sg.score * 100)}%)`).join('<br>')
            : '<span style="color:var(--text-secondary)">Chưa có gợi ý</span>';
          return `<tr>
            <td>${t.date || ''}</td>
            <td class="description">${t.explanation || ''}</td>
            <td class="number">${Utils.formatCurrency(t.credit)}</td>
            <td class="suggestion">${suggestText}</td>
            <td>
              <button class="btn btn-sm btn-primary" onclick="App.assignTPBToMSHS(${idx}, '${(suggestions[0]?suggestions[0].mshs:'').replace(/'/g, "\\'")}', '${(suggestions[0]?suggestions[0].studentName:'').replace(/'/g, "\\'")}', false)">Gán MSHS</button>
              <button class="btn btn-sm btn-warning" onclick="App.assignTPBToMSHS(${idx}, '${(suggestions[0]?suggestions[0].mshs:'').replace(/'/g, "\\'")}', '${(suggestions[0]?suggestions[0].studentName:'').replace(/'/g, "\\'")}', true)">📅 Tháng trước</button>
              <button class="btn btn-sm btn-outline" onclick="App.skipTPB('${txKey}')">Bỏ qua</button>
            </td>
          </tr>`;
        }).join('');
      }
      if (tpbCount) tpbCount.textContent = unmatchedTPB ? unmatchedTPB.length : 0;
    }

    // Update exception counter badge
    const totalExceptions = newSTKs.length + (unmatchedTPB ? unmatchedTPB.length : 0);
    const exceptionCounter = document.getElementById('exception-counter');
    if (exceptionCounter) {
      exceptionCounter.textContent = totalExceptions;
      exceptionCounter.style.display = totalExceptions > 0 ? 'inline-flex' : 'none';
    }
  },

  getChangeTypeInfo: function(type) {
    switch (type) {
      case APP_CONFIG.CHANGE_TYPE.NEW:
        return { icon: '🆕', label: 'Tăng mới', rowClass: 'change-new' };
      case APP_CONFIG.CHANGE_TYPE.QUIT:
        return { icon: '🚫', label: 'Giảm bớt', rowClass: 'change-quit' };
      case APP_CONFIG.CHANGE_TYPE.CLASS_CHANGE:
        return { icon: '🔄', label: 'Đổi lớp', rowClass: 'change-class' };
      case APP_CONFIG.CHANGE_TYPE.COMPANY_TRANSFER:
        return { icon: '💳', label: 'CK vào TK CT', rowClass: 'change-company' };
      case APP_CONFIG.CHANGE_TYPE.WRONG_AMOUNT:
        return { icon: '⚠️', label: 'Sai tiền CK', rowClass: 'change-wrong' };
      case 'tang_hoa_don':
        return { icon: '📋', label: 'Tăng DS HĐ', rowClass: 'change-new' };
      default:
        return { icon: '❓', label: type, rowClass: '' };
    }
  },

  // ========================
  // RENDER: Sync Changes
  // ========================
  renderSyncChanges: function() {
    const tbody = document.querySelector('#table-sync-changes tbody');
    const syncCount = document.getElementById('sync-changes-count');
    const changes = Storage.loadSyncChanges() || [];
    
    if (tbody) {
      if (changes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--text-secondary)">Chưa có thay đổi cần sync</td></tr>';
      } else {
        tbody.innerHTML = changes.map((c, idx) => `<tr>
          <td><span class="badge ${c.type === 'stk_phu_moi' ? 'info' : 'warning'}">${c.type === 'stk_phu_moi' ? 'STK phụ' : 'Keyword'}</span></td>
          <td>${c.mshs}</td>
          <td>${c.content}</td>
          <td><input type="checkbox" ${c.synced ? 'checked' : ''} onchange="App.toggleSyncStatus(${idx}, this.checked)"></td>
        </tr>`).join('');
      }
      if (syncCount) syncCount.textContent = changes.filter(c => !c.synced).length;
    }
  },

  // ========================
  // ACTIONS: Assign STK → MSHS
  // ========================
  assignSTKToMSHS: function(stk, tenTK, suggestedMSHS, suggestedName, isPreviousMonth) {
    const title = isPreviousMonth ? 'Gán STK cho Học sinh (📅 Tháng trước)' : 'Gán STK cho Học sinh';
    const extraNote = isPreviousMonth ? '<p style="color:var(--warning-color); font-weight:bold;">⚠ Khoản này sẽ được tính vào tháng TRƯỚC, không tính vào tháng đang đối soát.</p>' : '';
    Utils.showModal(
      title,
      `<p>STK: <strong>${stk}</strong> (${tenTK})</p>
       ${extraNote}
       <div class="form-group mt-3">
         <label>Nhập MSHS (vd: HV001):</label>
         <input type="text" id="input-assign-mshs" class="form-input" placeholder="HVxxx" value="${(suggestedMSHS||'').replace(/"/g, '&quot;')}" autofocus>
       </div>
       <div class="form-group mt-2">
         <label>Tên học sinh:</label>
         <input type="text" id="input-assign-name" class="form-input" placeholder="Tên đầy đủ" value="${(suggestedName||'').replace(/"/g, '&quot;')}">
       </div>`,
      () => {
        const mshs = document.getElementById('input-assign-mshs')?.value?.trim();
        const name = document.getElementById('input-assign-name')?.value?.trim();
        if (!mshs) {
          Utils.showToast('Vui lòng nhập MSHS', 'error');
          return false;
        }
        // Save to STK_PHU
        Storage.addSTKPhu({
          mshs: mshs.toUpperCase(),
          fullName: name || '',
          stk: stk,
          tenTK: tenTK,
          addedDate: new Date().toISOString()
        });
        // Save previous month flag if needed
        if (isPreviousMonth) {
          Storage.addPreviousMonthPayment({
            mshs: mshs.toUpperCase(),
            stk: stk,
            tenTK: tenTK,
            amount: 0, // Will be filled by matching
            source: 'vtb',
            date: new Date().toISOString()
          });
        }
        // Add sync change
        Storage.addSyncChange({
          type: 'stk_phu_moi',
          mshs: mshs.toUpperCase(),
          content: `STK: ${stk} - ${tenTK}${isPreviousMonth ? ' (📅 Tháng trước)' : ''}`,
          synced: false,
          date: new Date().toISOString()
        });
        Storage.addHistory({
          date: new Date().toISOString(),
          action: isPreviousMonth ? 'Thêm STK phụ (Tháng trước)' : 'Thêm STK phụ',
          detail: `${mshs} ← STK ${stk} (${tenTK})`
        });
        Utils.showToast(`Đã gán STK ${stk} → ${mshs}${isPreviousMonth ? ' (thuộc tháng trước)' : ''}`, 'success');
        // Run matching in background WITHOUT showing loading overlay
        setTimeout(() => {
          this.runMatchingBackground();
        }, 100);
        return true;
      }
    );
  },

  assignTPBToMSHS: function(txIndex, suggestedMSHS, suggestedName, isPreviousMonth) {
    const tx = this.state.tpbUnmatched[txIndex];
    if (!tx) return;
    this._currentAssignTx = tx; // Store for keyword matching

    const title = isPreviousMonth ? 'Gán GD TPBank (📅 Tháng trước)' : 'Gán GD TPBank cho Học sinh';
    const extraNote = isPreviousMonth ? '<p style="color:var(--warning-color); font-weight:bold;">⚠ Khoản này sẽ được tính vào tháng TRƯỚC, không tính vào tháng đang đối soát.</p>' : '';
    Utils.showModal(
      title,
      `<p>Nội dung: <strong>${tx.explanation}</strong></p>
       <p>Số tiền: <strong>${Utils.formatCurrency(tx.credit)}</strong></p>
       ${extraNote}
       <div class="form-group mt-3">
         <label>Nhập MSHS:</label>
         <input type="text" id="input-assign-mshs" class="form-input" placeholder="HVxxx" value="${(suggestedMSHS||'').replace(/"/g, '&quot;')}" autofocus>
       </div>
       <div class="form-group mt-2">
         <label>Từ khóa để lưu (keyword):</label>
         <input type="text" id="input-assign-keyword" class="form-input" placeholder="Từ khóa nhận diện PH">
       </div>
       <div class="form-group mt-2">
         <label>Tên học sinh:</label>
         <input type="text" id="input-assign-name" class="form-input" placeholder="Tên đầy đủ" value="${(suggestedName||'').replace(/"/g, '&quot;')}">
       </div>`,
      () => {
        const mshs = document.getElementById('input-assign-mshs')?.value?.trim();
        const keyword = document.getElementById('input-assign-keyword')?.value?.trim();
        const name = document.getElementById('input-assign-name')?.value?.trim();
        if (!mshs) {
          Utils.showToast('Vui lòng nhập MSHS', 'error');
          return false;
        }
        if (keyword) {
          Storage.addKeyword({
            keyword: keyword,
            mshs: mshs.toUpperCase(),
            studentName: name || '',
            addedDate: new Date().toISOString()
          });
          Storage.addSyncChange({
            type: 'keyword_moi',
            mshs: mshs.toUpperCase(),
            content: `Keyword: "${keyword}"${isPreviousMonth ? ' (📅 Tháng trước)' : ''}`,
            synced: false,
            date: new Date().toISOString()
          });
        }
        // Save previous month flag if needed
        if (isPreviousMonth) {
          Storage.addPreviousMonthPayment({
            mshs: mshs.toUpperCase(),
            stk: '',
            tenTK: name || '',
            amount: tx.credit,
            source: 'tpb',
            date: new Date().toISOString()
          });
        }
        Storage.addHistory({
          date: new Date().toISOString(),
          action: isPreviousMonth ? 'Gán GD TPBank (Tháng trước)' : 'Gán GD TPBank',
          detail: `${mshs} ← "${keyword || tx.explanation.substring(0, 40)}..."`
        });
        Utils.showToast(`Đã gán GD TPBank → ${mshs}${isPreviousMonth ? ' (thuộc tháng trước)' : ''}`, 'success');
        // Run matching in background WITHOUT showing loading overlay
        setTimeout(() => {
          this.runMatchingBackground();
        }, 100);
        return true;
      }
    );
  },

  // Background matching - không hiện loading overlay
  runMatchingBackground: async function() {
    try {
      const stkPhu = Storage.loadSTKPhu() || [];
      const keywords = Storage.loadKeywords() || [];

      if (this.state.vtbTransactions.length > 0) {
        const vtbResult = Matcher.matchVietinBank(this.state.vtbTransactions, this.state.students, stkPhu);
        this.state.vtbMatched = vtbResult.matched;
        this.state.vtbUnmatched = vtbResult.unmatched;
      }

      if (this.state.tpbTransactions.length > 0) {
        const tpbResult = Matcher.matchTPBank(this.state.tpbTransactions, keywords, this.state.students);
        this.state.tpbMatched = tpbResult.matched;
        this.state.tpbUnmatched = tpbResult.unmatched;
      }

      let paymentsByMSHS = Matcher.aggregateByMSHS(
        this.state.vtbMatched,
        this.state.tpbMatched,
        this.state.cashPayments
      );

      const familyGroups = Storage.loadFamilyGroups();
      // NOTE: Family split is handled in Reporter.generateReport() using fee ratio
      // No need to call Matcher.distributeByFamily() here

      this.state.reportRows = Reporter.generateReport(this.state.students, paymentsByMSHS, familyGroups, this.state.monthYear || '');

      // Re-render current tab
      this.renderCurrentTab();
    } catch (e) {
      console.error('Background matching error:', e);
    }
  },

  renderCurrentTab: function() {
    // Check which tab is currently active and re-render it
    const exceptionTab = document.getElementById('exception-tab');
    if (exceptionTab && exceptionTab.classList.contains('active')) {
      // Re-render exceptions with current state
      const newSTKs = this.state.vtbUnmatched.filter(t => !t.matchedMSHS);
      this.renderExceptions(newSTKs, this.state.tpbUnmatched);
    }
    // Also re-render report if visible (preserve current filter)
    const reportTab = document.getElementById('report-tab');
    if (reportTab && reportTab.classList.contains('active')) {
      this.applyReportFilters();
      this.renderSuspendedTable();
    }
    // Also re-render accounting tab if visible
    const accTab = document.getElementById('accounting-tab');
    if (accTab && accTab.classList.contains('active')) {
      this.renderAccountingTabs();
    }
  },

  // Bỏ qua giao dịch VietinBank (lưu vào storage để không hiện lại)
  skipSTK: function(stk, tenTK) {
    const skipped = Storage._get('joy_skipped_stk', []);
    if (!skipped.some(s => s.stk === stk)) {
      skipped.push({ stk, tenTK, date: new Date().toISOString() });
      Storage._set('joy_skipped_stk', skipped);
    }
    Utils.showToast('Đã bỏ qua giao dịch này', 'success');
    this.renderCurrentTab();
  },

  // Bỏ qua giao dịch TPBank (lưu vào storage để không hiện lại)
  skipTPB: function(txKey) {
    const tx = this.state.tpbUnmatched.find(t => `${t.date}_${t.credit}_${t.explanation}` === txKey);
    if (!tx) return;
    
    // Thêm vào danh sách bỏ qua
    const skipped = Storage._get('joy_skipped_tpb', []);
    if (!skipped.some(s => s.key === txKey)) {
      skipped.push({ key: txKey, date: tx.date, credit: tx.credit, explanation: tx.explanation, skippedDate: new Date().toISOString() });
      Storage._set('joy_skipped_tpb', skipped);
    }
    
    // Xóa khỏi danh sách hiện tại
    this.state.tpbUnmatched = this.state.tpbUnmatched.filter(t => `${t.date}_${t.credit}_${t.explanation}` !== txKey);
    
    Utils.showToast('Đã bỏ qua. Nhấn "Hoàn tác" nếu nhầm.', 'success');
    this.renderCurrentTab();
    this.renderUndoButton();
  },

  // Hoàn tác giao dịch vừa bỏ qua
  undoSkipTPB: function() {
    const skipped = Storage._get('joy_skipped_tpb', []);
    if (skipped.length === 0) {
      Utils.showToast('Không có giao dịch nào để hoàn tác', 'warning');
      return;
    }
    // Lấy giao dịch vừa bỏ qua gần nhất
    const lastSkipped = skipped.pop();
    Storage._set('joy_skipped_tpb', skipped);
    
    // Thêm lại vào danh sách hiện tại (nếu chưa có)
    const exists = this.state.tpbUnmatched.some(t => `${t.date}_${t.credit}_${t.explanation}` === lastSkipped.key);
    if (!exists) {
      this.state.tpbUnmatched.push({
        date: lastSkipped.date,
        credit: lastSkipped.credit,
        explanation: lastSkipped.explanation
      });
    }
    
    Utils.showToast('Đã hoàn tác giao dịch', 'success');
    this.renderCurrentTab();
    this.renderUndoButton();
  },

  renderUndoButton: function() {
    const skipped = Storage._get('joy_skipped_tpb', []);
    const undoContainer = document.getElementById('undo-container');
    if (undoContainer) {
      if (skipped.length > 0) {
        undoContainer.innerHTML = `<button class="btn btn-sm btn-warning" onclick="App.undoSkipTPB()">↩ Hoàn tác bỏ qua</button>`;
      } else {
        undoContainer.innerHTML = '';
      }
    }
  },

  // ========================
  // ACTIONS: Invoice selection (v2 — all Tab 2 rows auto-selected)
  // ========================
  toggleInvoiceItem: function(mshs, checked) {
    // No-op in v2: all Group A+B students are automatically included
    // Kept for backward compatibility with any legacy UI references
  },

  // ========================
  // ACCOUNTING: Compute 5-tab comparison
  // ========================
  computeAccountingData: function() {
    // Get prev invoice students (from file import "File Kế toán tháng trước")
    const prevInvoiceStudents = this.state.prevInvoiceStudents || Storage._get('joy_prev_invoice_students', []);
    
    // Get VTB matched MSHS this month (unique set) + aggregate amounts
    const vtbMatchedMSHS = new Set();
    const vtbAmountByMSHS = new Map();
    for (const tx of (this.state.vtbMatched || [])) {
      if (tx.matchedMSHS) {
        const mshs = tx.matchedMSHS.toUpperCase();
        vtbMatchedMSHS.add(mshs);
        vtbAmountByMSHS.set(mshs, (vtbAmountByMSHS.get(mshs) || 0) + (tx.credit || 0));
      }
    }
    
    // Build currMap: MSHS → student object (DS Tổng master)
    const currMap = new Map();
    for (const s of (this.state.students || [])) {
      if (s.mshs) currMap.set(s.mshs, s);
    }
    
    // Compute the 6-tab comparison (Tab 6 uses NAIVE formula — independent of Report)
    const familyGroups = Storage.loadFamilyGroups();
    const hpDefault = Number(document.getElementById('default-fee')?.value) || APP_CONFIG.DEFAULT_HOC_PHI || 800000;
    this.state.accountingData = Accounting.computeInvoiceComparison(
      prevInvoiceStudents, vtbMatchedMSHS, currMap, vtbAmountByMSHS, this.state.reportRows,
      familyGroups, hpDefault
    );
  },

  // ========================
  // ACCOUNTING: Render 5 sub-tab tables
  // ========================
  renderAccountingTabs: function() {
    const data = this.state.accountingData;
    if (!data) {
      console.log('No accounting data to render');
      return;
    }
    
    // Update summary counters
    const setCount = (id, count) => {
      const el = document.getElementById(id);
      if (el) el.textContent = count;
    };
    setCount('acc-count-tab1', data.tab1.length);
    setCount('acc-count-tab2', data.tab2.length);
    setCount('acc-count-tab3', data.tab3.length);
    setCount('acc-count-tab4', data.tab4.length);
    setCount('acc-count-tab5', data.tab5.length);
    setCount('acc-count-tab6', (data.tab6 || []).length);
    setCount('acc-count-tab7', this.state.accTab7Rows.length);
    
    // Render Tab 1: DS HĐ Tháng trước
    this._renderAccTable('table-acc-tab1', data.tab1, (r, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${r.mshs}</td>
        <td>${r.fullName}</td>
        <td>${r.className}</td>
        <td class="number">${Utils.formatCurrency(r.hocPhi)}</td>
      </tr>
    `);
    
    // Render Tab 2: DS CK VTB Tháng này
    this._renderAccTable('table-acc-tab2', data.tab2, (r, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${r.mshs}</td>
        <td>${r.fullName}</td>
        <td>${r.className}</td>
        <td class="number">${Utils.formatCurrency(r.hocPhi)}</td>
      </tr>
    `);
    
    // Render Tab 3: Giảm bớt
    this._renderAccTable('table-acc-tab3', data.tab3, (r, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${r.mshs}</td>
        <td>${r.fullName}</td>
        <td>${r.className}</td>
        <td class="number">${Utils.formatCurrency(r.hocPhi)}</td>
      </tr>
    `);
    
    // Render Tab 4: Stop - nghỉ học (dynamic: choice → confirm → split)
    this._renderAccTab4();
    
    // Render Tab 5: Tăng mới
    this._renderAccTable('table-acc-tab5', data.tab5, (r, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${r.mshs}</td>
        <td>${r.fullName}</td>
        <td>${r.className}</td>
        <td class="number">${Utils.formatCurrency(r.hocPhi)}</td>
      </tr>
    `);
    
    // Render Tab 6: Chuyển tiền sai
    this._renderAccTab6();

    // Render Tab 7: Tổng hợp (dynamic)
    this._renderAccTab7();
  },
  
  _renderAccTable: function(tableId, rows, rowRenderer) {
    const tbody = document.querySelector(`#${tableId} tbody`);
    if (!tbody) return;
    if (!rows || rows.length === 0) {
      const colCount = tableId === 'table-acc-tab6' ? 6 : (tableId === 'table-acc-tab4' ? 6 : 5);
      tbody.innerHTML = `<tr><td colspan="${colCount}" style="text-align:center; padding:20px; color:var(--text-secondary)">Không có dữ liệu</td></tr>`;
      return;
    }
    tbody.innerHTML = rows.map((r, idx) => rowRenderer(r, idx)).join('');
  },

  // ========================
  // ACCOUNTING TAB 4: Stop - nghỉ học (dynamic)
  // ========================
  _renderAccTab4: function() {
    const data = this.state.accountingData;
    const container = document.getElementById('acc-tab4-body');
    if (!container || !data) return;

    const tab4Rows = data.tab4 || [];
    if (tab4Rows.length === 0) {
      container.innerHTML = '<p style="text-align:center; padding:20px; color:var(--text-secondary)">Không có dữ liệu</p>';
      return;
    }

    if (this.state.accTab4Confirmed) {
      // AFTER CONFIRM: split into 2 sections
      this._renderAccTab4Confirmed(container, tab4Rows);
    } else {
      // BEFORE CONFIRM: show radio buttons
      this._renderAccTab4Choices(container, tab4Rows);
    }
  },

  _renderAccTab4Choices: function(container, tab4Rows) {
    const choices = this.state.accTab4Choices;
    const rows = tab4Rows.map((r, idx) => {
      const checked = choices[r.mshs] || '';
      return `<tr>
        <td>${idx + 1}</td>
        <td>${r.mshs}</td>
        <td>${r.fullName}</td>
        <td>${r.className}</td>
        <td class="number">${Utils.formatCurrency(r.hocPhi)}</td>
        <td style="color: var(--danger-color); font-weight: 500;">${r.lyDo || ''}</td>
        <td>
          <label style="cursor:pointer; margin-right:12px;">
            <input type="radio" name="acc4_${r.mshs}" value="nghi" ${checked === 'nghi' ? 'checked' : ''} onchange="App.setAccTab4Choice('${r.mshs}', 'nghi')"> 🛑 Nghỉ
          </label>
          <label style="cursor:pointer;">
            <input type="radio" name="acc4_${r.mshs}" value="vanhoc" ${checked === 'vanhoc' ? 'checked' : ''} onchange="App.setAccTab4Choice('${r.mshs}', 'vanhoc')"> 🔄 Vẫn học
          </label>
        </td>
      </tr>`;
    }).join('');

    container.innerHTML = `
      <p class="text-sm mb-2" style="color: var(--accent-yellow);">Chọn cho từng HS: <strong>🛑 Nghỉ</strong> (nghỉ thật sự) hoặc <strong>🔄 Vẫn học</strong> (đưa về Tab 3 Giảm bớt).</p>
      <div class="table-container">
        <table class="compact-table">
          <thead>
            <tr>
              <th>STT</th><th>MSHS</th><th>Họ tên</th><th>Lớp</th><th>Học phí</th><th>Lý do</th>
              <th style="min-width:200px;">
                <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap;">
                  <span>Quyết định</span>
                  <label style="font-size:11px; cursor:pointer; color:var(--danger-color);" title="Chọn toàn bộ Nghỉ">
                    <input type="checkbox" onchange="App.setAllAccTab4('nghi', this.checked)"> 🛑 Tất cả
                  </label>
                  <label style="font-size:11px; cursor:pointer; color:var(--success-color);" title="Chọn toàn bộ Vẫn học">
                    <input type="checkbox" onchange="App.setAllAccTab4('vanhoc', this.checked)"> 🔄 Tất cả
                  </label>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <div class="mt-3" style="text-align:right;">
        <button class="btn btn-primary" onclick="App.confirmAccTab4()">✅ Xác nhận</button>
      </div>
    `;
  },

  _renderAccTab4Confirmed: function(container, tab4Rows) {
    const choices = this.state.accTab4Choices;
    const nghiRows = tab4Rows.filter(r => choices[r.mshs] === 'nghi');
    const vanhocRows = tab4Rows.filter(r => choices[r.mshs] === 'vanhoc');

    let html = '';

    // Section 1: Nghỉ luôn
    if (nghiRows.length > 0) {
      html += `<h4 style="margin-bottom:8px;">🛑 Xác nhận Nghỉ học (${nghiRows.length} HS)</h4>`;
      html += `<div class="table-container mb-4"><table class="compact-table"><thead><tr>
        <th>STT</th><th>MSHS</th><th>Họ tên</th><th>Lớp</th><th>Học phí</th><th>Lý do</th>
      </tr></thead><tbody>`;
      nghiRows.forEach((r, idx) => {
        html += `<tr>
          <td>${idx + 1}</td><td>${r.mshs}</td><td>${r.fullName}</td><td>${r.className}</td>
          <td class="number">${Utils.formatCurrency(r.hocPhi)}</td>
          <td style="color: var(--danger-color);">${r.lyDo || ''}</td>
        </tr>`;
      });
      html += `</tbody></table></div>`;
    }

    // Section 2: Vẫn học → chuyển Tab 3
    if (vanhocRows.length > 0) {
      html += `<h4 style="margin-bottom:8px;">🔄 Xác nhận Vẫn học (${vanhocRows.length} HS)</h4>`;
      html += `<p class="text-sm text-secondary mb-2">Những HS này vẫn còn khả năng đóng tiền → chuyển sang Tab 3 Giảm bớt (Kế toán thêm vào).</p>`;
      html += `<div class="table-container mb-3"><table class="compact-table"><thead><tr>
        <th>STT</th><th>MSHS</th><th>Họ tên</th><th>Lớp</th><th>Học phí</th>
      </tr></thead><tbody>`;
      vanhocRows.forEach((r, idx) => {
        html += `<tr>
          <td>${idx + 1}</td><td>${r.mshs}</td><td>${r.fullName}</td><td>${r.className}</td>
          <td class="number">${Utils.formatCurrency(r.hocPhi)}</td>
        </tr>`;
      });
      html += `</tbody></table></div>`;
      html += `<div style="text-align:right;">
        <button class="btn btn-primary" onclick="App.moveToTab3()">📥 Đưa qua Tab 3 Giảm bớt</button>
      </div>`;
    }

    if (nghiRows.length === 0 && vanhocRows.length === 0) {
      html = '<p style="text-align:center; padding:20px; color:var(--text-secondary)">Không có dữ liệu</p>';
    }

    // Export button
    html += `<div class="mt-3" style="text-align:right;">
      <button class="btn btn-sm btn-outline" onclick="App.exportAccTab(4)">📥 Xuất Excel Tab này</button>
    </div>`;

    container.innerHTML = html;
  },

  setAccTab4Choice: function(mshs, choice) {
    this.state.accTab4Choices[mshs] = choice;
  },

  setAllAccTab4: function(choice, checked) {
    if (!checked) return; // only act on check, not uncheck
    const data = this.state.accountingData;
    if (!data) return;
    const tab4Rows = data.tab4 || [];
    tab4Rows.forEach(r => {
      this.state.accTab4Choices[r.mshs] = choice;
    });
    this._renderAccTab4();
  },

  confirmAccTab4: function() {
    const data = this.state.accountingData;
    if (!data) return;
    // Check all are chosen
    const allChosen = (data.tab4 || []).every(r => this.state.accTab4Choices[r.mshs]);
    if (!allChosen) {
      Utils.showToast('Vui lòng chọn cho tất cả học sinh', 'warning');
      return;
    }
    this.state.accTab4Confirmed = true;
    this._renderAccTab4();
    Utils.showToast('Đã xác nhận! Kiểm tra kết quả bên dưới.', 'success');
  },

  moveToTab3: function() {
    const data = this.state.accountingData;
    if (!data) return;
    const vanhocRows = (data.tab4 || []).filter(r => this.state.accTab4Choices[r.mshs] === 'vanhoc');
    if (vanhocRows.length === 0) return;

    // Add to tab3
    const existingMshs = new Set(data.tab3.map(r => r.mshs));
    for (const r of vanhocRows) {
      if (!existingMshs.has(r.mshs)) {
        data.tab3.push({ mshs: r.mshs, fullName: r.fullName, className: r.className, hocPhi: r.hocPhi, teacher: r.teacher || '' });
      }
    }
    data.tab3.sort((a, b) => a.mshs.localeCompare(b.mshs));

    // Remove from tab4
    const movedMshs = new Set(vanhocRows.map(r => r.mshs));
    data.tab4 = data.tab4.filter(r => !movedMshs.has(r.mshs));
    for (const mshs of movedMshs) {
      delete this.state.accTab4Choices[mshs];
    }

    this.state.accTab4Confirmed = false;
    this.renderAccountingTabs();
    Utils.showToast(`Đã chuyển ${vanhocRows.length} HS sang Tab 3 Giảm bớt`, 'success');
  },

  // ========================
  // BACKUP / RESTORE
  // ========================
  exportBackup: function() {
    const monthYear = this.state.monthYear || 'unknown';
    const backup = {};
    // Export all relevant localStorage keys from APP_CONFIG
    const keys = Object.values(APP_CONFIG.STORAGE_KEYS);
    // Also export custom keys
    const extraKeys = ['joy_prev_invoice_students', 'joy_prev_thuc_te_students', 'joy_skipped_stk', 'joy_skipped_tpb', 'joy_suspended', 'joy_adjustments', 'joy_acc_tab7_rows'];
    [...keys, ...extraKeys].forEach(key => {
      const val = localStorage.getItem(key);
      if (val) backup[key] = JSON.parse(val);
    });
    // Also save current month
    backup._meta = { monthYear, exportDate: new Date().toISOString(), version: APP_CONFIG.VERSION };
    const jsonStr = JSON.stringify(backup, null, 2);
    const filename = `JoyFeeCheck_Backup_${monthYear.replace('/', '-')}_${new Date().toISOString().slice(0,10)}.json`;

    // Method 1: Try standard Blob download
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // Use setTimeout to escape the button click handler context
    setTimeout(() => {
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      // Cleanup after a delay
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 1000);

      // Fallback: if download didn't work after 2s, open in new tab
      setTimeout(() => {
        Utils.showToast('Nếu file không tự tải về, Ctrl+S để lưu file từ tab mới', 'info');
        window.open(url, '_blank');
      }, 2000);
    }, 100);
  },

  importBackup: function(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backup = JSON.parse(e.target.result);
        if (!backup._meta) {
          Utils.showToast('File không hợp lệ (thiếu thông tin backup)', 'error');
          return;
        }
        // Restore keys
        let count = 0;
        Object.keys(backup).forEach(key => {
          if (key === '_meta') return;
          localStorage.setItem(key, JSON.stringify(backup[key]));
          count++;
        });
        Utils.showToast(`Đã phục hồi ${count} mục từ backup tháng ${backup._meta.monthYear}`, 'success');
        // Reload settings UI
        if (this.loadSettingsUI) this.loadSettingsUI();
        // Re-run matching if data available
        if (this.state.students && this.state.students.length > 0) {
          this.runMatchingBackground();
        }
      } catch (err) {
        Utils.showToast('Lỗi đọc file: ' + err.message, 'error');
      }
    };
    reader.readAsText(file);
    input.value = ''; // Reset input
  },

  // ========================
  // ACCOUNTING TAB 6: Chuyển tiền sai (allocate-then-remainder)
  // ========================
  _renderAccTab6: function() {
    const container = document.getElementById('acc-tab6-body');
    if (!container) return;
    const data = this.state.accountingData;
    if (!data || !data.tab6 || data.tab6.length === 0) {
      container.innerHTML = '<p style="text-align:center; padding:30px; color:var(--text-secondary)">Không có gia đình/cá nhân nào bị lệch tiền CK (theo thuật toán "Dò và chia tiền").</p>';
      return;
    }
    let html = '<div class="table-container"><table id="table-acc-tab6"><thead><tr><th>STT</th><th>Danh sách thành viên (số tiền được cấp)</th><th>Tổng CK thực tế</th><th>Tổng HP kỳ vọng</th><th>Chênh lệch</th><th>Lý do</th></tr></thead><tbody>';
    data.tab6.forEach((r, idx) => {
      const chenhLech = r.chenhLech || 0;
      const cls = chenhLech > 0 ? 'dư' : chenhLech < 0 ? 'thieu' : '';
      const familyBadge = r.isFamily ? '<span class="badge info" style="font-size:10px; margin-left:4px;">Gia đình</span>' : '<span class="badge" style="font-size:10px; margin-left:4px;">Cá nhân</span>';
      // Build member details display
      const members = (r.memberDetails || []).map(m => {
        const suffColor = m.sufficient === 'Đủ' ? 'var(--success-color)' : 'var(--danger-color)';
        const allocStr = Utils.formatCurrency(m.allocated);
        return `<span style="display:inline-block; margin:2px 4px 2px 0; padding:2px 8px; border-radius:6px; font-size:12px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08);">` +
          `<strong>${m.mshs}</strong> (${m.fullName || m.mshs}): ${allocStr} <span style="color:${suffColor}; font-weight:600;">[${m.sufficient}]</span></span>`;
      }).join(' ');
      html += `<tr>
        <td>${idx + 1}</td>
        <td style="font-size:12px; line-height:1.6;">${members}${familyBadge}</td>
        <td class="number" style="font-weight:600;">${Utils.formatCurrency(r.tongCKGiaDinh)}</td>
        <td class="number">${Utils.formatCurrency(r.kyVong)}</td>
        <td class="number ${cls}" style="font-weight:700;">${chenhLech > 0 ? '+' : ''}${Utils.formatCurrency(chenhLech)}</td>
        <td class="text-sm" style="color:${chenhLech > 0 ? 'var(--accent-yellow)' : 'var(--accent-red)'}; max-width:250px;">${r.lyDo || ''}</td>
      </tr>`;
    });
    html += '</tbody></table></div>';
    html += `<p style="padding:8px; font-size:12px; color:var(--text-secondary)">💡 Thuật toán "Dò và chia tiền": Dùng HP_default cho mọi thành viên (không biết học mấy lớp). Phân bổ lần lượt theo MSHS tăng dần → phần dư/thiếu cuối cùng chính là chênh lệch. Tab này CẢNH BÁO, không phải kết luận — kế toán soát tay thêm.</p>`;
    container.innerHTML = html;
  },

  // ========================
  // ACCOUNTING TAB 7: Tổng hợp — copy from other tabs
  // ========================
  copyToAccTab7: function(fromTab) {
    const data = this.state.accountingData;
    if (!data) return;
    const tabKey = 'tab' + fromTab;
    const sourceRows = data[tabKey];
    if (!sourceRows || sourceRows.length === 0) {
      Utils.showToast(`Tab ${fromTab} không có dữ liệu`, 'info');
      return;
    }
    const tagMap = { 1: 'DS HĐ tháng trước', 2: 'DS CK VTB', 3: 'Giảm bớt', 4: 'Stop - nghỉ học', 5: 'Tăng thêm', 6: 'CK sai tiền' };
    // Build master map: collect ALL classes + teacher + diaChi per MSHS
    const masterAllClasses = new Map(); // mshs → { fullName, classes: Set, teacher, hocPhi, diaChi }
    for (const s of (this.state.students || [])) {
      const m = masterAllClasses.get(s.mshs);
      if (m) {
        if (s.className) m.classes.add(s.className);
      } else {
        masterAllClasses.set(s.mshs, {
          fullName: s.fullName || '',
          classes: new Set(s.className ? [s.className] : []),
          teacher: s.teacher || '',
          hocPhi: Number(s.hocPhi) || 0,
          diaChi: s.diaChi || ''
        });
      }
    }
    const existingMshs = new Map(this.state.accTab7Rows.map(r => [r.mshs, r]));
    let added = 0;
    for (const r of sourceRows) {
      const tags = [];
      for (let t = 1; t <= 6; t++) {
        const tabRows = data['tab' + t];
        if (tabRows && tabRows.some(tr => tr.mshs === r.mshs)) {
          tags.push(tagMap[t]);
        }
      }
      const tagStr = tags.join(', ');
      const master = masterAllClasses.get(r.mshs) || {};
      // Merge all classes from master (not just the one from source tab)
      const allClasses = master.classes ? [...master.classes] : (r.className ? [r.className] : []);
      if (existingMshs.has(r.mshs)) {
        existingMshs.get(r.mshs).ghiChu = tagStr;
        // Update class if master has more classes
        if (allClasses.length > 1) {
          existingMshs.get(r.mshs).className = allClasses.join(', ');
        }
      } else {
        this.state.accTab7Rows.push({
          mshs: r.mshs,
          fullName: r.fullName || master.fullName || '',
          className: allClasses.join(', ') || r.className || '',
          hocPhi: r.hocPhi || master.hocPhi || 0,
          hocPhiDefault: r.hocPhi || master.hocPhi || 0, // original for exception detection
          teacher: master.teacher || '',
          diaChi: master.diaChi || '',
          ghiChu: tagStr,
          included: true // default checked
        });
        added++;
      }
    }
    this.renderAccountingTabs();
    Storage._set('joy_acc_tab7_rows', this.state.accTab7Rows);
    Utils.showToast(added > 0
      ? `Đã copy ${added} HS sang Tổng hợp (tags đã cập nhật)`
      : `Tags đã cập nhật cho HS có sẵn trong Tổng hợp`, added > 0 ? 'success' : 'info');
  },

  clearAccTab7: function() {
    if (this.state.accTab7Rows.length === 0) return;
    this.state.accTab7Rows = [];
    Storage._set('joy_acc_tab7_rows', []);
    this.renderAccountingTabs();
    Utils.showToast('Đã xoá tất cả trong Tổng hợp', 'success');
  },

  _renderAccTab7: function() {
    const container = document.getElementById('acc-tab7-body');
    if (!container) return;
    const rows = this.state.accTab7Rows;
    if (!rows || rows.length === 0) {
      container.innerHTML = '<p style="text-align:center; padding:30px; color:var(--text-secondary)">Chưa có dữ liệu. Bấm "📥 Copy sang Tổng hợp" ở tab bên trên.</p>';
      const filterBar = document.getElementById('acc-tab7-filter');
      if (filterBar) filterBar.innerHTML = '<span class="text-sm" style="font-weight:600;">Hiển thị Ghi chú:</span>';
      return;
    }
    // Ensure rows have included + hocPhiDefault
    rows.forEach(r => {
      if (r.included === undefined) r.included = true;
      if (r.hocPhiDefault === undefined) r.hocPhiDefault = r.hocPhi || 0;
    });
    // Collect all unique tags
    const allTags = new Set();
    rows.forEach(r => { (r.ghiChu || '').split(', ').filter(Boolean).forEach(t => allTags.add(t)); });
    // Render tag filter + sort dropdown
    const filterBar = document.getElementById('acc-tab7-filter');
    if (filterBar) {
      const activeTags = this.state.accTab7FilterTags;
      let fh = '<span class="text-sm" style="font-weight:600;">Hiển thị Ghi chú:</span>';
      fh += '<label style="font-size:12px; cursor:pointer;"><input type="checkbox" ' + (!activeTags ? 'checked' : '') + ' onchange="App.accTab7ToggleAllTags(this.checked)"> Tất cả</label>';
      [...allTags].sort().forEach(tag => {
        const ck = !activeTags || activeTags.has(tag);
        fh += '<label style="font-size:12px; cursor:pointer;"><input type="checkbox" ' + (ck ? 'checked' : '') + ' onchange="App.accTab7ToggleTag(\''+tag+'\', this.checked)"> '+tag+'</label>';
      });
      const cs = this.state.accTab7Sort || 'default';
      fh += '<span style="margin-left:auto;"></span>';
      fh += '<select class="form-control" style="width:auto; font-size:12px; padding:2px 6px;" onchange="App.accTab7SortChange(this.value)">';
      fh += '<option value="default" '+(cs==='default'?'selected':'')+'>Sắp xếp: Mặc định</option>';
      fh += '<option value="exception" '+(cs==='exception'?'selected':'')+'>⚡ Ngoại lệ lên đầu</option>';
      fh += '<option value="mshs-asc" '+(cs==='mshs-asc'?'selected':'')+'>MSHS A→Z</option>';
      fh += '<option value="name-asc" '+(cs==='name-asc'?'selected':'')+'>Họ tên A→Z</option>';
      fh += '<option value="class-asc" '+(cs==='class-asc'?'selected':'')+'>Lớp A→Z</option>';
      fh += '<option value="hp-asc" '+(cs==='hp-asc'?'selected':'')+'>Học phí ↑</option>';
      fh += '<option value="hp-desc" '+(cs==='hp-desc'?'selected':'')+'>Học phí ↓</option>';
      fh += '</select>';
      filterBar.innerHTML = fh;
    }
    // Apply sort
    let sorted = [...rows];
    const sort = this.state.accTab7Sort || 'default';
    if (sort==='exception') sorted.sort((a,b)=>{const ae=a.hocPhi!==a.hocPhiDefault?0:1;const be=b.hocPhi!==b.hocPhiDefault?0:1;return ae-be||a.mshs.localeCompare(b.mshs);});
    else if (sort==='mshs-asc') sorted.sort((a,b)=>a.mshs.localeCompare(b.mshs));
    else if (sort==='name-asc') sorted.sort((a,b)=>(a.fullName||'').localeCompare(b.fullName||''));
    else if (sort==='class-asc') sorted.sort((a,b)=>(a.className||'').localeCompare(b.className||''));
    else if (sort==='hp-asc') sorted.sort((a,b)=>(a.hocPhi||0)-(b.hocPhi||0));
    else if (sort==='hp-desc') sorted.sort((a,b)=>(b.hocPhi||0)-(a.hocPhi||0));
    // Render table
    const at = this.state.accTab7FilterTags;
    let html = '<div class="table-container"><table class="compact-table"><thead><tr><th style="width:40px">✓</th><th>STT</th><th>MSHS</th><th>Lớp</th><th>Họ tên</th><th>Giáo viên</th><th style="width:100px">Học phí</th><th>Địa chỉ</th><th>Ghi chú</th><th>Nguồn CK</th></tr></thead><tbody>';
    let totalHP=0, incCount=0;
    sorted.forEach((r, idx) => {
      const art = (r.ghiChu||'').split(', ').filter(Boolean);
      const vt = at ? art.filter(t=>at.has(t)) : art;
      const tagsH = vt.map(t=>'<span class="badge info">'+t+'</span>').join(' ');
      const isEx = r.hocPhi !== r.hocPhiDefault;
      const rs = isEx ? 'background:rgba(255,193,7,0.08);' : '';
      if (r.included) { totalHP += (r.hocPhi||0); incCount++; }
      html += '<tr style="'+rs+'">';
      html += '<td><input type="checkbox" '+(r.included?'checked':'')+' onchange="App.accTab7ToggleRow(\''+r.mshs+'\', this.checked)"></td>';
      html += '<td>'+(idx+1)+'</td><td>'+r.mshs+'</td><td>'+r.className+'</td><td>'+r.fullName+'</td>';
      html += '<td>'+(r.teacher||'')+'</td>';
      html += '<td><input type="number" class="form-control" style="width:90px;padding:2px 4px;font-size:12px;text-align:right;background:var(--bg-tertiary);border:1px solid var(--border-color);"';
      html += ' value="'+(r.hocPhi||0)+'" onchange="App.accTab7EditHP(\''+r.mshs+'\', this.value)"></td>';
      html += '<td style="font-size:12px">'+(r.diaChi||'')+'</td>';
      html += '<td style="font-size:12px">'+(tagsH||'—')+'</td>';
      // Nguồn CK: lookup reportRow để hiển thị nguồn thanh toán
      const reportRow = (this.state.reportRows || []).find(rr => rr.mshs === r.mshs);
      let nguonCK = '<span style="color:var(--text-secondary)">—</span>';
      if (reportRow) {
        const txs = reportRow.txList || [];
        if (txs.length > 0) {
          const sourceIcons = { vtb: '🏦 VTB', tpb: '🏦 TPBank', cash: '💵 Tiền mặt' };
          const summary = txs.map(tx => sourceIcons[tx.type] || tx.type).join(', ');
          nguonCK = '<span style="font-size:12px">' + summary + '</span>';
        }
      }
      html += '<td>' + nguonCK + '</td></tr>';
    });
    html += '</tbody></table></div>';
    html += '<div style="padding:8px;font-size:13px;display:flex;gap:20px;"><span>☑ Đã chọn: <strong>'+incCount+'</strong> HS</span><span>💰 Tổng cộng: <strong>'+Utils.formatCurrency(totalHP)+'</strong></span></div>';
    container.innerHTML = html;
  },

  accTab7ToggleAllTags: function(showAll) {
    this.state.accTab7FilterTags = showAll ? null : new Set();
    this._renderAccTab7();
  },

  accTab7ToggleTag: function(tag, checked) {
    let activeTags = this.state.accTab7FilterTags;
    if (!activeTags) {
      // Was showing all — build set from all tags minus this one
      activeTags = new Set();
      this.state.accTab7Rows.forEach(r => {
        (r.ghiChu || '').split(', ').filter(Boolean).forEach(t => activeTags.add(t));
      });
    }
    if (checked) activeTags.add(tag); else activeTags.delete(tag);
    // If all tags are active, set to null (show all)
    const allTags = new Set();
    this.state.accTab7Rows.forEach(r => {
      (r.ghiChu || '').split(', ').filter(Boolean).forEach(t => allTags.add(t));
    });
    this.state.accTab7FilterTags = (activeTags.size >= allTags.size) ? null : activeTags;
    this._renderAccTab7();
  },

  accTab7SortChange: function(sort) {
    this.state.accTab7Sort = sort;
    this._renderAccTab7();
  },

  accTab7ToggleRow: function(mshs, included) {
    const row = this.state.accTab7Rows.find(r => r.mshs === mshs);
    if (row) {
      row.included = included;
      Storage._set('joy_acc_tab7_rows', this.state.accTab7Rows);
      this._renderAccTab7();
    }
  },

  accTab7EditHP: function(mshs, value) {
    const row = this.state.accTab7Rows.find(r => r.mshs === mshs);
    if (row) {
      row.hocPhi = Number(value) || 0;
      Storage._set('joy_acc_tab7_rows', this.state.accTab7Rows);
      this._renderAccTab7();
    }
  },



  toggleSyncStatus: function(idx, checked) {
    const changes = Storage.loadSyncChanges() || [];
    if (changes[idx]) {
      changes[idx].synced = checked;
      Storage.saveSyncChanges(changes);
      this.renderSyncChanges();
    }
  },

  // ========================
  // EXPORT
  // ========================
  exportReport: function() {
    if (!this.state.reportRows.length) {
      Utils.showToast('Chưa có dữ liệu báo cáo', 'error');
      return;
    }
    const monthYear = document.getElementById('month-selector')?.value || '';
    const stats = Reporter.getStatistics(this.state.reportRows);
    Exporter.exportBaoCao(this.state.reportRows, stats, monthYear);
    Utils.showToast('Đã xuất file báo cáo đối soát', 'success');
  },

  exportAccountingReport: function() {
    const data = this.state.accountingData;
    if (!data) {
      Utils.showToast('Chưa có dữ liệu kế toán. Hãy chạy đối soát trước.', 'error');
      return;
    }
    const monthYear = document.getElementById('month-selector')?.value || '';
    Exporter.exportBaoCaoKeToan(data, monthYear, this.state.accTab7Rows, this.state.accTab7FilterTags);
    Utils.showToast('Đã xuất file Báo cáo Kế toán', 'success');
  },

  // Export single accounting sub-tab
  exportAccTab: function(tabNum) {
    const data = this.state.accountingData;
    if (!data) {
      Utils.showToast('Chưa có dữ liệu kế toán. Hãy chạy đối soát trước.', 'error');
      return;
    }
    const monthYear = document.getElementById('month-selector')?.value || '';
    const tabNames = {
      1: 'DS HĐ Tháng trước',
      2: 'DS CK VTB Tháng này',
      3: 'Giảm bớt',
      4: 'Stop - nghỉ học',
      5: 'Tăng mới',
      6: 'Chuyển tiền sai',
      7: 'Tổng hợp'
    };
    const tabKey = 'tab' + tabNum;
    let rows;
    if (tabNum === 7) {
      rows = this.state.accTab7Rows.filter(r => r.included !== false);
      // Also apply sort for export
      const sort = this.state.accTab7Sort || 'default';
      if (sort === 'exception') rows.sort((a,b)=>{const ae=a.hocPhi!==a.hocPhiDefault?0:1;const be=b.hocPhi!==b.hocPhiDefault?0:1;return ae-be||a.mshs.localeCompare(b.mshs);});
      else if (sort === 'mshs-asc') rows.sort((a,b)=>a.mshs.localeCompare(b.mshs));
      else if (sort === 'name-asc') rows.sort((a,b)=>(a.fullName||'').localeCompare(b.fullName||''));
      else if (sort === 'class-asc') rows.sort((a,b)=>(a.className||'').localeCompare(b.className||''));
      else if (sort === 'hp-asc') rows.sort((a,b)=>(a.hocPhi||0)-(b.hocPhi||0));
      else if (sort === 'hp-desc') rows.sort((a,b)=>(b.hocPhi||0)-(a.hocPhi||0));
    } else {
      rows = data[tabKey] || [];
    }
    if (rows.length === 0) {
      Utils.showToast('Tab này không có dữ liệu để xuất', 'info');
      return;
    }
    Exporter.exportAccTabSingle(tabNum, rows, tabNames[tabNum] || `Tab ${tabNum}`, monthYear, tabNum === 7 ? this.state.accTab7FilterTags : null);
    Utils.showToast(`Đã xuất Excel: ${tabNames[tabNum]} (${rows.length} HS)`, 'success');
  },

  // ========================
  // SETTINGS
  // ========================
  savePrevMonth: function() {
    if (!this.state.students.length) {
      Utils.showToast('Chưa có dữ liệu học sinh', 'error');
      return;
    }
    const monthYear = document.getElementById('month-selector')?.value || '';
    Storage.savePrevMonthDS(this.state.students, {
      month: monthYear,
      savedDate: new Date().toISOString()
    });
    // Save HD list — v2: save all Tab 2 MSHS (Groups A+B)
    Storage.savePrevMonthHD(this.state.ghiHDRows.map(r => r.mshs));
    
    // Auto-archive
    if (this.state.matchingDone) {
      Exporter.exportMonthlyArchive({
        students: this.state.students,
        reportRows: this.state.reportRows,
        thucTeRows: this.state.thucTeRows,
        ghiHDMSHS: this.state.ghiHDRows.map(r => r.mshs),
        changeRecords: this.state.changeRecords,
        stkPhu: Storage.loadSTKPhu(),
        keywords: Storage.loadKeywords()
      }, monthYear);
    }

    Storage.addHistory({
      date: new Date().toISOString(),
      action: 'Lưu DS tháng tham chiếu',
      detail: `Tháng ${monthYear}, ${this.state.students.length} HS`
    });
    Utils.showToast('Đã lưu DS tháng này làm tham chiếu + xuất file backup', 'success');
    this.loadSettingsUI();
  },

  // (C) Nhập DS nộp Kế toán tháng trước từ file Excel (để đối chiếu Tăng mới/Giảm/Sai số tiền)
  importPrevMonthExcel: function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      Utils.showLoading(true);
      try {
        const ds = await Importer.parseGoogleSheets(file);
        const students = ds.students || ds;
        
        // Trích MSHS có cờ ghi HĐ (cột ghiChuGiaDinh chứa 'ghi hd' / 'hóa đơn')
        const hdList = students
          .filter(s => {
            const note = (s.ghiChuGiaDinh || '').toLowerCase();
            return note.includes('ghi hd') || note.includes('hoá đơn') || note.includes('hóa đơn');
          })
          .map(s => s.mshs);
        
        // Lưu danh sách học sinh tháng trước
        const monthYear = document.getElementById('month-selector')?.value || '';
        Storage.savePrevMonthDS(students, { month: monthYear + ' (Kế toán T)', savedDate: new Date().toISOString() });
        Storage.savePrevMonthHD(hdList);
        
        // Lưu thêm trạng thái đóng tiền của từng bé (nếu có trong file)
        const paymentStatus = {};
        students.forEach(s => {
          if (s.mshs) {
            paymentStatus[s.mshs] = {
              hocPhi: s.hocPhi || 0,
              trangThai: s.ghiChuGiaDinh || ''
            };
          }
        });
        Storage._set('joy_prev_month_payment_status', paymentStatus);
        
        Storage.addHistory({
          date: new Date().toISOString(),
          action: 'Nhập DS Kế toán tháng trước',
          detail: `${students.length} HS, ${hdList.length} ghi HĐ`
        });
        Utils.showToast(`Đã nhập DS tháng trước: ${students.length} HS (${hdList.length} ghi HĐ). Tab "Thay đổi" sẽ hiển thị so sánh.`, 'success');
        this.loadSettingsUI();
      } catch (err) {
        Utils.showToast(`Lỗi đọc file: ${err.message}`, 'error');
      } finally {
        Utils.showLoading(false);
      }
    };
    input.click();
  },

  exportSTKPhu: function() {
    Exporter.exportSTKPhu(Storage.loadSTKPhu(), this.state.students);
    Utils.showToast('Đã xuất DS STK phụ (dán vào Google Trang tính)', 'success');
  },

  exportBackup: function() {
    Utils.showToast('Đã xuất file backup', 'success');
  },

  importBackup: function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          Storage.importFullBackup(data);
          Utils.showToast('Đã khôi phục dữ liệu từ backup', 'success');
          this.loadSettingsUI();
        } catch (err) {
          Utils.showToast('File backup không hợp lệ', 'error');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  },

  exportNhacPH: function() {
    if (!this.state.reportRows || this.state.reportRows.length === 0) {
      Utils.showToast('Chưa có dữ liệu báo cáo. Hãy chạy đối soát trước.', 'error');
      return;
    }
    const nhacList = Accounting.generateNhacPH(this.state.reportRows);
    if (nhacList.length === 0) {
      Utils.showToast('Không có học sinh nào cần nhắc phí!', 'info');
      return;
    }
    const monthYear = document.getElementById('month-selector')?.value || '';
    Exporter.exportNhacPH(nhacList, monthYear);
    Utils.showToast(`Đã xuất DS nhắc phí (${nhacList.length} học sinh)`, 'success');
  },

  exportMapping: function() {
    const data = {
      joy_stk_phu: Storage.loadSTKPhu(),
      joy_keywords: Storage.loadKeywords(),
      joy_family_groups: Storage.loadFamilyGroups(),
      exportDate: new Date().toISOString()
    };
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `joy_mappings.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    Utils.showToast('Đã xuất file mapping (STK + Từ khóa + Nhóm GĐ)', 'success');
  },

  importMapping: function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          let addedSTK = 0;
          let addedKw = 0;
          let addedFG = 0;
          if (data.joy_stk_phu) addedSTK = Storage.mergeSTKPhu(data.joy_stk_phu);
          if (data.joy_keywords) addedKw = Storage.mergeKeywords(data.joy_keywords);
          if (data.joy_family_groups) addedFG = Storage.mergeFamilyGroups(data.joy_family_groups);
          
          Utils.showToast(`Đã gộp mapping: +${addedSTK} STK, +${addedKw} từ khóa, +${addedFG} nhóm GĐ`, 'success');
          this.loadSettingsUI();
        } catch (err) {
          Utils.showToast('Lỗi đọc file JSON mapping', 'error');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  },

  _revalidateKeywords: function() {
    const students = this.state.students || [];
    const masterMshs = new Set(students.map(s => s.mshs));
    const keywords = Storage.loadKeywords();
    if (!keywords.length) return;

    let staleCount = 0;
    let fixedCount = 0;
    const fixed = [];
    const stale = [];

    keywords.forEach(kw => {
      if (!masterMshs.has(kw.mshs)) {
        // MSHS no longer in master — try to find by studentName
        const match = students.find(s => {
          const normName = Utils.normalizeText(s.fullName || '');
          const kwName = Utils.normalizeText(kw.studentName || '');
          return normName && kwName && (normName.includes(kwName) || kwName.includes(normName));
        });
        if (match) {
          kw.mshs = match.mshs;
          kw.studentName = match.fullName;
          fixed.push(`"${kw.keyword}" → ${match.mshs} (${match.fullName})`);
          fixedCount++;
        } else {
          stale.push(`"${kw.keyword}" → MSHS cũ ${kw.mshs} (không tìm thấy)`);
          staleCount++;
        }
      }
    });

    if (fixedCount > 0 || staleCount > 0) {
      Storage.saveKeywords(keywords);
      let msg = '';
      if (fixedCount > 0) msg += `✅ Đã tự sửa ${fixedCount} từ khóa: ${fixed.join('; ')}`;
      if (staleCount > 0) msg += `${msg ? '\n' : ''}⚠️ ${staleCount} từ khóa cần kiểm tra: ${stale.join('; ')}`;
      Utils.showToast(msg, fixedCount > 0 ? 'success' : 'warning');
    }
  },

  loadSettingsUI: function() {
    // Family groups table
    const familyGroups = Storage.loadFamilyGroups() || [];
    const fgTbody = document.querySelector('#table-family-groups tbody');
    if (fgTbody) {
      if (familyGroups.length === 0) {
        fgTbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-secondary)">Chưa có nhóm gia đình nào</td></tr>';
      } else {
        fgTbody.innerHTML = familyGroups.map(g => `<tr>
          <td>${g.groupName}</td>
          <td><code>${g.stkDaiDien}</code></td>
          <td>${g.tenPH}</td>
          <td>${g.members.join(', ')}</td>
          <td><button class="btn btn-sm btn-danger" onclick="App.deleteFamilyGroup('${g.groupId}')">Xóa</button></td>
        </tr>`).join('');
      }
    }

    // Packages table
    const packages = Storage.loadPackages() || [];
    const pkgTbody = document.querySelector('#table-packages tbody');
    if (pkgTbody) {
      if (packages.length === 0) {
        pkgTbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:var(--text-secondary)">Chưa có gói đóng học phí nào</td></tr>';
      } else {
        pkgTbody.innerHTML = packages.map(p => {
          // Calculate discount amount per student per month
          const hpDefault = APP_CONFIG.DEFAULT_HOC_PHI || 800000;
          const discountPerMonth = Math.floor(hpDefault * (p.discountPercent || 0) / 100);
          const totalDiscount = discountPerMonth * (p.months || 1) * p.members.length;
          
          // Check if package is expiring soon (last month)
          const now = new Date();
          const [endYear, endMon] = (p.endMonth || '').split('-').map(Number);
          const endDate = new Date(endYear, endMon);
          const monthsLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24 * 30));
          const isExpiring = monthsLeft <= 1 && monthsLeft >= 0;
          
          return `<tr style="${isExpiring ? 'background: rgba(255,193,7,0.1);' : ''}">
            <td>${p.packageName} ${isExpiring ? '<span style="color:var(--warning-color);">⚠ Hết hạn</span>' : ''}</td>
            <td>${p.members.join(', ')}</td>
            <td>${p.months} tháng</td>
            <td>${p.discountPercent || 0}%</td>
            <td class="number">${Utils.formatCurrency(totalDiscount)}</td>
            <td>${p.startMonth}</td>
            <td>${p.endMonth}</td>
            <td><button class="btn btn-sm btn-danger" onclick="App.deletePackage('${p.packageId}')">Xóa</button></td>
          </tr>`;
        }).join('');
      }
    }

    // Fee Adjustments table
    const adjustments = Storage.loadFeeAdjustments() || [];
    const adjTbody = document.querySelector('#table-adjustments tbody');
    if (adjTbody) {
      if (adjustments.length === 0) {
        adjTbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--text-secondary)">Chưa có điều chỉnh nào</td></tr>';
      } else {
        adjTbody.innerHTML = adjustments.map(a => `<tr>
          <td>${a.mshs}</td>
          <td>${a.studentName || ''}</td>
          <td>${a.type}</td>
          <td style="color: ${a.amount < 0 ? 'var(--color-success)' : 'var(--color-danger)'}">${Utils.formatCurrency(a.amount)}</td>
          <td>${a.monthYear}</td>
          <td class="text-sm">${a.note || ''}</td>
          <td><button class="btn btn-sm btn-danger" onclick="App.deleteAdjustment('${a.id}')">Xóa</button></td>
        </tr>`).join('');
      }
    }

    // Referrals table
    const referrals = Storage.loadReferrals() || [];
    const refTbody = document.querySelector('#table-referrals tbody');
    if (refTbody) {
      if (referrals.length === 0) {
        refTbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-secondary)">Chưa có giới thiệu nào</td></tr>';
      } else {
        refTbody.innerHTML = referrals.map(r => {
          const ph = students.find(s => s.mshs === r.mshs);
          const hs = students.find(s => s.mshs === r.referredMSHS);
          const isPending = !r.confirmed && r.applyMonth <= this.state.monthYear;
          const isConfirmed = r.confirmed;
          return `<tr style="${isPending ? 'background: rgba(255,193,7,0.1);' : ''}">
            <td>${r.mshs} - ${ph?.fullName || ''}</td>
            <td>${r.referredMSHS} - ${hs?.fullName || ''}</td>
            <td>${r.startMonth}</td>
            <td>${r.applyMonth}</td>
            <td>${isConfirmed ? '<span class="badge success">✅ Đã xác nhận</span>' : isPending ? '<span class="badge warning">⏳ Chờ xác nhận</span>' : '<span class="badge">Chưa đến hạn</span>'}</td>
            <td>
              ${isPending ? `<button class="btn btn-sm btn-primary" onclick="App.confirmReferral('${r.id}')">✅ Đã báo PH</button>` : ''}
              <button class="btn btn-sm btn-danger" onclick="App.deleteReferral('${r.id}')">Xóa</button>
            </td>
          </tr>`;
        }).join('');
      }
    }

    // STK Phu table
    const stkPhu = Storage.loadSTKPhu() || [];
    const stkTbody = document.querySelector('#table-stk-mapping tbody');
    if (stkTbody) {
      if (stkPhu.length === 0) {
        stkTbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--text-secondary)">Chưa có dữ liệu</td></tr>';
      } else {
        stkTbody.innerHTML = stkPhu.map(m => `<tr>
          <td>${m.mshs}</td>
          <td><code>${m.stk}</code></td>
          <td>${m.tenTK}</td>
          <td>
            <button class="btn btn-sm btn-outline" onclick="App.editSTKPhu('${m.stk.replace(/'/g, "\\'")}', '${m.mshs.replace(/'/g, "\\'")}', '${(m.tenTK||'').replace(/'/g, "\\'")}')">✏️</button>
            <button class="btn btn-sm btn-danger" onclick="App.deleteSTKPhu('${m.stk.replace(/'/g, "\\'")}')">Xóa</button>
          </td>
        </tr>`).join('');
      }
    }

    // Keywords table
    const keywords = Storage.loadKeywords() || [];
    const kwTbody = document.querySelector('#table-keyword-mapping tbody');
    if (kwTbody) {
      if (keywords.length === 0) {
        kwTbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--text-secondary)">Chưa có dữ liệu</td></tr>';
      } else {
        kwTbody.innerHTML = keywords.map(k => `<tr>
          <td>${k.keyword}</td>
          <td>${k.mshs}</td>
          <td>${k.studentName || ''}</td>
          <td>
            <button class="btn btn-sm btn-outline" onclick="App.editKeyword('${k.keyword.replace(/'/g, "\\'")}', '${k.mshs.replace(/'/g, "\\'")}', '${(k.studentName||'').replace(/'/g, "\\'")}')">✏️</button>
            <button class="btn btn-sm btn-danger" onclick="App.deleteKeyword('${k.keyword.replace(/'/g, "\\'")}')">Xóa</button>
          </td>
        </tr>`).join('');
      }
    }

    // Storage info
    const info = Storage.getStorageInfo();
    const prevMonthStatus = document.getElementById('status-prev-month');
    const prevAccountingStatus = document.getElementById('status-prev-accounting');
    const lastBackup = document.getElementById('status-last-backup');
    if (prevMonthStatus) {
      if (info.prevMonthInfo) {
        prevMonthStatus.textContent = `Đã có (${info.prevMonthInfo.month || 'N/A'})`;
        prevMonthStatus.className = 'badge success';
      } else {
        prevMonthStatus.textContent = 'Chưa có';
        prevMonthStatus.className = 'badge warning';
      }
    }
    if (prevAccountingStatus) {
      const prevPaymentStatus = Storage._get('joy_prev_month_payment_status', null);
      if (prevPaymentStatus && Object.keys(prevPaymentStatus).length > 0) {
        prevAccountingStatus.textContent = `Đã có (${Object.keys(prevPaymentStatus).length} HS)`;
        prevAccountingStatus.className = 'badge success';
      } else {
        prevAccountingStatus.textContent = 'Chưa có';
        prevAccountingStatus.className = 'badge warning';
      }
    }
    const prevInvoiceStatus = document.getElementById('status-prev-invoice');
    if (prevInvoiceStatus) {
      const prevInvStudents = Storage._get('joy_prev_invoice_students', []);
      if (prevInvStudents.length > 0) {
        prevInvoiceStatus.textContent = `Đã có (${prevInvStudents.length} HS)`;
        prevInvoiceStatus.className = 'badge success';
      } else {
        prevInvoiceStatus.textContent = 'Chưa có';
        prevInvoiceStatus.className = 'badge warning';
      }
    }
    if (lastBackup) {
      lastBackup.textContent = info.lastHistoryDate || 'Chưa có';
    }

    // History log
    const historyLog = document.getElementById('history-log');
    const history = Storage.loadHistory() || [];
    if (historyLog) {
      if (history.length === 0) {
        historyLog.innerHTML = '<li style="color:var(--text-secondary)">Chưa có hoạt động nào</li>';
      } else {
        historyLog.innerHTML = history.slice(0, 50).map(h => {
          const date = new Date(h.date).toLocaleString('vi-VN');
          return `<li><span class="history-date">${date}</span> <strong>${h.action}</strong>: ${h.detail}</li>`;
        }).join('');
      }
    }
  },

  deleteSTKPhu: function(stk) {
    Storage.removeSTKPhu(stk);
    Utils.showToast('Đã xóa STK phụ', 'success');
    this.loadSettingsUI();
  },

  editSTKPhu: function(oldStk, oldMshs, oldTenTK) {
    Utils.showModal(
      'Sửa STK Phụ',
      `
      <div class="form-group mb-3">
        <label>MSHS:</label>
        <input type="text" id="input-edit-stk-mshs" class="form-control" value="${oldMshs}">
      </div>
      <div class="form-group mb-3">
        <label>STK:</label>
        <input type="text" id="input-edit-stk-stk" class="form-control" value="${oldStk}">
      </div>
      <div class="form-group mb-3">
        <label>Tên TK:</label>
        <input type="text" id="input-edit-stk-ten" class="form-control" value="${oldTenTK}">
      </div>
      `,
      () => {
        const mshs = document.getElementById('input-edit-stk-mshs').value.trim().toUpperCase();
        const stk = document.getElementById('input-edit-stk-stk').value.trim();
        const tenTK = document.getElementById('input-edit-stk-ten').value.trim();
        if (!mshs || !stk) {
          Utils.showToast('MSHS và STK không được để trống', 'error');
          return false;
        }
        // Xóa cũ, thêm mới
        Storage.removeSTKPhu(oldStk);
        Storage.addSTKPhu({ mshs, stk, tenTK, addedDate: new Date().toISOString() });
        Utils.showToast(`Đã cập nhật STK ${stk} → ${mshs}`, 'success');
        this.loadSettingsUI();
        return true;
      }
    );
  },

  deleteKeyword: function(keyword) {
    Storage.removeKeyword(keyword);
    Utils.showToast('Đã xóa từ khóa', 'success');
    this.loadSettingsUI();
  },

  editKeyword: function(oldKeyword, oldMshs, oldName) {
    Utils.showModal(
      'Sửa Từ khóa',
      `
      <div class="form-group mb-3">
        <label>Từ khóa:</label>
        <input type="text" id="input-edit-kw-keyword" class="form-control" value="${oldKeyword}">
      </div>
      <div class="form-group mb-3">
        <label>MSHS:</label>
        <input type="text" id="input-edit-kw-mshs" class="form-control" value="${oldMshs}">
      </div>
      <div class="form-group mb-3">
        <label>Tên HS:</label>
        <input type="text" id="input-edit-kw-name" class="form-control" value="${oldName}">
      </div>
      `,
      () => {
        const keyword = document.getElementById('input-edit-kw-keyword').value.trim();
        const mshs = document.getElementById('input-edit-kw-mshs').value.trim().toUpperCase();
        const name = document.getElementById('input-edit-kw-name').value.trim();
        if (!keyword || !mshs) {
          Utils.showToast('Từ khóa và MSHS không được để trống', 'error');
          return false;
        }
        Storage.removeKeyword(oldKeyword);
        Storage.addKeyword({ keyword, mshs, studentName: name, addedDate: new Date().toISOString() });
        Utils.showToast(`Đã cập nhật từ khóa "${keyword}" → ${mshs}`, 'success');
        this.loadSettingsUI();
        return true;
      }
    );
  },

  addFamilyGroupUI: function() {
    Utils.showModal(
      'Thêm Nhóm Gia đình',
      `
      <div class="form-group mb-3">
        <label>Tên nhóm (gợi nhớ)</label>
        <input type="text" id="input-fg-name" class="form-control" placeholder="VD: Nhà Cô Lan">
      </div>
      <div class="form-group mb-3">
        <label>Danh sách MSHS của các con (bắt buộc)</label>
        <input type="text" id="input-fg-members" class="form-control" placeholder="Cách nhau dấu phẩy (VD: HV011, HV012)">
      </div>
      <div class="form-group mb-3">
        <label>Tên PH / Chủ tài khoản (tùy chọn)</label>
        <input type="text" id="input-fg-ten" class="form-control" placeholder="Tên phụ huynh nếu biết">
      </div>
      <div class="form-group mb-3">
        <label>STK Đại diện (tùy chọn)</label>
        <input type="text" id="input-fg-stk" class="form-control" placeholder="Bỏ trống nếu CK qua TPBank/Zalo">
      </div>
      <p class="text-sm text-secondary">Khi phụ huynh này CK, hệ thống sẽ tự chia đều cho các MSHS trên dựa theo mức học phí của từng bé.</p>
      <p class="text-sm text-secondary">💡 Chỉ cần nhập MSHS là đủ. Tên PH và STK là thông tin bổ sung, không bắt buộc.</p>
      `,
      () => {
        const groupName = document.getElementById('input-fg-name').value.trim();
        const membersRaw = document.getElementById('input-fg-members').value.trim();
        const tenPH = document.getElementById('input-fg-ten').value.trim();
        const stkDaiDien = document.getElementById('input-fg-stk').value.trim();

        if (!groupName || !membersRaw) {
          Utils.showToast('Vui lòng nhập Tên nhóm và MSHS các con', 'error');
          return false;
        }

        const members = membersRaw.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
        if (members.length < 2) {
          Utils.showToast('Nhóm gia đình phải có ít nhất 2 MSHS', 'error');
          return false;
        }

        Storage.addFamilyGroup({
          groupName,
          stkDaiDien: stkDaiDien || tenPH || groupName,
          tenPH: tenPH || '',
          members
        });

        Utils.showToast('Đã thêm nhóm gia đình', 'success');
        this.loadSettingsUI();
        return true;
      }
    );
  },

  deleteFamilyGroup: function(groupId) {
    Storage.removeFamilyGroup(groupId);
    Utils.showToast('Đã xóa nhóm gia đình', 'success');
    this.loadSettingsUI();
  },

  // ========================
  // ACTIONS: Package Payments
  // ========================
  addPackageUI: function() {
    const monthYear = document.getElementById('input-month')?.value || '';
    const discount6 = document.getElementById('input-pkg-discount-6')?.value || 6;
    const discount12 = document.getElementById('input-pkg-discount-12')?.value || 12;
    Utils.showModal(
      'Thêm Gói Đóng Góc Học Phí',
      `
      <div class="form-group mb-3">
        <label>Tên gói (gợi nhớ)</label>
        <input type="text" id="input-pkg-name" class="form-control" placeholder="VD: Gói 6 tháng Nhà Cô Lan">
      </div>
      <div class="form-group mb-3">
        <label>Danh sách MSHS của các con (bắt buộc)</label>
        <input type="text" id="input-pkg-members" class="form-control" placeholder="Cách nhau dấu phẩy (VD: HV011, HV012)">
      </div>
      <div class="form-group mb-3">
        <label>Số tháng đóng trước</label>
        <select id="input-pkg-months" class="form-control">
          <option value="6">6 tháng (giảm ${discount6}%)</option>
          <option value="12">12 tháng (giảm ${discount12}%)</option>
        </select>
      </div>
      <div class="form-group mb-3">
        <label>Tháng bắt đầu (YYYY-MM)</label>
        <input type="text" id="input-pkg-start" class="form-control" placeholder="VD: 2026-08" value="${monthYear}">
      </div>
      <p class="text-sm text-secondary">Hệ thống sẽ tự động ghi nhận các con đã đóng học phí + giảm giá cho tất cả các tháng trong gói.</p>
      `,
      () => {
        const packageName = document.getElementById('input-pkg-name').value.trim();
        const membersRaw = document.getElementById('input-pkg-members').value.trim();
        const months = parseInt(document.getElementById('input-pkg-months').value) || 6;
        const startMonth = document.getElementById('input-pkg-start').value.trim();

        if (!packageName || !membersRaw || !startMonth) {
          Utils.showToast('Vui lòng nhập Tên gói, MSHS và Tháng bắt đầu', 'error');
          return false;
        }

        // Validate month format
        if (!/^\d{4}-\d{2}$/.test(startMonth)) {
          Utils.showToast('Tháng bắt đầu phải có định dạng YYYY-MM (VD: 2026-08)', 'error');
          return false;
        }

        const members = membersRaw.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
        if (members.length < 1) {
          Utils.showToast('Vui lòng nhập ít nhất 1 MSHS', 'error');
          return false;
        }

        // Calculate end month and discount
        const [startYear, startMon] = startMonth.split('-').map(Number);
        const endDate = new Date(startYear, startMon - 1 + months);
        const endMonth = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}`;
        
        // Get discount percentage based on months
        const discountPercent = months >= 12 ? parseFloat(discount12) : parseFloat(discount6);

        Storage.addPackage({
          packageName,
          members,
          months,
          startMonth,
          endMonth,
          discountPercent
        });

        Utils.showToast(`Đã thêm gói "${packageName}" cho ${members.length} bé, ${months} tháng`, 'success');
        this.loadSettingsUI();
        return true;
      }
    );
  },

  deletePackage: function(packageId) {
    Storage.removePackage(packageId);
    Utils.showToast('Đã xóa gói', 'success');
    this.loadSettingsUI();
  },

  // ========================
  // ACTIONS: Fee Adjustments
  // ========================
  addAdjustmentUI: function() {
    const monthYear = this.state.monthYear || document.getElementById('input-month')?.value || '';
    const students = this.state.students || [];
    const mshsOptions = students.map(s => `<option value="${s.mshs}">${s.mshs} - ${s.fullName}</option>`).join('');

    Utils.showModal(
      '📝 Thêm Điều Chỉnh Học Phí',
      `
      <div class="form-group mb-3">
        <label>MSHS học viên</label>
        <select id="input-adj-mshs" class="form-control">
          <option value="">-- Chọn MSHS --</option>
          ${mshsOptions}
        </select>
      </div>
      <div class="form="form-group mb-3">
        <label>Loại điều chỉnh</label>
        <select id="input-adj-type" class="form-control">
          <option value="Giới thiệu bạn mới">🎁 Giới thiệu bạn mới (giảm tiền)</option>
          <option value="Tạm ngưng lớp">⏸️ Tạm ngưng lớp (giảm HP tháng này)</option>
          <option value="Hỗ trợ hoàn cảnh">❤️ Hỗ trợ hoàn cảnh (miễn/giảm)</option>
          <option value="Ưu đãi khác">💰 Ưu đãi khác</option>
        </select>
      </div>
      <div class="form-group mb-3">
        <label>Số tiền điều chỉnh (giảm = số âm, tăng = số dương)</label>
        <input type="number" id="input-adj-amount" class="form-control" placeholder="VD: -400000 (giảm 400k)" value="-400000">
      </div>
      <div class="form-group mb-3">
        <label>Tháng áp dụng</label>
        <input type="text" id="input-adj-month" class="form-control" placeholder="YYYY-MM" value="${monthYear}">
      </div>
      <div class="form-group mb-3">
        <label>Ghi chú (tùy chọn)</label>
        <input type="text" id="input-adj-note" class="form-control" placeholder="VD: Mẹ giới thiệu bạn mới học 3 tháng">
      </div>
      <p class="text-sm text-secondary">Số tiền âm = giảm HP. VD: -400000 = giảm 400k. Nếu HP gốc 800k, sau giảm = 400k.</p>
      `,
      () => {
        const mshs = document.getElementById('input-adj-mshs')?.value?.trim();
        const type = document.getElementById('input-adj-type')?.value;
        const amount = parseInt(document.getElementById('input-adj-amount')?.value) || 0;
        const adjMonth = document.getElementById('input-adj-month')?.value?.trim();
        const note = document.getElementById('input-adj-note')?.value?.trim();

        if (!mshs || !adjMonth) {
          Utils.showToast('Vui lòng chọn MSHS và Tháng áp dụng', 'error');
          return false;
        }
        if (amount === 0) {
          Utils.showToast('Số tiền điều chỉnh phải khác 0', 'error');
          return false;
        }

        // Validate month format
        if (!/^\d{4}-\d{2}$/.test(adjMonth)) {
          Utils.showToast('Tháng phải có định dạng YYYY-MM', 'error');
          return false;
        }

        const student = students.find(s => s.mshs === mshs);
        Storage.addFeeAdjustment({
          mshs,
          studentName: student?.fullName || '',
          type,
          amount,
          monthYear: adjMonth,
          note
        });

        // Log history
        Storage.addHistory({
          action: 'Thêm điều chỉnh HP',
          detail: `${mshs} (${student?.fullName || ''}): ${type} ${Utils.formatCurrency(amount)} tháng ${adjMonth}`
        });

        Utils.showToast(`Đã thêm điều chỉnh: ${type} ${Utils.formatCurrency(amount)} cho ${mshs}`, 'success');
        this.loadSettingsUI();
      }
    );
  },

  deleteAdjustment: function(adjId) {
    Storage.removeFeeAdjustment(adjId);
    Utils.showToast('Đã xóa điều chỉnh', 'success');
    this.loadSettingsUI();
  },

  // Mở modal điều chỉnh HP từ nút trong báo cáo
  adjustFeeFromReport: function(mshs, fullName) {
    const monthYear = this.state.monthYear || '';
    const students = this.state.students || [];
    const student = students.find(s => s.mshs === mshs);

    Utils.showModal(
      `📝 Điều chỉnh HP — ${fullName} (${mshs})`,
      `
      <div class="form-group mb-3">
        <label>MSHS</label>
        <input type="text" class="form-control" value="${mshs}" readonly style="background: var(--bg-tertiary);">
      </div>
      <div class="form-group mb-3">
        <label>Loại điều chỉnh</label>
        <select id="input-adj-type" class="form-control">
          <option value="Giới thiệu bạn mới">🎁 Giới thiệu bạn mới (giảm tiền)</option>
          <option value="Tạm ngưng lớp">⏸️ Tạm ngưng lớp (giảm HP tháng này)</option>
          <option value="Hỗ trợ hoàn cảnh">❤️ Hỗ trợ hoàn cảnh (miễn/giảm)</option>
          <option value="Ưu đãi khác">💰 Ưu đãi khác</option>
        </select>
      </div>
      <div class="form-group mb-3">
        <label>Số tiền điều chỉnh (giảm = số âm)</label>
        <input type="number" id="input-adj-amount" class="form-control" placeholder="VD: -400000 (giảm 400k)" value="-400000">
      </div>
      <div class="form-group mb-3">
        <label>Tháng áp dụng</label>
        <input type="text" id="input-adj-month" class="form-control" placeholder="YYYY-MM" value="${monthYear}">
      </div>
      <div class="form-group mb-3">
        <label>Ghi chú (tùy chọn)</label>
        <input type="text" id="input-adj-note" class="form-control" placeholder="VD: Mẹ giới thiệu bạn mới học 3 tháng">
      </div>
      <p class="text-sm text-secondary">Số tiền âm = giảm HP. VD: -400000 = giảm 400k.</p>
      `,
      () => {
        const type = document.getElementById('input-adj-type')?.value;
        const amount = parseInt(document.getElementById('input-adj-amount')?.value) || 0;
        const adjMonth = document.getElementById('input-adj-month')?.value?.trim();
        const note = document.getElementById('input-adj-note')?.value?.trim();

        if (!adjMonth) {
          Utils.showToast('Vui lòng nhập tháng áp dụng', 'error');
          return false;
        }
        if (amount === 0) {
          Utils.showToast('Số tiền điều chỉnh phải khác 0', 'error');
          return false;
        }
        if (!/^\d{4}-\d{2}$/.test(adjMonth)) {
          Utils.showToast('Tháng phải có định dạng YYYY-MM', 'error');
          return false;
        }

        Storage.addFeeAdjustment({
          mshs,
          studentName: fullName,
          type,
          amount,
          monthYear: adjMonth,
          note
        });

        Storage.addHistory({
          action: 'Thêm điều chỉnh HP',
          detail: `${mshs} (${fullName}): ${type} ${Utils.formatCurrency(amount)} tháng ${adjMonth}`
        });

        Utils.showToast(`Đã thêm điều chỉnh: ${type} ${Utils.formatCurrency(amount)} cho ${mshs}`, 'success');

        // Re-run matching to update report
        setTimeout(() => {
          this.runMatchingBackground();
        }, 100);
      }
    );
  },

  // ========================
  // ACTIONS: Referrals (Giới thiệu bạn mới)
  // ========================
  addReferralUI: function() {
    const students = this.state.students || [];
    const mshsOptions = students.map(s => `<option value="${s.mshs}">${s.mshs} - ${s.fullName}</option>`).join('');

    Utils.showModal(
      '🎁 Thêm Giới Thiệu Bạn Mới',
      `
      <div class="form-group mb-3">
        <label>PH nào được giảm? (Chọn MSHS của PH giới thiệu)</label>
        <select id="input-ref-mshs" class="form-control">
          <option value="">-- Chọn MSHS PH --</option>
          ${mshsOptions}
        </select>
      </div>
      <div class="form-group mb-3">
        <label>HS mới được giới thiệu? (Chọn MSHS HS mới)</label>
        <select id="input-ref-referred" class="form-control">
          <option value="">-- Chọn MSHS HS mới --</option>
          ${mshsOptions}
        </select>
      </div>
      <div class="form-group mb-3">
        <label>Tháng HS mới bắt đầu học (YYYY-MM)</label>
        <input type="text" id="input-ref-start" class="form-control" placeholder="VD: 2026-06">
      </div>
      <div class="form-group mb-3">
        <label>Số tiền giảm</label>
        <input type="number" id="input-ref-amount" class="form-control" value="-400000">
      </div>
      <p class="text-sm text-secondary">Sau 3 tháng HS mới học → Hệ thống tự nhắc để trừ tiền. Mỗi HS mới chỉ được giới thiệu 1 lần (chống trùng).</p>
      `,
      () => {
        const mshs = document.getElementById('input-ref-mshs')?.value?.trim();
        const referredMSHS = document.getElementById('input-ref-referred')?.value?.trim();
        const startMonth = document.getElementById('input-ref-start')?.value?.trim();
        const amount = parseInt(document.getElementById('input-ref-amount')?.value) || -400000;

        if (!mshs || !referredMSHS || !startMonth) {
          Utils.showToast('Vui lòng nhập đầy đủ thông tin', 'error');
          return false;
        }
        if (mshs === referredMSHS) {
          Utils.showToast('MSHS giới thiệu và HS mới phải khác nhau', 'error');
          return false;
        }
        if (!/^\d{4}-\d{2}$/.test(startMonth)) {
          Utils.showToast('Tháng phải có định dạng YYYY-MM', 'error');
          return false;
        }

        // Calculate apply month (month 4 = start + 3)
        const [startYear, startMon] = startMonth.split('-').map(Number);
        const applyDate = new Date(startYear, startMon - 1 + 3);
        const applyMonth = `${applyDate.getFullYear()}-${String(applyDate.getMonth() + 1).padStart(2, '0')}`;

        const result = Storage.addReferral({
          mshs,
          referredMSHS,
          startMonth,
          applyMonth,
          amount,
          note: `Giới thiệu ${referredMSHS} bắt đầu ${startMonth}`
        });

        if (result.error) {
          Utils.showToast(result.error, 'error');
          return false;
        }

        const ph = students.find(s => s.mshs === mshs);
        const hs = students.find(s => s.mshs === referredMSHS);
        Storage.addHistory({
          action: 'Thêm giới thiệu bạn mới',
          detail: `${mshs} (${ph?.fullName || ''}) giới thiệu ${referredMSHS} (${hs?.fullName || ''}) bắt đầu ${startMonth}, áp dụng ${applyMonth}`
        });

        Utils.showToast(`Đã thêm: ${mshs} giới thiệu ${referredMSHS}. Áp dụng giảm từ ${applyMonth}`, 'success');
        this.loadSettingsUI();
      }
    );
  },

  confirmReferral: function(refId) {
    const ref = Storage.loadReferrals().find(r => r.id === refId);
    if (!ref) return;

    const monthYear = this.state.monthYear || '';
    const students = this.state.students || [];
    const ph = students.find(s => s.mshs === ref.mshs);

    Utils.showModal(
      '✅ Xác nhận đã báo PH',
      `<p>Đã thông báo <b>${ph?.fullName || ref.mshs}</b> về việc giảm ${Utils.formatCurrency(ref.amount)}?</p>
       <p class="text-sm text-secondary">Sau khi xác nhận, hệ thống sẽ áp dụng giảm HP tự động.</p>`,
      () => {
        // Apply fee adjustment
        Storage.addFeeAdjustment({
          mshs: ref.mshs,
          studentName: ph?.fullName || '',
          type: 'Giới thiệu bạn mới',
          amount: ref.amount,
          monthYear: ref.applyMonth,
          note: `Giới thiệu ${ref.referredMSHS}`
        });

        // Confirm referral
        Storage.confirmReferral(refId);

        Storage.addHistory({
          action: 'Xác nhận giới thiệu bạn mới',
          detail: `${ref.mshs} (${ph?.fullName || ''}): Đã xác nhận giảm ${Utils.formatCurrency(ref.amount)} tháng ${ref.applyMonth}`
        });

        Utils.showToast(`Đã xác nhận! ${ref.mshs} được giảm ${Utils.formatCurrency(ref.amount)} tháng ${ref.applyMonth}`, 'success');
        this.loadSettingsUI();
      }
    );
  },

  deleteReferral: function(refId) {
    Storage.removeReferral(refId);
    Utils.showToast('Đã xóa giới thiệu', 'success');
    this.loadSettingsUI();
  },

  // ========================
  // ACTIONS: Suspended Students
  // ========================
  suspendStudentUI: function() {
    const monthYear = this.state.monthYear || '';
    const students = this.state.students || [];
    const suspended = Storage.getSuspendedForMonth(monthYear);
    const suspendedMSHS = new Set(suspended.map(s => `${s.mshs}_${s.className}`));
    const activeStudents = students.filter(s => {
      const classes = s.className ? s.className.split(',').map(c => c.trim()) : [];
      return classes.length > 0 && !classes.some(c => suspendedMSHS.has(`${s.mshs}_${c}`));
    });
    const mshsOptions = activeStudents.map(s => `<option value="${s.mshs}">${s.mshs} - ${s.fullName}</option>`).join('');

    Utils.showModal(
      '⏸️ Tạm ngưng HS',
      `
      <div class="form-group mb-3">
        <label>Chọn HS tạm ngưng</label>
        <select id="input-sus-mshs" class="form-control" onchange="App.updateSuspendClasses()">
          <option value="">-- Chọn MSHS --</option>
          ${mshsOptions}
        </select>
      </div>
      <div class="form-group mb-3">
        <label>Chọn lớp tạm ngưng</label>
        <select id="input-sus-class" class="form-control">
          <option value="">-- Chọn HS trước --</option>
        </select>
      </div>
      <div class="form-group mb-3">
        <label>Tháng</label>
        <input type="text" id="input-sus-month" class="form-control" placeholder="YYYY-MM" value="${monthYear}">
      </div>
      <div class="form-group mb-3">
        <label>Lý do (tùy chọn)</label>
        <input type="text" id="input-sus-note" class="form-control" placeholder="VD: Bé bận, gia đình đi vắng">
      </div>
      `,
      () => {
        const mshs = document.getElementById('input-sus-mshs')?.value?.trim();
        const className = document.getElementById('input-sus-class')?.value?.trim();
        const susMonth = document.getElementById('input-sus-month')?.value?.trim();
        const note = document.getElementById('input-sus-note')?.value?.trim();

        if (!mshs || !className || !susMonth) {
          Utils.showToast('Vui lòng chọn HS, lớp và tháng', 'error');
          return false;
        }
        if (!/^\d{4}-\d{2}$/.test(susMonth)) {
          Utils.showToast('Tháng phải có định dạng YYYY-MM', 'error');
          return false;
        }

        const student = students.find(s => s.mshs === mshs);
        const result = Storage.addSuspended({
          mshs,
          studentName: student?.fullName || '',
          className,
          monthYear: susMonth,
          note
        });

        if (result.error) {
          Utils.showToast(result.error, 'error');
          return false;
        }

        Storage.addHistory({
          action: 'Tạm ngưng lớp',
          detail: `${mshs} (${student?.fullName || ''}) - lớp ${className} tháng ${susMonth}`
        });

        Utils.showToast(`Đã tạm ngưng ${mshs} - lớp ${className} tháng ${susMonth}`, 'success');
        this.renderSuspendedTable();
        this.runMatchingBackground();
      }
    );
  },

  updateSuspendClasses: function() {
    const mshs = document.getElementById('input-sus-mshs')?.value;
    const classSelect = document.getElementById('input-sus-class');
    if (!mshs || !classSelect) return;
    const students = this.state.students || [];
    const student = students.find(s => s.mshs === mshs);
    const classes = student?.className ? student.className.split(',').map(c => c.trim()) : [];
    const monthYear = document.getElementById('input-sus-month')?.value || this.state.monthYear || '';
    const suspended = Storage.getSuspendedForMonth(monthYear);
    const suspendedClasses = new Set(suspended.filter(s => s.mshs === mshs).map(s => s.className));
    const available = classes.filter(c => !suspendedClasses.has(c));
    classSelect.innerHTML = available.length > 0
      ? available.map(c => `<option value="${c}">${c}</option>`).join('')
      : '<option value="">Tất cả lớp đã tạm ngưng</option>';
  },

  unsuspendStudent: function(susId) {
    Storage.removeSuspended(susId);
    Utils.showToast('Đã bỏ tạm ngưng', 'success');
    this.renderSuspendedTable();
    this.runMatchingBackground();
  },

  renderSuspendedTable: function() {
    const monthYear = this.state.monthYear || '';
    const suspended = Storage.getSuspendedForMonth(monthYear);
    const tbody = document.querySelector('#table-suspended tbody');
    if (!tbody) return;
    if (suspended.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-secondary)">Không có HS tạm ngưng tháng này</td></tr>';
      return;
    }
    tbody.innerHTML = suspended.map(s => `<tr>
      <td>${s.mshs}</td>
      <td>${s.studentName || ''}</td>
      <td>${s.className}</td>
      <td>${s.monthYear}</td>
      <td class="text-sm">${s.note || ''}</td>
      <td><button class="btn btn-sm btn-primary" onclick="App.unsuspendStudent('${s.id}')">Bỏ ngưng</button></td>
    </tr>`).join('');
  },

  // Tạm ngưng nhanh từ nút ⏸️ trong báo cáo
  quickSuspend: function(mshs, fullName) {
    const monthYear = this.state.monthYear || '';
    const students = this.state.students || [];
    const student = students.find(s => s.mshs === mshs);
    const classes = student?.className ? student.className.split(',').map(c => c.trim()) : [];
    const suspended = Storage.getSuspendedForMonth(monthYear);
    const suspendedClasses = new Set(suspended.filter(s => s.mshs === mshs).map(s => s.className));
    const available = classes.filter(c => !suspendedClasses.has(c));

    if (available.length === 0) {
      Utils.showToast(`${fullName} đã tạm ngưng tất cả lớp tháng này`, 'warning');
      return;
    }

    Utils.showModal(
      `⏸️ Tạm ngưng — ${fullName} (${mshs})`,
      `
      <div class="form-group mb-3">
        <label>Lớp tạm ngưng</label>
        <select id="input-sus-class" class="form-control">
          ${available.map(c => `<option value="${c}">${c}</option>`).join('')}
        </select>
      </div>
      <div class="form-group mb-3">
        <label>Tháng</label>
        <input type="text" id="input-sus-month" class="form-control" value="${monthYear}" readonly style="background: var(--bg-tertiary);">
      </div>
      <div class="form-group mb-3">
        <label>Lý do (tùy chọn)</label>
        <input type="text" id="input-sus-note" class="form-control" placeholder="VD: Bé bận">
      </div>
      `,
      () => {
        const className = document.getElementById('input-sus-class')?.value?.trim();
        const note = document.getElementById('input-sus-note')?.value?.trim();

        if (!className) {
          Utils.showToast('Vui lòng chọn lớp', 'error');
          return false;
        }

        const result = Storage.addSuspended({
          mshs,
          studentName: fullName,
          className,
          monthYear,
          note
        });

        if (result.error) {
          Utils.showToast(result.error, 'error');
          return false;
        }

        Storage.addHistory({
          action: 'Tạm ngưng lớp',
          detail: `${mshs} (${fullName}) - lớp ${className} tháng ${monthYear}`
        });

        Utils.showToast(`Đã tạm ngưng ${fullName} - lớp ${className}`, 'success');
        this.renderSuspendedTable();
        this.runMatchingBackground();
      }
    );
  },

  // Tạm ngưng HS chưa đóng — hiện danh sách có checkbox để chọn
  suspendUnpaidStudents: function() {
    // Save current filter state before suspend
    this._savedFilters = {
      trangThai: document.getElementById('filter-status')?.value || 'all',
      className: document.getElementById('filter-class')?.value || 'all',
      teacher: document.getElementById('filter-teacher')?.value || 'all',
      searchText: document.getElementById('search-report')?.value || ''
    };

    const monthYear = this.state.monthYear || '';
    const suspended = Storage.getSuspendedForMonth(monthYear);
    const suspendedSet = new Set(suspended.map(s => `${s.mshs}_${s.className}`));

    // Find unpaid students not yet suspended
    const unpaid = (this.state.reportRows || []).filter(r => {
      if (r.trangThai !== APP_CONFIG.STATUS.UNPAID) return false;
      const classes = r.className ? r.className.split(',').map(c => c.trim()) : [];
      return classes.some(c => !suspendedSet.has(`${r.mshs}_${c}`));
    });

    if (unpaid.length === 0) {
      Utils.showToast('Không có HS "Chưa đóng" nào cần tạm ngưng', 'info');
      return;
    }

    // Build checkbox list
    const rowsHtml = unpaid.map((r, idx) => {
      const classes = r.className ? r.className.split(',').map(c => c.trim()) : [];
      const available = classes.filter(c => !suspendedSet.has(`${r.mshs}_${c}`));
      return `<tr>
        <td><input type="checkbox" class="sus-check" data-mshs="${r.mshs}" data-name="${r.fullName}" data-classes='${JSON.stringify(available)}' checked></td>
        <td>${r.mshs}</td>
        <td>${r.fullName}</td>
        <td>${available.join(', ')}</td>
      </tr>`;
    }).join('');

    Utils.showModal(
      `📋 DS Chưa đóng → Tạm ngưng (${unpaid.length} HS)`,
      `<p>Chọn HS cần tạm ngưng (bỏ tick HS nào chỉ đóng chậm):</p>
       <div style="margin-bottom:8px;">
         <label style="cursor:pointer; font-size:13px;"><input type="checkbox" id="sus-check-all" checked onchange="App.toggleAllSusCheck(this.checked)"> <strong>Chọn tất cả</strong></label>
       </div>
       <div style="max-height:300px; overflow-y:auto;">
         <table class="compact-table" style="width:100%"><thead><tr><th style="width:40px"></th><th>MSHS</th><th>Họ tên</th><th>Lớp</th></tr></thead>
         <tbody>${rowsHtml}</tbody></table>
       </div>
       <p class="mt-2 text-sm text-secondary">Lý do sẽ tự ghi: "Chưa đóng HP — tháng ${monthYear}"</p>`,
      () => {
        const checks = document.querySelectorAll('.sus-check:checked');
        if (checks.length === 0) {
          Utils.showToast('Chưa chọn HS nào', 'warning');
          return false;
        }
        let count = 0;
        checks.forEach(cb => {
          const mshs = cb.dataset.mshs;
          const name = cb.dataset.name;
          const classes = JSON.parse(cb.dataset.classes);
          classes.forEach(c => {
            Storage.addSuspended({
              mshs,
              studentName: name,
              className: c,
              monthYear,
              note: `Chưa đóng HP — tháng ${monthYear}`
            });
            count++;
          });
        });
        Utils.showToast(`Đã tạm ngưng ${count} lớp của ${checks.length} HS`, 'success');
        // Verify data was saved
        const verifyList = Storage.getSuspendedForMonth(monthYear);
        console.log('[Suspend] Saved count:', count, 'Verified in storage:', verifyList.length, 'monthYear:', monthYear);
        // Re-render suspended table
        this.renderSuspendedTable();
        // Restore saved filter state (both data + dropdown UI)
        this.applyReportFilters(this._savedFilters);
        if (this._savedFilters) {
          const fs = document.getElementById('filter-status');
          const fc = document.getElementById('filter-class');
          const ft = document.getElementById('filter-teacher');
          if (fs) fs.value = this._savedFilters.trangThai || 'all';
          if (fc) fc.value = this._savedFilters.className || 'all';
          if (ft) ft.value = this._savedFilters.teacher || 'all';
        }
      }
    );
  },

  toggleAllSusCheck: function(checked) {
    document.querySelectorAll('.sus-check').forEach(cb => { cb.checked = checked; });
  },

  // ========================
  // ACTIONS: Quick Family Group from Report
  // ========================
  addFamilyGroupForStudent: function(mshs, fullName) {
    // Pre-fill form with this student's info
    Utils.showModal(
      `Thêm Nhóm Gia đình — ${fullName} (${mshs})`,
      `
      <div class="form-group mb-3">
        <label>Tên nhóm (gợi nhớ)</label>
        <input type="text" id="input-fg-name" class="form-control" placeholder="VD: Nhà ${fullName}" value="Nhà ${fullName}">
      </div>
      <div class="form-group mb-3">
        <label>Danh sách MSHS của các con (bắt buộc)</label>
        <input type="text" id="input-fg-members" class="form-control" placeholder="Cách nhau dấu phẩy" value="${mshs}, ">
      </div>
      <div class="form-group mb-3">
        <label>Tên PH / Chủ tài khoản (tùy chọn)</label>
        <input type="text" id="input-fg-ten" class="form-control" placeholder="Tên phụ huynh nếu biết">
      </div>
      <div class="form-group mb-3">
        <label>STK Đại diện (tùy chọn)</label>
        <input type="text" id="input-fg-stk" class="form-control" placeholder="Bỏ trống nếu CK qua TPBank/Zalo">
      </div>
      <p class="text-sm text-secondary">💡 Bổ sung thêm MSHS anh chị em vào ô trên, rồi bấm Xác nhận.</p>
      `,
      () => {
        const groupName = document.getElementById('input-fg-name').value.trim();
        const membersRaw = document.getElementById('input-fg-members').value.trim();
        const tenPH = document.getElementById('input-fg-ten').value.trim();
        const stkDaiDien = document.getElementById('input-fg-stk').value.trim();

        if (!groupName || !membersRaw) {
          Utils.showToast('Vui lòng nhập Tên nhóm và MSHS các con', 'error');
          return false;
        }

        const members = membersRaw.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
        if (members.length < 2) {
          Utils.showToast('Nhóm gia đình phải có ít nhất 2 MSHS', 'error');
          return false;
        }

        Storage.addFamilyGroup({
          groupName,
          stkDaiDien: stkDaiDien || tenPH || groupName,
          tenPH: tenPH || '',
          members
        });

        Utils.showToast(`Đã thêm nhóm gia đình: ${groupName}`, 'success');
        this.loadSettingsUI();
        return true;
      }
    );
  },

  // ========================
  // ACTIONS: Book Fee Mark
  // ========================
  markBookFee: function(mshs) {
    Utils.showModal(
      `📚 Ghi nhận Tiền sách — ${mshs}`,
      `
      <p>Học sinh <strong>${mshs}</strong> đóng dư học phí.</p>
      <div class="form-group mt-3">
        <label>Số tiền sách (VNĐ):</label>
        <input type="text" id="input-book-fee" class="form-control" placeholder="VD: 200000" autofocus>
      </div>
      <p class="text-sm text-secondary">Sau khi xác nhận, ghi chú "📚 Tiền sách: X.XXX.XXXđ" sẽ được thêm vào dòng này.</p>
      `,
      () => {
        const amount = Utils.parseNumber(document.getElementById('input-book-fee')?.value);
        if (!amount || amount <= 0) {
          Utils.showToast('Vui lòng nhập số tiền sách hợp lệ', 'error');
          return false;
        }

        // Update the report row note
        const row = this.state.reportRows.find(r => r.mshs === mshs);
        if (row) {
          const bookNote = `📚 Tiền sách: ${Utils.formatCurrency(amount)}`;
          row.ghiChu = row.ghiChu ? row.ghiChu + ' · ' + bookNote : bookNote;
          row.tienSach = amount;
          // Re-render report
          this.renderReportTable(this.state.reportRows);
        }

        Utils.showToast(`Đã ghi nhận tiền sách ${Utils.formatCurrency(amount)} cho ${mshs}`, 'success');
        return true;
      }
    );
  }
};

// ========================
// BOOTSTRAP
// ========================
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
