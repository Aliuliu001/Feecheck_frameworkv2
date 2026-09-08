/**
 * JOY FEE CHECK - Exporter Module
 * Handles Excel file generation using SheetJS (XLSX)
 */

window.Exporter = {
  // Simple helper to download
  triggerDownload(workbook, filename) {
    XLSX.writeFile(workbook, filename);
  },

  // Vietnamese number to words (for amounts)
  _numberToWords: function(num) {
    if (num === 0) return 'không đồng';
    const ones = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
    const tens = ['', 'mười', 'hai mươi', 'ba mươi', 'bốn mươi', 'năm mươi', 'sáu mươi', 'bảy mươi', 'tám mươi', 'chín mươi'];
    const read3 = (n) => {
      if (n === 0) return '';
      let result = '';
      const h = Math.floor(n / 100);
      const t = Math.floor((n % 100) / 10);
      const o = n % 10;
      if (h > 0) result += ones[h] + ' trăm';
      if (t > 0) {
        if (t === 1 && h > 0) result += ' mười';
        else result += (h > 0 ? ' ' : '') + tens[t];
      } else if (h > 0 && o > 0) {
        result += ' lẻ';
      }
      if (o > 0) {
        if (t === 1 && h === 0) result += (result ? ' ' : '') + 'một';
        else result += (result ? ' ' : '') + ones[o];
      }
      return result;
    };
    const units = ['', 'nghìn', 'triệu', 'tỷ'];
    let n = Math.floor(num);
    let words = '';
    let unitIdx = 0;
    while (n > 0) {
      const chunk = n % 1000;
      if (chunk > 0) {
        const chunkWords = read3(chunk);
        words = chunkWords + (units[unitIdx] ? ' ' + units[unitIdx] : '') + (words ? ' ' + words : '');
      }
      n = Math.floor(n / 1000);
      unitIdx++;
    }
    return words.trim() + ' đồng chẵn';
  },

  // Helper to autofit columns based on data length
  autoFitColumns(ws, data, headerKeys) {
    const colWidths = headerKeys.map(key => {
      let maxLen = key.length;
      if (data && data.length) {
        data.forEach(row => {
          const val = row[key];
          const len = val ? val.toString().length : 0;
          if (len > maxLen) maxLen = len;
        });
      }
      return { wch: Math.min(maxLen + 2, 50) };
    });
    ws['!cols'] = colWidths;
  },

  /**
   * Export internal reconciliation report
   */
  exportBaoCao(reportRows, stats, monthYear) {
    const wb = XLSX.utils.book_new();

    // Chuẩn hóa tháng thành MM.YYYY
    const monthLabel = (monthYear || '').includes('-')
      ? monthYear.split('-').reverse().join('.')
      : (monthYear || '');
    
    const dataRows = reportRows.map((row, index) => ({
      'STT': index + 1,
      'MSHS': row.mshs,
      'Họ tên': row.fullName,
      'Lớp': row.className,
      'GV': row.teacher,
      'Tổng HP': row.tongHocPhi,
      'CK VietinBank': row.chuyenKhoanVTB,
      'Tiền mặt': row.tienMat,
      'CK TPBank': row.chuyenKhoanTPB,
      'Tổng đã đóng': row.tongDaDong,
      'Trạng thái': row.trangThai,
      'Ghi chú': row.ghiChu || ''
    }));

    // Add total row
    dataRows.push({
      'STT': '',
      'MSHS': '',
      'Họ tên': 'TỔNG CỘNG',
      'Lớp': '',
      'GV': '',
      'Tổng HP': stats.tongHocPhi,
      'CK VietinBank': '',
      'Tiền mặt': '',
      'CK TPBank': '',
      'Tổng đã đóng': stats.tongThu,
      'Trạng thái': '',
      'Ghi chú': ''
    });

    const ws = XLSX.utils.json_to_sheet(dataRows);
    
    // Add Header Rows above data manually by inserting them
    XLSX.utils.sheet_add_aoa(ws, [
      [APP_CONFIG.COMPANY_NAME],
      [`BÁO CÁO ĐỐI SOÁT - ${monthLabel}`],
      [`Ngày tạo: ${new Date().toLocaleDateString('vi-VN')}`],
      []
    ], { origin: 'A1' });

    // Shift the JSON data down (we need to remake the sheet to insert titles easily)
    // Actually, a better way is to create an array of arrays (AoA) from start
    
    const finalAoA = [
      [APP_CONFIG.COMPANY_NAME],
      [`BÁO CÁO ĐỐI SOÁT - ${monthLabel}`],
      [`Ngày tạo: ${new Date().toLocaleDateString('vi-VN')}`],
      [],
      ['STT', 'MSHS', 'Họ tên', 'Lớp', 'GV', 'Tổng HP', 'CK VietinBank', 'Tiền mặt', 'CK TPBank', 'Tổng đã đóng', 'Trạng thái', 'Ghi chú']
    ];

    dataRows.forEach(row => {
      finalAoA.push([
        row['STT'], row['MSHS'], row['Họ tên'], row['Lớp'], row['GV'], row['Tổng HP'],
        row['CK VietinBank'], row['Tiền mặt'], row['CK TPBank'], row['Tổng đã đóng'],
        row['Trạng thái'], row['Ghi chú']
      ]);
    });

    const finalWs = XLSX.utils.aoa_to_sheet(finalAoA);
    this.autoFitColumns(finalWs, dataRows, ['STT', 'MSHS', 'Họ tên', 'Lớp', 'GV', 'Tổng HP', 'CK VietinBank', 'Tiền mặt', 'CK TPBank', 'Tổng đã đóng', 'Trạng thái', 'Ghi chú']);
    
    XLSX.utils.book_append_sheet(wb, finalWs, 'BÁO CÁO ĐỐI SOÁT');
    
    const filename = `BaoCao_DoiSoat_${monthLabel.replace(/[/ ]/g, '_')}.xlsx`;
    this.triggerDownload(wb, filename);
  },

  /**
   * Export accounting outputs (Thuc te, Ghi HD, Thay doi)
   */
  exportKeToan(thucTeRows, ghiHDRows, invoiceChanges, monthYear) {
    const wb = XLSX.utils.book_new();

    // Chuẩn hóa tháng thành MM.YYYY (từ input type=month "YYYY-MM")
    const monthLabel = (monthYear || '').includes('-')
      ? monthYear.split('-').reverse().join('.')
      : (monthYear || '');

    const headers = ['STT', 'Mã học sinh', 'Mã lớp', 'Họ tên học sinh', 'Giáo viên', 'Học phí', 'Địa chỉ', 'Ghi chú'];

    // 1. Sheet "Thực Tế"
    const aoaThucTe = [ headers ];
    let totalThucTe = 0;
    thucTeRows.forEach((item, idx) => {
      aoaThucTe.push([
        idx + 1, item.mshs, item.className, item.fullName, item.teacher, item.hocPhi, item.diaChi, item.ghiChu || ''
      ]);
      totalThucTe += (item.hocPhi || 0);
    });
    aoaThucTe.push(['', '', '', '', '', totalThucTe, '', '']);
    const wsThucTe = XLSX.utils.aoa_to_sheet(aoaThucTe);
    this.autoFitColumns(wsThucTe, thucTeRows, headers);
    XLSX.utils.book_append_sheet(wb, wsThucTe, 'Thực Tế');

    // 2. Sheet "Danh sách viết HĐ"
    const aoaGhiHD = [
      [APP_CONFIG.COMPANY_NAME, '', '', '', '', '', '', ''],
      [APP_CONFIG.COMPANY_TAX, '', '', '', '', '', '', ''],
      [APP_CONFIG.COMPANY_ADDRESS, '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      [`DANH SACH HỌC SINH THÁNG ${monthLabel}`],
      ['', '', '', '', '', '', '', ''],
      headers
    ];
    let totalGhiHD = 0;
    ghiHDRows.forEach((item, idx) => {
      aoaGhiHD.push([
        idx + 1, item.mshs, item.className, item.fullName, item.teacher, item.hocPhi, item.diaChi, item.ghiChu || ''
      ]);
      totalGhiHD += (item.hocPhi || 0);
    });
    
    aoaGhiHD.push(['', '', '', '', '', totalGhiHD, '', '']);
    aoaGhiHD.push(['Số tiền bằng chữ:', '', '', '', '', '', '', '']);
    aoaGhiHD.push(['', '', '', '', '', 'Giám đốc', '', '']);
    aoaGhiHD.push(['', '', '', '', '', '', '', '']);
    aoaGhiHD.push(['', '', '', '', '', 'TRUONG TUAN NGOC', '', '']);

    const wsGhiHD = XLSX.utils.aoa_to_sheet(aoaGhiHD);
    this.autoFitColumns(wsGhiHD, ghiHDRows, headers);
    XLSX.utils.book_append_sheet(wb, wsGhiHD, 'Danh sách viết HĐ');

    // 3. Sheet "Thay đổi DS HĐ" — Tăng/Giảm + CK sai tiền
    const tangMoi = (invoiceChanges && invoiceChanges.tangMoi) || [];
    const giamBot = (invoiceChanges && invoiceChanges.giamBot) || [];
    const saiTienCK = (invoiceChanges && invoiceChanges.saiTienCK) || [];
    const thayDoiHeaders = ['MSHS', 'Họ tên', 'Lớp', 'Học phí', 'Lý do'];

    const aoaThayDoi = [
      [APP_CONFIG.COMPANY_NAME],
      [`MST: ${APP_CONFIG.COMPANY_TAX}`],
      [`Địa chỉ: ${APP_CONFIG.COMPANY_ADDRESS}`],
      [],
      [`THAY ĐỔI DS GHI HĐ THÁNG ${monthLabel}`],
      []
    ];

    // TĂNG MỚI
    if (tangMoi.length > 0) {
      aoaThayDoi.push(['📈 TĂNG MỚI']);
      aoaThayDoi.push(thayDoiHeaders);
      tangMoi.forEach(item => {
        aoaThayDoi.push([item.mshs, item.fullName, item.className, item.hocPhi, item.lyDo]);
      });
      aoaThayDoi.push(['', '', '', '', `Tổng tăng: ${tangMoi.length} HS`]);
      aoaThayDoi.push([]);
    }

    // GIẢM BỚT
    if (giamBot.length > 0) {
      aoaThayDoi.push(['📉 GIẢM BỚT']);
      aoaThayDoi.push(thayDoiHeaders);
      giamBot.forEach(item => {
        aoaThayDoi.push([item.mshs, item.fullName, item.className, item.hocPhi, item.lyDo]);
      });
      aoaThayDoi.push(['', '', '', '', `Tổng giảm: ${giamBot.length} HS`]);
    }

    // CK SAI TIỀN
    if (saiTienCK.length > 0) {
      aoaThayDoi.push([]);
      aoaThayDoi.push(['⚠️ CK SAI TIỀN — CK VTB sai HP quy định']);
      aoaThayDoi.push(['MSHS', 'Họ tên', 'Lớp', 'HP quy định', 'Đã CK', 'Chênh lệch']);
      saiTienCK.forEach(item => {
        aoaThayDoi.push([item.mshs, item.fullName, item.className, item.hocPhi, item.ckNop, item.lyDo]);
      });
      aoaThayDoi.push(['', '', '', '', '', `Tổng: ${saiTienCK.length} HS sai tiền`]);
    }

    if (tangMoi.length === 0 && giamBot.length === 0 && saiTienCK.length === 0) {
      aoaThayDoi.push(['Không có thay đổi so với tháng trước']);
    }

    const wsThayDoi = XLSX.utils.aoa_to_sheet(aoaThayDoi);
    this.autoFitColumns(wsThayDoi, tangMoi.concat(giamBot).concat(saiTienCK), thayDoiHeaders);
    XLSX.utils.book_append_sheet(wb, wsThayDoi, 'Thay đổi DS HĐ');

    const filename = `BaoCao_KeToan_${monthLabel.replace(/[/ ]/g, '_')}.xlsx`;
    this.triggerDownload(wb, filename);
  },

  /**
   * Export a single accounting sub-tab as Excel
   */
  exportAccTabSingle: function(tabNum, rows, tabTitle, monthYear, filterTags) {
    // filterTags: null = show all, Set = only these tags for tab 7 ghiChu
    const wb = XLSX.utils.book_new();
    const monthLabel = (monthYear || '').includes('-')
      ? monthYear.split('-').reverse().join('.')
      : (monthYear || '');

    const isTab6 = tabNum === 6;
    const isTab4 = tabNum === 4;
    const isTab7 = tabNum === 7;
    const isTab1 = tabNum === 1;
    const headers = isTab6
      ? ['STT', 'Thành viên (số tiền được cấp)', 'Tổng CK thực tế', 'Tổng HP kỳ vọng', 'Chênh lệch', 'Lý do']
      : isTab4
        ? ['STT', 'MSHS', 'Họ tên', 'Lớp', 'Học phí', 'Lý do']
        : isTab7
          ? ['STT', 'MSHS', 'Lớp', 'Họ tên', 'Giáo viên', 'Học phí', 'Địa chỉ', 'Ghi chú', 'Nguồn CK']
          : isTab1
            ? ['STT', 'MSHS', 'Mã lớp', 'Họ và tên HS', 'Giáo viên', 'Học phí', 'Địa chỉ', 'Ghi chú tháng trước']
            : ['STT', 'MSHS', 'Họ tên', 'Lớp', 'Học phí'];

    let aoa;
    let totalHP = 0;

    if (isTab7) {
      // Tab 7: Formal invoice format
      aoa = [
        ['CÔNG TY TNHH TRUNG TÂM NGOẠI NGỮ JOY'],
        ['5801527284'],
        ['Hẻm 3b, Hồ Tùng Mậu, Phường Xuân Hương - Đà Lạt, Tỉnh Lâm Đồng'],
        [],
        [`DANH SÁCH HỌC SINH THÁNG ${monthLabel}`],
        [],
        headers
      ];
      rows.forEach((r, idx) => {
        let ghiChu = r.ghiChu || '';
        if (filterTags && ghiChu) {
          ghiChu = ghiChu.split(', ').filter(t => filterTags.has(t)).join(', ');
        }
        // Nguồn CK: lookup reportRow để lấy nguồn thanh toán
        const reportRows = window.App?.state?.reportRows || [];
        const rr = reportRows.find(x => x.mshs === r.mshs);
        let nguonCK = '—';
        if (rr) {
          if (rr.chuyenKhoanVTB > 0) nguonCK = 'VTB';
          if (rr.chuyenKhoanTPB > 0) nguonCK = nguonCK === '—' ? 'TPBank' : nguonCK + ', TPBank';
          if (rr.tienMat > 0) nguonCK = nguonCK === '—' ? 'Tiền mặt' : nguonCK + ', Tiền mặt';
        }
        aoa.push([idx + 1, r.mshs, r.className, r.fullName, r.teacher || '', r.hocPhi || 0, r.diaChi || '', ghiChu, nguonCK]);
        totalHP += (r.hocPhi || 0);
      });
      // Total row: TỔNG CỘNG in col D, total in col E (not F, to avoid sum/subtotal issues)
      aoa.push(['', '', '', 'TỔNG CỘNG', totalHP, '', '', '', '']);
      // Empty row
      aoa.push([]);
      // Amount in words (column A)
      const amountWords = 'Số tiền bằng chữ: ' + this._numberToWords(totalHP);
      aoa.push([amountWords]);
      // Empty row
      aoa.push([]);
      // Giám đốc (column F = Địa chỉ = index 6)
      aoa.push(['', '', '', '', '', 'Giám đốc']);
      // 4 empty rows for signature space
      aoa.push([], [], [], []);
      // TRƯƠNG TUẤN NGỌC (column F = Địa chỉ)
      aoa.push(['', '', '', '', '', 'TRƯƠNG TUẤN NGỌC']);
    } else {
      // Other tabs: standard format
      aoa = [
        [APP_CONFIG.COMPANY_NAME],
        [`BÁO CÁO KẾ TOÁN — ${tabTitle} — Tháng ${monthLabel}`],
        [`Ngày tạo: ${new Date().toLocaleDateString('vi-VN')}`],
        [],
        headers
      ];
      rows.forEach((r, idx) => {
        if (isTab6) {
          // Tab 6: allocate-then-remainder format (1 row per family)
          const memberStr = (r.memberDetails || []).map(m =>
            `${m.mshs} (${m.fullName || m.mshs}): ${Utils.formatCurrency(m.allocated)} [${m.sufficient}]`
          ).join(' | ');
          aoa.push([idx + 1, memberStr, r.tongCKGiaDinh || 0, r.kyVong || 0, r.chenhLech || 0, r.lyDo || '']);
        } else {
          let row;
          if (isTab1) {
            row = [idx + 1, r.mshs, r.className || '', r.fullName, r.teacher || '', r.hocPhi || 0, r.diaChi || '', r.ghiChu || ''];
          } else {
            row = [idx + 1, r.mshs, r.fullName, r.className, r.hocPhi || 0];
          }
          if (isTab4) row.push(r.lyDo || '');
          aoa.push(row);
        }
        totalHP += (r.hocPhi || 0);
      });
      const totalRow = isTab1
        ? ['', '', '', '', 'TỔNG CỘNG', totalHP, '', '']
        : ['', '', '', 'TỔNG CỘNG', totalHP];
      if (isTab6) totalRow.push('');
      else if (isTab4) totalRow.push('');
      aoa.push(totalRow);
    }

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    this.autoFitColumns(ws, null, headers);
    XLSX.utils.book_append_sheet(wb, ws, tabTitle.substring(0, 31));

    // Tab 7: add DS HS Master sheet (deduplicated by MSHS)
    if (isTab7) {
      const students = window.App?.state?.students || [];
      if (students.length > 0) {
        // Deduplicate: merge rows with same MSHS (combine class names)
        const mergedMap = new Map();
        students.forEach(s => {
          const key = s.mshs || '';
          if (mergedMap.has(key)) {
            const existing = mergedMap.get(key);
            // Add class if not already present
            if (s.className && !existing.classes.includes(s.className)) {
              existing.classes.push(s.className);
            }
          } else {
            mergedMap.set(key, {
              mshs: key,
              fullName: s.fullName || '',
              classes: s.className ? [s.className] : [],
              teacher: s.teacher || '',
              hocPhi: Number(s.hocPhi) || 0,
              diaChi: s.diaChi || '',
              phone: s.phone || ''
            });
          }
        });
        const masterHdrs = ['STT', 'MSHS', 'Lớp', 'Họ tên', 'Giáo viên', 'Học phí', 'Địa chỉ', 'Ghi chú'];
        const masterAoa = [
          ['DANH SÁCH HỌC SINH TỔNG'],
          [`Tháng ${monthLabel} (${mergedMap.size} HS)`],
          [],
          masterHdrs
        ];
        let stt = 1;
        mergedMap.forEach(s => {
          masterAoa.push([stt++, s.mshs, s.classes.join(', '), s.fullName, s.teacher, s.hocPhi, s.diaChi, '']);
        });
        const wsMaster = XLSX.utils.aoa_to_sheet(masterAoa);
        this.autoFitColumns(wsMaster, null, masterHdrs);
        XLSX.utils.book_append_sheet(wb, wsMaster, 'DS HS Master');
      }
    }

    const safeTitle = tabTitle.replace(/[^a-zA-Z0-9\u00C0-\u024F]/g, '_');
    const filename = `KeToan_${safeTitle}_${monthLabel.replace(/[/ ]/g, '_')}.xlsx`;
    this.triggerDownload(wb, filename);
  },

  /**
   * Export accounting report (7-tab comparison)
   */
  exportBaoCaoKeToan: function(data, monthYear, accTab7Rows, filterTags) {
    const wb = XLSX.utils.book_new();
    const monthLabel = (monthYear || '').includes('-')
      ? monthYear.split('-').reverse().join('.')
      : (monthYear || '');

    const createSheet = (aoa, colCount) => {
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      if (colCount) this.autoFitColumns(ws, null, colCount);
      return ws;
    };

    const headers5 = ['STT', 'MSHS', 'Họ tên', 'Lớp', 'Học phí'];
    const headers6 = ['STT', 'MSHS', 'Họ tên', 'Lớp', 'Học phí', 'Lý do'];

    const buildAoA = (title, rows, extraHeaders) => {
      const hdrs = extraHeaders || headers5;
      const aoa = [
        [APP_CONFIG.COMPANY_NAME],
        [`BÁO CÁO KẾ TOÁN - ${title} - Tháng ${monthLabel}`],
        [`Ngày tạo: ${new Date().toLocaleDateString('vi-VN')}`],
        [],
        hdrs
      ];
      let totalHP = 0;
      rows.forEach((r, idx) => {
        aoa.push([
          idx + 1, r.mshs, r.fullName, r.className, r.hocPhi || 0,
          ...(extraHeaders === headers6 ? [r.lyDo || ''] : [])
        ]);
        totalHP += (r.hocPhi || 0);
      });
      aoa.push(['', '', '', 'TỔNG CỘNG', totalHP, ...(extraHeaders === headers6 ? [''] : [])]);
      return aoa;
    };

    // Sheet 1: DS HĐ Tháng trước
    XLSX.utils.book_append_sheet(wb,
      createSheet(buildAoA('DS HĐ Tháng trước', data.tab1), headers5),
      '1_DS_HĐ_tháng_trước');

    // Sheet 2: DS CK VTB
    XLSX.utils.book_append_sheet(wb,
      createSheet(buildAoA('DS CK VTB Tháng này', data.tab2), headers5),
      '2_DS_CK_VTB');

    // Sheet 3: Giảm bớt
    XLSX.utils.book_append_sheet(wb,
      createSheet(buildAoA('Giảm bớt', data.tab3), headers5),
      '3_Giảm_bớt');

    // Sheet 4: Stop - nghỉ học (with reason)
    XLSX.utils.book_append_sheet(wb,
      createSheet(buildAoA('Stop - nghỉ học', data.tab4, headers6), headers6),
      '4_Stop_nghỉ_học');

    // Sheet 5: Tăng mới
    XLSX.utils.book_append_sheet(wb,
      createSheet(buildAoA('Tăng mới', data.tab5), headers5),
      '5_Tăng_mới');

    // Sheet 6: Chuyển tiền sai (allocate-then-remainder, 1 row per family)
    if (data.tab6 && data.tab6.length > 0) {
      const hdrs6 = ['STT', 'Thành viên (số tiền được cấp)', 'Tổng CK thực tế', 'Tổng HP kỳ vọng', 'Chênh lệch', 'Lý do'];
      const aoa6 = [
        [APP_CONFIG.COMPANY_NAME],
        [`BÁO CÁO KẾ TOÁN - Chuyển tiền sai - Tháng ${monthLabel}`],
        [`Ngày tạo: ${new Date().toLocaleDateString('vi-VN')}`],
        [],
        hdrs6
      ];
      data.tab6.forEach((r, idx) => {
        const memberStr = (r.memberDetails || []).map(m =>
          `${m.mshs} (${m.fullName || m.mshs}): ${Utils.formatCurrency(m.allocated)} [${m.sufficient}]`
        ).join(' | ');
        aoa6.push([idx + 1, memberStr, r.tongCKGiaDinh || 0, r.kyVong || 0, r.chenhLech || 0, r.lyDo || '']);
      });
      XLSX.utils.book_append_sheet(wb,
        createSheet(aoa6, hdrs6),
        '6_Chuyển_tiền_sai');
    }

    // Sheet 7: Tổng hợp
    if (accTab7Rows && accTab7Rows.length > 0) {
      const hdrs7 = ['STT', 'MSHS', 'Lớp', 'Họ tên', 'Giáo viên', 'Học phí', 'Địa chỉ', 'Ghi chú'];
      const aoa7 = [
        [APP_CONFIG.COMPANY_NAME],
        [`BÁO CÁO KẾ TOÁN - Tổng hợp - Tháng ${monthLabel}`],
        [`Ngày tạo: ${new Date().toLocaleDateString('vi-VN')}`],
        [],
        hdrs7
      ];
      accTab7Rows.forEach((r, idx) => {
        let ghiChu = r.ghiChu || '';
        if (filterTags && ghiChu) {
          ghiChu = ghiChu.split(', ').filter(t => filterTags.has(t)).join(', ');
        }
        aoa7.push([idx + 1, r.mshs, r.className, r.fullName, r.teacher || '', r.hocPhi || 0, r.diaChi || '', ghiChu]);
      });
      XLSX.utils.book_append_sheet(wb,
        createSheet(aoa7, hdrs7),
        '7_Tổng_hợp');
    }

    const filename = `BaoCaoKeToan_7Tabs_${monthLabel.replace(/[/ ]/g, '_')}.xlsx`;
    this.triggerDownload(wb, filename);
  },

  /**
   * Export reminder list for parents
   */
  exportNhacPH(nhacList, monthYear) {
    const wb = XLSX.utils.book_new();

    // Chuẩn hóa tháng thành MM.YYYY
    const monthLabel = (monthYear || '').includes('-')
      ? monthYear.split('-').reverse().join('.')
      : (monthYear || '');
    const dataRows = nhacList.map((row, idx) => ({
      'STT': idx + 1,
      'MSHS': row.mshs,
      'Họ tên': row.fullName,
      'SĐT': row.phone,
      'Số tiền thiếu': row.soTienThieu,
      'Lớp': row.className
    }));

    const ws = XLSX.utils.json_to_sheet(dataRows);
    this.autoFitColumns(ws, dataRows, ['STT', 'MSHS', 'Họ tên', 'SĐT', 'Số tiền thiếu', 'Lớp']);
    
    XLSX.utils.book_append_sheet(wb, ws, 'NHẮC PHỤ HUYNH');
    
    const filename = `DanhSach_NhacPH_${monthLabel.replace(/[/ ]/g, '_')}.xlsx`;
    this.triggerDownload(wb, filename);
  },

  /**
   * Export full JSON backup
   */
  exportBackupJSON(data) {
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `JoyFeeCheck_Backup_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * Export monthly archive
   */
  exportMonthlyArchive(allData, monthYear) {
    const dataStr = JSON.stringify(allData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `JoyFeeCheck_Archive_${monthYear.replace(/[/ ]/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * Export Full Excel (Nhiều sheet)
   */
  exportFullExcel(data) {
    const wb = XLSX.utils.book_new();
    const { students, vtb, tpb, cash, reportRows, stats, stkPhu, keywords, monthYear } = data;

    // Chuẩn hóa tháng thành MM.YYYY
    const monthLabel = (monthYear || '').includes('-')
      ? monthYear.split('-').reverse().join('.')
      : (monthYear || '');

    const createSheet = (aoa, cols) => {
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      this.autoFitColumns(ws, null, cols);
      return ws;
    };

    // 1. Ds_HocSinh
    const hsAoA = [['STT', 'Teacher', 'Shift', 'Class', 'Full name', 'MSHS', 'SDT', 'STK_PH', 'Tên TK', 'Học Phí', 'Địa chỉ', 'Ghi chú']];
    (students || []).forEach((s, idx) => {
      hsAoA.push([idx + 1, s.teacher, s.shift, s.className, s.fullName, s.mshs, s.phone, s.stkPH, s.tenTK, s.hocPhi, s.diaChi, s.ghiChuGiaDinh]);
    });
    XLSX.utils.book_append_sheet(wb, createSheet(hsAoA, hsAoA[0]), 'Ds_HocSinh');

    // 2. SAOKE_RAW (VietinBank)
    const vtbAoA = [['STT', 'NgàyGD', 'Nội dung', 'Ghi nợ', 'Ghi có', 'Số dư', 'STK đối ứng', 'Tên TK đối ứng']];
    (vtb || []).forEach((t, idx) => {
      vtbAoA.push([t.stt || idx + 1, t.date, t.description, t.debit, t.credit, t.balance, t.stkDoiUng, t.tenTKDoiUng]);
    });
    XLSX.utils.book_append_sheet(wb, createSheet(vtbAoA, vtbAoA[0]), 'SAOKE_RAW');

    // 3. SAO_KE_CA_NHAN (TPBank)
    const tpbAoA = [['Transaction Date', 'Reference Number', 'Explanation', 'Debit', 'Credit', 'Balance']];
    (tpb || []).forEach(t => {
      tpbAoA.push([t.date, t.refNumber, t.explanation, t.debit, t.credit, t.balance]);
    });
    XLSX.utils.book_append_sheet(wb, createSheet(tpbAoA, tpbAoA[0]), 'SAO_KE_CA_NHAN');

    // 4. TIEN_MAT
    const cashAoA = [['NGAY DONG', 'LỚP', 'HỌ TEN', 'SỐ TIỀN', 'MSHS', 'GHI CHU']];
    (cash || []).forEach(c => {
      cashAoA.push([c.date, c.className, c.fullName, c.amount, c.mshs, c.ghiChu]);
    });
    XLSX.utils.book_append_sheet(wb, createSheet(cashAoA, cashAoA[0]), 'TIEN_MAT');

    // 5. STK_PHU
    const stkPhuAoA = [['MSHS', 'Họ tên', 'STK_PH', 'Tên TK']];
    (stkPhu || []).forEach(s => {
      stkPhuAoA.push([s.mshs, s.fullName, s.stk, s.tenTK]);
    });
    XLSX.utils.book_append_sheet(wb, createSheet(stkPhuAoA, stkPhuAoA[0]), 'STK_PHU');

    // 6. MAP_TU_KHOA
    const kwAoA = [['TỪ KHÓA', 'MSHS', 'Tên HS']];
    (keywords || []).forEach(k => {
      kwAoA.push([k.keyword, k.mshs, k.studentName]);
    });
    XLSX.utils.book_append_sheet(wb, createSheet(kwAoA, kwAoA[0]), 'MAP_TU_KHOA');

    // 7. BAO_CAO
    const reportAoA = [
      [APP_CONFIG.COMPANY_NAME],
      [`BÁO CÁO ĐỐI SOÁT - ${monthLabel}`],
      [],
      ['STT', 'MSHS', 'Họ tên', 'Lớp', 'GV', 'Tổng HP', 'CK VietinBank', 'Tiền mặt', 'CK TPBank', 'Tổng đã đóng', 'Trạng thái', 'Ghi chú']
    ];
    (reportRows || []).forEach((row, idx) => {
      reportAoA.push([
        idx + 1, row.mshs, row.fullName, row.className, row.teacher, row.tongHocPhi,
        row.chuyenKhoanVTB, row.tienMat, row.chuyenKhoanTPB, row.tongDaDong,
 row.trangThai, row.ghiChu || ''
 ]);
 });
    if (stats) {
      reportAoA.push([
        '', '', 'TỔNG CỘNG', '', '', stats.tongHocPhi, '', '', '', stats.tongThu, '', ''
      ]);
    }
    XLSX.utils.book_append_sheet(wb, createSheet(reportAoA, reportAoA[3]), 'BAO_CAO');

    const filename = `JoyFeeCheck_Full_${monthLabel.replace(/[/ ]/g, '_')}.xlsx`;
    this.triggerDownload(wb, filename);
  },

  /**
   * (B) Xuất danh sách STK phụ đã gán -> để người dùng dán ngược vào
   *     Google Trang tính (sheet STK_PHU). Hỗ trợ không giới hạn số TK/bé.
   * @param {Array} stkPhuList  Storage.loadSTKPhu()
   * @param {Array} students    DS HS (để lấy tên đầy đủ chuẩn)
   */
  exportSTKPhu: function(stkPhuList, students) {
    const wb = XLSX.utils.book_new();
    const nameMap = new Map();
    (students || []).forEach(s => nameMap.set(s.mshs, s.fullName || ''));

    const aoa = [
      ['STT', 'MSHS', 'Tên học sinh', 'STK phụ', 'Tên chủ TK', 'Ngày thêm'],
      []
    ];
    (stkPhuList || []).forEach((s, idx) => {
      aoa.push([
        idx + 1,
        s.mshs,
        nameMap.get(s.mshs) || (s.fullName || ''),
        s.stk,
        s.tenTK || '',
        s.addedDate ? s.addedDate.split('T')[0] : ''
      ]);
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), 'STK_PHU');
    const filename = `STK_PHU_moi_${new Date().toISOString().slice(0,10).replace(/-/g,'')}.xlsx`;
    this.triggerDownload(wb, filename);
  }
};
