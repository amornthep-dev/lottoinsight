// ─── Formula Hit-Rate Tester ─────────────────────────────────
// รัน: node scripts/formula-test.mjs
// วิเคราะห์ว่าสูตรคณิตศาสตร์แบบไหน "เข้า" ผลหวยไทยมากที่สุด
// ใช้ข้อมูลจริง 100 งวด (lottery.json)
// ─────────────────────────────────────────────────────────────

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(readFileSync(join(__dirname, "../data/lottery.json"), "utf8"));

// ─── Helpers ─────────────────────────────────────────────────
const mod100 = n => ((n % 100) + 100) % 100;
const pad2   = n => String(mod100(n)).padStart(2, "0");
const pad3   = n => String(((n % 1000) + 1000) % 1000).padStart(3, "0");
const digsum = s => String(s).split("").reduce((a, c) => a + +c, 0);
const reverse2 = s => s.slice(-2).split("").reverse().join("");
const last2  = s => String(s).slice(-2).padStart(2, "0");
const last3  = s => String(s).slice(-3).padStart(3, "0");
const first2 = s => String(s).slice(0, 2).padStart(2, "0");
const first3 = s => String(s).slice(0, 3).padStart(3, "0");
const mid2   = s => { const st = String(s).padStart(6,"0"); return st.slice(2,4); };
const allDigits = s => String(s).padStart(6,"0").split("").map(Number);

// ─── Formula definitions (return array of candidate strings) ──
// Each formula gets: prev draw (p1), prev prev (p2), etc.
// Returns a list of 2-digit or 3-digit string candidates

const FORMULAS_2 = [
  // --- Digit Sum formulas ---
  {
    name: "digitSum(prize1) mod100",
    fn: (p) => [pad2(digsum(p.prize1))]
  },
  {
    name: "digitSum²(prize1) mod100",  // sum the digit sum again
    fn: (p) => [pad2(digsum(digsum(p.prize1)))]
  },
  {
    name: "last2(prize1)",
    fn: (p) => [last2(p.prize1)]
  },
  {
    name: "first2(prize1)",
    fn: (p) => [first2(p.prize1)]
  },
  {
    name: "mid2(prize1) digits 3-4",
    fn: (p) => [mid2(p.prize1)]
  },
  {
    name: "reverse2(prize2back)",
    fn: (p) => [reverse2(p.prize2back)]
  },
  {
    name: "prize2back+1",
    fn: (p) => [pad2(+p.prize2back + 1)]
  },
  {
    name: "prize2back+2",
    fn: (p) => [pad2(+p.prize2back + 2)]
  },
  {
    name: "prize2back-1",
    fn: (p) => [pad2(+p.prize2back - 1)]
  },
  {
    name: "prize2back-2",
    fn: (p) => [pad2(+p.prize2back - 2)]
  },
  {
    name: "prize2back complement (100-x)",
    fn: (p) => [pad2(100 - +p.prize2back)]
  },
  {
    name: "digitSum(prize3back[0]) *2 mod100",
    fn: (p) => [pad2(digsum(p.prize3back[0]) * 2)]
  },
  {
    name: "last2(prize3back[0])",
    fn: (p) => [last2(p.prize3back[0])]
  },
  {
    name: "last2(prize3back[1])",
    fn: (p) => [last2(p.prize3back[1])]
  },
  {
    name: "sum(prize3back[0]+prize3back[1]) last2",
    fn: (p) => [last2(+p.prize3back[0] + +p.prize3back[1])]
  },
  {
    name: "prize2back + last2(prize1) mod100",
    fn: (p) => [pad2(+p.prize2back + +last2(p.prize1))]
  },
  {
    name: "prize2back - last2(prize1) mod100",
    fn: (p) => [pad2(+p.prize2back - +last2(p.prize1))]
  },
  {
    name: "last2(prize1) - prize2back mod100",
    fn: (p) => [pad2(+last2(p.prize1) - +p.prize2back)]
  },
  {
    name: "digitSum(prize1)+prize2back mod100",
    fn: (p) => [pad2(digsum(p.prize1) + +p.prize2back)]
  },
  {
    name: "allDigits product mod100",
    fn: (p) => {
      const prod = allDigits(p.prize1).reduce((a,c) => c===0 ? a : a*c, 1);
      return [pad2(prod)];
    }
  },
  {
    name: "pairSum d1+d6, d2+d5, d3+d4 concat last",
    fn: (p) => {
      const d = allDigits(p.prize1);
      return [pad2(d[0]+d[5]), pad2(d[1]+d[4]), pad2(d[2]+d[3])];
    }
  },
  // --- Cross-draw: use p1 AND p2 ---
  {
    name: "[2draw] prize2back avg (round)",
    fn: (p, p2) => p2 ? [pad2(Math.round((+p.prize2back + +p2.prize2back)/2))] : []
  },
  {
    name: "[2draw] prize2back sum mod100",
    fn: (p, p2) => p2 ? [pad2(+p.prize2back + +p2.prize2back)] : []
  },
  {
    name: "[2draw] prize2back diff mod100",
    fn: (p, p2) => p2 ? [pad2(Math.abs(+p.prize2back - +p2.prize2back))] : []
  },
  {
    name: "[2draw] last2(prize1) xor-add mod100",
    fn: (p, p2) => p2 ? [pad2(+last2(p.prize1) + +last2(p2.prize1))] : []
  },
  {
    name: "[2draw] prize2back * prize2back mod100",
    fn: (p, p2) => p2 ? [pad2(+p.prize2back * +p2.prize2back)] : []
  },
  {
    name: "[3draw] sum 3 prize2back mod100",
    fn: (p, p2, p3) => (p2&&p3) ? [pad2(+p.prize2back + +p2.prize2back + +p3.prize2back)] : []
  },
  {
    name: "[3draw] digitSum(sum 3 prize1) mod100",
    fn: (p, p2, p3) => (p2&&p3) ? [pad2(digsum(+p.prize1 + +p2.prize1 + +p3.prize1))] : []
  },
  // --- Date-based ---
  {
    name: "draw day of month mod100",
    fn: (p) => {
      const day = parseInt(p.date.split("-")[2]);
      return [pad2(day)];
    }
  },
  {
    name: "last2(prize1) mod 10 concat last2(prize3back[0]) mod10",
    fn: (p) => [pad2(+last2(p.prize1) % 10 * 10 + +last2(p.prize3back[0]) % 10)]
  },
  {
    name: "digitSum all prizes mod100",
    fn: (p) => {
      const total = digsum(p.prize1) + digsum(p.prize3back[0]) + digsum(p.prize3back[1]) + digsum(p.prize2back);
      return [pad2(total)];
    }
  },
  {
    name: "last2(prize3back[0]) + prize2back mod100",
    fn: (p) => [pad2(+last2(p.prize3back[0]) + +p.prize2back)]
  },
  {
    name: "prize3back[0] - prize3back[1] abs last2",
    fn: (p) => [last2(Math.abs(+p.prize3back[0] - +p.prize3back[1]))]
  },
];

const FORMULAS_3 = [
  {
    name: "last3(prize1)",
    fn: (p) => [last3(p.prize1)]
  },
  {
    name: "first3(prize1)",
    fn: (p) => [first3(p.prize1)]
  },
  {
    name: "mid3(prize1) digits 2-4",
    fn: (p) => [String(p.prize1).padStart(6,"0").slice(1,4)]
  },
  {
    name: "mid3(prize1) digits 3-5",
    fn: (p) => [String(p.prize1).padStart(6,"0").slice(2,5)]
  },
  {
    name: "prize3back[0] itself",
    fn: (p) => [p.prize3back[0]]
  },
  {
    name: "prize3back[1] itself",
    fn: (p) => [p.prize3back[1]]
  },
  {
    name: "reverse prize3back[0]",
    fn: (p) => [p.prize3back[0].split("").reverse().join("")]
  },
  {
    name: "reverse prize3back[1]",
    fn: (p) => [p.prize3back[1].split("").reverse().join("")]
  },
  {
    name: "prize3back[0]+1 last3",
    fn: (p) => [pad3(+p.prize3back[0] + 1)]
  },
  {
    name: "prize3back[0]-1 last3",
    fn: (p) => [pad3(+p.prize3back[0] - 1)]
  },
  {
    name: "sum(prize3back) mod1000",
    fn: (p) => [pad3(+p.prize3back[0] + +p.prize3back[1])]
  },
  {
    name: "diff(prize3back) abs",
    fn: (p) => [pad3(Math.abs(+p.prize3back[0] - +p.prize3back[1]))]
  },
  {
    name: "digitSum(prize1)*10 + prize2back%10 last3",
    fn: (p) => [pad3(digsum(p.prize1)*10 + +p.prize2back%10)]
  },
  {
    name: "[2draw] prize3back[0] avg round",
    fn: (p, p2) => p2 ? [pad3(Math.round((+p.prize3back[0] + +p2.prize3back[0])/2))] : []
  },
  {
    name: "[2draw] prize3back sum mod1000",
    fn: (p, p2) => p2 ? [pad3(+p.prize3back[0] + +p2.prize3back[0])] : []
  },
  {
    name: "prize3back mirror: swap first+last digit",
    fn: (p) => {
      const s = p.prize3back[0];
      return [s[2]+s[1]+s[0], p.prize3back[1][2]+p.prize3back[1][1]+p.prize3back[1][0]];
    }
  },
  {
    name: "last3(prize1) rotate left",
    fn: (p) => {
      const s = String(p.prize1).padStart(6,"0").slice(-3);
      return [s[1]+s[2]+s[0]];
    }
  },
  {
    name: "last3(prize1) rotate right",
    fn: (p) => {
      const s = String(p.prize1).padStart(6,"0").slice(-3);
      return [s[2]+s[0]+s[1]];
    }
  },
];

// ─── Run tests ────────────────────────────────────────────────
function runTest(formulas, getActual, label) {
  console.log(`\n${"═".repeat(70)}`);
  console.log(`  ${label}`);
  console.log(`${"═".repeat(70)}`);

  const results = [];

  for (const f of formulas) {
    let hits = 0, tested = 0, multiHits = 0;

    // For each draw (starting from index 1), use index-1 as prev
    for (let i = 1; i < data.length; i++) {
      const current = data[i];
      const p1 = data[i - 1];
      const p2 = data[i - 2] || null;
      const p3 = data[i - 3] || null;

      const candidates = f.fn(p1, p2, p3);
      if (candidates.length === 0) continue;

      const actual = getActual(current);
      tested++;

      const hit = candidates.some(c => actual.includes(c));
      if (hit) hits++;
      if (candidates.filter(c => actual.includes(c)).length > 1) multiHits++;
    }

    if (tested === 0) continue;
    const rate = (hits / tested * 100).toFixed(1);
    const expected2 = label.includes("2-digit") ? (tested / 100 * 1).toFixed(1) : (tested / 1000 * 2).toFixed(1);
    results.push({ name: f.name, hits, tested, rate: +rate, expected: +expected2, multiHits });
  }

  // Sort by hit rate descending
  results.sort((a, b) => b.rate - a.rate);

  const maxNameLen = Math.max(...results.map(r => r.name.length));
  for (const r of results) {
    const bar = "█".repeat(Math.round(r.rate / 3));
    const flag = r.rate >= 5 ? " ◄◄ INTERESTING" : r.rate >= 3 ? " ◄ notable" : "";
    console.log(
      `${r.name.padEnd(maxNameLen)} | ${String(r.hits).padStart(3)}/${r.tested} (${String(r.rate).padStart(5)}%)  ${bar}${flag}`
    );
  }

  console.log(`\nBase rate: 2-digit random = 1.0%, 3-digit random = 0.2%`);
  return results;
}

// ─── Run for prize2back ───────────────────────────────────────
runTest(
  FORMULAS_2,
  (d) => [d.prize2back],          // actual = single 2-digit number
  "PRIZE2BACK (เลขท้าย 2 ตัว)"
);

// ─── Run for prize3back ───────────────────────────────────────
runTest(
  FORMULAS_3,
  (d) => d.prize3back,             // actual = array of 2 three-digit numbers
  "PRIZE3BACK (เลขท้าย 3 ตัว)"
);

// ─── Extra: Check if any 2-digit formula beats 5%+ ───────────
console.log("\n\n" + "═".repeat(70));
console.log("  สรุป: สูตรที่น่าสนใจที่สุด (hit rate > 3%)");
console.log("═".repeat(70));
console.log("  random baseline 2-digit = 1%,  3-digit = 0.2%");
console.log("  ถ้าสูตรถูก 5% = 5x random,  10% = 10x random");
console.log("─".repeat(70));
console.log("  หมายเหตุ: ตัวเลขเหล่านี้เป็น historical fit");
console.log("  ผลจริงในอนาคตไม่การันตีว่าจะตรงกัน (random draw)");
console.log("═".repeat(70));
