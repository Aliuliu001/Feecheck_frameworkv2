/**
 * Storage - Quản lý lưu trữ local storage
 */

window.Storage = {
  // Lấy dữ liệu từ localStorage
  _get: function(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      console.error(`Error reading ${key} from localStorage:`, e);
      return defaultValue;
    }
  },

  // Lưu dữ liệu vào localStorage
  _set: function(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error(`Error saving ${key} to localStorage:`, e);
      if (window.Utils) window.Utils.showToast('Lỗi khi lưu dữ liệu. Có thể do bộ nhớ đầy.', 'error');
      return false;
    }
  },

  // STK PHỤ
  saveSTKPhu: function(data) {
    return this._set(APP_CONFIG.STORAGE_KEYS.STK_PHU, data);
  },
  loadSTKPhu: function() {
    return this._get(APP_CONFIG.STORAGE_KEYS.STK_PHU, []);
  },
  addSTKPhu: function(mapping) {
    const list = this.loadSTKPhu();
    // Xóa cái cũ nếu có cùng STK
    const filtered = list.filter(item => item.stk !== mapping.stk);
    filtered.push({
      ...mapping,
      addedDate: new Date().toISOString()
    });
    this.saveSTKPhu(filtered);
  },
  removeSTKPhu: function(stk) {
    const list = this.loadSTKPhu();
    this.saveSTKPhu(list.filter(item => item.stk !== stk));
  },
  mergeSTKPhu: function(newList) {
    if (!Array.isArray(newList)) return 0;
    const currentList = this.loadSTKPhu();
    const currentMap = new Map(currentList.map(item => [item.stk, item]));
    let count = 0;
    
    newList.forEach(newItem => {
      if (newItem.stk && !currentMap.has(newItem.stk)) {
        const entry = {
          ...newItem,
          addedDate: newItem.addedDate || new Date().toISOString()
        };
        currentList.push(entry);
        currentMap.set(newItem.stk, entry);
        count++;
      }
    });
    
    if (count > 0) {
      this.saveSTKPhu(currentList);
    }
    return count;
  },

  // TỪ KHÓA
  saveKeywords: function(data) {
    return this._set(APP_CONFIG.STORAGE_KEYS.KEYWORDS, data);
  },
  loadKeywords: function() {
    return this._get(APP_CONFIG.STORAGE_KEYS.KEYWORDS, []);
  },
  addKeyword: function(mapping) {
    const list = this.loadKeywords();
    const filtered = list.filter(item => item.keyword !== mapping.keyword);
    filtered.push({
      ...mapping,
      addedDate: new Date().toISOString()
    });
    this.saveKeywords(filtered);
  },
  removeKeyword: function(keyword) {
    const list = this.loadKeywords();
    this.saveKeywords(list.filter(item => item.keyword !== keyword));
  },
  mergeKeywords: function(newList) {
    if (!Array.isArray(newList)) return 0;
    const currentList = this.loadKeywords();
    const currentMap = new Map(currentList.map(item => [item.keyword, item]));
    let count = 0;
    
    newList.forEach(newItem => {
      if (newItem.keyword && !currentMap.has(newItem.keyword)) {
        const entry = {
          ...newItem,
          addedDate: newItem.addedDate || new Date().toISOString()
        };
        currentList.push(entry);
        currentMap.set(newItem.keyword, entry);
        count++;
      }
    });
    
    if (count > 0) {
      this.saveKeywords(currentList);
    }
    return count;
  },

  // NHÓM GIA ĐÌNH
  loadFamilyGroups: function() {
    return this._get(APP_CONFIG.STORAGE_KEYS.FAMILY_GROUPS, []);
  },
  saveFamilyGroups: function(data) {
    return this._set(APP_CONFIG.STORAGE_KEYS.FAMILY_GROUPS, data);
  },
  addFamilyGroup: function(group) {
    const list = this.loadFamilyGroups();
    const newGroup = {
      ...group,
      groupId: 'GD' + Date.now(),
      addedDate: new Date().toISOString()
    };
    list.push(newGroup);
    this.saveFamilyGroups(list);
    return newGroup.groupId;
  },
  removeFamilyGroup: function(groupId) {
    let list = this.loadFamilyGroups();
    list = list.filter(g => g.groupId !== groupId);
    this.saveFamilyGroups(list);
  },
  mergeFamilyGroups: function(newList) {
    if (!Array.isArray(newList)) return 0;
    const currentList = this.loadFamilyGroups();
    const currentMap = new Map(currentList.map(item => [item.groupId, item]));
    let count = 0;
    
    newList.forEach(newItem => {
      if (newItem.groupId && !currentMap.has(newItem.groupId)) {
        currentList.push(newItem);
        currentMap.set(newItem.groupId, newItem);
        count++;
      }
    });
    
    if (count > 0) {
      this.saveFamilyGroups(currentList);
    }
    return count;
  },

  // THANH TOÁN THÁNG TRƯỚC
  addPreviousMonthPayment: function(payment) {
    const list = this._get(APP_CONFIG.STORAGE_KEYS.PREV_MONTH_PAYMENTS, []);
    list.push({
      ...payment,
      id: 'PMP' + Date.now(),
      date: new Date().toISOString()
    });
    this._set(APP_CONFIG.STORAGE_KEYS.PREV_MONTH_PAYMENTS, list);
  },
  loadPreviousMonthPayments: function() {
    return this._get(APP_CONFIG.STORAGE_KEYS.PREV_MONTH_PAYMENTS, []);
  },
  clearPreviousMonthPayments: function() {
    this._set(APP_CONFIG.STORAGE_KEYS.PREV_MONTH_PAYMENTS, []);
  },

  // HỌC PHÍ ĐÓNG GÓI (nhiều tháng)
  savePackages: function(data) {
    return this._set(APP_CONFIG.STORAGE_KEYS.PACKAGES, data);
  },
  loadPackages: function() {
    return this._get(APP_CONFIG.STORAGE_KEYS.PACKAGES, []);
  },
  addPackage: function(pkg) {
    const list = this.loadPackages();
    const newPkg = {
      ...pkg,
      packageId: 'PKG' + Date.now(),
      addedDate: new Date().toISOString()
    };
    list.push(newPkg);
    this.savePackages(list);
    return newPkg.packageId;
  },
  removePackage: function(packageId) {
    let list = this.loadPackages();
    list = list.filter(p => p.packageId !== packageId);
    this.savePackages(list);
  },
  // Kiểm tra MSHS có đang trong gói đóng tiền không
  isPackageActive: function(mshs, monthYear) {
    const packages = this.loadPackages();
    for (const pkg of packages) {
      if (!pkg.members || !pkg.members.includes(mshs.toUpperCase())) continue;
      // monthYear format: "2026-08"
      const [pkgYear, pkgMonth] = pkg.startMonth.split('-').map(Number);
      const [curYear, curMonth] = monthYear.split('-').map(Number);
      const pkgStart = pkgYear * 12 + pkgMonth;
      const pkgEnd = pkgStart + (pkg.months || 1) - 1;
      const cur = curYear * 12 + curMonth;
      if (cur >= pkgStart && cur <= pkgEnd) {
        return { active: true, packageName: pkg.packageName || pkg.groupName, startMonth: pkg.startMonth, endMonth: pkg.endMonth || '', discountPercent: pkg.discountPercent || 0 };
      }
    }
    return { active: false };
  },

  // DỮ LIỆU THÁNG TRƯỚC
  savePrevMonthDS: function(data, monthInfo) {
    this._set(APP_CONFIG.STORAGE_KEYS.PREV_MONTH_DS, data);
    if (monthInfo) {
      this._set(APP_CONFIG.STORAGE_KEYS.PREV_MONTH_INFO, {
        ...monthInfo,
        savedDate: new Date().toISOString()
      });
    }
  },
  loadPrevMonthDS: function() {
    return this._get(APP_CONFIG.STORAGE_KEYS.PREV_MONTH_DS, []);
  },
  savePrevMonthHD: function(data) {
    this._set(APP_CONFIG.STORAGE_KEYS.PREV_MONTH_HD, data);
  },
  loadPrevMonthHD: function() {
    return this._get(APP_CONFIG.STORAGE_KEYS.PREV_MONTH_HD, []);
  },

  // THAY ĐỔI ĐỒNG BỘ
  saveSyncChanges: function(changes) {
    return this._set(APP_CONFIG.STORAGE_KEYS.SYNC_CHANGES, changes);
  },
  loadSyncChanges: function() {
    return this._get(APP_CONFIG.STORAGE_KEYS.SYNC_CHANGES, []);
  },
  addSyncChange: function(change) {
    const list = this.loadSyncChanges();
    list.push({
      ...change,
      date: new Date().toISOString(),
      synced: false
    });
    this.saveSyncChanges(list);
  },

  // LỊCH SỬ
  addHistory: function(entry) {
    const list = this.loadHistory();
    list.unshift({
      ...entry,
      date: new Date().toISOString()
    });
    // Giữ lại 100 bản ghi gần nhất
    if (list.length > 100) list.length = 100;
    this._set(APP_CONFIG.STORAGE_KEYS.HISTORY, list);
  },
  loadHistory: function() {
    return this._get(APP_CONFIG.STORAGE_KEYS.HISTORY, []);
  },

  // ========================
  // ĐIỀU CHỈNH HỌC PHÍ
  // ========================
  addFeeAdjustment: function(adj) {
    const list = this.loadFeeAdjustments();
    list.push({
      id: 'adj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      ...adj,
      createdDate: new Date().toISOString()
    });
    this._set('joy_fee_adjustments', list);
    return list;
  },
  loadFeeAdjustments: function() {
    return this._get('joy_fee_adjustments', []);
  },
  removeFeeAdjustment: function(id) {
    const list = this.loadFeeAdjustments().filter(a => a.id !== id);
    this._set('joy_fee_adjustments', list);
    return list;
  },
  // Lấy tổng số tiền điều chỉnh cho 1 MSHS trong 1 tháng
  getAdjustmentForStudent: function(mshs, monthYear) {
    const list = this.loadFeeAdjustments();
    return list.filter(a => a.mshs === mshs && a.monthYear === monthYear);
  },

  // ========================
  // GIỚI THIỆU BẠN MỚI
  // ========================
  addReferral: function(ref) {
    const list = this.loadReferrals();
    // Chống trùng: HS mới đã được ai giới thiệu chưa?
    const exists = list.find(r => r.referredMSHS === ref.referredMSHS);
    if (exists) return { error: `HS ${ref.referredMSHS} đã được ${exists.mshs} giới thiệu trước đó` };
    list.push({
      id: 'ref_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      ...ref,
      confirmed: false,
      createdDate: new Date().toISOString()
    });
    this._set('joy_referrals', list);
    return { success: true };
  },
  loadReferrals: function() {
    return this._get('joy_referrals', []);
  },
  confirmReferral: function(refId) {
    const list = this.loadReferrals();
    const ref = list.find(r => r.id === refId);
    if (ref) {
      ref.confirmed = true;
      ref.confirmedDate = new Date().toISOString();
      this._set('joy_referrals', list);
    }
    return list;
  },
  removeReferral: function(refId) {
    const list = this.loadReferrals().filter(r => r.id !== refId);
    this._set('joy_referrals', list);
    return list;
  },
  // Kiểm tra referral nào đã đủ 3 tháng và chưa xác nhận
  getPendingReferrals: function(monthYear) {
    const list = this.loadReferrals();
    return list.filter(r => !r.confirmed && r.applyMonth && r.applyMonth <= monthYear);
  },

  // ========================
  // TẠM NGƯNG LỚP
  // ========================
  addSuspended: function(sus) {
    const list = this.loadSuspended();
    // Chống trùng: HS + lớp + tháng đã tạm ngưng chưa?
    const exists = list.find(s => s.mshs === sus.mshs && s.className === sus.className && s.monthYear === sus.monthYear);
    if (exists) return { error: `${sus.mshs} lớp ${sus.className} đã tạm ngưng tháng ${sus.monthYear}` };
    list.push({
      id: 'sus_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      ...sus,
      createdDate: new Date().toISOString()
    });
    this._set('joy_suspended', list);
    return { success: true };
  },
  loadSuspended: function() {
    return this._get('joy_suspended', []);
  },
  removeSuspended: function(susId) {
    const list = this.loadSuspended().filter(s => s.id !== susId);
    this._set('joy_suspended', list);
    return list;
  },
  getSuspendedForMonth: function(monthYear) {
    const list = this.loadSuspended();
    return list.filter(s => s.monthYear === monthYear);
  },

  // BACKUP & RESTORE
  exportFullBackup: function() {
    const backup = {};
    Object.values(APP_CONFIG.STORAGE_KEYS).forEach(key => {
      backup[key] = this._get(key);
    });
    backup.backupDate = new Date().toISOString();
    backup.version = APP_CONFIG.VERSION;
    return backup;
  },
  importFullBackup: function(json) {
    if (!json || typeof json !== 'object') return false;
    let success = true;
    Object.values(APP_CONFIG.STORAGE_KEYS).forEach(key => {
      if (json[key] !== undefined) {
        if (!this._set(key, json[key])) success = false;
      }
    });
    return success;
  },

  // THỐNG KÊ
  getStorageInfo: function() {
    const stkCount = this.loadSTKPhu().length;
    const kwCount = this.loadKeywords().length;
    const history = this.loadHistory();
    const prevMonthInfo = this._get(APP_CONFIG.STORAGE_KEYS.PREV_MONTH_INFO, null);
    
    return {
      stkCount,
      keywordCount: kwCount,
      lastHistoryDate: history.length > 0 ? history[0].date : null,
      prevMonthStatus: prevMonthInfo
    };
  }
};
