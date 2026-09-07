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
    if (!dateStr) return '';
    try {
      let dateObj;
      if (typeof dateStr === 'string') {
        const parts = dateStr.split(/[-\/ ]/);
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

  // Trích xuất từ khóa tiềm năng từ nội dung chuyển khoản
  extractKeywordsFromDescription: function(desc) {
    if (!desc) return [];
    let clean = Utils.normalizeText(desc);
    
    // Loại bỏ các từ vô nghĩa phổ biến
    const fillerWords = [
      'chuyen tien', 'hoc phi', 'thang', 'ct den', 'mbvcb', 'nop tien', 'thanh toan',
      'tu', 'cho', 'den', 'tien hoc', 'hp', 'chuyen khoan', 'ck', 'nd', 'giao dich'
    ];
    
    fillerWords.forEach(word => {
      clean = clean.replace(new RegExp(`\\b${word}\\b`, 'g'), ' ');
    });
    
    // Tách thành các từ và lấy những cụm từ có nghĩa (độ dài > 3)
    const words = clean.split(/\s+/).filter(w => w.length > 2);
    return words;
  }
};
