/**
 * JOY FEE CHECK - Reporter Module
 * Handles report generation, filtering, and statistics logic.
 */

window.Reporter = {
  /**
   * Generates report rows aggregating multiple classes per student and mapping payments.
   * @param {Array} students - Array of STUDENT objects from importer
   * @param {Map} paymentsByMSHS - Map of MSHS -> {vtb, tpb, cash, total}
   * @returns {Array} Array of REPORT_ROW objects
   */
  generateReport(students, paymentsByMSHS, familyGroups = [], monthYear = '') {
    const reportRows = [];
    const grouped = new Map();

    // Group student rows by MSHS
    for (const student of students) {
      if (!grouped.has(student.mshs)) {
        grouped.set(student.mshs, []);
      }
      grouped.get(student.mshs).push(student);
    }

    // Build family lookup: MSHS -> familyGroup
    const familyLookup = new Map();
    for (const fg of familyGroups) {
      if (fg.members) {
        for (const mshs of fg.members) {
          familyLookup.set(mshs, fg);
        }
      }
    }

    // Load fee adjustments for current month
    const allAdjustments = Storage.loadFeeAdjustments() || [];
    const adjustments = allAdjustments.filter(a => a.monthYear === monthYear);
    const adjMap = new Map(); // mshs -> total adjustment amount
    for (const adj of adjustments) {
      adjMap.set(adj.mshs, (adjMap.get(adj.mshs) || 0) + adj.amount);
    }

    for (const [mshs, classRows] of grouped.entries()) {
      let tongHocPhi = 0;
      let classes = [];
      let teachers = [];
      
      const primaryRow = classRows[0];
      
      for (const row of classRows) {
        tongHocPhi += (Number(row.hocPhi) || 0);
        if (row.className && !classes.includes(row.className)) {
          classes.push(row.className);
        }
        if (row.teacher && !teachers.includes(row.teacher)) {
          teachers.push(row.teacher);
        }
      }

      // Apply fee adjustments (giới thiệu, tạm ngưng, miễn giảm...)
      const totalAdj = adjMap.get(mshs) || 0;
      const tongHocPhiGoc = tongHocPhi;
      if (totalAdj !== 0) {
        tongHocPhi = Math.max(0, tongHocPhi + totalAdj); // HP không thể âm
      }

      const paymentData = paymentsByMSHS.get(mshs) || { vtb: 0, tpb: 0, cash: 0, total: 0 };
      
      // =========================
      // FAMILY SPLIT LOGIC (Sequential Allocation)
      // =========================
      const familyGroup = familyLookup.get(mshs);
      let familySplit = null;
      let adjustedPayment = paymentData.total;
      let familyNote = '';

      if (familyGroup) {
        // Calculate family total fee
        let familyTotalFee = 0;
        const familyStudentFees = {};
        for (const fmshs of familyGroup.members) {
          const fmRows = grouped.get(fmshs) || [];
          let fFee = 0;
          for (const r of fmRows) {
            fFee += (Number(r.hocPhi) || 0);
          }
          familyStudentFees[fmshs] = fFee;
          familyTotalFee += fFee;
        }

        // Get all family payments
        let familyTotalPayment = 0;
        for (const fmshs of familyGroup.members) {
          const fp = paymentsByMSHS.get(fmshs) || { vtb: 0, tpb: 0, cash: 0, total: 0 };
          familyTotalPayment += fp.total;
        }

        // Sequential allocation: allocate to each student in order until pool is exhausted
        let pool = familyTotalPayment;
        let myAllocated = 0;
        
        // Sort members by fee (highest first) to allocate fairly
        const sortedMembers = [...familyGroup.members].sort((a, b) => {
          return (familyStudentFees[b] || 0) - (familyStudentFees[a] || 0);
        });
        
        for (const fmshs of sortedMembers) {
          const fFee = familyStudentFees[fmshs] || 0;
          if (fmshs === mshs) {
            // This is the current student - allocate what's left or their fee, whichever is smaller
            myAllocated = Math.min(pool, fFee);
            pool -= myAllocated; // Trừ pool sau khi phân bổ
            break;
          } else {
            // Allocate to other students first
            const alloc = Math.min(pool, fFee);
            pool -= alloc;
          }
        }

        adjustedPayment = myAllocated;
        
        familySplit = {
          group: familyGroup,
          totalFee: familyTotalFee,
          myFee: tongHocPhi,
          familyTotalPayment: familyTotalPayment,
          adjustedPayment: adjustedPayment,
          pool: pool
        };
      }

      // Check if student has active package
      const packageInfo = Storage.isPackageActive(mshs, monthYear);
      let trangThai = '';
      let soTienThieu = 0;
      
      // Học sinh miễn phí (HP = 0)
      if (tongHocPhi === 0) {
        trangThai = 'MIỄN PHÍ';
      } else if (packageInfo.active) {
        // Student has paid via package
        trangThai = APP_CONFIG.STATUS.PACKAGE;
      } else if (adjustedPayment >= tongHocPhi && tongHocPhi > 0) {
        trangThai = adjustedPayment > tongHocPhi ? APP_CONFIG.STATUS.OVERPAID : APP_CONFIG.STATUS.PAID;
      } else if (adjustedPayment > 0 && adjustedPayment < tongHocPhi) {
        trangThai = APP_CONFIG.STATUS.PARTIAL;
        soTienThieu = tongHocPhi - adjustedPayment;
      } else if (adjustedPayment === 0) {
        trangThai = APP_CONFIG.STATUS.UNPAID;
        soTienThieu = tongHocPhi;
      }

      if (soTienThieu < 0) soTienThieu = 0;
      
      // ==========================
      // Tạo Ghi Chú Tự Động
      // ==========================
      let notes = [];
      
      // 0. Đóng gói
      if (packageInfo.active) {
        const discountPercent = packageInfo.discountPercent || 0;
        const discountAmount = Math.floor(tongHocPhi * discountPercent / 100);
        notes.push(`📦 Đã đóng gói: ${packageInfo.packageName} (${packageInfo.startMonth} → ${packageInfo.endMonth})${discountPercent > 0 ? ` — Giảm ${discountPercent}% (${Utils.formatCurrency(discountAmount)}/tháng)` : ''}`);
      }

      // 0.5. Điều chỉnh học phí
      if (totalAdj !== 0) {
        const adjDetails = allAdjustments.filter(a => a.mshs === mshs && a.monthYear === monthYear);
        const adjTypes = adjDetails.map(a => a.type).join(', ');
        notes.push(`📝 Điều chỉnh: ${Utils.formatCurrency(totalAdj)} (${adjTypes})`);
        if (tongHocPhiGoc !== tongHocPhi) {
          notes.push(`HP: ${Utils.formatCurrency(tongHocPhiGoc)} → ${Utils.formatCurrency(tongHocPhi)}`);
        }
      }

      // 1. CK VietinBank khác mức học phí quy định (cảnh báo hụt HĐ)
      if (paymentData.vtb > 0 && paymentData.vtb !== tongHocPhi) {
        notes.push(`⚠ CK TK CT: ${Utils.formatCurrency(paymentData.vtb)} (HP: ${Utils.formatCurrency(tongHocPhi)})`);
      }

      // 3. Học nhiều lớp
      if (classes.length > 1) {
        notes.push(`Học ${classes.length} lớp`);
      }

      // 4. Nhóm gia đình
      if (familyGroup) {
        notes.push(`👨‍👩‍👧‍👦 GĐ: ${familyGroup.name || familyGroup.groupId}`);
        if (familySplit) {
          notes.push(`HP ${Utils.formatCurrency(tongHocPhi)} / Tổng GD: ${Utils.formatCurrency(familySplit.familyTotalPayment)}`);
          notes.push(`Đã phân bổ: ${Utils.formatCurrency(adjustedPayment)}${familySplit.pool > 0 ? ` (còn dư: ${Utils.formatCurrency(familySplit.pool)})` : ''}`);
        }
      }

      // 5. Thiếu / Dư
      if (trangThai === APP_CONFIG.STATUS.PARTIAL) {
        notes.push(`Thiếu: ${Utils.formatCurrency(soTienThieu)}`);
      } else if (trangThai === APP_CONFIG.STATUS.OVERPAID) {
        notes.push(`Dư: ${Utils.formatCurrency(adjustedPayment - tongHocPhi)}`);
      }

      let ghiChu = notes.join(' · ');

      reportRows.push({
        mshs: mshs,
        fullName: primaryRow.fullName || '',
        className: classes.join(', '),
        teacher: teachers.join(', '),
        phone: primaryRow.phone || '',
        tongHocPhi: tongHocPhi,
        chuyenKhoanVTB: paymentData.vtb,
        tienMat: paymentData.cash,
        chuyenKhoanTPB: paymentData.tpb,
        tongDaDong: familySplit ? adjustedPayment : paymentData.total,
        tongDaDongGoc: paymentData.total,
        familySplit: familySplit,
        trangThai: trangThai,
        soTienThieu: soTienThieu,
        ghiChu: ghiChu,
        ghiChuGiaDinh: primaryRow.ghiChuGiaDinh || '',
        coChuyenTKCongTy: paymentData.vtb > 0,
        txList: paymentData.txList || []
      });
    }

    // Sort by MSHS
    reportRows.sort((a, b) => a.mshs.localeCompare(b.mshs));
    return reportRows;
  },

  /**
   * Calculates overall statistics from report rows.
   */
  getStatistics(reportRows) {
    let stats = {
      tongHS: reportRows.length,
      daDong: 0,
      chuaDong: 0,
      dongThieu: 0,
      dongDu: 0,
      dongGoi: 0,
      tongThu: 0,
      tongHocPhi: 0
    };

    for (const row of reportRows) {
      stats.tongThu += (row.tongDaDong || 0);
      stats.tongHocPhi += (row.tongHocPhi || 0);
      
      switch (row.trangThai) {
        case APP_CONFIG.STATUS.PAID:
          stats.daDong++;
          break;
        case APP_CONFIG.STATUS.UNPAID:
          stats.chuaDong++;
          break;
        case APP_CONFIG.STATUS.PARTIAL:
          stats.dongThieu++;
          break;
        case APP_CONFIG.STATUS.OVERPAID:
          stats.dongDu++;
          break;
        case APP_CONFIG.STATUS.PACKAGE:
          stats.dongGoi++;
          break;
      }
    }
    return stats;
  },

  /**
   * Filters report rows based on active filter criteria.
   */
  filterReport(reportRows, filters) {
    const { trangThai, className, teacher, searchText } = filters || {};
    
    return reportRows.filter(row => {
      if (trangThai && trangThai !== 'all' && row.trangThai !== trangThai) return false;
      if (className && className !== 'all' && !row.className.includes(className)) return false;
      if (teacher && teacher !== 'all' && !row.teacher.includes(teacher)) return false;
      
      if (searchText) {
        const query = searchText.toLowerCase();
        if (!row.mshs.toLowerCase().includes(query) && !row.fullName.toLowerCase().includes(query)) {
          return false;
        }
      }
      
      return true;
    });
  }
};
