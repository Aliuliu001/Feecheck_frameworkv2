/**
 * JOY FEE CHECK - Shared Data Model
 * Defines all data structures used across modules
 */

// ============================================================
// DATA STRUCTURES (for documentation - used by all modules)
// ============================================================

/*
STUDENT: {
  stt: Number,
  mshs: String,          // "HV011"
  fullName: String,       // "Trần Hoàng An Nhiên"  
  teacher: String,        // "Mr. Ngọc"
  shift: String,          // "09:45"
  className: String,      // "S2.001 - Pumpkin Seed"
  phone: String,          // "0967536696"
  stkPH: String,          // "5491205278990"
  tenTK: String,          // "CAN HOANG LAN PHUONG"
  hocPhi: Number,         // 800000
  ghiChuGiaDinh: String,  // ""
  diaChi: String          // "" (optional)
}

TRANSACTION_VIETINBANK: {
  stt: Number,
  date: String,           // "29-07-2026 17:14:47"
  description: String,    // full description
  debit: Number,
  credit: Number,
  balance: Number,
  maGD: String,           // transaction code
  stkDoiUng: String,      // "0811000013379"
  tenTKDoiUng: String,    // "TRAN THI LINH DOAN"
  // After matching:
  matchedMSHS: String|null,
  matchSource: String|null  // "stk_chinh", "stk_phu", "manual"
}

TRANSACTION_TPBANK: {
  date: String,           // "01/07/2026 14:50:00"
  refNumber: String,      // "663ITC126182AJR1"
  explanation: String,    // full content
  debit: Number,
  credit: Number,
  balance: Number,
  // After matching:
  matchedMSHS: String|null,
  matchSource: String|null,  // "keyword", "manual"
  matchedKeyword: String|null
}

CASH_PAYMENT: {
  date: String,           // "04-07-26"
  className: String,      // "S1.003 - Hazelnut"
  fullName: String,       // "Mai Vũ Khánh An"
  amount: Number,         // 800000
  mshs: String,           // "HV096"
  ghiChu: String          // "HP tháng 7"
}

STK_PHU_MAPPING: {
  mshs: String,           // "HV179"
  fullName: String,       // "Lý Mỹ Thiên Kim"
  stk: String,            // "1410129649008"
  tenTK: String,          // "NGUYEN THI NGUYET"
  addedDate: String       // ISO date when added
}

KEYWORD_MAPPING: {
  keyword: String,        // "GAU KIEN"
  mshs: String,           // "HV236"
  studentName: String,    // "Trần Kiên (Gấu)"
  addedDate: String       // ISO date when added
}

REPORT_ROW: {
  mshs: String,
  fullName: String,
  className: String,
  teacher: String,
  tongHocPhi: Number,
  chuyenKhoanVTB: Number,  // VietinBank
  tienMat: Number,
  chuyenKhoanTPB: Number,  // TPBank
  tongDaDong: Number,
  trangThai: String,       // "Đã đóng" | "Chưa đóng" | "Đóng thiếu" | "Đóng dư"
  soTienThieu: Number,
  ghiChu: String,
  ghiChuGiaDinh: String,
  coChuyenTKCongTy: Boolean  // true if has VietinBank transfer
}

CHANGE_RECORD: {
  type: String,           // "tang_moi" | "nghi_hoc" | "doi_lop" | "ck_tk_cty"
  mshs: String,
  fullName: String,
  oldClass: String|null,
  newClass: String|null,
  ghiChu: String
}

SYNC_CHANGE: {
  type: String,           // "stk_phu_moi" | "keyword_moi"
  mshs: String,
  content: String,
  synced: Boolean,
  date: String
}

NHOM_GIA_DINH: {
  groupId: String,       // "GD001" — auto-generate
  groupName: String,     // "Nhà Cô Lan" — tên gợi nhớ
  members: [String],     // ["HV011", "HV012", "HV045"] — danh sách MSHS
  stkDaiDien: String,    // "5491205278990" — STK phụ huynh đại diện
  tenPH: String          // "CAN HOANG LAN PHUONG"
}
*/

// ============================================================
// CONSTANTS
// ============================================================
const APP_CONFIG = {
  APP_NAME: 'Joy Fee Check',
  VERSION: '1.0.0',
  COMPANY_NAME: 'CÔNG TY TNHH TRUNG TÂM NGOẠI NGỮ JOY',
  COMPANY_TAX: '5801527284',
  COMPANY_ADDRESS: 'Hẻm 3b, Hồ Tùng Mậu, Phường Xuân Hương - Đà Lạt, Tỉnh Lâm Đồng',
  
  // localStorage keys
  STORAGE_KEYS: {
    STK_PHU: 'joy_stk_phu',
    KEYWORDS: 'joy_keywords', 
    PREV_MONTH_DS: 'joy_prev_month_ds',
    PREV_MONTH_HD: 'joy_prev_month_hd',
    PREV_MONTH_INFO: 'joy_prev_month_info',
    SYNC_CHANGES: 'joy_sync_changes',
    HISTORY: 'joy_history',
    SETTINGS: 'joy_settings',
    FAMILY_GROUPS: 'joy_family_groups',
    PREV_MONTH_PAYMENTS: 'joy_prev_month_payments',
    PACKAGES: 'joy_packages'
  },

  // Default hoc phi
  DEFAULT_HOC_PHI: 800000,
  HOC_PHI_HE: 400000,

  // Status labels
  STATUS: {
    PAID: 'Đã đóng',
    UNPAID: 'Chưa đóng', 
    PARTIAL: 'Đóng thiếu',
    OVERPAID: 'Đóng dư',
    PACKAGE: '📦 Đã đóng gói'
  },

  // Change types
  CHANGE_TYPE: {
    NEW: 'tang_moi',
    QUIT: 'nghi_hoc',
    CLASS_CHANGE: 'doi_lop',
    COMPANY_TRANSFER: 'ck_tk_cty',
    WRONG_AMOUNT: 'sai_so_tien'
  }
};

// Make available globally
if (typeof window !== 'undefined') {
  window.APP_CONFIG = APP_CONFIG;
}
