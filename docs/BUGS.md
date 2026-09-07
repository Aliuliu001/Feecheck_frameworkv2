# 🐛 BUGS — Đã fix & Known Issues

> Cập nhật: 04/08/2026

---

## ✅ ĐÃ FIX (Session 2 — 03-04/08/2026)

### CRITICAL

| # | File | Dòng | Mô tả | Fix |
|:--|:--|:--|:--|:--|
| B01 | `reporter.js` | 125-128 | `filterReport()` khi filter = "all" (mặc định), `"all"` là truthy nên lọc ẩn TOÀN BỘ rows | Thêm `&& trangThai !== 'all'` cho mỗi điều kiện |
| B02 | `app.js` | 225 | Nút `#btn-export-full` không có event listener → bấm không có gì | Thêm `addEventListener` gọi `Exporter.exportFullExcel(this.state)` |
| B03 | `utils.js` | 191-194 | `showModal()` confirmBtn đóng modal trước khi gọi `onConfirm()` → nếu validation fail, modal đã đóng mất | Đổi logic: chỉ đóng modal nếu `onConfirm()` không return `false` |

### HIGH

| # | File | Dòng | Mô tả | Fix |
|:--|:--|:--|:--|:--|
| B04 | `storage.js` | 51, 57-63 | `mergeSTKPhu()` không update `currentMap` trong loop → nếu `newList` có duplicate key, chèn trùng | Thêm `currentMap.set(newItem.stk, entry)` sau push |
| B05 | `storage.js` | 93, 98-105 | `mergeKeywords()` cùng lỗi như B04 | Tương tự: thêm `currentMap.set()` |
| B06 | `storage.js` | 51, 93 | `return;` thay vì `return 0;` khi input không phải array → caller nhận `undefined` | Đổi thành `return 0;` |
| B07 | `app.js` | 429-435 | `suggestMatch()` truyền array `[{...}]` thay vì object `{...}` → `unmatchedTx.description` = undefined | Bỏ ngoặc vuông, truyền object trực tiếp |
| B08 | `app.js` | 433 | `suggestions[0].length` — `suggestions[0]` là object, `.length` = undefined → luôn hiện "Không có gợi ý" | Sửa: `suggestions.length > 0` rồi `suggestions.map(...)` |
| B09 | `app.js` | 460 | TPBank unmatched hard-code `"Chưa có gợi ý"` thay vì gọi `suggestMatch()` | Thêm gọi `Matcher.suggestMatch(t, this.state.students)` |
| B10 | `app.js` | 443, 895 | Inline `onclick` dùng template literal chứa dấu `'` → JS syntax error nếu tên/STK có `'` | Thêm `.replace(/'/g, "\\\\'")` |
| B11 | `app.js` | 635, 690 | Sau khi gán STK/keyword xong, chỉ gọi `renderSyncChanges()` → bảng ngoại lệ không cập nhật | Đổi thành `this.runMatching()` để re-match + re-render |
| B12 | `app.js` | 930 | `info.lastBackupDate` không tồn tại (đúng: `info.lastHistoryDate`) → luôn hiện "Chưa có" | Sửa tên biến |
| B13 | `matcher.js` | 68 | `b.keyword.length` crash nếu keyword undefined | Đổi: `(b.keyword || '').length` |
| B14 | `matcher.js` | 164-183 | `aggregateByMSHS` case-sensitive → `'hv001' !== 'HV001'` | Thêm `.toUpperCase()` |

### MEDIUM

| # | File | Dòng | Mô tả | Fix |
|:--|:--|:--|:--|:--|
| B15 | `utils.js` | 79-83 | `formatDate()` không parse DD-MM-YY (2 chữ số năm) → ngày tiền mặt hiện sai | Thêm nhánh `parts[2].length === 2` → `2000 + parseInt(parts[2])` |
| B16 | `importer.js` | 94 | Hardcode `APP_CONFIG.DEFAULT_HOC_PHI` thay vì đọc `#default-fee` input | Đổi: `Utils.parseNumber(document.getElementById('default-fee')?.value) \|\| APP_CONFIG.DEFAULT_HOC_PHI` |
| B17 | `importer.js` | 155-162 | VietinBank thiếu alias cột `"Số TK đối ứng"`, `"Số tài khoản đối ứng"` | Thêm vào mảng tìm kiếm |
| B18 | `importer.js` | 217-223 | TPBank thiếu alias cột `"Ngày"`, `"Ngày GD"` | Thêm vào mảng tìm kiếm |
| B19 | `importer.js` | 241 | Regex hard-code `LE THI TUYET NHUNG chuyen tien` (tên chủ TK cá nhân) | Comment ra — user sẽ tự filter nếu cần |
| B20 | `importer.js` | 313 | MSHS tiền mặt không `.toUpperCase()` → mismatch khi aggregate | Thêm `.toUpperCase()` |

---

## ⚠️ KNOWN ISSUES (CHƯA FIX)

| # | File | Mô tả | Mức độ | Ghi chú |
|:--|:--|:--|:--|:--|
| K02 | `exporter.js` | `exportKeToan()` sheet "DS viết HĐ" — **ĐÃ FIX** (code hiện có 6 dòng header công ty + footer tổng + Giám đốc). Docs cũ ghi chưa fix là SAI. | — | Đã verify 28/08 |
| K03 | `exporter.js` | `exportFullExcel()` key mapping — **ĐÃ FIX** (app.js truyền đúng `vtb/tpb/cash`). Docs cũ ghi chưa fix là SAI. | — | Đã verify 28/08 |
| K06 | Toàn bộ | **ĐÃ TEST** bằng Node harness 28/08 với file thật tháng 7. Diff vs master BAO_CAO: 173 trùng, 3 mismatch (1.7%), lệch 800k do 2 HS thiếu keyword (đúng nghiệp vụ). | — | Xem session test bên dưới |

---

## ✅ ĐÃ FIX 28/08 (phát hiện qua test file thật tháng 7)

| # | File | Mô tả | Mức độ | Fix |
|:--|:--|:--|:--|:--|
| B21 | `exporter.js` | Xuất Excel lấy `row.ghiChuGiaDinh` (thường rỗng) thay vì `row.ghiChu` → **mất toàn bộ cảnh báo ⚠** trong file Excel | HIGH | Đổi sang `row.ghiChu` ở `exportBaoCao` + `exportFullExcel` (sheet BAO_CAO) |
| B22 | `exporter.js` | Format tháng `2026-08` (từ input type=month) không khớp mẫu kế toán `07.2026` | LOW | Chuẩn hóa thành `MM.YYYY` ở tất cả hàm export |
| B23 | `reporter.js` | Cảnh báo "⚠ Nghi nhầm" báo quá nhiều false positive (vì HP=800k, hầu hết GD lẻ đều bị gắn) | MEDIUM | User chọn bỏ hẳn, chỉ giữ "⚠ CK TK CT lệch HP" |
| B24 | `matcher.js:220` | `if (totalCKPool === 0) continue;` nằm trong `.forEach` → **SyntaxError crash toàn bộ app** nếu có nhóm GĐ | CRITICAL | Đổi `continue` → `return` |
| B25 | `importer.js:135` | Vòng lặp tìm header VTB giới hạn 20 dòng → sao kê có block "thông tin tài khoản" (24 dòng header) → chọn sai dòng → **toàn bộ VTB 0 match** | HIGH | Mở rộng 40 dòng + ưu tiên dòng chứa "đối ứng" |
| B26 | `matcher.js` | 1 STK chính (hoặc 1 keyword) có nhiều HS → chỉ gán khoản tiền vào HS đầu tiên `[0]`, bỏ sót các con còn lại | HIGH | Chia tiền theo tỉ lệ HP cho tất cả HS share cùng STK/keyword (áp dụng cho cả VTB và TPB) |

### Kết quả test (Node harness, file thật tháng 7)
- Parse: DS 185 HS, VTB 86 GD (match 90 sau chia), TPB 46 GD (match 42), Tiền mặt 27.
- Diff vs master `BAO_CAO`: 173 trùng / 3 mismatch (1.7%). Lệch tổng 800.000₫ do 2 HS (HV329, HV339) thiếu keyword mapping — đúng nghiệp vụ (tab Ngoại lệ để gán tay).
- File Excel xuất ra ĐÃ có cột Ghi chú chứa ⚠ (verify 6 dòng).
- Patch: `joyfeecheck_fixes.patch` (5 file, +134 dòng).
