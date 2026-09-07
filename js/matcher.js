/**
 * Matcher - Engine khớp nối giao dịch
 */

window.Matcher = {
  // Khớp giao dịch VietinBank (theo STK)
  matchVietinBank: function(transactions, students, stkPhuList) {
    const matched = [];
    const unmatched = [];

    // Tạo bản đồ STK -> MSHS để tra cứu nhanh (chính thức)
    const stkChinhMap = new Map();
    students.forEach(s => {
      const normSTK = Utils.normalizeSTK(s.stkPH);
      if (normSTK) {
        if (!stkChinhMap.has(normSTK)) {
          stkChinhMap.set(normSTK, []);
        }
        stkChinhMap.get(normSTK).push(s.mshs);
      }
    });

    // Tạo bản đồ STK Phụ -> MSHS
    const stkPhuMap = new Map();
    stkPhuList.forEach(m => {
      const normSTK = Utils.normalizeSTK(m.stk);
      if (normSTK) {
        if (!stkPhuMap.has(normSTK)) {
          stkPhuMap.set(normSTK, []);
        }
        stkPhuMap.get(normSTK).push(m.mshs);
      }
    });

    // Bản đồ MSHS -> Học phí (để chia tiền khi 1 STK có nhiều HS)
    const hpMap = new Map();
    students.forEach(s => {
      hpMap.set(s.mshs, Number(s.hocPhi) || APP_CONFIG.DEFAULT_HOC_PHI);
    });

    // Hàm chia 1 GD cho nhiều MSHS theo tỉ lệ học phí
    const splitToMembers = (tx, members) => {
      const reqs = members.map(mshs => ({ mshs, hp: hpMap.get(mshs) || APP_CONFIG.DEFAULT_HOC_PHI }));
      const totalHP = reqs.reduce((a, r) => a + r.hp, 0) || 1;
      let remain = tx.credit;
      reqs.forEach((r, idx) => {
        // Các phần tử trước lấy phần nguyên theo tỉ lệ; phần tử cuối gom phần dư
        const alloc = (idx === reqs.length - 1)
          ? remain
          : Math.floor(tx.credit * r.hp / totalHP);
        remain -= alloc;
        if (alloc <= 0) return;
        matched.push({
          ...tx,
          credit: alloc,
          matchedMSHS: r.mshs,
          matchSource: tx.matchSource,
          matchNote: members.length > 1 ? 'stk_chinh_chia_nhieu_hs' : ''
        });
      });
    };

    transactions.forEach(tx => {
      const normTxSTK = Utils.normalizeSTK(tx.stkDoiUng);
      let found = false;

      // 1. Tìm trong STK chính
      if (normTxSTK && stkChinhMap.has(normTxSTK)) {
        const members = stkChinhMap.get(normTxSTK);
        tx.matchSource = 'stk_chinh';
        if (members.length === 1) {
          tx.matchedMSHS = members[0];
          matched.push(tx);
        } else {
          // 1 STK chính có nhiều HS -> chia tiền theo tỉ lệ học phí
          splitToMembers(tx, members);
        }
        found = true;
      }
      // 2. Tìm trong STK phụ
      else if (normTxSTK && stkPhuMap.has(normTxSTK)) {
        const members = stkPhuMap.get(normTxSTK);
        tx.matchSource = 'stk_phu';
        if (members.length === 1) {
          tx.matchedMSHS = members[0];
          matched.push(tx);
        } else {
          splitToMembers(tx, members);
        }
        found = true;
      }
      // 3. Quét nội dung/mô tả giao dịch VietinBank khớp với tên học sinh đầy đủ hoặc mã học sinh
      else {
        const descText = Utils.normalizeText(tx.description || '');
        if (descText) {
          for (const s of students) {
            const normName = Utils.normalizeText(s.fullName || '');
            const normMSHS = Utils.normalizeText(s.mshs || '');
            if ((normName && descText.includes(normName)) || (normMSHS && descText.includes(normMSHS))) {
              tx.matchedMSHS = s.mshs;
              tx.matchSource = 'vtb_description';
              matched.push(tx);
              found = true;
              break;
            }
          }
        }
      }

      if (!found) {
        unmatched.push(tx);
      }
    });

    return { matched, unmatched };
  },

  // Khớp giao dịch TPBank (theo từ khóa)
  matchTPBank: function(transactions, keywordsList, students) {
    const matched = [];
    const unmatched = [];

    // Bản đồ MSHS -> Học phí (để chia tiền khi 1 keyword có nhiều HS)
    const hpMap = new Map();
    if (students) {
      students.forEach(s => hpMap.set(s.mshs, Number(s.hocPhi) || APP_CONFIG.DEFAULT_HOC_PHI));
    }

    // Nhóm các keyword trùng nhau (cùng chuỗi) thành 1 keyword -> [mshs...]
    const kwGroups = new Map();
    keywordsList.forEach(k => {
      const normKw = Utils.normalizeText(k.keyword);
      if (!normKw) return;
      if (!kwGroups.has(normKw)) kwGroups.set(normKw, []);
      kwGroups.get(normKw).push(k);
    });
    // Sắp xếp keyword theo độ dài giảm dần (ưu tiên khớp từ dài trước)
    const sortedKw = [...kwGroups.keys()].sort((a, b) => b.length - a.length);
    console.log(`[MATCH] Keywords loaded: ${sortedKw.length}`, sortedKw);

    transactions.forEach(tx => {
      const normDesc = Utils.normalizeText(tx.explanation);
      let found = false;

      for (const normKw of sortedKw) {
        if (normDesc.includes(normKw)) {
          console.log(`[MATCH] "${normKw}" found in "${normDesc}"`);
          const members = kwGroups.get(normKw);
          tx.matchSource = 'keyword';
          tx.matchedKeyword = members[0].keyword;
          if (members.length === 1) {
            tx.matchedMSHS = members[0].mshs;
            matched.push(tx);
          } else {
            // 1 keyword (1 PH) có nhiều HS -> chia tiền theo tỉ lệ HP (hoặc đều nếu thiếu HP)
            const reqs = members.map(m => ({ mshs: m.mshs, hp: hpMap.get(m.mshs) || 0 }));
            const totalHP = reqs.reduce((a, r) => a + r.hp, 0);
            let remain = tx.credit;
            reqs.forEach((r, idx) => {
              const alloc = (idx === reqs.length - 1)
                ? remain
                : Math.floor(tx.credit * (totalHP ? r.hp / totalHP : 1 / reqs.length));
              remain -= alloc;
              if (alloc <= 0) return;
              matched.push({
                ...tx,
                credit: alloc,
                matchedMSHS: r.mshs,
                matchNote: 'keyword_chia_nhieu_hs'
              });
            });
          }
          found = true;
          break;
        }
      }

      if (!found) {
        console.log(`[NO MATCH] No keyword found for "${normDesc.substring(0, 50)}..."`);
        // Thử khớp bằng Tên chủ TK đối ứng (khi PH ghi sai/nợ nội dung, app vẫn nhận diện được)
        if (tx.tenTKDoiUng) {
          const normTenTK = Utils.normalizeText(tx.tenTKDoiUng);
          const hitStudents = students.filter(s => {
            const t = Utils.normalizeText(s.tenTK || '');
            return t && (t.includes(normTenTK) || normTenTK.includes(t));
          });
          if (hitStudents.length >= 1) {
            tx.matchedMSHS = hitStudents[0].mshs;
            tx.matchSource = 'ten_tk';
            if (hitStudents.length > 1) tx.matchNote = 'ten_tk_trung_nhieu';
            matched.push(tx);
            found = true;
          }
        }
      }

      if (!found) {
        unmatched.push(tx);
      }
    });

    return { matched, unmatched };
  },

  // Đề xuất khớp nối cho giao dịch chưa khớp
  suggestMatch: function(unmatchedTx, students) {
    const suggestions = [];
    const descText = Utils.normalizeText(unmatchedTx.description || unmatchedTx.explanation || '');
    const tkDoiUngText = Utils.normalizeText(unmatchedTx.tenTKDoiUng || '');
    
    const possibleKeywords = Utils.extractKeywordsFromDescription(descText);

    students.forEach(s => {
      let maxScore = 0;
      let reason = '';

      // 1. So sánh tên TK đối ứng với tên PH
      const normTenPH = Utils.normalizeText(s.tenTK);
      if (normTenPH && tkDoiUngText) {
        const score = Utils.fuzzyMatch(normTenPH, tkDoiUngText);
        if (score > maxScore) {
          maxScore = score;
          reason = `Tên TK đối ứng (${unmatchedTx.tenTKDoiUng}) giống tên PH (${s.tenTK})`;
        }
      }

      // 2. So sánh tên HS với nội dung CK
      const normTenHS = Utils.normalizeText(s.fullName);
      if (normTenHS && descText.includes(normTenHS)) {
        if (1 > maxScore) {
          maxScore = 1;
          reason = `Nội dung chứa tên học sinh (${s.fullName})`;
        }
      }

      // 3. Khớp mờ tên HS với các từ khóa tiềm năng
      if (maxScore < 0.8) {
        for (const kw of possibleKeywords) {
          const score = Utils.fuzzyMatch(normTenHS, kw);
          if (score > maxScore) {
            maxScore = score;
            reason = `Nội dung có cụm từ "${kw}" giống tên học sinh (${s.fullName})`;
          }
        }
      }

      // 4. Mã học sinh trong nội dung
      const normMSHS = Utils.normalizeText(s.mshs);
      if (normMSHS && descText.includes(normMSHS)) {
        maxScore = 1;
        reason = `Nội dung chứa mã học sinh (${s.mshs})`;
      }

      if (maxScore > 0.5) { // Ngưỡng tối thiểu
        suggestions.push({
          mshs: s.mshs,
          studentName: s.fullName,
          score: maxScore,
          reason: reason
        });
      }
    });

    // Lấy top 3
    return suggestions.sort((a, b) => b.score - a.score).slice(0, 3);
  },

  // Tổng hợp số tiền đóng theo MSHS
  aggregateByMSHS: function(vtbMatched, tpbMatched, cashPayments) {
    const aggregated = new Map(); // mshs -> { vtb, tpb, cash, total, txList }

    const addTx = (tx, type) => {
      const matchedMshs = (tx.matchedMSHS || '').toUpperCase();
      if (!matchedMshs) return;
      if (!aggregated.has(matchedMshs)) {
        aggregated.set(matchedMshs, { vtb: 0, tpb: 0, cash: 0, total: 0, txList: [] });
      }
      const sums = aggregated.get(matchedMshs);
      if (type === 'vtb') sums.vtb += tx.credit;
      if (type === 'tpb') sums.tpb += tx.credit;
      sums.total += tx.credit;
      sums.txList.push({
        type,
        date: tx.date || '',
        amount: tx.credit || 0,
        description: tx.explanation || tx.description || '',
        account: tx.creditAccount || tx.account || tx.stkDoiUng || '',
        tenChuTK: tx.tenTKDoiUng || '',
        st: tx.st || ''
      });
    };

    vtbMatched.forEach(tx => addTx(tx, 'vtb'));
    tpbMatched.forEach(tx => addTx(tx, 'tpb'));

    cashPayments.forEach(cp => {
      const mshs = (cp.mshs || '').toUpperCase();
      if (!aggregated.has(mshs)) {
        aggregated.set(mshs, { vtb: 0, tpb: 0, cash: 0, total: 0, txList: [] });
      }
      const sums = aggregated.get(mshs);
      sums.cash += cp.amount;
      sums.total += cp.amount;
      sums.txList.push({
        type: 'cash',
        date: cp.date || '',
        amount: cp.amount || 0,
        description: cp.note || 'Tiền mặt',
        account: '',
        st: ''
      });
    });

    return aggregated;
  },

  /**
   * Distribute aggregated family payments among family members.
   * Modifies the aggregated map in place.
   */
  distributeByFamily: function(aggregated, students, familyGroups) {
    if (!familyGroups || familyGroups.length === 0) return aggregated;

    const studentMap = new Map(students.map(s => [s.mshs, s]));

    familyGroups.forEach(group => {
      // 1. Gather all CK money (VTB + TPB) for the whole group.
      let totalVTB = 0;
      let totalTPB = 0;

      // Group representation could be under stkDaiDien if it matched some student
      // We will check all members and extract their CK amounts, pooling them together.
      group.members.forEach(mshs => {
        if (aggregated.has(mshs)) {
          const sums = aggregated.get(mshs);
          totalVTB += sums.vtb;
          totalTPB += sums.tpb;
          // Reset CK amounts for members; we will redistribute it
          sums.vtb = 0;
          sums.tpb = 0;
          sums.total = sums.cash; // Only cash remains before distribution
        }
      });

      let totalCKPool = totalVTB + totalTPB;
      
      // Also check if there's an orphan aggregation by some logic under the group's first member
      // This is mostly handled by the loop above if the matcher assigned the CK to any member.

      if (totalCKPool === 0) return; // Nothing to distribute for this group

      // 2. Calculate requested tuition for each member
      const memberReqs = group.members.map(mshs => {
        const s = studentMap.get(mshs);
        const reqFee = s ? (s.hocPhi || APP_CONFIG.DEFAULT_HOC_PHI) : APP_CONFIG.DEFAULT_HOC_PHI;
        
        // Deduct cash already paid explicitly for this member
        let remainingNeed = reqFee;
        if (aggregated.has(mshs)) {
          remainingNeed -= aggregated.get(mshs).cash;
        }
        if (remainingNeed < 0) remainingNeed = 0;

        return { mshs, need: remainingNeed, reqFee };
      });

      const totalNeed = memberReqs.reduce((acc, curr) => acc + curr.need, 0);

      // 3. Distribute the pool
      // If pool is exactly equal to totalNeed, or less, or more, we distribute proportionally or sequentially
      // A simple sequential fill strategy is often best for tuition:
      let pool = totalCKPool;
      let vtbPool = totalVTB;
      let tpbPool = totalTPB;

      memberReqs.forEach((req, idx) => {
        if (pool <= 0) return;

        let allocVTB = 0;
        let allocTPB = 0;
        
        // Target allocation: Try to fulfill 'need', or if it's the last member, dump the rest
        let targetAlloc = req.need;
        if (idx === memberReqs.length - 1 && pool > targetAlloc) {
          targetAlloc = pool; // Dump remaining overpaid amount to the last member
        } else if (targetAlloc > pool) {
          targetAlloc = pool;
        }

        if (targetAlloc > 0) {
          // Take from VTB first, then TPB
          if (vtbPool >= targetAlloc) {
            allocVTB = targetAlloc;
            vtbPool -= targetAlloc;
          } else {
            allocVTB = vtbPool;
            allocTPB = targetAlloc - vtbPool;
            vtbPool = 0;
            tpbPool -= allocTPB;
          }

          pool -= targetAlloc;

          // Update aggregated
          if (!aggregated.has(req.mshs)) {
            aggregated.set(req.mshs, { vtb: 0, tpb: 0, cash: 0, total: 0 });
          }
          const sums = aggregated.get(req.mshs);
          sums.vtb += allocVTB;
          sums.tpb += allocTPB;
          sums.total += allocVTB + allocTPB;
        }
      });
    });

    return aggregated;
  },

  // Tìm các STK mới (chưa có trong CSDL)
  getNewSTKs: function(vtbTransactions, students, stkPhuList) {
    const existingSTKs = new Set();
    
    students.forEach(s => {
      const normSTK = Utils.normalizeSTK(s.stkPH);
      if (normSTK) existingSTKs.add(normSTK);
    });

    stkPhuList.forEach(m => {
      const normSTK = Utils.normalizeSTK(m.stk);
      if (normSTK) existingSTKs.add(normSTK);
    });

    const newSTKMap = new Map(); // stk -> {stk, tenTK, totalAmount, count}

    vtbTransactions.forEach(tx => {
      const normSTK = Utils.normalizeSTK(tx.stkDoiUng);
      if (normSTK && !existingSTKs.has(normSTK)) {
        if (!newSTKMap.has(normSTK)) {
          newSTKMap.set(normSTK, {
            stk: tx.stkDoiUng,
            tenTK: tx.tenTKDoiUng || '',
            totalAmount: 0,
            count: 0
          });
        }
        const stmData = newSTKMap.get(normSTK);
        stmData.totalAmount += tx.credit;
        stmData.count += 1;
        if (tx.tenTKDoiUng && !stmData.tenTK) {
          stmData.tenTK = tx.tenTKDoiUng;
        }
      }
    });

    return Array.from(newSTKMap.values());
  }
};
