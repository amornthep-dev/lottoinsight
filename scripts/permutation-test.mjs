// ─── Permutation Hit-Rate Tester ─────────────────────────────
// ทดสอบ: ถ้าเราใช้ "เลขกลับ/เรียงใหม่" ทุก permutation
// อัตราการถูกจะเพิ่มขึ้นเท่าไร?
// รัน: node scripts/permutation-test.mjs
// ─────────────────────────────────────────────────────────────

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(readFileSync(join(__dirname, "../data/lottery.json"), "utf8"));

// ─── Helpers ─────────────────────────────────────────────────
const pad2 = n => String(((n % 100) + 100) % 100).padStart(2, "0");
const pad3 = n => String(((n % 1000) + 1000) % 1000).padStart(3, "0");

// สร้าง permutations ทั้งหมดของ string (ไม่ซ้ำ)
function permutations(s) {
  if (s.length <= 1) return [s];
  const result = new Set();
  for (let i = 0; i < s.length; i++) {
    const rest = s.slice(0, i) + s.slice(i + 1);
    for (const p of permutations(rest)) {
      result.add(s[i] + p);
    }
  }
  return [...result];
}

// เลขคล้าย: ±1 ในแต่ละหลัก (ไม่เกิน 10 ตัว)
function nearDigits2(s) {
  const candidates = new Set([s]);
  const d = s.split("").map(Number);
  for (let i = 0; i < 2; i++) {
    for (const delta of [-1, 1]) {
      const nd = [...d];
      nd[i] = ((nd[i] + delta) + 10) % 10;
      candidates.add(nd.join(""));
    }
  }
  return [...candidates];
}

function nearDigits3(s) {
  const candidates = new Set([s]);
  const d = s.split("").map(Number);
  for (let i = 0; i < 3; i++) {
    for (const delta of [-1, 1]) {
      const nd = [...d];
      nd[i] = ((nd[i] + delta) + 10) % 10;
      candidates.add(nd.join(""));
    }
  }
  return [...candidates];
}

// ─── ทดสอบ baseline ก่อน ─────────────────────────────────────

console.log("═".repeat(65));
console.log("  ตาราง: จำนวน candidates vs โอกาสถูก (ทฤษฎี)");
console.log("═".repeat(65));

// 2-digit: มี 100 เลข (00-99)
console.log("\n🎯 เลขท้าย 2 ตัว (00-99 = 100 ตัวเลือก)");
console.log("─".repeat(50));
[
  { label: "สุ่ม 1 ตัว (random baseline)", n: 1 },
  { label: "เลข + กลับ 1 ตัว (เช่น 56→56,65)", n: 2 },
  { label: "เลข + ±1 แต่ละหลัก (≈5 ตัว)", n: 5 },
  { label: "เลข + กลับ + ±1 (≈6-7 ตัว)", n: 7 },
  { label: "Phase 1 ปัจจุบัน (10 ตัว)", n: 10 },
  { label: "Phase 2 ปัจจุบัน (5 ตัว)", n: 5 },
  { label: "Phase 3 ปัจจุบัน (3 ตัว)", n: 3 },
  { label: "Phase 4 ปัจจุบัน (2 ตัว)", n: 2 },
].forEach(({ label, n }) => {
  const pct = (n / 100 * 100).toFixed(0);
  const bar = "█".repeat(Math.round(n / 2));
  console.log(`  ${label.padEnd(42)} = ${String(n).padStart(3)} ตัว → ${String(pct).padStart(3)}%  ${bar}`);
});

// 3-digit: มี 1000 เลข (000-999) — แต่รางวัลออก 2 ตัว
console.log("\n🎯 เลขท้าย 3 ตัว (000-999 = 1000 ตัวเลือก, ออก 2 ตัว/งวด)");
console.log("─".repeat(60));
[
  { label: "สุ่ม 1 ตัว (random baseline)", n: 1 },
  { label: "เลข + 6 permutations (เช่น 513→ทั้ง 6)", n: 6 },
  { label: "เลข + 6 perms + ±1 แต่ละหลัก", n: 6+6 },
  { label: "เลข + 2 ชุด × 6 perms", n: 12 },
  { label: "เลข + 2 ชุด × 6 perms + near", n: 24 },
  { label: "Phase 1 (20 ตัว), ออก 2 จาก 1000", n: 20, two: true },
  { label: "Phase 2 (10 ตัว), ออก 2 จาก 1000", n: 10, two: true },
  { label: "Phase 3 (5 ตัว), ออก 2 จาก 1000", n: 5, two: true },
  { label: "Phase 4 (2 ตัว), ออก 2 จาก 1000", n: 2, two: true },
].forEach(({ label, n, two }) => {
  // ออก 2 ตัว → โอกาส = 1 - (1000-n)/1000 × (999-n)/999 ≈ 2n/1000
  const pct = two ? (n / 1000 * 100 * 2).toFixed(2) : (n / 1000 * 100 * 2).toFixed(2);
  const bar = "█".repeat(Math.max(1, Math.round(parseFloat(pct))));
  console.log(`  ${label.padEnd(44)} = ${String(n).padStart(3)} ตัว → ${String(pct).padStart(5)}%  ${bar}`);
});

// ─── ทดสอบจริงกับข้อมูล ───────────────────────────────────────

console.log("\n\n" + "═".repeat(65));
console.log("  ทดสอบจริงกับ 99 งวด — เลขท้าย 2 ตัว");
console.log("═".repeat(65));

// สูตรที่ดีที่สุดจากการทดสอบก่อน: pairSum d1+d6, d2+d5, d3+d4
function pairSumFormula(prize1) {
  const d = String(prize1).padStart(6, "0").split("").map(Number);
  return [pad2(d[0]+d[5]), pad2(d[1]+d[4]), pad2(d[2]+d[3])];
}

// ทดสอบแต่ละ strategy สำหรับ prize2back
const strategies2 = [
  {
    name: "pairSum (3 ตัว) — baseline",
    getCandidates: (p) => pairSumFormula(p.prize1),
  },
  {
    name: "pairSum + mirror (≤6 ตัว)",
    getCandidates: (p) => {
      const base = pairSumFormula(p.prize1);
      const all = new Set(base);
      base.forEach(n => permutations(n).forEach(x => all.add(x)));
      return [...all];
    },
  },
  {
    name: "pairSum + near±1 (≤15 ตัว)",
    getCandidates: (p) => {
      const base = pairSumFormula(p.prize1);
      const all = new Set(base);
      base.forEach(n => nearDigits2(n).forEach(x => all.add(x)));
      return [...all];
    },
  },
  {
    name: "pairSum + mirror + near (≤21 ตัว)",
    getCandidates: (p) => {
      const base = pairSumFormula(p.prize1);
      const all = new Set(base);
      base.forEach(n => {
        permutations(n).forEach(x => {
          all.add(x);
          nearDigits2(x).forEach(y => all.add(y));
        });
      });
      return [...all];
    },
  },
  // prev prize2back + กลับ
  {
    name: "prev prize2back + mirror (2 ตัว)",
    getCandidates: (p) => [...new Set([p.prize2back, ...permutations(p.prize2back)])],
  },
  {
    name: "prev prize2back + mirror + near (≤10 ตัว)",
    getCandidates: (p) => {
      const all = new Set();
      const perms = permutations(p.prize2back);
      perms.forEach(n => nearDigits2(n).forEach(x => all.add(x)));
      return [...all];
    },
  },
  // last2(prize3back) + กลับ
  {
    name: "last2(prize3back[0]) + mirror (2 ตัว)",
    getCandidates: (p) => {
      const n = p.prize3back[0].slice(-2);
      return [...new Set([n, ...permutations(n)])];
    },
  },
  {
    name: "last2(both prize3back) + mirror (4 ตัว)",
    getCandidates: (p) => {
      const all = new Set();
      p.prize3back.forEach(n3 => {
        const n = n3.slice(-2);
        permutations(n).forEach(x => all.add(x));
      });
      return [...all];
    },
  },
];

for (const s of strategies2) {
  let hits = 0, tested = 0, totalCands = 0;
  for (let i = 1; i < data.length; i++) {
    const current = data[i];
    const prev = data[i-1];
    const cands = s.getCandidates(prev);
    totalCands += cands.length;
    tested++;
    if (cands.includes(current.prize2back)) hits++;
  }
  const avgCands = (totalCands / tested).toFixed(1);
  const hitRate = (hits / tested * 100).toFixed(1);
  const randomBaseline = (totalCands / tested / 100 * 100).toFixed(1);
  const xRandom = (hits / tested * 100 / (totalCands / tested / 100 * 100)).toFixed(1);
  console.log(`\n  ${s.name}`);
  console.log(`    candidates เฉลี่ย: ${avgCands} ตัว`);
  console.log(`    ถูก: ${hits}/${tested} = ${hitRate}%`);
  console.log(`    random baseline: ~${randomBaseline}%   →   ${xRandom}x random`);
}

console.log("\n\n" + "═".repeat(65));
console.log("  ทดสอบจริงกับ 99 งวด — เลขท้าย 3 ตัว");
console.log("═".repeat(65));

// สูตร 3 ตัว
function last3Formula(prize1) {
  return [String(prize1).padStart(6,"0").slice(-3)];
}

const strategies3 = [
  {
    name: "last3(prize1) — baseline (1 ตัว)",
    getCandidates: (p) => last3Formula(p.prize1),
  },
  {
    name: "last3(prize1) + 6 permutations",
    getCandidates: (p) => {
      const all = new Set();
      last3Formula(p.prize1).forEach(n => permutations(n).forEach(x => all.add(x)));
      return [...all];
    },
  },
  {
    name: "last3 + perms + near±1 (≤42 ตัว)",
    getCandidates: (p) => {
      const all = new Set();
      last3Formula(p.prize1).forEach(n => {
        permutations(n).forEach(x => {
          all.add(x);
          nearDigits3(x).forEach(y => all.add(y));
        });
      });
      return [...all];
    },
  },
  {
    name: "prize3back[0] + 6 perms",
    getCandidates: (p) => {
      const all = new Set();
      permutations(p.prize3back[0]).forEach(x => all.add(x));
      return [...all];
    },
  },
  {
    name: "both prize3back + all perms (≤12 ตัว)",
    getCandidates: (p) => {
      const all = new Set();
      p.prize3back.forEach(n => permutations(n).forEach(x => all.add(x)));
      return [...all];
    },
  },
  {
    name: "both prize3back + perms + near (≤84 ตัว)",
    getCandidates: (p) => {
      const all = new Set();
      p.prize3back.forEach(n => {
        permutations(n).forEach(x => {
          all.add(x);
          nearDigits3(x).forEach(y => all.add(y));
        });
      });
      return [...all];
    },
  },
];

for (const s of strategies3) {
  let hits = 0, tested = 0, totalCands = 0;
  for (let i = 1; i < data.length; i++) {
    const current = data[i];
    const prev = data[i-1];
    const cands = s.getCandidates(prev);
    const actual = current.prize3back;
    totalCands += cands.length;
    tested++;
    if (actual.some(a => cands.includes(a))) hits++;
  }
  const avgCands = (totalCands / tested).toFixed(1);
  const hitRate = (hits / tested * 100).toFixed(1);
  // baseline: 1 - (1-avgCands/1000)^2 ≈ 2*avgCands/1000
  const randomBaseline = Math.min(100, (2 * totalCands / tested / 1000 * 100)).toFixed(2);
  const xRandom = (hits / tested * 100 / parseFloat(randomBaseline)).toFixed(1);
  console.log(`\n  ${s.name}`);
  console.log(`    candidates เฉลี่ย: ${avgCands} ตัว`);
  console.log(`    ถูก: ${hits}/${tested} = ${hitRate}%`);
  console.log(`    random baseline: ~${randomBaseline}%   →   ${xRandom}x random`);
}

console.log("\n\n" + "═".repeat(65));
console.log("  📌 สรุป: ข้อดี-ข้อเสีย ของ permutation approach");
console.log("═".repeat(65));
console.log(`
  ข้อดี:
  ✅ hit rate เพิ่มขึ้น (เพราะมี candidates มากขึ้น)
  ✅ คนดูแล้วรู้สึกว่า "ใกล้" มากกว่า (เห็นเลขคล้ายๆ)
  ✅ มีเอกลักษณ์ของเว็บ (แนวคิดเฉพาะ)

  ข้อเสีย / ต้องระวัง:
  ⚠️  hit rate เพิ่ม เพราะ candidates เพิ่ม ไม่ใช่เพราะสูตรดีกว่า
  ⚠️  ถ้า candidates เยอะ → คนซื้อต้องซื้อหลายเลข ต้นทุนสูงขึ้น
  ⚠️  3 ตัว 6 permutations × 80 บาท = 480 บาท/ชุด vs รางวัล 4,000 บาท
  ⚠️  ยัง random อยู่ — แค่เพิ่ม net ให้กว้างขึ้น

  🎯 จุดขาย:
  "LottoInsight คัดกลุ่มตัวเลข + แจกทุก permutation
   ให้คุณเลือกซื้อตามงบประมาณตัวเอง"
`);
