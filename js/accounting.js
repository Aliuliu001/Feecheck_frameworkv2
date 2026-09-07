/**
 * JOY FEE CHECK - Accounting Module (v6 — 7-tab set operations)
 * 
 * Tab 1: DS HĐ Tháng trước (raw from prev invoice file import)
 * Tab 2: DS CK VTB Tháng này (students who CK to company VietinBank)
 * Tab 3: Giảm bớt = (Tab1 - Tab2) ∩ IN master ∩ HP>0 (còn cơ hội đóng tiền)
 * Tab 4: Stop học nghỉ = (Tab1 - Tab2) ∩ (NOT in master OR HP=0) (hết cơ hội)
 * Tab 5: Tăng mới = Tab2 - Tab1 (new VTB transfers)
 * Tab 6: Chuyển tiền sai = allocate-then-remainder per family (INDEPENDENT from Report)
 */
window.Accounting = {
  generateThucTe(students) {
    const validStudents = students.filter(s => {
      const note = (s.ghiChuGiaDinh || '').toLowerCase().trim();
      return !note.includes('nghỉ học');
    });
    validStudents.sort((a, b) => {
      const c = (a.className || '').localeCompare(b.className || '');
      return c !== 0 ? c : (a.stt || 0) - (b.stt || 0);
    });
    let counter = 1;
    return validStudents.map(s => ({
      stt: counter++, mshs: s.mshs, className: s.className || '', fullName: s.fullName || '',
      teacher: s.teacher || '', hocPhi: s.hocPhi || 0, diaChi: s.diaChi || '', ghiChu: s.ghiChuGiaDinh || ''
    }));
  },

  /**
   * Compute 7-tab accounting comparison.
   *
   * @param {Array} prevInvoiceStudents - Tab 1 data
   * @param {Set} vtbMatchedMSHS - Unique MSHS that CK to VTB this month
   * @param {Map} currMap - MSHS → student object (DS Tổng master)
   * @param {Map} vtbAmountByMSHS - MSHS → total VTB CK amount this month
   * @param {Array} reportRows - Report rows (unused by Tab 6 — kept for signature compat)
   * @param {Array} familyGroups - Family groups (for Tab 6 allocate-then-remainder)
   * @param {number} hpDefault - Default HP per student (for Tab 6 allocate-then-remainder)
   * @returns {Object} { tab1, tab2, tab3, tab4, tab5, tab6, prevSet, tab2Set }
   */
  computeInvoiceComparison(prevInvoiceStudents, vtbMatchedMSHS, currMap, vtbAmountByMSHS, reportRows, familyGroups, hpDefault) {
    const prevMSHS = (prevInvoiceStudents || []).map(s => typeof s === 'string' ? s : s.mshs).filter(Boolean);
    const prevSet = new Set(prevMSHS);
    const tab2Set = vtbMatchedMSHS || new Set();

    // Build prev student data map for display
    const prevDataMap = new Map();
    for (const s of (prevInvoiceStudents || [])) {
      const mshs = typeof s === 'string' ? s : s.mshs;
      if (mshs) prevDataMap.set(mshs, typeof s === 'string' ? { mshs, fullName: mshs, hocPhi: 0, className: '' } : s);
    }

    // Tab 1: DS HĐ Tháng trước
    const tab1 = prevMSHS.map(mshs => {
      const prevData = prevDataMap.get(mshs) || {};
      const student = (currMap || new Map()).get(mshs);
      return {
        mshs,
        fullName: student ? student.fullName : (prevData.fullName || mshs),
        className: student ? student.className : (prevData.className || ''),
        hocPhi: student ? (Number(student.hocPhi) || 0) : (prevData.hocPhi || 0),
        teacher: student ? student.teacher : ''
      };
    });

    // Tab 2: DS CK VTB Tháng này
    const tab2 = [];
    for (const mshs of tab2Set) {
      const student = (currMap || new Map()).get(mshs);
      const ckAmount = (vtbAmountByMSHS || new Map()).get(mshs) || 0;
      tab2.push({
        mshs,
        fullName: student ? student.fullName : mshs,
        className: student ? student.className : '',
        hocPhi: student ? (Number(student.hocPhi) || 0) : 0,
        teacher: student ? student.teacher : '',
        ckAmount
      });
    }
    tab2.sort((a, b) => a.mshs.localeCompare(b.mshs));

    // Tab1 - Tab2
    const tab1MinusTab2 = tab1.filter(r => !tab2Set.has(r.mshs));

    // Tab 3: Giảm bớt = (Tab1 - Tab2) ∩ IN master ∩ HP>0
    const tab3 = tab1MinusTab2.filter(r => {
      const student = (currMap || new Map()).get(r.mshs);
      if (!student) return false;
      if ((Number(student.hocPhi) || 0) === 0) return false;
      return true;
    });

    // Tab 4: Stop học nghỉ = (Tab1 - Tab2) ∩ (NOT in master OR HP=0)
    const tab4 = tab1MinusTab2.filter(r => {
      const student = (currMap || new Map()).get(r.mshs);
      if (!student) return true;
      if ((Number(student.hocPhi) || 0) === 0) return true;
      return false;
    }).map(r => {
      const student = (currMap || new Map()).get(r.mshs);
      let lyDo;
      if (!student) {
        lyDo = '🚫 Không còn trong DS Tổng';
      } else if ((Number(student.hocPhi) || 0) === 0) {
        lyDo = '💰 HP = 0';
      } else {
        lyDo = '⚠️ Cần rà tay';
      }
      return { ...r, lyDo };
    });

    // Tab 5: Tăng mới = Tab2 - Tab1
    const tab5 = tab2.filter(r => !prevSet.has(r.mshs));

    // ═══════════════════════════════════════════════════════════════
    // Tab 6: Chuyển tiền sai — Allocate-then-remainder algorithm
    // COMPLETELY INDEPENDENT from Report/Đối soát tab.
    // No dependency on reportRows whatsoever.
    //
    // Algorithm per family:
    //   1. Tong_CK_GiaDinh = sum CK for all members in family
    //   2. Sort members by MSHS ascending (deterministic)
    //   3. Allocate HP_default to each member in order (max HP_default each)
    //   4. ChenhLech = remainder after all members processed
    //   5. Flag if ChenhLech ≠ 0
    // Students NOT in any family group → solo (1-person family)
    // ═══════════════════════════════════════════════════════════════
    const vtbAmt = vtbAmountByMSHS || new Map();
    const hpDef = hpDefault || APP_CONFIG.DEFAULT_HOC_PHI || 800000;
    const groups = familyGroups || [];

    // Step 1: Build family membership map (mshs → familyGroup)
    const mshsToGroup = new Map();
    for (const fg of groups) {
      for (const m of (fg.members || [])) {
        mshsToGroup.set(m.toUpperCase(), fg);
      }
    }

    // Step 2: Build family aggregation — 1 entry per family or solo student
    // IMPORTANT: iterate over ALL family groups (not just tab2Set) so that
    // family members who didn't CK are still included in the allocation.
    const familyCKMap = new Map();
    const processedMSHS = new Set();

    // First: process all family groups — include ALL members regardless of CK status
    for (const fg of groups) {
      const members = (fg.members || []).map(m => m.toUpperCase());
      if (members.length === 0) continue;
      let totalCK = 0;
      for (const mshs of members) {
        totalCK += vtbAmt.get(mshs) || 0;
        processedMSHS.add(mshs);
      }
      familyCKMap.set(fg.groupId, { members, totalCK, family: fg });
    }

    // Second: process solo students (CK'd but NOT in any family group)
    for (const mshs of tab2Set) {
      const mshsUpper = (typeof mshs === 'string' ? mshs : '').toUpperCase();
      if (!mshsUpper || processedMSHS.has(mshsUpper)) continue;
      const ck = vtbAmt.get(mshsUpper) || 0;
      familyCKMap.set('solo_' + mshsUpper, { members: [mshsUpper], totalCK: ck, family: null });
      processedMSHS.add(mshsUpper);
    }

    // Step 3: For each family/solo, run allocate-then-remainder
    const tab6 = [];
    for (const [fKey, entry] of familyCKMap) {
      // Sort members by MSHS ascending (deterministic)
      entry.members.sort((a, b) => a.toUpperCase().localeCompare(b.toUpperCase()));

      // SKIP families with NO VTB CK at all — they likely paid via TPBank/Cash,
      // not a "Chuyển tiền sai" case. Tab 3 (Giảm bớt) handles non-VTB families.
      if (entry.totalCK === 0) continue;

      const memberCount = entry.members.length;
      const kyVong = hpDef * memberCount;
      const tongCKGiaDinh = entry.totalCK;
      const isFamily = !!entry.family;

      // Allocate HP_default to each member in order
      let con_lai = tongCKGiaDinh;
      const memberDetails = entry.members.map(mshs => {
        const da_cap = Math.min(con_lai, hpDef);
        const isSufficient = da_cap >= hpDef;
        const shortage = isSufficient ? 0 : hpDef - da_cap;
        con_lai -= da_cap;
        return {
          mshs,
          fullName: ((currMap || new Map()).get(mshs) || {}).fullName || mshs,
          allocated: da_cap,
          sufficient: isSufficient ? 'Đủ' : 'Thiếu ' + Utils.formatCurrency(shortage)
        };
      });

      // con_lai is now the remainder
      const chenhLech = con_lai;

      // Only include families/students with a mismatch (chenhLech ≠ 0)
      // or where any member is under-allocated (thiếu)
      const hasShortage = memberDetails.some(m => m.allocated < hpDef);
      if (chenhLech === 0 && !hasShortage) continue;

      // Build lyDo reason string
      let lyDo = '';
      if (chenhLech > 0) {
        lyDo = 'Dư ' + Utils.formatCurrency(chenhLech) + ' — có thể gộp tiền sách/gộp nhiều tháng';
      }
      // Find the most underfunded member for shortage message
      const shortageMembers = memberDetails.filter(m => m.allocated < hpDef);
      if (shortageMembers.length > 0) {
        // Pick the member with the largest shortage (or last one alphabetically for determinism)
        const worstShortage = shortageMembers.reduce((worst, m) => {
          const diff = hpDef - m.allocated;
          const worstDiff = hpDef - worst.allocated;
          if (diff > worstDiff) return m;
          if (diff === worstDiff && m.mshs > worst.mshs) return m;
          return worst;
        });
        const shortageAmount = hpDef - worstShortage.allocated;
        if (lyDo) {
          lyDo += ' | ';
        }
        lyDo += 'Thiếu ' + Utils.formatCurrency(shortageAmount) + ' — thành viên ' + worstShortage.fullName + ' chưa được ghi nhận đủ tiền';
      }

      // Build display fields
      const mshsList = entry.members;
      const firstMSHS = mshsList[0];
      const joinedNames = memberDetails.map(m => m.mshs + ' - ' + m.fullName).join(', ');
      const joinedClassNames = mshsList.map(m => {
        const s = (currMap || new Map()).get(m);
        return s ? s.className : '';
      }).filter(Boolean).join(', ');

      tab6.push({
        memberDetails,
        tongCKGiaDinh,
        kyVong,
        chenhLech,
        lyDo,
        memberCount,
        isFamily,
        mshs: isFamily ? mshsList.join(', ') : firstMSHS,
        fullName: isFamily ? joinedNames : (memberDetails[0].fullName || firstMSHS),
        className: isFamily ? joinedClassNames : (((currMap || new Map()).get(firstMSHS) || {}).className || ''),
        hocPhi: kyVong,
        ckAmount: tongCKGiaDinh
      });
    }

    // Sort: families first, then by |chenhLech| descending
    tab6.sort((a, b) => {
      if (a.isFamily !== b.isFamily) return a.isFamily ? -1 : 1;
      return Math.abs(b.chenhLech) - Math.abs(a.chenhLech);
    });

    return { tab1, tab2, tab3, tab4, tab5, tab6, prevSet, tab2Set };
  },

  generateNhacPH(reportRows) {
    return reportRows
      .filter(r => r.trangThai === APP_CONFIG.STATUS.UNPAID || r.trangThai === APP_CONFIG.STATUS.PARTIAL)
      .map(r => ({ mshs: r.mshs, fullName: r.fullName, phone: r.phone || '', soTienThieu: r.soTienThieu || 0, className: r.className || '' }));
  }
};
