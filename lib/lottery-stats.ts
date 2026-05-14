import lotteryData from "@/data/lottery.json";

// ─── Utility ─────────────────────────────────────────────
function countFreq(nums: string[]): Record<string, number> {
  return nums.reduce((acc, n) => ({ ...acc, [n]: (acc[n] || 0) + 1 }), {} as Record<string, number>);
}
function getGap(num: string, allNums: string[]): number {
  const idx = allNums.indexOf(num);
  return idx === -1 ? allNums.length : idx;
}
function topN(scores: Record<string, number>, n: number): string[] {
  return Object.entries(scores).filter(([,v]) => v > 0)
    .sort((a, b) => b[1] - a[1]).slice(0, n).map(([k]) => k);
}
function stdDev(nums: number[]): number {
  if (nums.length < 2) return 0;
  const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
  return Math.sqrt(nums.reduce((a, b) => a + (b - mean) ** 2, 0) / nums.length);
}

// ─── Phase Algorithms ────────────────────────────────────

// PHASE 1: ความถี่ตลอดกาล + Position Freq + Never Appeared
export function getPhase1() {
  const all3 = lotteryData.flatMap(d => d.prize3back);
  const all2 = lotteryData.map(d => d.prize2back);
  const freq3 = countFreq(all3);
  const freq2 = countFreq(all2);

  // Never appeared bonus (เลขที่ไม่เคยออก +1 คะแนน)
  const score3: Record<string, number> = { ...freq3 };
  const score2: Record<string, number> = { ...freq2 };

  // Position frequency — สร้างเลข 3 ตัวจาก digit ที่ออกบ่อยรายตำแหน่ง
  const posFreq = getPositionFreq();
  const constructed3 = constructFromPosition(posFreq, 10);
  constructed3.forEach(n => { score3[n] = (score3[n] || 0) + 2; });

  // Add never-appeared with small bonus
  const neverApp2 = getNeverAppeared2();
  neverApp2.slice(0, 10).forEach(n => { score2[n] = (score2[n] || 0.5); });

  return { prize3back: topN(score3, 20), prize2back: topN(score2, 20) };
}

// PHASE 2: Phase1 + Recent30 + Digit Sum + Draw Date Split
export function getPhase2() {
  const all3 = lotteryData.flatMap(d => d.prize3back);
  const all2 = lotteryData.map(d => d.prize2back);
  const r30_3 = lotteryData.slice(0, 30).flatMap(d => d.prize3back);
  const r30_2 = lotteryData.slice(0, 30).map(d => d.prize2back);
  const freq3 = countFreq(all3); const freq2 = countFreq(all2);
  const r30f3 = countFreq(r30_3); const r30f2 = countFreq(r30_2);

  // Draw date split
  const draws1st = lotteryData.filter(d => d.date.endsWith("-01"));
  const draws16th = lotteryData.filter(d => d.date.endsWith("-16"));
  const isFirst = new Date().getDate() <= 8; // ถ้าใกล้งวด 1 มากกว่า
  const splitFreq3 = countFreq((isFirst ? draws1st : draws16th).flatMap(d => d.prize3back));
  const splitFreq2 = countFreq((isFirst ? draws1st : draws16th).map(d => d.prize2back));

  // Digit sum bonus
  const hotSum2 = getHotDigitSum(2); const hotSum3 = getHotDigitSum(3);

  const score3: Record<string, number> = {};
  for (const n of Object.keys(freq3)) {
    const digitSum = n.split("").reduce((a, b) => a + +b, 0);
    const sumBonus = hotSum3.includes(digitSum) ? 1.5 : 0;
    score3[n] = (freq3[n]||0)*0.4 + (r30f3[n]||0)*1.2 + (splitFreq3[n]||0)*0.8 + sumBonus;
  }
  const score2: Record<string, number> = {};
  for (const n of Object.keys(freq2)) {
    const digitSum = n.split("").reduce((a, b) => a + +b, 0);
    const sumBonus = hotSum2.includes(digitSum) ? 1.5 : 0;
    score2[n] = (freq2[n]||0)*0.4 + (r30f2[n]||0)*1.2 + (splitFreq2[n]||0)*0.8 + sumBonus;
  }
  return { prize3back: topN(score3, 10), prize2back: topN(score2, 10) };
}

// PHASE 3: Phase2 + Gap StdDev + Recency Weight + Trending
export function getPhase3() {
  const all3 = lotteryData.flatMap(d => d.prize3back);
  const all2 = lotteryData.map(d => d.prize2back);
  const r30_3 = lotteryData.slice(0, 30).flatMap(d => d.prize3back);
  const r30_2 = lotteryData.slice(0, 30).map(d => d.prize2back);
  const r12_3 = lotteryData.slice(0, 12).flatMap(d => d.prize3back);
  const r12_2 = lotteryData.slice(0, 12).map(d => d.prize2back);
  const freq3 = countFreq(all3); const freq2 = countFreq(all2);
  const r30f3 = countFreq(r30_3); const r30f2 = countFreq(r30_2);
  const r12f3 = countFreq(r12_3); const r12f2 = countFreq(r12_2);
  const recency3 = getRecencyWeighted(3); const recency2 = getRecencyWeighted(2);
  const gapSd3 = getGapStdDev(3); const gapSd2 = getGapStdDev(2);

  const score3: Record<string, number> = {};
  for (const n of Object.keys(freq3)) {
    const gap = getGap(n, all3);
    const trend = (r12f3[n]||0) - Math.max(0, (r30f3[n]||0) - (r12f3[n]||0)) * 0.5;
    const gapBonus = gap > 5 ? gap * 0.4 : 0;
    const stdDevBonus = gapSd3[n] !== undefined && gapSd3[n] < 3 ? 1.5 : 0; // สม่ำเสมอ
    score3[n] = (freq3[n]||0)*0.25 + (r30f3[n]||0)*0.35 + (recency3[n]||0)*0.8
      + gapBonus + trend*0.6 + stdDevBonus;
  }
  const score2: Record<string, number> = {};
  for (const n of Object.keys(freq2)) {
    const gap = getGap(n, all2);
    const trend = (r12f2[n]||0) - Math.max(0, (r30f2[n]||0) - (r12f2[n]||0)) * 0.5;
    const gapBonus = gap > 4 ? gap * 0.6 : 0;
    const stdDevBonus = gapSd2[n] !== undefined && gapSd2[n] < 3 ? 1.5 : 0;
    score2[n] = (freq2[n]||0)*0.25 + (r30f2[n]||0)*0.35 + (recency2[n]||0)*0.8
      + gapBonus + trend*0.6 + stdDevBonus;
  }
  return { prize3back: topN(score3, 5), prize2back: topN(score2, 5) };
}

// PHASE 4: ทุกเกณฑ์ + Hot Streak + Pair Correlation + Weighted
export function getPhase4() {
  const p1 = getPhase1(); const p2 = getPhase2(); const p3 = getPhase3();
  const score3: Record<string, number> = {};
  const score2: Record<string, number> = {};
  const addRank = (arr: string[], map: Record<string, number>, w: number) =>
    arr.forEach((n, i) => { map[n] = (map[n]||0) + (arr.length - i) * w; });
  addRank(p1.prize3back, score3, 0.3); addRank(p2.prize3back, score3, 0.4); addRank(p3.prize3back, score3, 0.3);
  addRank(p1.prize2back, score2, 0.3); addRank(p2.prize2back, score2, 0.4); addRank(p3.prize2back, score2, 0.3);
  const pair = getPairCorrelation();
  pair.top3.forEach(n => { score3[n] = (score3[n]||0) + 2; });
  pair.top2.forEach(n => { score2[n] = (score2[n]||0) + 2; });
  return { prize3back: topN(score3, 2), prize2back: topN(score2, 2) };
}

// ─── Statistical Functions ───────────────────────────────

// 1. Position Frequency — ความถี่รายตำแหน่ง (3 ตัว)
export function getPositionFreq() {
  const all3 = lotteryData.flatMap(d => d.prize3back);
  const pos: [Record<string,number>, Record<string,number>, Record<string,number>] = [{},{},{}];
  for (const n of all3) {
    for (let i = 0; i < 3; i++) {
      const d = n[i];
      pos[i][d] = (pos[i][d]||0) + 1;
    }
  }
  return pos;
}

function constructFromPosition(pos: ReturnType<typeof getPositionFreq>, count: number): string[] {
  const top = pos.map(p => Object.entries(p).sort((a,b) => b[1]-a[1]).slice(0,3).map(([d]) => d));
  const results: string[] = [];
  for (const a of top[0]) for (const b of top[1]) for (const c of top[2]) {
    results.push(a+b+c);
    if (results.length >= count) return results;
  }
  return results;
}

// 2. Digit Sum Analysis — ผลรวมหลัก
export function getDigitSumFreq(digits: 2 | 3) {
  const nums = digits === 2
    ? lotteryData.map(d => d.prize2back)
    : lotteryData.flatMap(d => d.prize3back);
  const sumFreq: Record<number, number> = {};
  for (const n of nums) {
    const s = n.split("").reduce((a, b) => a + +b, 0);
    sumFreq[s] = (sumFreq[s]||0) + 1;
  }
  return sumFreq;
}

export function getHotDigitSum(digits: 2 | 3): number[] {
  const freq = getDigitSumFreq(digits);
  return Object.entries(freq).sort((a,b) => +b[1] - +a[1]).slice(0, 3).map(([s]) => +s);
}

// 3. Draw Date Split — งวด 1 vs งวด 16
export function getDrawDateSplit() {
  const d1 = lotteryData.filter(d => d.date.endsWith("-01"));
  const d16 = lotteryData.filter(d => d.date.endsWith("-16"));
  return {
    draw1_3: countFreq(d1.flatMap(d => d.prize3back)),
    draw1_2: countFreq(d1.map(d => d.prize2back)),
    draw16_3: countFreq(d16.flatMap(d => d.prize3back)),
    draw16_2: countFreq(d16.map(d => d.prize2back)),
    count1: d1.length, count16: d16.length,
  };
}

// 4. Recency Weighted Frequency — น้ำหนักตามความใหม่
export function getRecencyWeighted(digits: 2 | 3) {
  const weights = [1.0, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.35, 0.3, 0.25, 0.2, 0.15];
  const score: Record<string, number> = {};
  lotteryData.forEach((d, i) => {
    const w = i < weights.length ? weights[i] : 0.1;
    const nums = digits === 2 ? [d.prize2back] : d.prize3back;
    nums.forEach(n => { score[n] = (score[n]||0) + w; });
  });
  return score;
}

// 5. Gap Std Deviation — ความสม่ำเสมอของ gap
export function getGapStdDev(digits: 2 | 3) {
  const all = digits === 2
    ? lotteryData.map(d => d.prize2back)
    : lotteryData.flatMap(d => d.prize3back);
  const unique = [...new Set(all)];
  const result: Record<string, number> = {};
  for (const n of unique) {
    const appearances: number[] = [];
    all.forEach((v, i) => { if (v === n) appearances.push(i); });
    if (appearances.length >= 2) {
      const gaps = appearances.slice(1).map((v, i) => v - appearances[i]);
      result[n] = Math.round(stdDev(gaps) * 10) / 10;
    } else {
      result[n] = 999;
    }
  }
  return result;
}

// 6. Never Appeared — เลขที่ไม่เคยออก
export function getNeverAppeared2(): string[] {
  const appeared = new Set(lotteryData.map(d => d.prize2back));
  return Array.from({ length: 100 }, (_, i) => String(i).padStart(2, "0"))
    .filter(n => !appeared.has(n));
}
export function getNeverAppeared3(): string[] {
  const appeared = new Set(lotteryData.flatMap(d => d.prize3back));
  return Array.from({ length: 1000 }, (_, i) => String(i).padStart(3, "0"))
    .filter(n => !appeared.has(n));
}

// 7. Pair Correlation — คู่เลขที่ออกพร้อมกันบ่อย
export function getPairCorrelation() {
  const pair3: Record<string, number> = {};
  const pair2: Record<string, number> = {};
  lotteryData.forEach(d => {
    // เลข 3 ตัวที่ออกคู่กัน
    if (d.prize3back.length >= 2) {
      const key = d.prize3back.sort().join("-");
      pair3[key] = (pair3[key]||0) + 1;
    }
    // first digit correlation
    d.prize3back.forEach(n3 => {
      if (d.prize2back[0] === n3[1]) { // tens digit match
        pair2[d.prize2back] = (pair2[d.prize2back]||0) + 1;
        pair3[n3] = (pair3[n3]||0) + 0.5;
      }
    });
  });
  return {
    top3: topN(pair3, 5),
    top2: topN(pair2, 5),
    raw3: pair3, raw2: pair2,
  };
}

// 8. Hot Streak — ออกต่อเนื่องใน 6 งวดล่าสุด
export function getHotStreak() {
  return {
    hot3: countFreq(lotteryData.slice(0,6).flatMap(d => d.prize3back)),
    hot2: countFreq(lotteryData.slice(0,6).map(d => d.prize2back)),
  };
}

// ─── Detailed Stats สำหรับ Visualization ──────────────────
export function getDetailedStats() {
  const all3 = lotteryData.flatMap(d => d.prize3back);
  const all2 = lotteryData.map(d => d.prize2back);
  const r30_3 = lotteryData.slice(0,30).flatMap(d => d.prize3back);
  const r30_2 = lotteryData.slice(0,30).map(d => d.prize2back);
  const r12_3 = lotteryData.slice(0,12).flatMap(d => d.prize3back);
  const r12_2 = lotteryData.slice(0,12).map(d => d.prize2back);

  const allTimeFreq3 = countFreq(all3);
  const allTimeFreq2 = countFreq(all2);
  const recent30Freq3 = countFreq(r30_3);
  const recent30Freq2 = countFreq(r30_2);
  const recent12Freq3 = countFreq(r12_3);
  const recent12Freq2 = countFreq(r12_2);

  const gapScore3: Record<string,number> = {};
  for (const n of Object.keys(allTimeFreq3)) gapScore3[n] = getGap(n, all3);
  const gapScore2: Record<string,number> = {};
  for (const n of Object.keys(allTimeFreq2)) gapScore2[n] = getGap(n, all2);

  const trendScore3: Record<string,number> = {};
  for (const n of Object.keys(allTimeFreq3)) {
    trendScore3[n] = Math.max(0, (recent12Freq3[n]||0)*2 - Math.max(0,(recent30Freq3[n]||0)-(recent12Freq3[n]||0)));
  }
  const trendScore2: Record<string,number> = {};
  for (const n of Object.keys(allTimeFreq2)) {
    trendScore2[n] = Math.max(0, (recent12Freq2[n]||0)*2 - Math.max(0,(recent30Freq2[n]||0)-(recent12Freq2[n]||0)));
  }

  const recency3 = getRecencyWeighted(3);
  const recency2 = getRecencyWeighted(2);
  const gapStdDev3 = getGapStdDev(3);
  const gapStdDev2 = getGapStdDev(2);
  const hotStreak = getHotStreak();
  const posFreq = getPositionFreq();
  const digitSum2 = getDigitSumFreq(2);
  const digitSum3 = getDigitSumFreq(3);
  const drawSplit = getDrawDateSplit();
  const pairCorr = getPairCorrelation();
  const neverApp2 = getNeverAppeared2();
  const neverApp3 = getNeverAppeared3();

  // Combined scores per phase
  const combinedP2_3: Record<string,number> = {};
  for (const n of Object.keys(allTimeFreq3)) {
    combinedP2_3[n] = (allTimeFreq3[n]||0)*0.4 + (recent30Freq3[n]||0)*1.2;
  }
  const combinedP2_2: Record<string,number> = {};
  for (const n of Object.keys(allTimeFreq2)) {
    combinedP2_2[n] = (allTimeFreq2[n]||0)*0.4 + (recent30Freq2[n]||0)*1.2;
  }
  const combinedP3_3: Record<string,number> = {};
  for (const n of Object.keys(allTimeFreq3)) {
    const gap = gapScore3[n]||0;
    combinedP3_3[n] = (allTimeFreq3[n]||0)*0.25 + (recent30Freq3[n]||0)*0.35
      + (recency3[n]||0)*0.8 + (gap>5?gap*0.4:0) + (trendScore3[n]||0)*0.6
      + ((gapStdDev3[n]||999)<3?1.5:0);
  }
  const combinedP3_2: Record<string,number> = {};
  for (const n of Object.keys(allTimeFreq2)) {
    const gap = gapScore2[n]||0;
    combinedP3_2[n] = (allTimeFreq2[n]||0)*0.25 + (recent30Freq2[n]||0)*0.35
      + (recency2[n]||0)*0.8 + (gap>4?gap*0.6:0) + (trendScore2[n]||0)*0.6
      + ((gapStdDev2[n]||999)<3?1.5:0);
  }

  return {
    allTimeFreq3, allTimeFreq2,
    recent30Freq3, recent30Freq2,
    gapScore3, gapScore2,
    trendScore3, trendScore2,
    recency3, recency2,
    gapStdDev3, gapStdDev2,
    hotStreak,
    posFreq,
    digitSum2, digitSum3,
    drawSplit,
    pairCorr,
    neverApp2, neverApp3,
    combinedP2_3, combinedP2_2,
    combinedP3_3, combinedP3_2,
    totalDraws: lotteryData.length,
  };
}

export const phaseAlgorithmDesc: Record<number, string> = {
  1: "ความถี่ตลอดกาล + Position Frequency + Never Appeared",
  2: "Phase1 + Recent30 + Digit Sum + Draw Date Split",
  3: "Phase2 + Gap StdDev + Recency Weight + Trending",
  4: "ทุกเกณฑ์ + Hot Streak + Pair Correlation + Weighted 30/40/30",
};
