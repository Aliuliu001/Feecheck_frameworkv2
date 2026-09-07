# 📖 JOY FEE CHECK — README

> **Ứng dụng web đối soát học phí** cho Trung tâm Ngoại ngữ Joy (Đà Lạt)
> 100% client-side, thuần HTML + CSS + Vanilla JS. Không cần Node.js/Python.

---

## Cách chạy

1. Mở `index.html` trên trình duyệt (Chrome/Edge)
2. Kéo thả 4 file Excel vào đúng ô tương ứng trên tab Import
3. Nhấn "Bắt đầu đối soát"
4. Xem kết quả ở tab Báo cáo / Kế toán

## Cấu trúc project

```
C:\Users\Admin\.gemini\antigravity\scratch\JoyFeeCheck\
├── index.html                 — HTML chính, 6 tab: Import, Ngoại lệ, Báo cáo, Kế toán, Cài đặt, Hướng dẫn
├── css/
│   └── style.css              — Dark mode, glassmorphism, responsive
├── js/
│   ├── datamodel.js           — Constants + data model documentation
│   ├── utils.js               — normalizeSTK, normalizeText, fuzzyMatch, showToast, showModal, parseNumber, formatDate
│   ├── storage.js             — localStorage CRUD: STK_PHU, keywords, prevMonth, history, backup
│   ├── importer.js            — Parse 4 loại file Excel (SheetJS): DS HS, VietinBank, TPBank, Tiền mặt
│   ├── matcher.js             — Match STK + keyword + fuzzy suggest + aggregate tiền theo MSHS
│   ├── reporter.js            — Generate report rows + statistics + filter
│   ├── accounting.js          — DS Thực tế + DS Ghi HĐ + Detect changes
│   ├── exporter.js            — Export Excel (SheetJS) + JSON backup
│   └── app.js                 — Controller chính (973 dòng), kết nối tất cả modules
├── lib/
│   └── xlsx.full.min.js       — SheetJS v0.20.3 (đọc/ghi Excel, offline)
├── shared_data/
│   └── joy_mappings.json      — Mapping STK phụ + từ khóa (auto-load khi mở app)
├── backup/
│   └── initial_mappings.json  — Dữ liệu mapping ban đầu từ file Excel cũ
├── test_data/                 — (sẽ chứa 4 file .xlsx tách từ file gốc để test)
├── extract_mappings.ps1       — Script PowerShell trích xuất mapping từ file Excel gốc
├── extract_test_data.ps1      — Script PowerShell tách 4 sheet test từ file gốc
└── docs/
    ├── README.md              — File này
    ├── PROCESS.md             — Tiến trình làm việc, bối cảnh, quyết định thiết kế
    ├── TASK.md                — Task list chi tiết cho model kế tiếp
    └── BUGS.md                — Danh sách bugs đã fix + bugs known
```

## Dữ liệu đầu vào (4 file)

| # | Nguồn | Định dạng | Lưu ý |
|:--|:--|:--|:--|
| 1 | DS Học sinh (Google Sheets) | `.xlsx` | Cột: STT, Teacher, Shift, Class, Full name, MSHS, SDT, STK_PH, TênTK, HọcPhí |
| 2 | Sao kê VietinBank | `.xlsx` | Có STK đối ứng, match trực tiếp |
| 3 | Sao kê TPBank | `.xlsx` (qua ABBYY từ PDF) | Không có STK, match bằng keyword trong nội dung CK |
| 4 | Tiền mặt (Google Drive) | `.xlsx` | Đã có MSHS sẵn |

## File Excel gốc tham khảo

- **Đường dẫn**: `D:\Joy\Chương trình SGK\Văn phòng\Check HD VAT\Mr. Check VAT 7 - Tháng 7 - Copy.xlsm`
- Chứa 16 sheets, trong đó quan trọng: `Ds_HocSinh`, `SAOKE_RAW`, `SAO_KE_CA_NHAN`, `TIEN_MAT`, `STK_PHU`, `MAP_TU_KHOA`, `BAO_CAO`

## File mẫu kế toán

- **Đường dẫn**: `D:\Joy\Chương trình SGK\Văn phòng\Lương hàng tháng\Backup Ds Hang Thang Ke Toan\Ds hoc Phi - 07.2026 - Done.xlsx`
- 2 sheets:
  - **"Thực Tế"**: 148 HS, header ở row 1, 8 cột (STT | Mã HS | Mã lớp | Họ tên | GV | Học phí | Địa chỉ | Ghi chú), tổng cuối dòng
  - **"Danh sách viết HĐ"**: 130 HS, 6 dòng header công ty (tên, MST, địa chỉ), row 7 = header cột, row 8+ = data, cuối có tổng + "Số tiền bằng chữ:" + "Giám đốc" + "TRUONG TUAN NGOC"

## Logic matching

```
VietinBank: STK đối ứng → STK_PH trong DS HS → MSHS
                        → nếu không thấy → tìm STK_PHU
                        → nếu vẫn không → "STK mới cần map"
TPBank:     Keyword trong nội dung CK → MAP_TU_KHOA → MSHS
                        → nếu không → gợi ý fuzzy
Tiền mặt:   MSHS đã có sẵn trong file
Nhóm GĐ:    Gộp tiền VTB/TPB theo STK đại diện hoặc thành viên → chia lại cho từng cháu
```

## Luồng dữ liệu

```
Import 4 file → Importer parse → Matcher match → Reporter tạo báo cáo → Accounting tạo DS kế toán
                                    ↓
                              Storage (localStorage) ← STK_PHU + MAP_TU_KHOA tích lũy qua các tháng
                                    ↓
                              Exporter → Xuất .xlsx / .json
```
