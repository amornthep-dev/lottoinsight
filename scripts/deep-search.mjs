// ─── Deep Formula Search — Maximize Hit Rate with Permutations ───
// ทดสอบ approach ใหม่ที่ลึกกว่าเดิม:
// 1. Digit-level prediction (ทายทีละหลัก)
// 2. Hot Digit Cluster (digit ที่ออกบ่อยในช่วงล่าสุด)
// 3. Rolling window consistency (สม่ำเสมอทุก 10 งวด)
// 4. Multi-formula ensemble
// รัน: node scripts/deep-search.mjs
// ─────────────────────────────────────────────────────────────────

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(readFileSync(join(__dirname, "../data/lottery.json"), "utf8"));

const pad2 = n => String(((n % 100) + 100) % 100).padStart(2, "0");
const pad3 = n => String(((n % 1000) + 1000) % 1000).padStart(3, "0");

function permutations(s) {
  if (s.length <= 1) return [s];
  const result = new Set();
  for (let i = 0; i < s.length; i++) {
    const rest = s.slice(0, i) + s.slice(i + 1);
    for (const p of permutations(rest)) result.add(s[i] + p);
  }
  return [...result];
}

function allPerms2(nums) {
  const s = new Set();
  nums.forEach(n => permutations(String(n).padStart(2,"0")).forEach(x => s.add(x)));
  return [...s];
}

function allPerms3(nums) {
  const s = new Set();
  nums.forEach(n => permutations(String(n).padStart(3,"0")).forEach(x => s.add(x)));
  return [...s];
}

// ─── Approach 1: Hot Digit Cluster ───────────────────────────────
// เอา digit ที่ออกบ่อยใน N งวดล่าสุด แล้วสร้างเลขจากมัน

function getHotDigits(pastDraws, n, source) {
  const freq = Array(10).fill(0);
  pastDraws.slice(0, n).forEach(d => {
    if (source === "2back") {
      d.prize2back.split("").forEach(c => freq[+c]++);
    } else {
      d.prize3back.forEach(n3 => n3.split("").forEach(c => freq[+c]++));
      d.prize2back.split("").forEach(c => freq[+c]++);
    }
  });
  return freq.map((f,i) => ({d:i, f})).sort((a,b)=>b.f-a.f).map(x=>x.d);
}

// สร้าง 2-digit candidates จาก top K digits
function genCandidates2fromDigits(digits, k) {
  const topK = digits.slice(0, k);
  const cands = new Set();
  for (const a of topK) for (const b of topK) {
    cands.add(String(a)+String(b));
  }
  return [...cands];
}

// สร้าง 3-digit candidates จาก top K digits
function genCandidates3fromDigits(digits, k) {
  const topK = digits.slice(0, k);
  const cands = new Set();
  for (const a of topK) for (const b of topK) for (const c of topK) {
    cands.add(String(a)+String(b)+String(c));
  }
  return [...cands];
}

// ─── Approach 2: Prize1 Digit Decomposition ──────────────────────
// แยกเลขรางวัลที่ 1 ออกเป็น digit แล้วประกอบใหม่

function prize1Digits(prize1) {
  const d = String(prize1).padStart(6,"0").split("").map(Number);
  const cands2 = new Set();
  const cands3 = new Set();
  // ทุก pair
  for (let i=0;i<6;i++) for (let j=0;j<6;j++) if(i!==j) {
    cands2.add(String(d[i])+String(d[j]));
  }
  // ทุก triple
  for (let i=0;i<6;i++) for (let j=0;j<6;j++) for (let k=0;k<6;k++) if(i!==j&&j!==k&&i!==k) {
    cands3.add(String(d[i])+String(d[j])+String(d[k]));
  }
  return { cands2: [...cands2], cands3: [...cands3] };
}

// ─── Approach 3: Sum/Diff Matrix ─────────────────────────────────
// เอาเลขรางวัลมา บวก/ลบ/คูณ กันทุกแบบ

function mathMatrix(pastDraws, n) {
  const draws = pastDraws.slice(0, n);
  const backs2 = draws.map(d => +d.prize2back);
  const backs3 = draws.flatMap(d => d.prize3back.map(x => +x));
  const cands2 = new Set();
  const cands3 = new Set();

  // บวกทุกคู่
  for (let i=0;i<backs2.length;i++) for (let j=i+1;j<backs2.length;j++) {
    cands2.add(pad2(backs2[i]+backs2[j]));
    cands2.add(pad2(Math.abs(backs2[i]-backs2[j])));
    cands2.add(pad2(backs2[i]*backs2[j]));
  }
  // average ทุกชุด 2
  for (let i=0;i<backs2.length-1;i++) {
    cands2.add(pad2(Math.round((backs2[i]+backs2[i+1])/2)));
  }
  // digitSum ของ prize1
  draws.forEach(d => {
    const s = String(d.prize1).split("").reduce((a,c)=>a+ +c,0);
    cands2.add(pad2(s));
    cands2.add(pad2(s*2));
    cands2.add(pad2(s*3));
  });

  // 3-digit sums
  for (let i=0;i<backs3.length;i++) for (let j=i+1;j<backs3.length;j++) {
    cands3.add(pad3(backs3[i]+backs3[j]));
    cands3.add(pad3(Math.abs(backs3[i]-backs3[j])));
  }

  return { cands2: allPerms2([...cands2]), cands3: allPerms3([...cands3]) };
}

// ─── Approach 4: Lucky Numbers — เลขที่ "ค้าง" นานที่สุด ──────────
function getOverdueNumbers2(pastDraws) {
  const lastSeen = {};
  pastDraws.forEach((d, i) => {
    if (!(d.prize2back in lastSeen)) lastSeen[d.prize2back] = i;
  });
  // เลขที่ไม่ออกมานานที่สุด
  const all = Array.from({length:100}, (_,i) => pad2(i));
  return all
    .sort((a,b) => (lastSeen[b]??200) - (lastSeen[a]??200))
    .slice(0,20);
}

function getOverdueNumbers3(pastDraws) {
  const lastSeen = {};
  pastDraws.forEach((d, i) => {
    d.prize3back.forEach(n => { if (!(n in lastSeen)) lastSeen[n] = i; });
  });
  const seen = Object.entries(lastSeen).sort((a,b)=>b[1]-a[1]).slice(0,30).map(x=>x[0]);
  return allPerms3(seen);
}

// ─── Rolling 10-draw window test ─────────────────────────────────
// สำหรับแต่ละ window ของ 10 งวดล่าสุด วัดว่าสูตรใด "เข้า" มากที่สุด

function testStrategy(name, getCandidates2, getCandidates3, windowSize=10) {
  let hit2=0, hit3=0, tested=0;
  let totalCands2=0, totalCands3=0;

  // ทดสอบทุก window
  for (let i = 1; i < data.length; i++) {
    const current = data[i];
    const past = data.slice(i+1); // งวดก่อนหน้า (ไม่รวมปัจจุบัน)
    if (past.length < windowSize) continue;

    const c2 = getCandidates2(past, windowSize);
    const c3 = getCandidates3(past, windowSize);

    totalCands2 += c2.length;
    totalCands3 += c3.length;
    tested++;

    if (c2.includes(current.prize2back)) hit2++;
    if (current.prize3back.some(n => c3.includes(n))) hit3++;
  }

  const rate2 = tested > 0 ? (hit2/tested*100).toFixed(1) : "0";
  const rate3 = tested > 0 ? (hit3/tested*100).toFixed(1) : "0";
  const avg2 = tested > 0 ? (totalCands2/tested).toFixed(0) : "0";
  const avg3 = tested > 0 ? (totalCands3/tested).toFixed(0) : "0";
  const base2 = (+avg2/100*100).toFixed(1);
  const base3 = (2*+avg3/1000*100).toFixed(2);
  const x2 = base2>0 ? (+rate2/+base2).toFixed(2) : "N/A";
  const x3 = base3>0 ? (+rate3/+base3).toFixed(2) : "N/A";

  return { name, hit2, hit3, tested, rate2:+rate2, rate3:+rate3, avg2:+avg2, avg3:+avg3, base2:+base2, base3:+base3, x2:+x2, x3:+x3 };
}

// ─── Define Strategies ────────────────────────────────────────────

const strategies = [
  {
    name: "Hot Digit top-3 (9 cands + perms)",
    c2: (p,w) => allPerms2(genCandidates2fromDigits(getHotDigits(p,w,"2back"),3)),
    c3: (p,w) => allPerms3(genCandidates3fromDigits(getHotDigits(p,w,"3back"),3)),
  },
  {
    name: "Hot Digit top-4 (16 cands + perms)",
    c2: (p,w) => allPerms2(genCandidates2fromDigits(getHotDigits(p,w,"2back"),4)),
    c3: (p,w) => allPerms3(genCandidates3fromDigits(getHotDigits(p,w,"3back"),3)),
  },
  {
    name: "Hot Digit top-5 (25 cands + perms)",
    c2: (p,w) => allPerms2(genCandidates2fromDigits(getHotDigits(p,w,"2back"),5)),
    c3: (p,w) => allPerms3(genCandidates3fromDigits(getHotDigits(p,w,"3back"),4)),
  },
  {
    name: "Prize1 digit pairs (all 2-digit combos from prize1)",
    c2: (p,w) => allPerms2(prize1Digits(p[0].prize1).cands2),
    c3: (p,w) => allPerms3(prize1Digits(p[0].prize1).cands3),
  },
  {
    name: "Math matrix (sum/diff/product of 3 งวดล่าสุด) + perms",
    c2: (p,w) => mathMatrix(p,3).cands2,
    c3: (p,w) => mathMatrix(p,3).cands3,
  },
  {
    name: "Math matrix (5 งวดล่าสุด) + perms",
    c2: (p,w) => mathMatrix(p,5).cands2,
    c3: (p,w) => mathMatrix(p,5).cands3,
  },
  {
    name: "Overdue numbers (ค้างนาน) top-20 + perms",
    c2: (p,w) => allPerms2(getOverdueNumbers2(p)),
    c3: (p,w) => getOverdueNumbers3(p).slice(0,200),
  },
  {
    name: "Hot Digit w5 top-4 + Overdue top-10 UNION",
    c2: (p,w) => {
      const hot = allPerms2(genCandidates2fromDigits(getHotDigits(p,5,"2back"),4));
      const due = getOverdueNumbers2(p).slice(0,10);
      return [...new Set([...hot,...due])];
    },
    c3: (p,w) => {
      const hot = allPerms3(genCandidates3fromDigits(getHotDigits(p,5,"3back"),3));
      const due = getOverdueNumbers3(p).slice(0,50);
      return [...new Set([...hot,...due])];
    },
  },
  {
    name: "Prize1 pairs + Hot Digit top-3 UNION",
    c2: (p,w) => {
      const p1 = allPerms2(prize1Digits(p[0].prize1).cands2);
      const hot = allPerms2(genCandidates2fromDigits(getHotDigits(p,5,"2back"),3));
      return [...new Set([...p1,...hot])];
    },
    c3: (p,w) => {
      const p1 = allPerms3(prize1Digits(p[0].prize1).cands3);
      const hot = allPerms3(genCandidates3fromDigits(getHotDigits(p,5,"3back"),3));
      return [...new Set([...p1,...hot])];
    },
  },
  // Narrow versions — ถ้าต้องการ candidates น้อยลงแต่ยังดี
  {
    name: "Hot Digit top-3, window=5 (narrow)",
    c2: (p,w) => allPerms2(genCandidates2fromDigits(getHotDigits(p,5,"2back"),3)),
    c3: (p,w) => allPerms3(genCandidates3fromDigits(getHotDigits(p,5,"3back"),3)),
  },
  {
    name: "Hot Digit top-3, window=3 (very narrow)",
    c2: (p,w) => allPerms2(genCandidates2fromDigits(getHotDigits(p,3,"2back"),3)),
    c3: (p,w) => allPerms3(genCandidates3fromDigits(getHotDigits(p,3,"3back"),3)),
  },
];

// ─── Run all strategies ───────────────────────────────────────────

console.log("═".repeat(90));
console.log("  DEEP SEARCH — Testing " + strategies.length + " strategies, rolling window, with permutations");
console.log("  Metric: hit rate vs random baseline (ยิ่งสูงกว่า 1.0x ยิ่งดี)");
console.log("═".repeat(90));

const results = strategies.map(s => testStrategy(s.name, s.c2, s.c3));

// Sort by 2-digit hit rate (หลักสำคัญ)
results.sort((a,b) => b.rate2 - a.rate2);

console.log("\n📊 เรียงตาม hit rate เลขท้าย 2 ตัว:\n");
console.log("Strategy".padEnd(52) + "| 2ตัว hit | cands | base  | x    | 3ตัว hit | cands | base   | x");
console.log("─".repeat(120));

for (const r of results) {
  const flag2 = r.x2 >= 1.3 ? " 🔥" : r.x2 >= 1.1 ? " ✓" : "";
  const flag3 = r.x3 >= 1.3 ? " 🔥" : r.x3 >= 1.1 ? " ✓" : "";
  console.log(
    r.name.slice(0,51).padEnd(52) +
    `| ${String(r.rate2+"%").padStart(8)} | ${String(r.avg2).padStart(5)} | ${String(r.base2+"%").padStart(5)} | ${String(r.x2+"x").padStart(4)}${flag2} | ` +
    `${String(r.rate3+"%").padStart(8)} | ${String(r.avg3).padStart(5)} | ${String(r.base3+"%").padStart(6)} | ${String(r.x3+"x").padStart(4)}${flag3}`
  );
}

// ─── Simulate "last 10 draws" for the BEST strategy ──────────────
const best = results[0];
console.log(`\n\n${"═".repeat(90)}`);
console.log(`  🎯 จำลอง: Strategy ที่ดีที่สุด = "${best.name}"`);
console.log(`  ใช้กับ 10 งวดล่าสุดจริง ๆ (งวด index 1-10)`);
console.log("═".repeat(90));

const bestStrat = strategies.find(s => s.name === best.name);
let simHit2=0, simHit3=0;
for (let i = 1; i <= 10; i++) {
  const current = data[i];
  if (!current) break;
  const past = data.slice(i+1);
  const c2 = bestStrat.c2(past, 10);
  const c3 = bestStrat.c3(past, 10);
  const h2 = c2.includes(current.prize2back);
  const h3 = current.prize3back.some(n => c3.includes(n));
  if (h2) simHit2++;
  if (h3) simHit3++;
  console.log(`  ${current.dateDisplay.padEnd(25)} | 2ตัว: ${current.prize2back} ${h2?"✅ ถูก ("+c2.slice(0,6).join(",")+"...)":"❌ พลาด (sample:"+c2.slice(0,5).join(",")+")"}`);
  console.log(`  ${"".padEnd(25)} | 3ตัว: ${current.prize3back.join("/")} ${h3?"✅ ถูก":"❌ พลาด (sample:"+c3.slice(0,5).join(",")+")"}`);
  console.log(`  ${"─".repeat(85)}`);
}
console.log(`\n  รวม 10 งวด: 2ตัว ถูก ${simHit2}/10 (${simHit2*10}%)  |  3ตัว ถูก ${simHit3}/10 (${simHit3*10}%)`);
console.log(`  candidates เฉลี่ย: 2ตัว=${best.avg2} ตัว, 3ตัว=${best.avg3} ตัว`);
console.log(`  random baseline: 2ตัว=${best.avg2}%, 3ตัว=${(best.avg3*2/10).toFixed(1)}%`);

// ─── Summary ──────────────────────────────────────────────────────
console.log(`\n\n${"═".repeat(90)}`);
console.log("  📌 ข้อสรุป:");
console.log("═".repeat(90));
console.log(`
  1. ถ้าต้องการ hit rate สูงมาก → ต้องใช้ candidates มากขึ้น
     แต่ทุก approach วิ่งอยู่ที่ ~1.0-1.3x random เสมอ
     (เพราะหวยรัฐบาลไทยออกแบบมาเพื่อ random จริงๆ)

  2. สิ่งที่ทำได้ดีที่สุด = "Hot Digit Cluster + Permutation"
     → เลขที่ประกอบจาก digit ที่ออกบ่อยล่าสุด + เลขกลับทุกแบบ
     → กว้างพอให้ hit สม่ำเสมอ แต่ไม่ใช่ทั้ง 100 เลข

  3. แนะนำใช้สำหรับเว็บ:
     "กลุ่มเลขสถิติ — คัดจาก digit ที่ออกบ่อย + เลขกลับทุก permutation"
     ไม่ต้องอ้างว่า "ทำนาย" แค่ "กลุ่มเลขที่ digit ยังร้อนอยู่"
`);
