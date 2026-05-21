import type { SheetResult } from "./sheets";

export interface AnalysisResult {
  threeDigit: { number: string; method: string }[];
  twoDigit: { number: string; method: string }[];
}

/** นับความถี่ของตัวเลขในอาร์เรย์ */
function countFreq(nums: string[]): Map<string, number> {
  const freq = new Map<string, number>();
  for (const n of nums) {
    if (n && n.replace(/x/gi, "").length > 0) {
      freq.set(n, (freq.get(n) ?? 0) + 1);
    }
  }
  return freq;
}

/** หา index งวดล่าสุดที่เลขนั้นออก */
function lastSeenIndex(nums: string[], target: string): number {
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] === target) return i;
  }
  return nums.length; // ไม่เคยออก = gap สูงสุด
}

/** ดึงตัวเลขไม่ซ้ำจนครบ count ตัว */
function pickUnique(
  candidates: string[],
  existing: Set<string>,
  count: number
): string[] {
  const result: string[] = [];
  for (const c of candidates) {
    if (result.length >= count) break;
    if (!existing.has(c)) {
      result.push(c);
      existing.add(c);
    }
  }
  return result;
}

function padNum(n: string, digits: number): string {
  return n.padStart(digits, "0");
}

/**
 * วิเคราะห์ข้อมูลย้อนหลัง สร้างชุดตัวเลขน่าสนใจ 5 ชุด
 * สำหรับ 3 ตัว และ 2 ตัว
 */
export function generateAnalysis(results: SheetResult[]): AnalysisResult {
  if (results.length === 0) {
    return { threeDigit: [], twoDigit: [] };
  }

  // เอาแค่ N งวดล่าสุด
  const recent = results.slice(0, Math.min(results.length, 30));

  // ---- 3 ตัว ----
  const all3 = recent.map((r) => padNum(r.prize3, 3)).filter(Boolean);
  const freq3 = countFreq(all3);
  const used3 = new Set<string>();
  const picked3: { number: string; method: string }[] = [];

  // Method 1: มาบ่อยที่สุด
  const byFreq3 = [...freq3.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([n]) => n);
  const m1 = pickUnique(byFreq3, used3, 1);
  m1.forEach((n) => picked3.push({ number: n, method: "ออกบ่อยที่สุดใน 30 งวด" }));

  // Method 2: ร้อนแรงใน 5 งวดล่าสุด (เปลี่ยนทุกงวด)
  const last5_3 = all3.slice(0, 5);
  const hotFreq5_3 = countFreq(last5_3);
  const hot5_3 = [...hotFreq5_3.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([n]) => n);
  const m2 = pickUnique(hot5_3.length > 0 ? hot5_3 : byFreq3.slice(1), used3, 1);
  m2.forEach((n) => picked3.push({ number: n, method: "ออกบ่อยใน 5 งวดล่าสุด" }));

  // Method 3: ห่างนานที่สุด (overdue)
  const allUniq3 = [...freq3.keys()];
  const byGap3 = allUniq3.sort(
    (a, b) => lastSeenIndex(all3, b) - lastSeenIndex(all3, a)
  );
  const m3 = pickUnique(byGap3, used3, 1);
  m3.forEach((n) => picked3.push({ number: n, method: "ห่างจากครั้งล่าสุดนานที่สุด" }));

  // Method 4: ผลรวมตัวเลข (digit sum) ที่พบบ่อยที่สุด
  const sums3 = all3.map((n) =>
    n.split("").reduce((s, d) => s + parseInt(d), 0)
  );
  const sumFreq3 = countFreq(sums3.map(String));
  const topSum3 = [...sumFreq3.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const sameSum3 = allUniq3.filter(
    (n) =>
      n.split("").reduce((s, d) => s + parseInt(d), 0).toString() === topSum3
  );
  const m4 = pickUnique(sameSum3, used3, 1);
  if (m4.length === 0) {
    const fb = pickUnique(byFreq3.slice(3), used3, 1);
    fb.forEach((n) =>
      picked3.push({ number: n, method: "ผลรวมตัวเลขพบบ่อย" })
    );
  } else {
    m4.forEach((n) =>
      picked3.push({ number: n, method: "ผลรวมตัวเลขพบบ่อย" })
    );
  }

  // Method 5: เลขที่ยังไม่เคยออกเลย — ดูจาก pool ทั้งหมด 000-999
  const allPossible3 = Array.from({ length: 1000 }, (_, i) =>
    i.toString().padStart(3, "0")
  );
  const cold3 = allPossible3.filter((n) => !freq3.has(n));
  const coldSrc3 = cold3.length > 0 ? cold3 : byGap3.slice(-5);
  const m5 = pickUnique(coldSrc3, used3, 1);
  m5.forEach((n) =>
    picked3.push({ number: n, method: "ยังไม่เคยออกใน 30 งวด" })
  );

  // เติมให้ครบ 5: ลอง byFreq3 ก่อน ถ้าหมดแล้วใช้ pool 000-999
  while (picked3.length < 5) {
    const fb =
      pickUnique(byFreq3, used3, 1).length > 0
        ? pickUnique(byFreq3, used3, 1)
        : pickUnique(allPossible3, used3, 1);
    if (fb.length === 0) break;
    fb.forEach((n) =>
      picked3.push({ number: n, method: "วิเคราะห์เพิ่มเติม" })
    );
  }

  // ---- 2 ตัว ----
  const all2 = recent
    .map((r) => padNum(r.prize2bottom || r.prize2, 2))
    .filter(Boolean);
  const freq2 = countFreq(all2);
  const used2 = new Set<string>();
  const picked2: { number: string; method: string }[] = [];

  const byFreq2 = [...freq2.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([n]) => n);
  const allUniq2 = [...freq2.keys()];

  const mm1 = pickUnique(byFreq2, used2, 1);
  mm1.forEach((n) => picked2.push({ number: n, method: "ออกบ่อยที่สุดใน 30 งวด" }));

  // Method 2: ร้อนแรงใน 5 งวดล่าสุด
  const last5_2 = all2.slice(0, 5);
  const hot5_2 = [...countFreq(last5_2).entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([n]) => n);
  const mm2 = pickUnique(hot5_2.length > 0 ? hot5_2 : byFreq2.slice(1), used2, 1);
  mm2.forEach((n) =>
    picked2.push({ number: n, method: "ออกบ่อยใน 5 งวดล่าสุด" })
  );

  // Method 3: ห่างนานที่สุด (overdue)
  const byGap2 = allUniq2.sort(
    (a, b) => lastSeenIndex(all2, b) - lastSeenIndex(all2, a)
  );
  const mm3 = pickUnique(byGap2, used2, 1);
  mm3.forEach((n) =>
    picked2.push({ number: n, method: "ห่างจากครั้งล่าสุดนานที่สุด" })
  );

  const sums2 = all2.map((n) =>
    n.split("").reduce((s, d) => s + parseInt(d), 0)
  );
  const topSum2 = [...countFreq(sums2.map(String)).entries()].sort(
    (a, b) => b[1] - a[1]
  )[0]?.[0];
  const sameSum2 = allUniq2.filter(
    (n) =>
      n.split("").reduce((s, d) => s + parseInt(d), 0).toString() === topSum2
  );
  const mm4 = pickUnique(sameSum2, used2, 1);
  if (mm4.length === 0) {
    const fb = pickUnique(byFreq2.slice(3), used2, 1);
    fb.forEach((n) => picked2.push({ number: n, method: "ผลรวมตัวเลขพบบ่อย" }));
  } else {
    mm4.forEach((n) =>
      picked2.push({ number: n, method: "ผลรวมตัวเลขพบบ่อย" })
    );
  }

  // Method 5: เลขที่ยังไม่เคยออกเลย — ดูจาก pool ทั้งหมด 00-99
  const allPossible2 = Array.from({ length: 100 }, (_, i) =>
    i.toString().padStart(2, "0")
  );
  const cold2 = allPossible2.filter((n) => !freq2.has(n));
  const coldSrc2 = cold2.length > 0 ? cold2 : byGap2.slice(-5);
  const mm5 = pickUnique(coldSrc2, used2, 1);
  mm5.forEach((n) =>
    picked2.push({ number: n, method: "ยังไม่เคยออกใน 30 งวด" })
  );

  // เติมให้ครบ 5: ลอง byFreq2 ก่อน ถ้าหมดแล้วใช้ pool 00-99
  while (picked2.length < 5) {
    const fb =
      pickUnique(byFreq2, used2, 1).length > 0
        ? pickUnique(byFreq2, used2, 1)
        : pickUnique(allPossible2, used2, 1);
    if (fb.length === 0) break;
    fb.forEach((n) =>
      picked2.push({ number: n, method: "วิเคราะห์เพิ่มเติม" })
    );
  }

  return {
    threeDigit: picked3.slice(0, 5),
    twoDigit: picked2.slice(0, 5),
  };
}
