// backtest-v3.mjs — NARROW POOL VERSION
// แต่ละ method generate แค่ 10-15 core candidates (ไม่ expand permutation ก่อน)
// แล้วค่อย score → filter score≥2 → expand permutation เฉพาะ top ones
// node scripts/backtest-v3.mjs

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
const __dirname = dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(readFileSync(join(__dirname, "../data/lottery.json"), "utf8"));

const mod  = (n,m) => ((Math.round(n)%m)+m)%m;
const pad2 = n => String(mod(n,100)).padStart(2,"0");

function uniquePerms(s) {
  if (s.length<=1) return [s];
  const res = new Set();
  for (let i=0;i<s.length;i++) {
    const rest=s.slice(0,i)+s.slice(i+1);
    for (const p of uniquePerms(rest)) res.add(s[i]+p);
  }
  return [...res];
}
function permsOf(nums) {
  const s=new Set(); nums.forEach(n=>uniquePerms(n.padStart(2,"0")).forEach(p=>s.add(p))); return [...s];
}
function isPerm(actual, cands) { return uniquePerms(actual).some(p=>cands.includes(p)); }

// ─── NARROW methods: max 10-15 core candidates each ──────────────

// Lo Shu: เฉพาะ n1×n2 top pairs (ไม่รวม magic partner)
const LO=[  [4,9,2],[3,5,7],[8,1,6]  ];
const dpos={};
for (let r=0;r<3;r++) for (let c=0;c<3;c++) dpos[LO[r][c]]=[r,c];
function lsConn(d) {
  if(d===0) return [1,9];
  const pos=dpos[d]; if(!pos) return [d];
  const [row,col]=pos; const s=new Set();
  for (let c=0;c<3;c++) s.add(LO[row][c]);
  for (let r=0;r<3;r++) s.add(LO[r][col]);
  return [...s];
}
function mLoShu(past) {
  const p=past[0].prize2back; const d1=+p[0],d2=+p[1];
  const n1=lsConn(d1).slice(0,4), n2=lsConn(d2).slice(0,4);
  const core=new Set();
  for (const a of n1) for (const b of n2) core.add(String(a)+String(b));
  return [...core].slice(0,12); // max 12 core
}

// RSI: top 3 oversold digits only → 3×3 = 9 core
function mRSI(past) {
  const cnt=(draws,per)=>{ const c=Array(10).fill(0); draws.slice(0,per).forEach(d=>{c[+d.prize2back[0]]++;c[+d.prize2back[1]]++;}); return c; };
  const d5=cnt(past,5),d10=cnt(past,10),d20=cnt(past,20);
  const rsiD=(c,per)=>Math.min(100,Math.max(0,(c/(per*2/10))*50));
  const combined=Array(10).fill(0).map((_,i)=>rsiD(d5[i],5)*0.5+rsiD(d10[i],10)*0.3+rsiD(d20[i],20)*0.2);
  const ov=[...combined.map((v,d)=>({d,v}))].sort((a,b)=>a.v-b.v).slice(0,3).map(x=>x.d);
  const core=new Set();
  for (const a of ov) for (const b of ov) core.add(String(a)+String(b));
  return [...core]; // max 9 core
}

// Fibonacci: direct formula values only (no sub-results)
const PHI=1.6180339887, PHI2=PHI*PHI, DELTA=2.4142135624;
function mFib(past) {
  const [a,b,c,d]=[0,1,2,3].map(i=>+(past[i]?.prize2back??0));
  return [...new Set([a+b,Math.abs(a-b),a*PHI,a*PHI2,a+b+c,a+b+c+d,a*DELTA,a/PHI].map(n=>pad2(n)))].slice(0,8);
}

// Kaprekar: chain values only from last 2 draws (no cross-chain)
function kapStep(n) {
  const s=String(n).padStart(2,"0").split("").map(Number).sort((a,b)=>b-a);
  return mod(parseInt(s.join(""))-parseInt([...s].reverse().join("")),100);
}
function kapChain(seed,steps=5) {
  const ch=[seed]; let cur=seed;
  for (let i=0;i<steps;i++) { cur=kapStep(cur); if(ch.includes(cur)||cur===0) break; ch.push(cur); }
  return ch;
}
function mKaprekar(past) {
  const seeds=past.slice(0,2).map(d=>+d.prize2back);
  const core=new Set();
  seeds.forEach(s=>kapChain(s).forEach(n=>core.add(pad2(n))));
  return [...core].slice(0,10);
}

// Transition: top-3 predicted digits × top-3 (9 core)
function mTransition(past) {
  const counts=Array.from({length:10},()=>Array(10).fill(0));
  const totals=Array(10).fill(0);
  for (let i=0;i<past.length-1;i++) {
    const cur=past[i].prize2back,next=past[i+1].prize2back;
    for (const cd of [+cur[0],+cur[1]]) {
      counts[cd][+next[0]]++;counts[cd][+next[1]]++;totals[cd]+=2;
    }
  }
  const mat=counts.map((row,d)=>row.map(c=>totals[d]>0?c/totals[d]:0.1));
  const votes=Array(10).fill(0);
  [+past[0].prize2back[0],+past[0].prize2back[1]].forEach(cd=>mat[cd].forEach((p,nd)=>{votes[nd]+=p*0.5;}));
  [+past[1].prize2back[0],+past[1].prize2back[1]].forEach(cd=>mat[cd].forEach((p,nd)=>{votes[nd]+=p*0.5;}));
  const top=[...votes.map((v,d)=>({d,v}))].sort((a,b)=>b.v-a.v).slice(0,3).map(x=>x.d);
  const core=new Set();
  for (const a of top) for (const b of top) core.add(String(a)+String(b));
  return [...core]; // 9 core
}

const METHODS=["loshu","rsi","fib","kaprekar","transition"];
const getFn={loshu:mLoShu,rsi:mRSI,fib:mFib,kaprekar:mKaprekar,transition:mTransition};

// ─── Backtest with narrow pools ───────────────────────────────────
console.log("═".repeat(80));
console.log("  Triple Score V2 — NARROW POOL BACKTEST");
console.log("  แต่ละ method: 8-12 core candidates → score → filter ≥2 → +permutation");
console.log("═".repeat(80));

const results=[];
for (let i=1;i<=10;i++) {
  const draw=data[i]; if(!draw) break;
  const past=data.slice(i+1);
  if(past.length<5) break;
  const actual2=draw.prize2back;

  // Core candidates per method
  const core={};
  for (const m of METHODS) core[m]=getFn[m](past);

  // Score each number (from union of all cores)
  const allCore=new Set(Object.values(core).flat());
  const scored=[...allCore].map(num=>{
    const sc=METHODS.filter(m=>core[m].includes(num)).length;
    return {num, sc, methods:METHODS.filter(m=>core[m].includes(num))};
  }).sort((a,b)=>b.sc-a.sc||a.num.localeCompare(b.num));

  // Filter score ≥2 → expand to permutations
  const top=scored.filter(e=>e.sc>=2);
  const topNums=top.map(e=>e.num);
  const focusedPool=permsOf(topNums); // these are the "confident" candidates

  // Also check exact core hits
  const exactCore={}; const permCore={};
  for (const m of METHODS) {
    exactCore[m]=core[m].includes(actual2);
    permCore[m]=isPerm(actual2,core[m]);
  }

  // Focused pool hits
  const focusedExact=focusedPool.includes(actual2);
  const focusedPerm=isPerm(actual2,focusedPool); // actual2 itself is exact or its perm in pool

  // Score of actual2 in the scoring
  const actualInCore=scored.find(e=>e.num===actual2);
  const actualScore=actualInCore?.sc??0;
  // Also check if a perm of actual2 scored high
  const permsOfActual=uniquePerms(actual2);
  const bestPermEntry=scored.filter(e=>permsOfActual.includes(e.num)).sort((a,b)=>b.sc-a.sc)[0];
  const bestPermScore=bestPermEntry?.sc??0;

  results.push({
    draw, actual2,
    scored, top, focusedPool,
    exactCore, permCore,
    focusedExact, focusedPerm,
    actualScore, bestPermScore,
    corePoolSize:allCore.size,
    focusedPoolSize:focusedPool.length,
    topPoolSize:top.length,
  });

  const flag=focusedPerm?"🎯":focusedExact?"✅":"  ";
  const scoreStr=`score=${bestPermScore}/5`;
  console.log(`\n${flag} ${draw.dateDisplay.padEnd(25)} | ออก: ${actual2} | ${scoreStr}`);
  console.log(`   Core pools: LoShu=${core.loshu.length} RSI=${core.rsi.length} Fib=${core.fib.length} Kap=${core.kaprekar.length} Trans=${core.transition.length}`);
  console.log(`   Score≥2 pool (before perm): ${top.length} เลข → +perm: ${focusedPool.length} เลข`);
  console.log(`   Method hits (exact/perm in core): ${METHODS.map(m=>`${m}:${exactCore[m]?"✅":permCore[m]?"🔄":"❌"}`).join(" ")}`);
  if(top.length>0) console.log(`   Top scored: ${top.slice(0,8).map(e=>`${e.num}(${e.sc})`).join(", ")}`);
  console.log(`   Focused pool hit: ${focusedPerm?"🎯 ถูก (รวมกลับ)":focusedExact?"✅ ถูก exact":"❌ พลาด"}`);
}

// ─── Summary ──────────────────────────────────────────────────────
console.log("\n"+"═".repeat(80));
console.log("  สรุปผล NARROW POOL");
console.log("═".repeat(80));
const total=results.length;

const fpExact=results.filter(r=>r.focusedExact).length;
const fpPerm=results.filter(r=>r.focusedPerm).length;
const avgFocused=Math.round(results.reduce((s,r)=>s+r.focusedPoolSize,0)/total);
const avgTop=Math.round(results.reduce((s,r)=>s+r.topPoolSize,0)/total);
const score2up=results.filter(r=>r.bestPermScore>=2).length;
const score3up=results.filter(r=>r.bestPermScore>=3).length;
const score4up=results.filter(r=>r.bestPermScore>=4).length;
const avgCore=Math.round(results.reduce((s,r)=>s+r.corePoolSize,0)/total);

console.log(`\n  Pool sizes:`);
console.log(`    Core (union all methods): ~${avgCore} เลข`);
console.log(`    Score≥2 (before perm):   ~${avgTop} เลข`);
console.log(`    Focused pool (+perm):    ~${avgFocused} เลข`);
console.log(`\n  Focused pool hits:`);
console.log(`    Exact match: ${fpExact}/${total} (${(fpExact/total*100).toFixed(0)}%)`);
console.log(`    +กลับ match: ${fpPerm}/${total} (${(fpPerm/total*100).toFixed(0)}%)`);
console.log(`    Random baseline at ~${avgFocused} pool: ~${avgFocused}%`);
console.log(`    Efficiency: ${(fpPerm/total*100/Math.max(avgFocused,1)).toFixed(2)}x random`);
console.log(`\n  Actual number's Triple Score (รวมกลับ):`);
console.log(`    Score ≥2/5: ${score2up}/${total} (${(score2up/total*100).toFixed(0)}%) ← ตัวเลขจริงโดน 2+ method`);
console.log(`    Score ≥3/5: ${score3up}/${total} (${(score3up/total*100).toFixed(0)}%)`);
console.log(`    Score ≥4/5: ${score4up}/${total} (${(score4up/total*100).toFixed(0)}%)`);
console.log(`\n  Per-method (core, including perm):`);
for (const m of METHODS) {
  const ex=results.filter(r=>r.exactCore[m]).length;
  const pe=results.filter(r=>r.permCore[m]).length;
  const avgP=Math.round(results.reduce((s,r)=>s+r.core?.[m]?.length??0,0)/total);
  console.log(`    ${m.padEnd(12)}: exact ${ex}/${total}  +perm ${pe}/${total}  pool~${getFn[m](data.slice(1)).length}`);
}
console.log("\n"+"═".repeat(80));
console.log("  สรุป: สิ่งที่จะแสดงใน Story Board");
console.log("═".repeat(80));
console.log(`
  ✅ แสดง Focused Pool (~${avgFocused} เลข) ต่อ 1 งวด
  ✅ Highlight ถ้า actual อยู่ใน focused pool
  ✅ แสดง score ของ actual number (กี่ method เห็นพ้อง)
  ✅ ${score2up}/10 งวด: actual score ≥2/5 method — นี่คือ headline stat
  ⚠️  Efficiency vs random: ต้องรายงานตรง ๆ ตามข้อมูลจริง
`);
