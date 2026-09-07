# SPEC 02: DATA STRUCTURES & LOCALSTORAGE

**Previous:** SPEC_01_OVERVIEW.md  
**Next:** SPEC_03_UI_LAYOUT.md

---

## CORE DATA MODELS

These structures are already defined in `js/datamodel.js`. Reference them when building UI.

### STUDENT
```javascript
{
  stt: Number,              // Row number
  mshs: String,             // "HV011" - Student ID (primary key)
  fullName: String,         // "Trần Hoàng An Nhiên"
  teacher: String,          // "Mr. Ngọc"
  shift: String,            // "09:45"
  className: String,        // "S2.001 - Pumpkin Seed"
  phone: String,            // "0967536696"
  stkPH: String,            // "5491205278990" - Parent's bank account
  tenTK: String,            // "CAN HOANG LAN PHUONG" - Account holder name
  hocPhi: Number,           // 800000 - Tuition fee (can be 0 for free)
  ghiChuGiaDinh: String,    // Family notes
  diaChi: String            // Address (optional)
}
```

### TRANSACTION_VIETINBANK
```javascript
{
  stt: Number,
  date: String,             // "29-07-2026 17:14:47"
  description: String,      // Full transaction description
  debit: Number,
  credit: Number,           // Incoming amount
  balance: Number,
  maGD: String,             // Transaction code
  stkDoiUng: String,        // "0811000013379" - Counterparty account
  tenTKDoiUng: String,      // "TRAN THI LINH DOAN" - Counterparty name
  // After matching:
  matchedMSHS: String|null, // "HV011"
  matchSource: String|null  // "stk_chinh" | "stk_phu" | "vtb_description"
}
```

### TRANSACTION_TPBANK
```javascript
{
  date: String,             // "01/07/2026 14:50:00"
  refNumber: String,        // "663ITC126182AJR1"
  explanation: String,      // Full content
  debit: Number,
  credit: Number,
  balance: Number,
  // After matching:
  matchedMSHS: String|null,
  matchSource: String|null,     // "keyword" | "manual"
  matchedKeyword: String|null
}
```

### CASH_PAYMENT
```javascript
{
  date: String,             // "04-07-26"
  className: String,        // "S1.003 - Hazelnut"
  fullName: String,         // "Mai Vũ Khánh An"
  amount: Number,           // 800000
  mshs: String,             // "HV096" - Already matched
  ghiChu: String            // "HP tháng 7"
}
```

### REPORT_ROW
```javascript
{
  mshs: String,
  fullName: String,
  className: String,            // Can be comma-separated if multiple classes
  teacher: String,
  phone: String,
  tongHocPhi: Number,           // Total tuition (sum if multiple classes)
  chuyenKhoanVTB: Number,       // VietinBank transfer amount
  tienMat: Number,              // Cash payment
  chuyenKhoanTPB: Number,       // TPBank transfer
  tongDaDong: Number,           // Total paid (after family allocation)
  tongDaDongGoc: Number,        // Original total (before family split)
  familySplit: Object|null,     // Family allocation details
  trangThai: String,            // "Đã đóng" | "Chưa đóng" | "Đóng thiếu" | "Đóng dư" | "📦 Đã đóng gói"
  soTienThieu: Number,          // Amount short
  ghiChu: String,               // Auto-generated notes (warnings, family info, etc.)
  ghiChuGiaDinh: String,        // Family notes from master list
  coChuyenTKCongTy: Boolean,    // True if has VietinBank transfer
  txList: Array                 // Transaction details
}
```

### NHOM_GIA_DINH (Family Group)
```javascript
{
  groupId: String,          // "GD1725671234567" - Auto-generated
  groupName: String,        // "Nhà Cô Lan" - Display name
  name: String,             // Alias for groupName
  members: [String],        // ["HV011", "HV012", "HV045"]
  stkDaiDien: String,       // "5491205278990" - Representative account
  tenPH: String,            // "CAN HOANG LAN PHUONG" - Parent name
  addedDate: String         // ISO date
}
```

---

## LOCALSTORAGE KEYS

Defined in `APP_CONFIG.STORAGE_KEYS` (datamodel.js):

| Key | Purpose | Data Type |
|-----|---------|-----------|
| `joy_stk_phu` | Secondary bank account mappings | Array of `{mshs, stk, tenTK, fullName}` |
| `joy_keywords` | TPBank keyword mappings | Array of `{keyword, mshs, studentName}` |
| `joy_family_groups` | Family group definitions | Array of NHOM_GIA_DINH |
| `joy_packages` | Package payment records (multi-month) | Array of package objects |
| `joy_fee_adjustments` | Fee adjustments (discounts, suspensions) | Array of adjustment objects |
| `joy_referrals` | Referral rewards tracking | Array of referral objects |
| `joy_suspended` | Temporarily suspended students | Array of suspension objects |
| `joy_prev_invoice_students` | Previous month invoice list (Tab 1 data) | Array of student objects |
| `joy_prev_thuc_te_students` | Previous month "Thực Tế" list | Array of student objects |
| `joy_acc_tab7_rows` | Tab 7 (Tổng hợp) accumulated rows | Array of row objects |
| `joy_sync_changes` | Changes pending sync to Google Sheets | Array of change records |
| `joy_history` | Action history log | Array (max 100 entries) |
| `joy_settings` | App settings | Object |

---

## STATUS VALUES

### Payment Status (trangThai)
- `"Đã đóng"` — Paid in full (green badge)
- `"Chưa đóng"` — Not paid (red badge)
- `"Đóng thiếu"` — Partially paid (yellow badge)
- `"Đóng dư"` — Overpaid (blue badge)
- `"📦 Đã đóng gói"` — Paid via package (purple badge)
- `"MIỄN PHÍ"` — Free (gray badge, HP = 0)

### Match Source (matchSource)
- `"stk_chinh"` — Matched via primary bank account in master list
- `"stk_phu"` — Matched via secondary account mapping
- `"vtb_description"` — Matched via VietinBank description text
- `"keyword"` — Matched via TPBank keyword
- `"ten_tk"` — Matched via account holder name
- `"manual"` — Manually assigned by user

---

## ACCOUNTING TAB DEFINITIONS

### Tab 1: DS HĐ Tháng trước
**Source:** `joy_prev_invoice_students` (imported from previous month accounting file)  
**Display:** All students from last month's invoice list (~130 students)

### Tab 2: DS CK VTB Tháng này
**Source:** Current month VietinBank matched transactions  
**Logic:** Students who transferred to company VietinBank account this month (~128 students)

### Tab 3: Giảm bớt (Kế toán thêm vào)
**Logic:** `(Tab1 - Tab2) ∩ (IN current master list) ∩ (HP > 0)`  
**Meaning:** Students who were invoiced last month but haven't paid this month YET (still have opportunity to pay)

### Tab 4: Stop - nghỉ học
**Logic:** `(Tab1 - Tab2) ∩ (NOT in current master list OR HP = 0)`  
**Meaning:** Students who were invoiced last month but are no longer in system or have HP=0 (no longer studying)  
**UI:** Radio buttons (🛑 Nghỉ học | 🔄 Vẫn học) + confirm dialog before moving to Tab 3

### Tab 5: Tăng mới
**Logic:** `Tab2 - Tab1`  
**Meaning:** Students who paid VTB this month but were NOT in last month's invoice (new students)

### Tab 6: Chuyển tiền sai
**Algorithm:** Allocate-then-remainder per family (INDEPENDENT from Report tab)
- Use `HP_default` for ALL members (don't know actual class count)
- Compare `KyVong = HP_default × member_count` vs `Tong_CK_GiaDinh`
- Flag if difference ≠ 0 (tolerance = 0đ)
- This is a WARNING tab, not final conclusion

### Tab 7: Tổng hợp
**Source:** User manually copies rows from other tabs via "📥 Copy sang Tổng hợp" button  
**Features:**
- Checkbox per row (default checked) — uncheck to exclude from export
- Editable HP field (click to edit)
- Tag filter (show/hide by "Ghi chú" tags)
- Sort options (7 choices)
- Summary bar: Total selected students + Total amount
- Persists to localStorage: `joy_acc_tab7_rows`

---

## CONSTANTS

From `APP_CONFIG` (datamodel.js):

```javascript
APP_NAME: 'Joy Fee Check'
VERSION: '1.0.0'
COMPANY_NAME: 'CÔNG TY TNHH TRUNG TÂM NGOẠI NGỮ JOY'
COMPANY_TAX: '5801527284'
COMPANY_ADDRESS: 'Hẻm 3b, Hồ Tùng Mậu, Phường Xuân Hương - Đà Lạt, Tỉnh Lâm Đồng'
DEFAULT_HOC_PHI: 800000
HOC_PHI_HE: 400000
```

---

**Status:** Specification file 2 of 8 complete.  
**Next:** Read `SPEC_03_UI_LAYOUT.md` for page structure and navigation.
