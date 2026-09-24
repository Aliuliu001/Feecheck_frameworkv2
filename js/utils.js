/**
 * Tiện ích chung cho Joy Fee Check
 */

window.Utils = {
  // Loại bỏ khoảng trắng, dấu chấm, dấu gạch ngang từ STK
  normalizeSTK: function(stk) {
    if (!stk) return '';
    return stk.toString().replace(/[\s\.\-]/g, '').trim();
  },

  // Chuyển đổi tiếng Việt có dấu thành không dấu, chữ thường
  normalizeText: function(text) {
    if (!text) return '';
    return text
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212]/g, '-')  // Normalize all dash types to regular dash
      .replace(/\s+/g, ' ')  // Normalize multiple spaces to single space
      .trim();
  },

  // Tính độ tương đồng giữa 2 chuỗi (đơn giản, trả về 0-1)
  fuzzyMatch: function(str1, str2) {
    const s1 = Utils.normalizeText(str1);
    const s2 = Utils.normalizeText(str2);
    if (!s1 || !s2) return 0;
    if (s1 === s2) return 1;
    if (s1.includes(s2) || s2.includes(s1)) return 0.8;
    
    // Levenshtein distance
    const track = Array(s2.length + 1).fill(null).map(() =>
      Array(s1.length + 1).fill(null));
    for (let i = 0; i <= s1.length; i += 1) {
      track[0][i] = i;
    }
    for (let j = 0; j <= s2.length; j += 1) {
      track[j][0] = j;
    }
    for (let j = 1; j <= s2.length; j += 1) {
      for (let i = 1; i <= s1.length; i += 1) {
        const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
        track[j][i] = Math.min(
          track[j][i - 1] + 1, // deletion
          track[j - 1][i] + 1, // insertion
          track[j - 1][i - 1] + indicator, // substitution
        );
      }
    }
    const distance = track[s2.length][s1.length];
    const maxLength = Math.max(s1.length, s2.length);
    return (maxLength - distance) / maxLength;
  },

  // Parse số từ chuỗi có dấu phẩy hoặc chấm
  parseNumber: function(str) {
    if (str === null || str === undefined) return 0;
    if (typeof str === 'number') return str;
    const cleanStr = str.toString().replace(/,/g, '').replace(/\./g, '').trim();
    const num = parseFloat(cleanStr);
    return isNaN(num) ? 0 : num;
  },

  // Định dạng tiền tệ VND
  formatCurrency: function(num) {
    if (isNaN(num)) return '0';
    return new Intl.NumberFormat('vi-VN').format(num);
  },

  // Định dạng ngày thành DD/MM/YYYY
  formatDate: function(dateStr) {
    if (!dateStr && dateStr !== 0) return '';
    try {
      // Excel serial number (VD: 45879 = ngày trong Excel) → đổi sang ngày thật
      if (typeof dateStr === 'number' && dateStr > 20000 && dateStr < 80000) {
        const excelEpoch = new Date(1899, 11, 30);
        const dateObj = new Date(excelEpoch.getTime() + dateStr * 86400000);
        const d = dateObj.getDate().toString().padStart(2, '0');
        const m = (dateObj.getMonth() + 1).toString().padStart(2, '0');
        const y = dateObj.getFullYear();
        return `${d}/${m}/${y}`;
      }
      let dateObj;
      if (typeof dateStr === 'string') {
        const parts = dateStr.split(/[-\\/ ]/);
        if (parts.length >= 3) {
          if (parts[2].length === 4) { // DD/MM/YYYY
            dateObj = new Date(parts[2], parts[1] - 1, parts[0]);
          } else if (parts[0].length === 4) { // YYYY/MM/DD
            dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
          } else if (parts[2].length === 2) { // DD/MM/YY → DD/MM/20YY
            const year = 2000 + parseInt(parts[2], 10);
            dateObj = new Date(year, parts[1] - 1, parts[0]);
          }
        }
      }
      if (!dateObj || isNaN(dateObj.getTime())) {
        dateObj = new Date(dateStr);
      }
      if (isNaN(dateObj.getTime())) return dateStr;
      
      const d = dateObj.getDate().toString().padStart(2, '0');
      const m = (dateObj.getMonth() + 1).toString().padStart(2, '0');
      const y = dateObj.getFullYear();
      return `${d}/${m}/${y}`;
    } catch(e) {
      return dateStr;
    }
  },

  // Hiển thị thông báo (toast)
  showToast: function(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 10px;';
      document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    const bgColors = {
      success: '#3fb950',
      error: '#f85149',
      warning: '#d29922',
      info: '#58a6ff'
    };
    
    toast.style.cssText = `
      background: ${bgColors[type] || bgColors.info};
      color: #fff;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      opacity: 0;
      transform: translateY(20px);
      transition: all 0.3s ease;
    `;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    }, 10);
    
    // Remove after 4s
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(20px)';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  },

  // Hiển thị hộp thoại (modal)
  showModal: function(title, content, onConfirm, onCancel) {
    const overlay = document.getElementById('global-modal');
    if (!overlay) {
      console.error('Không tìm thấy #global-modal trong HTML');
      return;
    }
    
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = content;
    
    overlay.classList.add('show');
    
    const cancelBtn = document.getElementById('btn-modal-cancel');
    const confirmBtn = document.getElementById('btn-modal-confirm');
    const closeBtn = document.getElementById('btn-close-modal');
    
    // Clear previous event listeners bằng cách clone
    const newCancelBtn = cancelBtn.cloneNode(true);
    const newConfirmBtn = confirmBtn.cloneNode(true);
    const newCloseBtn = closeBtn.cloneNode(true);
    
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
    
    const closeModal = () => {
      overlay.classList.remove('show');
    };
    
    newCloseBtn.onclick = () => {
      closeModal();
      if (onCancel) onCancel();
    };
    
    newCancelBtn.onclick = () => {
      closeModal();
      if (onCancel) onCancel();
    };

    // Reset confirm button state
    newConfirmBtn.disabled = false;
    newConfirmBtn.textContent = 'Xác nhận';
    
    newConfirmBtn.onclick = () => {
      if (onConfirm) {
        // Disable button to prevent double-click
        newConfirmBtn.disabled = true;
        newConfirmBtn.textContent = 'Đang xử lý...';
        // Nếu onConfirm trả về false rõ ràng, không đóng modal (ví dụ: validation fail)
        const result = onConfirm();
        if (result !== false) {
          closeModal();
        } else {
          // Re-enable button if validation fails
          newConfirmBtn.disabled = false;
          newConfirmBtn.textContent = 'Xác nhận';
        }
      } else {
        closeModal();
      }
    };
  },

  // Hiển thị/ẩn loading overlay
  showLoading: function(show) {
    let overlay = document.getElementById('loading-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'loading-overlay';
      overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(13, 17, 23, 0.8); display: none; align-items: center; justify-content: center; z-index: 10001; backdrop-filter: blur(2px); flex-direction: column; color: #58a6ff; font-family: "Inter", sans-serif;';
      overlay.innerHTML = `
        <div class="spinner" style="width: 40px; height: 40px; border: 4px solid rgba(88, 166, 255, 0.2); border-top-color: #58a6ff; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 16px;"></div>
        <style>@keyframes spin { 100% { transform: rotate(360deg); } }</style>
        <div id="loading-text">Đang xử lý...</div>
      `;
      document.body.appendChild(overlay);
    }
    overlay.style.display = show ? 'flex' : 'none';
  },

  // Debounce hàm
  debounce: function(fn, delay) {
    let timeoutId;
    return function(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        fn.apply(this, args);
      }, delay);
    };
  },

  // Tạo ID ngẫu nhiên
  generateId: function() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  },

  // Họ phổ biến — bỏ qua khi tìm "phần tên đặc trưng" (tránh nhận nhầm: NGUYEN có ở khắp nơi)
  commonSurnames: function() {
    return ['nguyen', 'tran', 'le', 'pham', 'hoang', 'huynh', 'phan', 'vu', 'vo', 'dang', 'bui', 'do', 'ho', 'ngo', 'duong', 'ly', 'cao', 'truong', 'dinh', 'vo'];
  },

  // Bỏ mốc tháng khỏi nội dung (T8/T9/thang 8...) — tháng nào cũng khớp được
  stripMonthMarkers: function(text) {
    if (!text) return '';
    return text
      .toString()
      .replace(/\bt\s?\d{1,2}\b/gi, ' ')
      .replace(/\bthang\s?\d{1,2}\b/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  },

  // Từ chung chung trong nội dung CK — không bao giờ là tên người, bỏ qua khi gợi ý/khớp
  // (VD: "chuyen khoan nhanh qua zalo" có ở CK của mọi nhà → không được dùng để nhận diện)
  keywordFillerWords: function() {
    return ['chuyen', 'khoan', 'tien', 'nhanh', 'qua', 'zalo', 'ct', 'chuyen tien', 'hoc phi', 'thang', 'ct den', 'ct tu', 'tpb', 'mbvcb', 'nop tien', 'thanh toan', 'tu', 'cho', 'den', 'tien hoc', 'hp', 'chuyen khoan', 'ck', 'nd', 'giao dich'];
  },

  // Từ khóa "yếu" = toàn chữ chung chung / họ phổ biến / quá ngắn → không được lưu, không được khớp
  // (VD: "CHUYEN KHOAN", "NHANH QUA ZALO", "LOI" lưu vào là gom nhầm CK nhiều nhà)
  // Từ khóa "khỏe" = tên người gửi: tối thiểu 2 chữ có nghĩa (VD: "MY LOI"),
  // hoặc 1 cụm dính đặc trưng dài >= 6 ký tự (VD: "DPBAOCHAU")
  isWeakKeyword: function(keyword) {
    const normKw = this.normalizeText(keyword || '');
    if (!normKw) return true;
    const surnames = this.commonSurnames();
    const fillers = this.keywordFillerWords();
    const words = normKw.split(' ').filter(w => w.length >= 2);
    if (words.length === 0) return true;
    // 1 cụm dính đặc trưng dài (không phải họ/filler) vẫn khỏe
    if (words.length === 1) {
      const flat = normKw.replace(/\s+/g, '');
      if (flat.length >= 6 && !surnames.includes(flat) && !fillers.includes(flat)) return false;
      return true;
    }
    // Nhiều chữ: cần tối thiểu 2 chữ có nghĩa (không phải filler/họ phổ biến)
    const meaningful = words.filter(w => !fillers.includes(w) && !surnames.includes(w));
    return meaningful.length < 2;
  },

  // So khớp từ khóa: nguyên cụm hoặc từng chữ đầy đủ, hoặc đoạn đặc trưng đủ dài
  // (không còn kiểu "chung đoạn ngắn là nhận" — nguyên nhân gom nhầm CK nhiều nhà vào 1 bé)
  looseKeywordHit: function(normKw, normDesc) {
    if (!normKw || !normDesc) return false;
    // 1. Khớp nguyên cụm: "my loi" khớp "my loi chuyen..."
    if (normDesc.includes(normKw)) return true;
    // 2. Khớp từng chữ đầy đủ (dính/rời đều được): "bao chau" khớp "dophucbaochau"
    const kwWords = normKw.split(' ').filter(w => w.length > 2);
    if (kwWords.length > 1 && kwWords.every(w => normDesc.includes(w))) return true;
    const kwFlat = normKw.replace(/\s+/g, '');
    const descFlat = normDesc.replace(/\s+/g, '');
    // 3. Dính/rời toàn cụm: "baochau" khớp "bao chau"
    if (kwFlat.length >= 4 && descFlat.includes(kwFlat)) return true;
    // 4. Chung đoạn đặc trưng: đoạn chung phải đủ dài so với từ khóa (>=60%),
    //    và không phải họ phổ biến / từ chung chung (VD: "chuyen" không được tính)
    const surnames = this.commonSurnames();
    const fillers = this.keywordFillerWords();
    const needLen = Math.max(6, Math.ceil(kwFlat.length * 0.6));
    if (kwFlat.length >= 6) {
      for (let i = 0; i + needLen <= kwFlat.length; i++) {
        for (let l = Math.min(12, kwFlat.length - i); l >= needLen; l--) {
          const sub = kwFlat.substring(i, i + l);
          if (surnames.includes(sub)) continue;
          if (fillers.includes(sub)) continue;
          if (descFlat.includes(sub)) return true;
        }
      }
    }
    return false;
  },

  // Trích xuất từ khóa tiềm năng từ nội dung chuyển khoản
  // (chỉ giữ tên người gửi — bỏ hết chữ chung chung như "chuyen khoan / nhanh qua / zalo",
  //  bỏ mã ngân hàng, số TK, số tiền — để gợi ý lúc gán ngắn gọn, lần sau không gom nhầm)
  extractKeywordsFromDescription: function(desc) {
    if (!desc) return [];
    const self = this;
    let clean = self.normalizeText(desc);

    self.keywordFillerWords().forEach(word => {
      clean = clean.replace(new RegExp(`\\b${word}\\b`, 'g'), ' ');
    });

    // Bỏ mã GD ngân hàng (mbvcb..., tpb;..., số TK, số tiền còn sót)
    const words = clean.split(/\s+/).filter(w => {
      if (w.length < 2) return false;
      if (/^\d+$/.test(w) || /^[\d;.,]+$/.test(w)) return false; // toàn số
      if (/^[a-z]*\d+[a-z\d]*$/.test(w) && /\d/.test(w)) return false; // mã lẫn số (mbvcb, 6224bft...)
      if (self.keywordFillerWords().includes(w)) return false;
      return true;
    });
    return words;
  }
};
