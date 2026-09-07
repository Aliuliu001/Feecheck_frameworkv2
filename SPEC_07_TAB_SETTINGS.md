# SPEC 07: TAB CÀI ĐẶT (SETTINGS)

**Previous:** SPEC_06_TAB_ACCOUNTING.md  
**Next:** SPEC_08_COMPONENTS.md

---

## OVERVIEW

The Settings tab manages configuration, mappings, family groups, packages, fee adjustments, referrals, and backups.

---

## LAYOUT

```
┌─────────────────────────────────────────────────────────┐
│ MAPPING DATA                                            │
│ • STK Phụ (Secondary bank accounts)                     │
│ • Từ khóa TPBank (TPBank keywords)                      │
│ • Export/Import Mapping buttons                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ NHÓM GIA ĐÌNH (Family Groups)                          │
│ [Table + Add button]                                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ ĐÓNG GÓI HỌC PHÍ (Package Payments)                    │
│ [Table + Add button + Discount % inputs]               │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ ĐIỀU CHỈNH HỌC PHÍ (Fee Adjustments)                   │
│ [Table + Add button]                                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ GIỚI THIỆU BẠN MỚI (Referral Rewards)                  │
│ [Alert box + Table + Add button]                        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ BACKUP & KHÔI PHỤC                                      │
│ [Status indicators + Action buttons]                    │
└─────────────────────────────────────────────────────────┘
```

---

## SECTION 1: MAPPING DATA

**Card Style:**
- Background: `#ffffff`
- Border: `1px solid #d2d2d7`
- Border-radius: `16px`
- Padding: `24px`
- Margin-bottom: `24px`

### Header with Actions:
```
Dữ liệu Mapping                    [Xuất Mapping] [Nhập Mapping]
```

**Buttons:**
- `Xuất Mapping`: Primary style (blue)
- `Nhập Mapping`: Outline style (gray border)

### Sub-section: STK Phụ (Secondary Accounts)

**Title:**
```
STK Phụ
```
- Font: `16px`, weight `600`, margin-bottom: `12px`

**Table:**
```
┌──────────┬─────────────┬────────────────────┬────┐
│MSHS      │STK          │Tên TK              │    │
├──────────┼─────────────┼────────────────────┼────┤
│HV179     │1410129649008│NGUYEN THI NGUYET   │[×] │
└──────────┴─────────────┴────────────────────┴────┘
```

**Columns:**
- MSHS: `80px`
- STK: `140px`
- Tên TK: `220px` (expandable)
- Delete: `40px` (× button)

**Delete Button:**
- Size: `24px × 24px`
- Color: `#ff3b30` (red)
- Hover: Background `#ffe5e5`
- Border-radius: `50%`

**No Data State:**
```
Chưa có STK phụ. Bấm "➕ Thêm STK" để thêm mới.
```
- Font: `13px`, color `#86868b`, text-align center, padding: `32px 0`

### Sub-section: Từ khóa TPBank

**Title:**
```
Từ khóa TPBank
```

**Table:**
```
┌─────────────┬──────────┬────────────────────┬────┐
│Từ khóa      │MSHS      │Tên HS              │    │
├─────────────┼──────────┼────────────────────┼────┤
│GAU KIEN     │HV236     │Trần Kiên (Gấu)     │[×] │
└─────────────┴──────────┴────────────────────┴────┘
```

**Columns:**
- Từ khóa: `140px`
- MSHS: `80px`
- Tên HS: `200px`
- Delete: `40px`

---

## SECTION 2: NHÓM GIA ĐÌNH (Family Groups)

**Card Style:** Same as Section 1

**Header:**
```
Nhóm Gia đình                                    [➕ Thêm nhóm]
```

**Description:**
```
Dùng khi 1 phụ huynh đóng tiền cho nhiều con. Hệ thống sẽ tự động phân bổ 
tiền theo học phí riêng của từng cháu.
```
- Font: `13px`, color `#86868b`, margin: `12px 0 16px 0`

**Table:**
```
┌──────────────┬─────────────┬─────────────────┬───────────────────────┬────┐
│Tên nhóm      │STK Đại diện │Tên PH           │Thành viên (MSHS)      │    │
├──────────────┼─────────────┼─────────────────┼───────────────────────┼────┤
│Nhà Cô Lan    │5491205278990│CAN HOANG LAN... │HV011, HV012, HV045    │[×] │
└──────────────┴─────────────┴─────────────────┴───────────────────────┴────┘
```

**Columns:**
- Tên nhóm: `160px`
- STK Đại diện: `140px`
- Tên PH: `180px`
- Thành viên: `220px` (wrap text if long)
- Delete: `40px`

### Add Family Group Modal:

**Modal Title:** `➕ Thêm Nhóm Gia đình`

**Form Fields:**
1. **Tên nhóm** (text input)
   - Placeholder: "VD: Nhà Cô Lan"
   - Required

2. **Danh sách MSHS** (text input)
   - Placeholder: "HV011, HV012, HV045"
   - Help text: "Cách nhau bằng dấu phẩy"
   - Required

3. **STK đại diện** (text input)
   - Placeholder: "5491205278990"
   - Required

4. **Tên phụ huynh** (text input)
   - Placeholder: "CAN HOANG LAN PHUONG"
   - Optional

**Buttons:**
- Cancel: Secondary
- Confirm: Primary (`Thêm nhóm`)

---

## SECTION 3: ĐÓNG GÓI HỌC PHÍ (Package Payments)

**Card Style:** Same as above

**Header:**
```
📦 Đóng gói học phí (nhiều tháng)                [➕ Thêm gói]
```

**Description:**
```
Ghi nhận khi phụ huynh đóng trước nhiều tháng (6 tháng, 1 năm...). 
Hệ thống sẽ tự động ghi nhận bé đã đóng cho các tháng tương ứng, không báo "chưa đóng".
```

**Discount Settings (above table):**
```
Giảm % (6 tháng): [6]    Giảm % (12 tháng): [12]
```
- Layout: Inline, gap: `24px`
- Input width: `80px`
- Font: `13px`

**Table:**
```
┌────────────┬──────────────────┬────────┬──────┬─────────────┬──────────┬──────────┬────┐
│Tên gói     │Thành viên (MSHS) │Số tháng│Giảm %│Số tiền giảm │Từ tháng  │Đến tháng │    │
├────────────┼──────────────────┼────────┼──────┼─────────────┼──────────┼──────────┼────┤
│Gói 6T HV011│HV011             │6       │6%    │288,000      │09/2026   │02/2027   │[×] │
└────────────┴──────────────────┴────────┴──────┴─────────────┴──────────┴──────────┴────┘
```

**Columns:**
- Tên gói: `140px`
- Thành viên: `160px`
- Số tháng: `80px` (center-aligned)
- Giảm %: `70px` (right-aligned)
- Số tiền giảm: `120px` (right-aligned)
- Từ tháng: `90px`
- Đến tháng: `90px`
- Delete: `40px`

### Add Package Modal:

**Form Fields:**
1. **Tên gói** (text, optional)
2. **Thành viên (MSHS)** (text, comma-separated, required)
3. **Số tháng** (number, required, min: 1)
4. **Giảm %** (number, default from settings, editable)
5. **Từ tháng** (month input, required)

**Auto-calculate:**
- Đến tháng: `Từ tháng + Số tháng`
- Số tiền giảm: `HP × Số tháng × (Giảm % / 100)`

---

## SECTION 4: ĐIỀU CHỈNH HỌC PHÍ (Fee Adjustments)

**Card Style:** Same as above

**Header:**
```
📝 Điều chỉnh học phí (ưu đãi, giảm giá, tạm ngưng...)     [➕ Thêm điều chỉnh]
```

**Description:**
```
Giảm/gia hạn HP cho HS có hoàn cảnh đặc biệt: giới thiệu bạn mới (-400k), 
tạm ngưng lớp, miễn giảm... Các điều chỉnh sẽ áp dụng khi đối soát.
```

**Table:**
```
┌──────┬────────────┬─────────────┬────────────┬─────────┬──────────────────────┬────┐
│MSHS  │Tên HS      │Loại         │Số tiền     │Tháng    │Ghi chú               │    │
├──────┼────────────┼─────────────┼────────────┼─────────┼──────────────────────┼────┤
│HV011 │Nguyễn A    │Giới thiệu   │-400,000    │09/2026  │Giới thiệu HV200      │[×] │
└──────┴────────────┴─────────────┴────────────┴─────────┴──────────────────────┴────┘
```

**Columns:**
- MSHS: `80px`
- Tên HS: `140px`
- Loại: `120px`
- Số tiền: `100px` (right-aligned, negative = discount, positive = surcharge)
- Tháng: `90px`
- Ghi chú: `200px`
- Delete: `40px`

**Loại Options:**
- Giới thiệu
- Tạm ngưng lớp
- Miễn giảm
- Khác

### Add Adjustment Modal:

**Form Fields:**
1. **MSHS** (text or select from student list)
2. **Loại điều chỉnh** (select dropdown)
3. **Số tiền** (number, negative for discount)
4. **Tháng áp dụng** (month input)
5. **Ghi chú** (textarea, optional)

---

## SECTION 5: GIỚI THIỆU BẠN MỚI (Referral Rewards)

**Card Style:** Same as above

**Header:**
```
🎁 Giới thiệu bạn mới                              [➕ Thêm giới thiệu]
```

**Description:**
```
Khi PH giới thiệu HS mới → sau 3 tháng HS mới học → PH được giảm 400k. 
Hệ thống tự nhắc khi đủ 3 tháng.
```

**Alert Box (pending referrals):**
```
┌─────────────────────────────────────────────────────────┐
│ ⚠️ Có 2 referral đã đủ 3 tháng, cần xác nhận áp dụng! │
│ • HV015 giới thiệu HV200 (tháng bắt đầu: 06/2026)     │
│ • HV022 giới thiệu HV201 (tháng bắt đầu: 06/2026)     │
│                                     [Xác nhận áp dụng] │
└─────────────────────────────────────────────────────────┘
```
- Background: `#fff4e5` (warning yellow)
- Border: `1px solid #ff9500`
- Border-radius: `12px`
- Padding: `16px`
- Display: none if no pending referrals

**Table:**
```
┌────────────────────┬──────────────────────┬─────────────────┬─────────────────┬──────────┬────┐
│PH được giảm (MSHS) │HS mới được giới thiệu│Tháng HS mới bắt │Tháng áp dụng    │Trạng thái│    │
├────────────────────┼──────────────────────┼─────────────────┼─────────────────┼──────────┼────┤
│HV015               │HV200                 │06/2026          │09/2026          │✅ Đã xác │[×] │
└────────────────────┴──────────────────────┴─────────────────┴─────────────────┴──────────┴────┘
```

**Columns:**
- PH được giảm: `120px`
- HS mới: `140px`
- Tháng bắt đầu: `100px`
- Tháng áp dụng: `100px`
- Trạng thái: `100px` (badge: pending/confirmed)
- Delete: `40px`

**Trạng thái Badge:**
- Pending: `⏳ Chờ 3 tháng` (yellow)
- Confirmed: `✅ Đã xác nhận` (green)

### Add Referral Modal:

**Form Fields:**
1. **PH được giảm (MSHS)** (select from student list)
2. **HS mới được giới thiệu (MSHS)** (select from student list)
3. **Tháng HS mới bắt đầu học** (month input)
4. **Số tiền giảm** (number, default: 400000)

**Auto-calculate:**
- Tháng áp dụng giảm: `Tháng bắt đầu + 3 tháng`

---

## SECTION 6: BACKUP & KHÔI PHỤC

**Card Style:** Same as above, but with 2-column grid (desktop)

### Column 1: Status Indicators

**Title:** `Trạng thái dữ liệu`

**Status List:**
```
• Dữ liệu tháng trước: [✅ Đã có]
• File kế toán tháng trước: [⚠️ Chưa có]
• DS Ghi HĐ tháng trước: [✅ Đã có]
• Backup gần nhất: 06/09/2026 14:30
```

**Badge Styles:**
- `✅ Đã có`: Background `#d1f2dd`, color `#1e7e34`
- `⚠️ Chưa có`: Background `#fff4e5`, color `#e67700`

### Column 2: Action Buttons

**Buttons (vertical stack, gap: `12px`):**

1. **Lưu DS tháng này làm tham chiếu**
   - Outline style
   - Click: Save current month data for next month comparison

2. **Xuất DS STK phụ (dán vào Google Sheets)**
   - Outline style
   - Click: Export STK_PHU as CSV for manual Google Sheets update

3. **Xuất backup toàn bộ (JSON)**
   - Outline style
   - Click: Download full localStorage backup as JSON

4. **Nhập backup (JSON)**
   - Outline style
   - Click: Open file picker to restore from JSON backup

**Button Style:**
- Width: `100%`
- Height: `44px`
- Border: `1px solid #d2d2d7`
- Border-radius: `8px`
- Font: `14px`, weight `500`
- Padding: `0 16px`

---

## ALPINE.JS METHODS

### exportMapping()
```javascript
exportMapping() {
  const mapping = {
    joy_stk_phu: Storage.loadSTKPhu(),
    joy_keywords: Storage.loadKeywords(),
    joy_family_groups: Storage.loadFamilyGroups(),
    exportDate: new Date().toISOString()
  };
  
  const blob = new Blob([JSON.stringify(mapping, null, 2)], 
    { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `joy_mappings_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  
  URL.revokeObjectURL(url);
  this.showToast('✅ Đã xuất mapping', 'success');
}
```

### importMapping()
```javascript
async importMapping(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    
    let count = 0;
    if (data.joy_stk_phu) count += Storage.mergeSTKPhu(data.joy_stk_phu);
    if (data.joy_keywords) count += Storage.mergeKeywords(data.joy_keywords);
    if (data.joy_family_groups) count += Storage.mergeFamilyGroups(data.joy_family_groups);
    
    this.loadSettingsUI(); // Refresh display
    this.showToast(`✅ Đã import ${count} mappings mới`, 'success');
  } catch (err) {
    this.showToast(`❌ Lỗi import: ${err.message}`, 'error');
  }
}
```

### addFamilyGroup()
```javascript
addFamilyGroup(formData) {
  const group = {
    groupName: formData.groupName,
    name: formData.groupName,
    members: formData.members.split(',').map(m => m.trim().toUpperCase()),
    stkDaiDien: formData.stkDaiDien.trim(),
    tenPH: formData.tenPH.trim()
  };
  
  Storage.addFamilyGroup(group);
  this.loadSettingsUI();
  this.showToast('✅ Đã thêm nhóm gia đình', 'success');
}
```

### exportBackup()
```javascript
exportBackup() {
  const backup = Storage.exportFullBackup();
  const blob = new Blob([JSON.stringify(backup, null, 2)], 
    { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `joy_backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  
  // Delay revokeObjectURL to ensure download completes
  setTimeout(() => URL.revokeObjectURL(url), 3000);
  
  this.showToast('✅ Đã tải backup', 'success');
}
```

---

**Status:** Specification file 7 of 8 complete.  
**Next:** Read `SPEC_08_COMPONENTS.md` for reusable UI components and utilities.
