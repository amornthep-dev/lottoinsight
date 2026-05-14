/**
 * LottoInsight — Enhanced Triple Score V2
 * ─────────────────────────────────────────
 * 5-Method Signature System (stable, auto-updates from lottery.json)
 *
 *  1. Lo Shu V2         — Grid position + Magic Sum Lines
 *  2. Multi-RSI         — RSI-5 + RSI-10 + RSI-20 weighted
 *  3. Fibonacci Extended — Fib + Lucas + Tribonacci + φ²
 *  4. Kaprekar Chain    — Iterative digit rearrangement (เลขวิเศษ)
 *  5. Digit Transition  — Markov chain: digit ไหนมักตามหลัง digit ไหน
 *
 * Design principle: pure functions, no side-effects, input = pastData only
 * → auto-updates every time lottery.json gets a new row
 */

import lotteryData from "@/data/lottery.json";
type DrawEntry = typeof lotteryData[0];

// ─── Helpers ──────────────────────────────────────────────────────
const mod  = (n: number, m: number) => ((Math.round(n) % m) + m) % m;
const pad2 = (n: number) => String(mod(n, 100)).padStart(2, "0");
const pad3 = (n: number) => String(mod(n, 1000)).padStart(3, "0");

function uniquePerms(s: string): string[] {
  if (s.length <= 1) return [s];
  const res = new Set<string>();
  for (let i = 0; i < s.length; i++) {
    const rest = s.slice(0, i) + s.slice(i + 1);
    for (const p of uniquePerms(rest)) res.add(s[i] + p);
  }
  return [...res];
}
function withPerms2(nums: string[]): string[] {
  const s = new Set<string>();
  nums.forEach(n => uniquePerms(n.padStart(2, "0")).forEach(p => s.add(p)));
  return [...s];
}
function withPerms3(nums: string[]): string[] {
  const s = new Set<string>();
  nums.forEach(n => uniquePerms(n.padStart(3, "0")).forEach(p => s.add(p)));
  return [...s];
}

// ═══════════════════════════════════════════════════════════════════
// METHOD 1 — LO SHU V2
// เพิ่ม: Magic Sum Pairs (คู่เลขที่รวมกันได้ 15 = เส้นมงคล)
// ═══════════════════════════════════════════════════════════════════
export const LO_SHU_GRID: number[][] = [
  [4, 9, 2],
  [3, 5, 7],
  [8, 1, 6],
];
const _dpos: Record<number, [number, number]> = {};
for (let r = 0; r < 3; r++)
  for (let c = 0; c < 3; c++)
    _dpos[LO_SHU_GRID[r][c]] = [r, c];

export function getLoShuPos(d: number) { return d === 0 ? null : (_dpos[d] ?? null); }

export function getLoShuConnected(d: number): number[] {
  if (d === 0) return [0, 1, 9];
  const pos = getLoShuPos(d); if (!pos) return [d];
  const [row, col] = pos;
  const s = new Set<number>();
  for (let c = 0; c < 3; c++) s.add(LO_SHU_GRID[row][c]);
  for (let r = 0; r < 3; r++) s.add(LO_SHU_GRID[r][col]);
  if (row === col) for (let i = 0; i < 3; i++) s.add(LO_SHU_GRID[i][i]);
  if (row + col === 2) for (let i = 0; i < 3; i++) s.add(LO_SHU_GRID[i][2 - i]);
  return [...s];
}

/** Magic Sum Pairs: digit + partner = 15 (constant ของ Lo Shu) */
function getMagicPartner(d: number): number {
  if (d === 0) return 6; // 9+6=15, 0 maps near 9
  return mod(15 - d, 10);
}

export interface LoShuResult {
  prevNum2: string; d1: number; d2: number;
  n1: number[]; n2: number[]; highlightNums: number[];
  magicPartners: number[];
  candidates2: string[]; candidates3: string[];
}
export function calcLoShu(pastData: DrawEntry[]): LoShuResult {
  const prev2  = pastData[0]?.prize2back ?? "00";
  const prev3a = pastData[0]?.prize3back[0] ?? "000";
  const prev3b = pastData[0]?.prize3back[1] ?? "000";
  const d1 = +prev2[0], d2 = +prev2[1];
  const n1 = getLoShuConnected(d1);
  const n2 = getLoShuConnected(d2);
  const mp = [...new Set([getMagicPartner(d1), getMagicPartner(d2)])];

  // 2-digit: n1×n2 cross + magic partner combos
  const base2 = new Set<string>();
  for (const a of n1) for (const b of n2) base2.add(String(a) + String(b));
  for (const a of mp) for (const b of [...n1, ...n2, ...mp]) {
    base2.add(String(a) + String(b));
    base2.add(String(b) + String(a));
  }
  const candidates2 = withPerms2([...base2]);

  // 3-digit: from prize3back digits
  const da = [...new Set([...prev3a].map(Number).flatMap(d => getLoShuConnected(d)))];
  const db = [...new Set([...prev3b].map(Number).flatMap(d => getLoShuConnected(d)))];
  const base3 = new Set<string>();
  for (const a of da.slice(0,4)) for (const b of da.slice(0,4)) for (const c of db.slice(0,3))
    base3.add(String(a)+String(b)+String(c));
  const candidates3 = withPerms3([...base3]).slice(0, 80);

  return {
    prevNum2: prev2, d1, d2, n1, n2,
    highlightNums: [...new Set([...n1, ...n2])],
    magicPartners: mp, candidates2, candidates3,
  };
}

// ═══════════════════════════════════════════════════════════════════
// METHOD 2 — MULTI-RSI (3 timeframes combined)
// RSI-5 (weight 0.5) + RSI-10 (weight 0.3) + RSI-20 (weight 0.2)
// ═══════════════════════════════════════════════════════════════════
export interface RSIDigitEntry {
  digit: number; count5: number; count10: number; count20: number;
  rsi5: number; rsi10: number; rsi20: number; rsiCombined: number;
  zone: "oversold" | "neutral" | "overbought";
}
export interface RSIResult {
  digits: RSIDigitEntry[];
  oversoldDigits: number[]; overboughtDigits: number[];
  candidates2: string[]; candidates3: string[];
}

function digitRSI(counts: number[], periods: number): number {
  const expected = (periods * 2) / 10;
  return Math.min(100, Math.max(0, (counts.reduce((a,b)=>a+b,0) / Math.max(expected,0.001)) * 50));
}

export function calcRSI(pastData: DrawEntry[]): RSIResult {
  const countDigits2 = (draws: DrawEntry[]) => {
    const c = Array(10).fill(0) as number[];
    draws.forEach(d => { c[+d.prize2back[0]]++; c[+d.prize2back[1]]++; });
    return c;
  };
  const d5  = countDigits2(pastData.slice(0, 5));
  const d10 = countDigits2(pastData.slice(0, 10));
  const d20 = countDigits2(pastData.slice(0, 20));

  const digits: RSIDigitEntry[] = Array.from({length:10}, (_, digit) => {
    const r5  = digitRSI([d5[digit]], 5);
    const r10 = digitRSI([d10[digit]], 10);
    const r20 = digitRSI([d20[digit]], 20);
    const rc  = r5*0.5 + r10*0.3 + r20*0.2;
    return {
      digit, count5:d5[digit], count10:d10[digit], count20:d20[digit],
      rsi5:+r5.toFixed(1), rsi10:+r10.toFixed(1), rsi20:+r20.toFixed(1),
      rsiCombined:+rc.toFixed(1),
      zone: rc < 30 ? "oversold" : rc > 70 ? "overbought" : "neutral",
    };
  });

  const sorted = [...digits].sort((a,b) => a.rsiCombined - b.rsiCombined);
  const oversoldDigits   = sorted.slice(0, 3).map(x => x.digit);
  const overboughtDigits = sorted.slice(-3).map(x => x.digit).reverse();

  const base2 = new Set<string>();
  for (const a of oversoldDigits) for (const b of oversoldDigits) base2.add(String(a)+String(b));
  // เพิ่ม: cross ระหว่าง oversold × neutral-low
  const neutralLow = sorted.slice(3,5).map(x=>x.digit);
  for (const a of oversoldDigits) for (const b of neutralLow) {
    base2.add(String(a)+String(b)); base2.add(String(b)+String(a));
  }
  const candidates2 = withPerms2([...base2]);

  // 3-digit RSI
  const c3 = Array(10).fill(0) as number[];
  pastData.slice(0,14).forEach(d => d.prize3back.forEach(n => n.split("").forEach(c => c3[+c]++)));
  const exp3 = 14*2*3/10;
  const ov3 = c3.map((c,d)=>({d, r:(c/Math.max(exp3,0.001))*50})).sort((a,b)=>a.r-b.r).slice(0,3).map(x=>x.d);
  const base3 = new Set<string>();
  for (const a of ov3) for (const b of ov3) for (const c of ov3) base3.add(String(a)+String(b)+String(c));
  const candidates3 = withPerms3([...base3]).slice(0, 80);

  return { digits, oversoldDigits, overboughtDigits, candidates2, candidates3 };
}

// ═══════════════════════════════════════════════════════════════════
// METHOD 3 — FIBONACCI EXTENDED
// Fibonacci + Lucas + Tribonacci + φ² + Silver Ratio
// ═══════════════════════════════════════════════════════════════════
const PHI   = 1.6180339887;   // Golden Ratio
const PHI2  = PHI * PHI;      // φ² ≈ 2.618
const DELTA = 2.4142135624;   // Silver Ratio (1+√2)

export interface FibResult {
  seeds2: number[]; fibNext: number; fibDiff: number;
  phiA: number; phi2A: number; lucasNext: number;
  triboNext: number; silverA: number; invPhiA: number;
  sequence: number[]; candidates2: string[]; candidates3: string[];
}
export function calcFibonacci(pastData: DrawEntry[]): FibResult {
  const a = +(pastData[0]?.prize2back ?? 0);
  const b = +(pastData[1]?.prize2back ?? 0);
  const c = +(pastData[2]?.prize2back ?? 0);
  const d = +(pastData[3]?.prize2back ?? 0);

  const fibNext   = mod(a + b, 100);
  const fibDiff   = mod(Math.abs(a - b), 100);
  const phiA      = mod(a * PHI, 100);
  const phi2A     = mod(a * PHI2, 100);
  const lucasNext = mod(a + b + c, 100);        // Lucas: sum of 3
  const triboNext = mod(a + b + c + d, 100);    // Tribonacci: sum of 4
  const silverA   = mod(a * DELTA, 100);         // Silver ratio
  const invPhiA   = mod(a / PHI, 100);

  const raw2 = [fibNext, fibDiff, phiA, phi2A, lucasNext, triboNext, silverA, invPhiA,
    mod(b * PHI, 100), mod(c * PHI, 100)].map(n => pad2(n));
  const candidates2 = withPerms2(raw2);

  // 3-digit Fibonacci
  const a3 = +(pastData[0]?.prize3back[0] ?? 0);
  const b3 = +(pastData[1]?.prize3back[0] ?? 0);
  const c3v = +(pastData[2]?.prize3back[0] ?? 0);
  const raw3 = [
    pad3(a3+b3), pad3(Math.abs(a3-b3)), pad3(a3*PHI),
    pad3(b3*PHI), pad3(a3/PHI), pad3(a3+b3+c3v),
    pad3(a3*PHI2), pad3(a3*DELTA),
  ];
  const candidates3 = withPerms3(raw3).slice(0, 80);

  return { seeds2:[d,c,b,a], fibNext, fibDiff, phiA, phi2A, lucasNext, triboNext, silverA, invPhiA,
    sequence:[c,b,a,fibNext], candidates2, candidates3 };
}

// ═══════════════════════════════════════════════════════════════════
// METHOD 4 — KAPREKAR CHAIN
// วนหาค่า Kaprekar iteratively — ทุก intermediate value = candidate
// 3-digit → converges to 495 | 2-digit → cyclic patterns
// ═══════════════════════════════════════════════════════════════════
function kaprekarStep2(n: number): number {
  const s = String(n).padStart(2, "0");
  const digits = s.split("").map(Number).sort((a,b)=>b-a);
  const big = parseInt(digits.join(""));
  const small = parseInt([...digits].reverse().join(""));
  return mod(big - small, 100);
}
function kaprekarChain2(seed: number, steps = 6): number[] {
  const chain = new Set<number>([seed]);
  let cur = seed;
  for (let i = 0; i < steps; i++) {
    cur = kaprekarStep2(cur);
    chain.add(cur);
    if (cur === 0) break;
  }
  return [...chain];
}

function kaprekarStep3(n: number): number {
  const s = String(n).padStart(3, "0");
  const digits = s.split("").map(Number).sort((a,b)=>b-a);
  const big = parseInt(digits.join(""));
  const small = parseInt([...digits].reverse().join(""));
  return mod(big - small, 1000);
}
function kaprekarChain3(seed: number, steps = 7): number[] {
  const chain = new Set<number>([seed]);
  let cur = seed;
  for (let i = 0; i < steps; i++) {
    cur = kaprekarStep3(cur);
    chain.add(cur);
    if (cur === 495) break; // 3-digit constant
  }
  return [...chain];
}

export interface KaprekarResult {
  seeds2: number[]; chains2: number[][];
  seeds3: number[]; chains3: number[][];
  candidates2: string[]; candidates3: string[];
}
export function calcKaprekar(pastData: DrawEntry[]): KaprekarResult {
  // ใช้ 4 งวดล่าสุดเป็น seeds
  const seeds2 = pastData.slice(0, 4).map(d => +d.prize2back);
  const chains2 = seeds2.map(s => kaprekarChain2(s));
  const all2 = new Set<string>();
  chains2.forEach(chain => chain.forEach(n => {
    const s = pad2(n);
    withPerms2([s]).forEach(p => all2.add(p));
  }));
  // เพิ่ม: cross-chain sum
  for (let i = 0; i < chains2.length - 1; i++) {
    for (const a of chains2[i]) {
      for (const b of chains2[i+1]) {
        withPerms2([pad2(a+b), pad2(Math.abs(a-b))]).forEach(p => all2.add(p));
      }
    }
  }

  const seeds3 = pastData.slice(0, 4).flatMap(d => d.prize3back.map(n => +n));
  const chains3 = seeds3.map(s => kaprekarChain3(s));
  const all3 = new Set<string>();
  chains3.forEach(chain => chain.forEach(n => {
    withPerms3([pad3(n)]).forEach(p => all3.add(p));
  }));

  return {
    seeds2, chains2, seeds3: seeds3.slice(0,4), chains3: chains3.slice(0,4),
    candidates2: [...all2],
    candidates3: [...all3].slice(0, 100),
  };
}

// ═══════════════════════════════════════════════════════════════════
// METHOD 5 — DIGIT TRANSITION MATRIX
// Markov Chain: P(digit_j at t+1 | digit_i at t) จากข้อมูลย้อนหลัง
// เลข digit ไหนมักตามหลัง digit ไหน — เรียนรู้จากข้อมูลจริง
// ═══════════════════════════════════════════════════════════════════
export interface TransitionResult {
  matrix: number[][];         // 10×10 transition probabilities
  nextDigits: number[];       // most likely next digits
  candidates2: string[];
  candidates3: string[];
}
export function calcTransition(pastData: DrawEntry[]): TransitionResult {
  // Build 10×10 count matrix from prize2back history
  const counts = Array.from({length:10}, () => Array(10).fill(0)) as number[][];
  const totals = Array(10).fill(0) as number[];

  for (let i = 0; i < pastData.length - 1; i++) {
    const cur  = pastData[i].prize2back;
    const next = pastData[i+1].prize2back;
    // digit d1 of draw[i] → both digits of draw[i+1]
    for (const cd of [+cur[0], +cur[1]]) {
      counts[cd][+next[0]]++;
      counts[cd][+next[1]]++;
      totals[cd] += 2;
    }
  }

  // Normalize to probabilities
  const matrix = counts.map((row, d) =>
    row.map(c => totals[d] > 0 ? c / totals[d] : 0.1)
  );

  // For current draw: use last 2 draws' digits to predict next
  const curDigits = [
    +pastData[0].prize2back[0], +pastData[0].prize2back[1],
    +pastData[1].prize2back[0], +pastData[1].prize2back[1],
  ];

  // Weighted vote for each next digit
  const votes = Array(10).fill(0) as number[];
  const weights = [0.4, 0.4, 0.15, 0.15]; // more weight to latest draw
  curDigits.forEach((cd, wi) => {
    matrix[cd].forEach((prob, nd) => { votes[nd] += prob * weights[wi]; });
  });

  // Top 4 most likely next digits
  const nextDigits = votes
    .map((v, d) => ({d, v}))
    .sort((a,b) => b.v - a.v)
    .slice(0, 4)
    .map(x => x.d);

  // 2-digit candidates
  const base2 = new Set<string>();
  for (const a of nextDigits) for (const b of nextDigits) base2.add(String(a)+String(b));
  // Include current × predicted
  for (const cd of [+pastData[0].prize2back[0], +pastData[0].prize2back[1]]) {
    for (const nd of nextDigits) {
      base2.add(String(cd)+String(nd));
      base2.add(String(nd)+String(cd));
    }
  }
  const candidates2 = withPerms2([...base2]);

  // 3-digit transition
  const counts3 = Array.from({length:10}, () => Array(10).fill(0)) as number[][];
  const totals3 = Array(10).fill(0) as number[];
  for (let i = 0; i < pastData.length - 1; i++) {
    for (const n of pastData[i].prize3back) {
      for (const cd of n.split("").map(Number)) {
        for (const nn of pastData[i+1].prize3back) {
          nn.split("").forEach(nd => { counts3[cd][+nd]++; totals3[cd]++; });
        }
      }
    }
  }
  const mat3 = counts3.map((row, d) => row.map(c => totals3[d] > 0 ? c/totals3[d] : 0.1));
  const votes3 = Array(10).fill(0) as number[];
  pastData[0].prize3back.forEach(n3 => {
    n3.split("").forEach(cd => mat3[+cd].forEach((p,nd) => { votes3[nd] += p; }));
  });
  const top3dig = votes3.map((v,d)=>({d,v})).sort((a,b)=>b.v-a.v).slice(0,3).map(x=>x.d);
  const base3 = new Set<string>();
  for (const a of top3dig) for (const b of top3dig) for (const c of top3dig)
    base3.add(String(a)+String(b)+String(c));
  const candidates3 = withPerms3([...base3]).slice(0, 100);

  return { matrix, nextDigits, candidates2, candidates3 };
}

// ═══════════════════════════════════════════════════════════════════
// COMBINED — TRIPLE SCORE V2 (5 Methods)
// ═══════════════════════════════════════════════════════════════════
export type MethodKey = "loshu" | "rsi" | "fib" | "kaprekar" | "transition";

export interface TripleEntry {
  num: string;
  score: number;        // 0–5
  methods: MethodKey[];
  inLoShu: boolean; inRSI: boolean; inFib: boolean;
  inKaprekar: boolean; inTransition: boolean;
}

export interface TripleScoreData {
  entries2: TripleEntry[];
  entries3: TripleEntry[];
  top2: TripleEntry[];   // score ≥ 3
  top3: TripleEntry[];
  loshu: LoShuResult;
  rsi: RSIResult;
  fib: FibResult;
  kaprekar: KaprekarResult;
  transition: TransitionResult;
  candidateCounts: { loshu:number; rsi:number; fib:number; kaprekar:number; transition:number };
}

export function calcTripleScore(pastData: DrawEntry[]): TripleScoreData {
  const loshu      = calcLoShu(pastData);
  const rsi        = calcRSI(pastData);
  const fib        = calcFibonacci(pastData);
  const kaprekar   = calcKaprekar(pastData);
  const transition = calcTransition(pastData);

  function buildEntries(c1:string[], c2:string[], c3:string[], c4:string[], c5:string[]): TripleEntry[] {
    const all = new Set([...c1,...c2,...c3,...c4,...c5]);
    return [...all].map(num => {
      const flags = {
        inLoShu:      c1.includes(num),
        inRSI:        c2.includes(num),
        inFib:        c3.includes(num),
        inKaprekar:   c4.includes(num),
        inTransition: c5.includes(num),
      };
      const methods: MethodKey[] = (Object.keys(flags) as (keyof typeof flags)[])
        .filter(k => flags[k])
        .map(k => k.replace("in","").toLowerCase() as MethodKey);
      return { num, score: methods.length, methods, ...flags };
    }).sort((a,b) => b.score - a.score || a.num.localeCompare(b.num));
  }

  const entries2 = buildEntries(
    loshu.candidates2, rsi.candidates2, fib.candidates2,
    kaprekar.candidates2, transition.candidates2,
  );
  const entries3 = buildEntries(
    loshu.candidates3, rsi.candidates3, fib.candidates3,
    kaprekar.candidates3, transition.candidates3,
  );

  return {
    entries2, entries3,
    top2: entries2.filter(e => e.score >= 3),
    top3: entries3.filter(e => e.score >= 3),
    loshu, rsi, fib, kaprekar, transition,
    candidateCounts: {
      loshu: loshu.candidates2.length, rsi: rsi.candidates2.length,
      fib: fib.candidates2.length, kaprekar: kaprekar.candidates2.length,
      transition: transition.candidates2.length,
    },
  };
}

// ═══════════════════════════════════════════════════════════════════
// BACKTEST ENGINE — stable, auto-updates with lottery.json
// สำหรับ draw index i (1..N): ใช้ slice(i+1) เป็น past, draw[i] เป็น actual
// ═══════════════════════════════════════════════════════════════════
export interface BacktestDraw {
  idx: number;
  date: string;
  actual2: string;
  actual3: string[];
  // per-method candidates
  cands: Record<MethodKey, string[]>;
  // exact hits (ตรงเป๊ะ)
  exactHit2: Record<MethodKey, boolean>;
  exactHit3: Record<MethodKey, boolean>;
  // permutation hits (รวมเลขกลับ)
  permHit2: Record<MethodKey, boolean>;
  permHit3: Record<MethodKey, boolean>;
  // combined Triple Score
  triple2: TripleEntry[];
  topScore2: number;     // highest score among candidates that exact-hit
  topPermScore2: number; // highest score among candidates that perm-hit
  // pool size
  poolSize2: number;
}

export interface BacktestSummary {
  draws: BacktestDraw[];
  total: number;
  byMethod: Record<MethodKey, { exact2:number; perm2:number; exact3:number; perm3:number }>;
  combined: {
    anyHit2:number; anyPermHit2:number;
    score3plus2:number; score3plusPermHit2:number;
    score4plus2:number; score4plusPermHit2:number;
  };
  bestMethod2: MethodKey;
  poolAvg2: number;
}

const METHODS: MethodKey[] = ["loshu","rsi","fib","kaprekar","transition"];

function getMethodCands(score: TripleScoreData, m: MethodKey): string[] {
  return {
    loshu: score.loshu.candidates2, rsi: score.rsi.candidates2,
    fib: score.fib.candidates2, kaprekar: score.kaprekar.candidates2,
    transition: score.transition.candidates2,
  }[m];
}
function getMethodCands3(score: TripleScoreData, m: MethodKey): string[] {
  return {
    loshu: score.loshu.candidates3, rsi: score.rsi.candidates3,
    fib: score.fib.candidates3, kaprekar: score.kaprekar.candidates3,
    transition: score.transition.candidates3,
  }[m];
}

function isPerm(actual: string, cands: string[]): boolean {
  const perms = uniquePerms(actual);
  return cands.some(c => perms.includes(c));
}

export function runBacktest(windowSize = 10): BacktestSummary {
  const draws: BacktestDraw[] = [];

  for (let i = 1; i <= windowSize; i++) {
    const draw = lotteryData[i]; if (!draw) break;
    const past = lotteryData.slice(i + 1) as DrawEntry[];
    if (past.length < 5) break;

    const score = calcTripleScore(past);
    const actual2 = draw.prize2back;
    const actual3 = draw.prize3back;

    const cands: Record<MethodKey, string[]> = {} as never;
    const exactHit2: Record<MethodKey, boolean> = {} as never;
    const exactHit3: Record<MethodKey, boolean> = {} as never;
    const permHit2:  Record<MethodKey, boolean> = {} as never;
    const permHit3:  Record<MethodKey, boolean> = {} as never;

    for (const m of METHODS) {
      const c2 = getMethodCands(score, m);
      const c3 = getMethodCands3(score, m);
      cands[m]     = c2;
      exactHit2[m] = c2.includes(actual2);
      exactHit3[m] = actual3.some(n => c3.includes(n));
      permHit2[m]  = isPerm(actual2, c2);
      permHit3[m]  = actual3.some(n => isPerm(n, c3));
    }

    const triple2 = score.entries2;
    const hitting = triple2.filter(e => isPerm(actual2, [e.num]));
    const topPermScore2 = hitting.length > 0 ? Math.max(...hitting.map(e=>e.score)) : 0;
    const exactHitting = triple2.filter(e => e.num === actual2);
    const topScore2 = exactHitting.length > 0 ? exactHitting[0].score : 0;

    draws.push({
      idx: i, date: draw.dateDisplay, actual2, actual3,
      cands, exactHit2, exactHit3, permHit2, permHit3,
      triple2, topScore2, topPermScore2,
      poolSize2: triple2.length,
    });
  }

  const total = draws.length;
  const byMethod = {} as Record<MethodKey, {exact2:number;perm2:number;exact3:number;perm3:number}>;
  for (const m of METHODS) {
    byMethod[m] = {
      exact2: draws.filter(d => d.exactHit2[m]).length,
      perm2:  draws.filter(d => d.permHit2[m]).length,
      exact3: draws.filter(d => d.exactHit3[m]).length,
      perm3:  draws.filter(d => d.permHit3[m]).length,
    };
  }

  const anyHit2        = draws.filter(d => METHODS.some(m=>d.exactHit2[m])).length;
  const anyPermHit2    = draws.filter(d => METHODS.some(m=>d.permHit2[m])).length;
  const score3plus2    = draws.filter(d => d.topScore2 >= 3).length;
  const score3plusPerm = draws.filter(d => d.topPermScore2 >= 3).length;
  const score4plus2    = draws.filter(d => d.topScore2 >= 4).length;
  const score4plusPerm = draws.filter(d => d.topPermScore2 >= 4).length;

  const bestMethod2 = METHODS.reduce((best, m) =>
    byMethod[m].perm2 > byMethod[best].perm2 ? m : best
  , METHODS[0]);

  const poolAvg2 = total > 0
    ? Math.round(draws.reduce((s,d) => s+d.poolSize2, 0) / total) : 0;

  return {
    draws, total, byMethod,
    combined: {
      anyHit2, anyPermHit2,
      score3plus2, score3plusPermHit2: score3plusPerm,
      score4plus2, score4plusPermHit2: score4plusPerm,
    },
    bestMethod2, poolAvg2,
  };
}

// ═══════════════════════════════════════════════════════════════════
// NARROW-POOL BACKTEST — matches backtest-v3.mjs logic exactly
// แต่ละ method: 8-12 core candidates (ไม่ expand permutation ก่อน)
// score → filter ≥2 → expand perm เฉพาะ top ones
// ═══════════════════════════════════════════════════════════════════

function narrowLoShuCore(pastData: DrawEntry[]): string[] {
  const p = pastData[0].prize2back;
  const d1 = +p[0], d2 = +p[1];
  function rowColOnly(d: number): number[] {
    if (d === 0) return [1, 9];
    const pos = getLoShuPos(d); if (!pos) return [d];
    const [row, col] = pos;
    const s = new Set<number>();
    for (let c = 0; c < 3; c++) s.add(LO_SHU_GRID[row][c]);
    for (let r = 0; r < 3; r++) s.add(LO_SHU_GRID[r][col]);
    return [...s];
  }
  const n1 = rowColOnly(d1).slice(0, 4);
  const n2 = rowColOnly(d2).slice(0, 4);
  const core = new Set<string>();
  for (const a of n1) for (const b of n2) core.add(String(a) + String(b));
  return [...core].slice(0, 12);
}

function narrowRSICore(pastData: DrawEntry[]): string[] {
  const cnt = (draws: DrawEntry[], per: number) => {
    const c = Array(10).fill(0) as number[];
    draws.slice(0, per).forEach(d => { c[+d.prize2back[0]]++; c[+d.prize2back[1]]++; });
    return c;
  };
  const d5 = cnt(pastData, 5), d10 = cnt(pastData, 10), d20 = cnt(pastData, 20);
  const rsiD = (c: number, per: number) => Math.min(100, Math.max(0, (c / (per * 2 / 10)) * 50));
  const combined = Array(10).fill(0).map((_, i) =>
    rsiD(d5[i], 5) * 0.5 + rsiD(d10[i], 10) * 0.3 + rsiD(d20[i], 20) * 0.2
  );
  const ov = [...combined.map((v, d) => ({ d, v }))].sort((a, b) => a.v - b.v).slice(0, 3).map(x => x.d);
  const core = new Set<string>();
  for (const a of ov) for (const b of ov) core.add(String(a) + String(b));
  return [...core];
}

function narrowFibCore(pastData: DrawEntry[]): string[] {
  const [a, b, c, d] = [0, 1, 2, 3].map(i => +(pastData[i]?.prize2back ?? 0));
  return [...new Set(
    [a + b, Math.abs(a - b), a * PHI, a * PHI2, a + b + c, a + b + c + d, a * DELTA, a / PHI]
      .map(n => pad2(n))
  )].slice(0, 8);
}

function narrowKaprekarCore(pastData: DrawEntry[]): string[] {
  const seeds = pastData.slice(0, 2).map(d => +d.prize2back);
  const core = new Set<string>();
  seeds.forEach(s => kaprekarChain2(s).forEach(n => core.add(pad2(n))));
  return [...core].slice(0, 10);
}

function narrowTransitionCore(pastData: DrawEntry[]): string[] {
  const counts = Array.from({ length: 10 }, () => Array(10).fill(0)) as number[][];
  const totals = Array(10).fill(0) as number[];
  for (let i = 0; i < pastData.length - 1; i++) {
    const cur = pastData[i].prize2back, next = pastData[i + 1].prize2back;
    for (const cd of [+cur[0], +cur[1]]) {
      counts[cd][+next[0]]++; counts[cd][+next[1]]++; totals[cd] += 2;
    }
  }
  const mat = counts.map((row, d) => row.map(c => totals[d] > 0 ? c / totals[d] : 0.1));
  const votes = Array(10).fill(0) as number[];
  [+pastData[0].prize2back[0], +pastData[0].prize2back[1]].forEach(cd =>
    mat[cd].forEach((p, nd) => { votes[nd] += p * 0.5; })
  );
  [+pastData[1].prize2back[0], +pastData[1].prize2back[1]].forEach(cd =>
    mat[cd].forEach((p, nd) => { votes[nd] += p * 0.5; })
  );
  const top = [...votes.map((v, d) => ({ d, v }))].sort((a, b) => b.v - a.v).slice(0, 3).map(x => x.d);
  const core = new Set<string>();
  for (const a of top) for (const b of top) core.add(String(a) + String(b));
  return [...core];
}

function permsOf(nums: string[]): string[] {
  const s = new Set<string>();
  nums.forEach(n => uniquePerms(n.padStart(2, "0")).forEach(p => s.add(p)));
  return [...s];
}

// ─── Types ────────────────────────────────────────────────────────
export interface NarrowMethodHit {
  core: string[];
  exactHit: boolean;
  permHit: boolean;
}
export interface NarrowScoredEntry {
  num: string;
  sc: number;
  inMethods: MethodKey[];
}
export interface NarrowBacktestDraw {
  idx: number;
  date: string;
  actual2: string;
  methods: Record<MethodKey, NarrowMethodHit>;
  scored: NarrowScoredEntry[];
  top: NarrowScoredEntry[];
  focusedPool: string[];
  focusedPerm: boolean;
  bestPermScore: number;
  corePoolSize: number;
  focusedPoolSize: number;
}
export interface NarrowBacktestSummary {
  draws: NarrowBacktestDraw[];
  total: number;
  byMethod: Record<MethodKey, { exact: number; perm: number; avgPool: number }>;
  focusedPerm: number;
  score2plus: number;
  score3plus: number;
  avgFocused: number;
  avgCore: number;
}

export function runNarrowBacktest(windowSize = 10): NarrowBacktestSummary {
  const narrowFns: Record<MethodKey, (p: DrawEntry[]) => string[]> = {
    loshu:      narrowLoShuCore,
    rsi:        narrowRSICore,
    fib:        narrowFibCore,
    kaprekar:   narrowKaprekarCore,
    transition: narrowTransitionCore,
  };

  const draws: NarrowBacktestDraw[] = [];

  // เริ่มที่ i=0 เพื่อรวมงวดล่าสุด (ผลออกแล้ว) ใน backtest ด้วย
  for (let i = 0; i < windowSize; i++) {
    const draw = lotteryData[i]; if (!draw) break;
    const past = lotteryData.slice(i + 1) as DrawEntry[];
    if (past.length < 5) break;

    const actual2 = draw.prize2back;
    const methods = {} as Record<MethodKey, NarrowMethodHit>;

    for (const m of METHODS) {
      const core = narrowFns[m](past);
      methods[m] = {
        core,
        exactHit: core.includes(actual2),
        permHit:  isPerm(actual2, core),
      };
    }

    const allCore = new Set<string>();
    for (const m of METHODS) methods[m].core.forEach(n => allCore.add(n));
    const scored: NarrowScoredEntry[] = [...allCore].map(num => {
      const inMethods = METHODS.filter(m => methods[m].core.includes(num));
      return { num, sc: inMethods.length, inMethods };
    }).sort((a, b) => b.sc - a.sc || a.num.localeCompare(b.num));

    const top = scored.filter(e => e.sc >= 2);
    const focusedPool = permsOf(top.map(e => e.num));
    const permsOfActual = uniquePerms(actual2);
    const bestPermEntry = scored
      .filter(e => permsOfActual.includes(e.num))
      .sort((a, b) => b.sc - a.sc)[0];

    draws.push({
      idx: i, date: draw.dateDisplay, actual2,
      methods, scored, top, focusedPool,
      focusedPerm: focusedPool.some(n => permsOfActual.includes(n)),
      bestPermScore: bestPermEntry?.sc ?? 0,
      corePoolSize: allCore.size,
      focusedPoolSize: focusedPool.length,
    });
  }

  const total = draws.length;
  const byMethod = {} as Record<MethodKey, { exact: number; perm: number; avgPool: number }>;
  for (const m of METHODS) {
    byMethod[m] = {
      exact:   draws.filter(d => d.methods[m].exactHit).length,
      perm:    draws.filter(d => d.methods[m].permHit).length,
      avgPool: total > 0
        ? Math.round(draws.reduce((s, d) => s + d.methods[m].core.length, 0) / total)
        : 0,
    };
  }

  return {
    draws, total, byMethod,
    focusedPerm: draws.filter(d => d.focusedPerm).length,
    score2plus:  draws.filter(d => d.bestPermScore >= 2).length,
    score3plus:  draws.filter(d => d.bestPermScore >= 3).length,
    avgFocused:  total > 0 ? Math.round(draws.reduce((s, d) => s + d.focusedPoolSize, 0) / total) : 0,
    avgCore:     total > 0 ? Math.round(draws.reduce((s, d) => s + d.corePoolSize, 0) / total) : 0,
  };
}
