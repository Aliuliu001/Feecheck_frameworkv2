# Rà soát tổng thể template mới — Khôi phục chức năng rơi rớt (Feecheck_frameworkv2)

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Đối chiếu toàn bộ chức năng bản cũ (a09fae2) với bản Alpine hiện tại, khôi phục các mục bị rơi khi phủ template mới mà KHÔNG đụng logic matching/thuật toán.

**Architecture:** Giữ nguyên Alpine.js + SheetJS qua CDN, không build step. Mọi import qua `$store.appState`. Chỉ khôi phục UI + hàm gọi Storage/Reporter đã có, không viết lại matching.

**Tech Stack:** Vanilla Alpine.js, SheetJS (XLSX), localStorage key `joy_*`, GitHub Pages.

---

## Hiện trạng (đã đối chiếu read-only ngày 2026-09-23)

### Bản cũ `a09fae2:js/app.js` có ~80 hàm, bản mới `js/app.js` còn 51 hàm.

### Nhóm 1 — User báo bug trực tiếp
- **Thêm nhóm gia đình:** cũ dùng `Utils.showModal` 1 form 4 ô (Tên nhóm / DS MSHS bắt buộc / Tên PH tùy chọn / STK tùy chọn, kèm dòng giải thích chia đều theo HP từng bé). Mới dùng `prompt()` nối 4 lần → dễ đứng ở bước 2, không hiển thị đúng mô tả cũ. Nút `@click="addFamilyGroupUI()"` vẫn có (index.html:1009) nhưng trải nghiệm sai + thiếu validate tên nhóm bắt buộc.
- **Điều chỉnh HP / ưu đãi / tạm ngưng:** logic `Reporter` + `Storage.loadFeeAdjustments` vẫn chạy ngầm; bảng Điều chỉnh vừa khôi phục (commit 2719a4e), bảng Tạm ngưng vừa khôi phục — cần kiểm tra lại hiển thị + nút.
- **Giới thiệu bạn mới:** RƠI HẲN. `Storage.addReferral/loadReferrals/confirmReferral/removeReferral` còn nguyên trong `js/storage.js:338-369`, nhưng `js/app.js` mới KHÔNG có `addReferralUI/confirmReferral/deleteReferral/checkPendingReferrals`, `index.html` mới KHÔNG có `table-referrals` + `referral-alerts` (cũ index.html:702-728).
- **Lịch sử thao tác:** RƠI HẲN. `Storage.addHistory/loadHistory` còn (`storage.js:293-306`), nhưng `index.html` mới KHÔNG có `history-log` (cũ index.html:747-754), không chỗ nào gọi `addHistory` nữa.

### Nhóm 2 — Rà soát thêm, phát hiện rơi cùng đợt
- **Sync changes:** cũ có `table-sync-changes` + `renderSyncChanges/toggleSyncStatus/getChangeTypeInfo` — bản mới không có. Cần hỏi user còn dùng sync Google Sheets không, nếu không thì bỏ chính thức.
- **Tìm HS (findStudent/_findStudentSuggest/_scrollToStudent):** cũ có ô tìm + cuộn tới dòng; mới mất.
- **Lưu tham chiếu tháng:** `savePrevMonth/importPrevMonthExcel` + 3 badge trạng thái (`status-prev-month/prev-accounting/prev-invoice`) — mới mất.
- **Xuất phụ:** `exportSTKPhu` (dán vào Google Trang tính), `exportNhacPH` (nhắc PH), `export-full`, `importMapping` (mới chỉ có Xuất, không có Nhập), `editSTKPhu/editKeyword` (sửa mapping, mới chỉ có Xóa).
- **Từ báo cáo:** `adjustFeeFromReport` (mở điều chỉnh từ 1 dòng), `markBookFee` (đánh dấu tiền sách), `updateSuspendClasses/toggleAllSusCheck/renderSuspendedTable` (bản mới gộp thành `loadSuspendedUI`, cần kiểm tra đủ checkbox hàng loạt không).
- **Back-to-top:** nút `btn-back-to-top` (cũ index.html:882) — mới mất.

---

## Step-by-step plan

### Task 1: Chốt inventory rơi rớt (đối chiếu đủ, không đoán)
**Objective:** Có bảng mapping cũ→mới đầy đủ để không sót lần 2.

**Files:**
- Modify: `.hermes/plans/2026-09-23_120000-feecheck-audit.md` (tài liệu, không phải code)

**Step 1:** Chạy đối chiếu tên hàm cũ/mới:
```bash
cd /home/ubuntu/webapphocphi_new/joyfeecheck-main
git show a09fae2:js/app.js | grep -oP '^  \K[a-zA-Z_]+(?=: function|\(.*\{' | sort > /tmp/old_fns.txt
grep -oP '^\s{4}\K[a-zA-Z_]+(?=\(.*\) \{|\(.*\)\{)' js/app.js | sort > /tmp/new_fns.txt
comm -23 /tmp/old_fns.txt /tmp/new_fns.txt
```
Expected: danh sách hàm rơi (referral, history, sync, findStudent, savePrevMonth...).

**Step 2:** Đối chiếu id HTML:
```bash
git show a09fae2:index.html | grep -oP 'id="\K[^"]+' | sort > /tmp/old_ids.txt
grep -oP 'id="\K[^"]+' index.html | sort > /tmp/new_ids.txt
comm -23 /tmp/old_ids.txt /tmp/new_ids.txt
```
Expected: `table-referrals, referral-alerts, history-log, table-sync-changes, btn-set-prev-month, btn-export-stkphu, btn-export-nhac-ph, btn-back-to-top...`.

**Step 3:** Ghi kết quả vào cuối file plan này (bảng 3 cột: Chức năng | Bản cũ | Bản mới).
**Step 4:** Commit tài liệu:
```bash
git add .hermes/plans/ && git commit -m "audit: chot inventory roi rot template moi"
```

### Task 2: Khôi phục form Thêm nhóm gia đình (đúng 4 ô bản cũ)
**Objective:** Bấm ➕ Thêm nhóm → mở form 1 lần 4 ô như cũ, lưu xong hiện ngay trong bảng.

**Files:**
- Modify: `index.html:1006-1041` (thêm modal form family)
- Modify: `js/app.js:560-581` (`addFamilyGroupUI`)
- Test: `node --check js/app.js`

**Step 1:** Viết test giả lập (node, mock localStorage + window như các lần trước):
```js
// Thêm nhóm thiếu tên → báo lỗi, không lưu. Thêm đủ 2 MSHS → lưu, loadFamilyGroups() thấy nhóm mới.
```
Run: `node /tmp/test_family.js` — Expected: FAIL (hiện tại prompt-chain không validate tên bắt buộc đúng cũ).

**Step 2:** Thay `addFamilyGroupUI()` prompt-chain bằng modal Alpine 4 ô (Tên nhóm bắt buộc / DS MSHS bắt buộc / Tên PH tùy chọn / STK tùy chọn + dòng "tự chia đều theo HP từng bé"), validate: thiếu tên hoặc <2 MSHS → toast lỗi, không lưu.
**Step 3:** Chạy lại test — Expected: PASS.
**Step 4:** Mở trình duyệt thật: Cài đặt → ➕ Thêm nhóm → nhập "Nhà Cô Lan, HV011, HV012" → bảng hiện nhóm mới → Refresh → vẫn còn.
**Step 5:** Commit:
```bash
git add index.html js/app.js && git commit -m "khoi phuc form them nhom gia dinh 4 o nhu ban cu"
```

### Task 3: Khôi phục Giới thiệu bạn mới (bảng + nhắc 3 tháng)
**Objective:** Nhập được giới thiệu, đủ 3 tháng tự nhắc, xác nhận xong tự tạo điều chỉnh -400k.

**Files:**
- Modify: `index.html` (thêm section 🎁 sau Điều chỉnh HP: `referral-alerts` + `table-referrals` 6 cột như cũ)
- Modify: `js/app.js` (thêm `referralData`, `addReferralUI/confirmReferral/deleteReferral/checkPendingReferrals`, gọi trong `loadSettingsUI` + `runMatching`)
- Storage đã có (`storage.js:338-369`), Reporter đã trừ tiền qua adjustment — không đụng.
- Test: `node --check js/app.js`

**Step 1:** Test giả lập: thêm referral (PH HV001 giới thiệu HV002, bắt đầu 2026-06 → áp dụng 2026-09), `checkPendingReferrals('2026-09')` phải nhắc. Run — Expected: FAIL (hàm chưa có).
**Step 2:** Khôi phục UI + 4 hàm theo đúng logic cũ (chống trùng 1 HS mới chỉ 1 lần, tháng áp dụng = start+3, xác nhận → `addFeeAdjustment` -400k + `addHistory`).
**Step 3:** Chạy lại test — Expected: PASS (nhắc đúng tháng 9, xác nhận tạo điều chỉnh).
**Step 4:** Trình duyệt thật: thêm 1 giới thiệu → bảng hiện → sang tháng áp dụng thấy banner nhắc.
**Step 5:** Commit: `git commit -m "khoi phuc gioi thieu ban moi + nhac 3 thang"`

### Task 4: Khôi phục Lịch sử thao tác
**Objective:** Mọi thao tác thêm/xóa (gán, family, gói, điều chỉnh, referral, tạm ngưng) đều ghi log và coi được.

**Files:**
- Modify: `index.html` (thêm card Lịch sử + `history-log` dưới Backup, như cũ index.html:747-754)
- Modify: `js/app.js` (thêm `historyData`, hàm `refreshHistory()`, rắc `Storage.addHistory()` vào các hàm thêm/xóa đã khôi phục)
- Test: `node --check js/app.js`

**Step 1:** Test: gọi `addHistory({action:'test'})` → `loadHistory()[0]` phải là test. (Storage đã có — Expected: PASS sẵn, chỉ thiếu UI.)
**Step 2:** Thêm UI + gọi refresh sau mỗi thao tác.
**Step 3:** Trình duyệt thật: thêm 1 family → lịch sử hiện dòng mới nhất lên đầu.
**Step 4:** Commit: `git commit -m "khoi phuc lich su thao tac"`

### Task 5: Khôi phục nhóm Xuất/Nhập phụ (hỏi user trước khi làm)
**Objective:** Không khôi phục thừa chức năng user đã bỏ.

**Files (dự kiến):** `index.html` (Backup & Khôi phục), `js/app.js`, `js/exporter.js`

**Step 1:** Hỏi user 1 lần (qua Telegram): còn dùng không — (a) Lưu DS tháng làm tham chiếu, (b) Xuất STK phụ dán Google Trang tính, (c) Xuất nhắc PH, (d) Nhập Mapping, (e) Sửa mapping (hiện chỉ có Xóa). Chỉ làm mục user gật.
**Step 2:** Khôi phục từng mục được gật, mỗi mục 1 commit nhỏ.
**Step 3:** Test: mỗi nút bấm ra file đúng tên như cũ.

### Task 6: Khôi phục tiện ích nhỏ (tìm HS, về đầu trang, nút từ báo cáo)
**Objective:** Tìm HS + cuộn nhanh + thao tác nhanh từ dòng báo cáo hoạt động lại.

**Files:** `index.html`, `js/app.js`
- `findStudent/_scrollToStudent` (ô tìm MSHS → cuộn tới dòng báo cáo)
- `btn-back-to-top`
- `adjustFeeFromReport` (nút 📝 từ dòng báo cáo), `markBookFee` (đánh dấu tiền sách), `addFamilyGroupForStudent` (đã có — kiểm tra lại nút gọi)

**Step 1:** Test trình duyệt: gõ MSHS vào ô tìm → trang cuộn tới đúng dòng highlight.
**Step 2:** Commit: `git commit -m "khoi phuc tim HS, back-to-top, nut nhanh bao cao"`

### Task 7: Giả lập chạy tổng (không cần dữ liệu thật của user)
**Objective:** Chạy giả lập toàn bộ flow, liệt kê sót trước khi giao.

**Files:** `/tmp/test_full_flow.js` (không commit)

**Step 1:** Chuẩn bị dữ liệu giả 5 HS + 3 dòng VTB + 2 dòng TPB + 1 family + 1 gói + 1 referral + 1 tạm ngưng.
**Step 2:** Chạy: import → runMatching → filter từng ô → copy tab kế toán → export. Ghi lại bước nào lỗi/vắng nút.
```bash
node /tmp/test_full_flow.js
```
Expected: tất cả PASS, không hàm nào `is not a function`, không id nào `null`.
**Step 3:** Mở trình duyệt thật đi 1 vòng 6 tab, chụp checklist tick từng nút.

### Task 8: Đẩy lên GitHub + dặn user kiểm tra
**Objective:** Giao 1 bản duy nhất, user chỉ cần Refresh.

**Step 1:** Bump cache `?v=` trong index.html (kẻo user dính bản cũ).
**Step 2:** Push:
```bash
export MYPAT=$(grep GITHUB_PAT /home/ubuntu/feecheck_frameworkv2/.env | cut -d= -f2)
git remote set-url origin https://Aliuliu001:${MYPAT}@github.com/Aliuliu001/Feecheck_frameworkv2.git
git push origin main
git remote set-url origin https://github.com/Aliuliu001/Feecheck_frameworkv2.git && unset MYPAT
```
Expected: `PUSH_OK`.
**Step 3:** Nhắn user: Ctrl+Shift+R rồi kiểm tra 4 mục (family / điều chỉnh / giới thiệu / lịch sử).

---

## Files likely to change
- `index.html` — thêm modal family 4 ô, section referral + history, các nút xuất/nhập phụ, ô tìm HS, back-to-top
- `js/app.js` — `addFamilyGroupUI`, `addReferralUI/confirmReferral/deleteReferral/checkPendingReferrals`, `refreshHistory`, `findStudent`, xuất/nhập phụ
- `js/exporter.js` — chỉ nếu Task 5 user gật (export STK phụ / nhắc PH)
- `js/storage.js`, `js/reporter.js`, `js/matcher.js` — KHÔNG đụng (logic đã đúng)

## Tests / validation
- `node --check js/app.js` sau mỗi task (bắt buộc trước commit)
- Test giả lập Node có mock localStorage+window (mẫu các lần trước: backup merge, TPB rời rạc, loose match, gói expiring — đều exit 0)
- Trình duyệt thật: thêm family / referral / điều chỉnh / tạm ngưng → Refresh → còn; bộ lọc 4 ô ra đúng số; nút Copy Tổng hợp đủ tab
- Không test bằng dữ liệu thật tháng 9 của user (tránh lẫn), chỉ dùng dữ liệu giả 5 HS

## Risks, tradeoffs, open questions
- **Prompt() bị chặn:** trình duyệt mới hay chặn prompt liên tiếp → đó là lý do family "nhập tên xong không chạy". Fix bằng modal form 1 lần (Task 2).
- **Sync Google Sheets:** nếu user không còn dùng sync thì Task sync (renderSyncChanges...) sẽ BỎ chính thức thay vì khôi phục — cần hỏi (Task 5).
- **Không sửa matching:** mọi khôi phục chỉ gọi Storage/Reporter có sẵn; nếu phát hiện sai số trong lúc giả lập (Task 7) thì ghi riêng, không sửa chung đợt này.
- **Câu hỏi cần user trả lời 1 lần (Task 5):** còn dùng (a)-(e) không? Trả lời gật/cúi từng mục là đủ, không cần giải thích dài.
