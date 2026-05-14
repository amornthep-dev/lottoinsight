// backtest-v2.mjs — Quick verification of Enhanced Triple Score V2
// node scripts/backtest-v2.mjs
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
const __dirname = dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(readFileSync(join(__dirname, "../data/lottery.json"), "utf8"));

const mod  = (n, m) => ((Math.round(n) % m) + m) % m;
const pad2 = n => String(mod(n, 100)).padStart(2, "0");
const pad3 = n => String(mod(n, 1000)).padStart(3, "0");

function uniquePerms(s) {
  if (s.length <= 1) return [s];
  const res = new Set();
  for (let i = 0; i < s.length; i++) {
    const rest = s.slice(0, i) + s.slice(i + 1);
    for (const p of uniquePerms(rest)) res.add(s[i] + p);
  }
  return [...res];
}
function withPerms2(nums) {
  const s = new Set();
  nums.forEach(n => uniquePerms(String(n).padStart(2,"0")).forEach(p => s.add(p)));
  return [...s];
}

// ── Lo Shu V2 ─────────────────────────────────────────────────────
const LO_SHU = [[4,9,2],[3,5,7],[8,1,6]];
const dpos = {};
for (let r=0;r<3;r++) for (let c=0;c<3;c++) dpos[LO_SHU[r][c]] = [r,c];
function lsConn(d) {
  if (d===0) return [0,1,9];
  const pos = dpos[d]; if (!pos) return [d];
  const [row,col]=pos; const s=new Set();
  for (let c=0;c<3;c++) s.add(LO_SHU[row][c]);
  for (let r=0;r<3;r++) s.add(LO_SHU[r][col]);
  if (row===col) for (let i=0;i<3;i++) s.add(LO_SHU[i][i]);
  if (row+col===2) for (let i=0;i<3;i++) s.add(LO_SHU[i][2-i]);
  return [...s];
}
function loShu2(past) {
  const p=past[0].prize2back; const d1=+p[0],d2=+p[1];
  const n1=lsConn(d1),n2=lsConn(d2);
  const mp=[mod(15-d1,10),mod(15-d2,10)];
  const base=new Set();
  for (const a of n1) for (const b of n2) base.add(String(a)+String(b));
  for (const a of mp) for (const b of [...n1,...n2,...mp]) { base.add(String(a)+String(b)); base.add(String(b)+String(a)); }
  return withPerms2([...base]);
}

// ── Multi-RSI ─────────────────────────────────────────────────────
function rsi2(past) {
  const cnt=(draws,periods)=>{ const c=Array(10).fill(0); draws.slice(0,periods).forEach(d=>{c[+d.prize2back[0]]++;c[+d.prize2back[1]]++;}); return c; };
  const d5=cnt(past,5),d10=cnt(past,10),d20=cnt(past,20);
  const rsiD=(c,per)=>Math.min(100,Math.max(0,(c/(per*2/10))*50));
  const combined=Array(10).fill(0).map((_,i)=>rsiD(d5[i],5)*0.5+rsiD(d10[i],10)*0.3+rsiD(d20[i],20)*0.2);
  const sorted=[...combined.map((v,d)=>({d,v}))].sort((a,b)=>a.v-b.v);
  const ov=sorted.slice(0,3).map(x=>x.d);
  const nl=sorted.slice(3,5).map(x=>x.d);
  const base=new Set();
  for (const a of ov) for (const b of ov) base.add(String(a)+String(b));
  for (const a of ov) for (const b of nl) { base.add(String(a)+String(b)); base.add(String(b)+String(a)); }
  return withPerms2([...base]);
}

// ── Fibonacci Extended ────────────────────────────────────────────
const PHI=1.6180339887, PHI2=PHI*PHI, DELTA=2.4142135624;
function fib2(past) {
  const [a,b,c,d]=[0,1,2,3].map(i=>+(past[i]?.prize2back??0));
  const raw=[a+b,Math.abs(a-b),a*PHI,a*PHI2,a+b+c,a+b+c+d,a*DELTA,a/PHI,b*PHI,c*PHI].map(n=>pad2(n));
  return withPerms2(raw);
}

// ── Kaprekar Chain ────────────────────────────────────────────────
function kapStep2(n) {
  const s=String(n).padStart(2,"0").split("").map(Number).sort((a,b)=>b-a);
  return mod(parseInt(s.join(""))-parseInt([...s].reverse().join("")),100);
}
function kapChain2(seed,steps=6) {
  const ch=new Set([seed]); let cur=seed;
  for (let i=0;i<steps;i++) { cur=kapStep2(cur); ch.add(cur); if(cur===0) break; }
  return [...ch];
}
function kaprekar2(past) {
  const seeds=past.slice(0,4).map(d=>+d.prize2back);
  const chains=seeds.map(s=>kapChain2(s));
  const all=new Set();
  chains.forEach(ch=>ch.forEach(n=>withPerms2([pad2(n)]).forEach(p=>all.add(p))));
  for (let i=0;i<chains.length-1;i++)
    for (const a of chains[i]) for (const b of chains[i+1])
      withPerms2([pad2(a+b),pad2(Math.abs(a-b))]).forEach(p=>all.add(p));
  return [...all];
}

// ── Digit Transition Matrix ───────────────────────────────────────
function transition2(past) {
  const counts=Array.from({length:10},()=>Array(10).fill(0));
  const totals=Array(10).fill(0);
  for (let i=0;i<past.length-1;i++) {
    const cur=past[i].prize2back, next=past[i+1].prize2back;
    for (const cd of [+cur[0],+cur[1]]) {
      counts[cd][+next[0]]++; counts[cd][+next[1]]++; totals[cd]+=2;
    }
  }
  const mat=counts.map((row,d)=>row.map(c=>totals[d]>0?c/totals[d]:0.1));
  const curD=[+past[0].prize2back[0],+past[0].prize2back[1],+past[1].prize2back[0],+past[1].prize2back[1]];
  const w=[0.4,0.4,0.15,0.15];
  const votes=Array(10).fill(0);
  curD.forEach((cd,wi)=>mat[cd].forEach((p,nd)=>{votes[nd]+=p*w[wi];}));
  const nd=votes.map((v,d)=>({d,v})).sort((a,b)=>b.v-a.v).slice(0,4).map(x=>x.d);
  const base=new Set();
  for (const a of nd) for (const b of nd) base.add(String(a)+String(b));
  for (const cd of [+past[0].prize2back[0],+past[0].prize2back[1]])
    for (const n of nd) { base.add(String(cd)+String(n)); base.add(String(n)+String(cd)); }
  return withPerms2([...base]);
}

// ── Backtest ──────────────────────────────────────────────────────
function isPerm(actual, cands) { return uniquePerms(actual).some(p=>cands.includes(p)); }
const METHODS = ["loshu","rsi","fib","kaprekar","transition"];
const getFn = { loshu:loShu2, rsi:rsi2, fib:fib2, kaprekar:kaprekar2, transition:transition2 };

console.log("═".repeat(80));
console.log("  LottoInsight Triple Score V2 — BACKTEST (10 งวดล่าสุด)");
console.log("  5 Methods: Lo Shu V2 · Multi-RSI · Fibonacci Extended · Kaprekar · Transition");
console.log("═".repeat(80));

const results = [];
for (let i=1;i<=10;i++) {
  const draw=data[i]; if(!draw) break;
  const past=data.slice(i+1);
  if(past.length<5) break;

  const actual2=draw.prize2back;
  const cands={};
  for (const m of METHODS) cands[m]=getFn[m](past);

  // Triple Score: count methods per number
  const allNums=new Set(Object.values(cands).flat());
  const scored=[...allNums].map(num=>{
    const sc=METHODS.filter(m=>cands[m].includes(num)).length;
    return {num,sc};
  }).sort((a,b)=>b.sc-a.sc);

  const exact={}; const perm={};
  for (const m of METHODS) {
    exact[m]=cands[m].includes(actual2);
    perm[m]=isPerm(actual2,cands[m]);
  }
  const anyExact=METHODS.some(m=>exact[m]);
  const anyPerm=METHODS.some(m=>perm[m]);

  // Find actual2 in scored list
  const actualEntry=scored.find(s=>isPerm(actual2,[s.num]));
  const topPermScore=actualEntry?.sc??0;
  const poolSize=scored.length;

  results.push({draw,actual2,cands,exact,perm,anyExact,anyPerm,topPermScore,poolSize,scored});

  // Print draw result
  const methods=METHODS.map(m=>perm[m]?"✅":"❌").join(" ");
  const flag=anyPerm?"🎯":"  ";
  console.log(`\n${flag} ${draw.dateDisplay.padEnd(25)} | ออก: ${actual2} | pool: ${poolSize}`);
  console.log(`   LoShu:${exact.loshu?"✅":perm.loshu?"🔄":"❌"} RSI:${exact.rsi?"✅":perm.rsi?"🔄":"❌"} Fib:${exact.fib?"✅":perm.fib?"🔄":"❌"} Kap:${exact.kaprekar?"✅":perm.kaprekar?"🔄":"❌"} Trans:${exact.transition?"✅":perm.transition?"🔄":"❌"}`);
  console.log(`   ✅=exact  🔄=กลับ  | Triple Score ของ ${actual2}: ${topPermScore}/5`);
  console.log(`   Top 10 in pool: ${scored.slice(0,10).map(s=>`${s.num}(${s.sc})`).join(", ")}`);
}

// Summary
console.log("\n"+"═".repeat(80));
console.log("  สรุป 10 งวดล่าสุด");
console.log("═".repeat(80));
const total=results.length;

// Per method
for (const m of METHODS) {
  const ex=results.filter(r=>r.exact[m]).length;
  const pe=results.filter(r=>r.perm[m]).length;
  const avgPool=Math.round(results.reduce((s,r)=>s+r.cands[m].length,0)/total);
  const baseEx=avgPool/100*100;
  const xEx=(ex/total*100/baseEx).toFixed(2);
  const xPe=(pe/total*100/baseEx).toFixed(2);
  console.log(`  ${m.padEnd(12)} | exact: ${ex}/${total} (${(ex/total*100).toFixed(0)}%) | +กลับ: ${pe}/${total} (${(pe/total*100).toFixed(0)}%) | pool:~${avgPool} | ${xEx}x/${xPe}x vs random`);
}

const anyEx=results.filter(r=>r.anyExact).length;
const anyPe=results.filter(r=>r.anyPerm).length;
const s3pe=results.filter(r=>r.topPermScore>=3).length;
const s4pe=results.filter(r=>r.topPermScore>=4).length;
const s5pe=results.filter(r=>r.topPermScore>=5).length;
const avgPool=Math.round(results.reduce((s,r)=>s+r.poolSize,0)/total);

console.log(`\n  Combined (any method):`);
console.log(`    Exact:    ${anyEx}/${total} (${(anyEx/total*100).toFixed(0)}%)`);
console.log(`    +กลับ:   ${anyPe}/${total} (${(anyPe/total*100).toFixed(0)}%)`);
console.log(`\n  Triple Score hits (+กลับ):`);
console.log(`    Score ≥3: ${s3pe}/${total} (${(s3pe/total*100).toFixed(0)}%)`);
console.log(`    Score ≥4: ${s4pe}/${total} (${(s4pe/total*100).toFixed(0)}%)`);
console.log(`    Score =5: ${s5pe}/${total} (${(s5pe/total*100).toFixed(0)}%)`);
console.log(`\n  Pool size เฉลี่ย: ${avgPool} candidates`);
console.log(`  Random baseline: ${avgPool}% (ถ้าสุ่ม ${avgPool} เลขจาก 100)`);
console.log(`  Efficiency vs random: ${(anyPe/total*100/avgPool).toFixed(2)}x`);
console.log("═".repeat(80));
