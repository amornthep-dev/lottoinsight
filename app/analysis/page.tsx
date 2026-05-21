import { calcTripleScore, LO_SHU_GRID, getLoShuPos } from "@/lib/signature-methods";
import lotteryData from "@/data/lottery.json";
import Link from "next/link";
import { FlaskConical, TrendingUp, Waves, Trophy, Info, Link2, ArrowRight } from "lucide-react";

const past = lotteryData as typeof lotteryData;
const { entries2, entries3, top2, top3, loshu, rsi, fib, kaprekar, transition } = calcTripleScore(past);
const latest = lotteryData[0];

// คำนวณวันงวดถัดไป (server-side)
const THAI_MONTHS_S = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน",
  "กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
function getNextDrawStr(): string {
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth(), d = now.getDate();
  const next = d < 16 ? new Date(y, m, 16) : new Date(y, m + 1, 1);
  return `${next.getDate()} ${THAI_MONTHS_S[next.getMonth()]} ${next.getFullYear() + 543}`;
}
const nextDrawStr = getNextDrawStr();

// ─── Sub-components ───────────────────────────────────────────────

function SectionTitle({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="shrink-0 mt-0.5">{icon}</div>
      <div>
        <h2 className="text-base font-bold text-slate-200">{title}</h2>
        <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

function NumChip2({ entry }: { entry: typeof entries2[0] }) {
  const score = entry.score;
  const colors = [
    "border-[#2A2D3E] text-slate-600 bg-[#0F1117]",
    "border-blue-500/40 text-blue-400 bg-blue-500/5",
    "border-orange-400/40 text-orange-300 bg-orange-400/5",
    "border-yellow-400/60 text-yellow-300 bg-yellow-400/5",
    "border-[#C9A84C] text-[#C9A84C] bg-[#C9A84C]/10",
    "border-[#C9A84C] text-[#C9A84C] bg-[#C9A84C]/15",
  ];
  const badge = score >= 4 ? score : null;
  return (
    <span className={`relative inline-flex items-center justify-center font-mono font-bold text-sm px-2.5 py-1.5 rounded-lg border ${colors[Math.min(score, 5)]}`}>
      {entry.num}
      {badge && (
        <span className={`absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[#0F1117] text-[8px] font-black
          ${score === 5 ? "bg-[#C9A84C]" : "bg-yellow-400"}`}>{badge}</span>
      )}
      {score === 3 && (
        <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-orange-400 rounded-full flex items-center justify-center text-white text-[8px] font-black">3</span>
      )}
      {score === 2 && (
        <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-blue-400 rounded-full flex items-center justify-center text-white text-[8px] font-black">2</span>
      )}
    </span>
  );
}

// ─── LO SHU GRID VISUAL ──────────────────────────────────────────
function LoShuGridDisplay() {
  const { d1, d2, n1, n2, highlightNums, prevNum2, candidates2 } = loshu;

  return (
    <div className="bg-[#1A1D2E] border border-[#2A2D3E] rounded-2xl p-5 space-y-4">
      <SectionTitle
        icon={<FlaskConical size={18} className="text-red-400" />}
        title="🟥 Lo Shu Grid — ตารางมังกรจีน"
        sub={`seed: prize2back งวดล่าสุด = ${prevNum2} (digit ${d1} และ ${d2})`}
      />

      {/* 3×3 Grid */}
      <div className="flex justify-center">
        <div className="grid grid-cols-3 gap-1.5">
          {LO_SHU_GRID.flat().map((num) => {
            const inN1 = n1.includes(num);
            const inN2 = n2.includes(num);
            const both = inN1 && inN2;
            return (
              <div
                key={num}
                className={`w-14 h-14 flex flex-col items-center justify-center rounded-xl font-bold text-xl border transition-all
                  ${both
                    ? "bg-[#C9A84C]/20 border-[#C9A84C] text-[#C9A84C]"
                    : inN1
                      ? "bg-red-500/10 border-red-500/40 text-red-400"
                      : inN2
                        ? "bg-blue-500/10 border-blue-500/40 text-blue-400"
                        : "bg-[#0F1117] border-[#2A2D3E] text-slate-600"}`}
              >
                <span>{num}</span>
                {both && <span className="text-[8px] font-normal text-[#C9A84C]/70">d1+d2</span>}
                {inN1 && !both && <span className="text-[8px] font-normal text-red-400/70">d1</span>}
                {inN2 && !both && <span className="text-[8px] font-normal text-blue-400/70">d2</span>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-3 text-[10px] text-slate-500 justify-center flex-wrap">
        <span><span className="text-red-400">■</span> connected ถึง digit {d1}</span>
        <span><span className="text-blue-400">■</span> connected ถึง digit {d2}</span>
        <span><span className="text-[#C9A84C]">■</span> ทั้งคู่</span>
      </div>

      {/* Candidates */}
      <div>
        <p className="text-xs text-slate-500 mb-2">candidates (2 ตัว) รวม permutation:</p>
        <div className="flex flex-wrap gap-1.5">
          {candidates2.slice(0, 30).map(n => (
            <span key={n} className={`font-mono text-xs px-1.5 py-0.5 rounded border
              ${entries2.find(e=>e.num===n)?.score===5 ? "border-[#C9A84C] text-[#C9A84C] bg-[#C9A84C]/10 font-bold"
              : "border-[#2A2D3E] text-slate-500"}`}>{n}</span>
          ))}
          {candidates2.length > 30 && <span className="text-xs text-slate-600">+{candidates2.length - 30} เลข</span>}
        </div>
      </div>
    </div>
  );
}

// ─── RSI VISUAL ───────────────────────────────────────────────────
function RSIDisplay() {
  const { digits, oversoldDigits, overboughtDigits, candidates2 } = rsi;
  const periods = 20;
  return (
    <div className="bg-[#1A1D2E] border border-[#2A2D3E] rounded-2xl p-5 space-y-4">
      <SectionTitle
        icon={<TrendingUp size={18} className="text-emerald-400" />}
        title="📈 RSI Score — ดัชนีร้อน/เย็น"
        sub={`คำนวณจาก ${periods} งวดล่าสุด · RSI < 30 = เย็น (น่าจับตา) · RSI > 70 = ร้อนเกิน`}
      />

      {/* Digit bars */}
      <div className="space-y-1.5">
        {digits.map(({ digit, rsiCombined: r, count10: count, zone }) => {
          const isOversold = zone === "oversold";
          const isOver = zone === "overbought";
          const barColor = isOversold
            ? "bg-emerald-400"
            : isOver
              ? "bg-red-400"
              : "bg-slate-600";
          const barW = Math.round(r);
          return (
            <div key={digit} className="flex items-center gap-2">
              <span className={`w-5 text-xs font-bold font-mono text-right shrink-0
                ${isOversold ? "text-emerald-400" : isOver ? "text-red-400" : "text-slate-500"}`}>
                {digit}
              </span>
              <div className="flex-1 bg-[#0F1117] rounded-full h-4 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${barColor}`}
                  style={{ width: `${barW}%` }}
                />
              </div>
              <span className={`text-[10px] w-16 font-mono shrink-0
                ${isOversold ? "text-emerald-400" : isOver ? "text-red-400" : "text-slate-600"}`}>
                {r.toFixed(0)} {isOversold ? "❄️" : isOver ? "🔥" : ""}
              </span>
              <span className="text-[10px] text-slate-700 w-10">{count}ครั้ง</span>
            </div>
          );
        })}
      </div>

      <div className="flex gap-4 text-[10px] text-slate-500 flex-wrap">
        <span><span className="text-emerald-400">❄️ เย็น</span> = digit ที่ยัง "ค้าง" ไม่ออก → candidate</span>
        <span><span className="text-red-400">🔥 ร้อน</span> = ออกบ่อยเกินไป → พักก่อน</span>
      </div>

      <div>
        <p className="text-xs text-slate-500 mb-2">
          candidates จาก digit เย็น [{oversoldDigits.join(", ")}] รวม permutation:
        </p>
        <div className="flex flex-wrap gap-1.5">
          {candidates2.slice(0, 25).map(n => (
            <span key={n} className={`font-mono text-xs px-1.5 py-0.5 rounded border
              ${entries2.find(e=>e.num===n)?.score===5 ? "border-[#C9A84C] text-[#C9A84C] bg-[#C9A84C]/10 font-bold"
              : "border-[#2A2D3E] text-slate-500"}`}>{n}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── FIBONACCI VISUAL ────────────────────────────────────────────
function FibDisplay() {
  const { seeds2, fibNext, phiA, fibDiff, lucasNext, invPhiA, sequence, candidates2 } = fib;
  const phiB = Math.round(seeds2[1] * 1.6180339887) % 100;
  const PHI = 1.618;
  return (
    <div className="bg-[#1A1D2E] border border-[#2A2D3E] rounded-2xl p-5 space-y-4">
      <SectionTitle
        icon={<Waves size={18} className="text-purple-400" />}
        title="🌀 Fibonacci Flow — การไหลของตัวเลข"
        sub={`seed: prize2back 3 งวดล่าสุด = ${seeds2.join(" → ")}`}
      />

      {/* Sequence flow */}
      <div className="flex items-center gap-1 flex-wrap justify-center">
        {[seeds2[0], seeds2[1], seeds2[2]].map((n, i) => (
          <span key={i} className="flex items-center gap-1">
            <span className="font-mono font-bold text-xl px-3 py-1.5 bg-[#0F1117] border border-[#2A2D3E] rounded-xl text-slate-500">
              {String(n).padStart(2,"0")}
            </span>
            <span className="text-slate-700 text-xs">→</span>
          </span>
        ))}
        <span className="font-mono font-bold text-xl px-3 py-2 bg-[#C9A84C]/10 border-2 border-[#C9A84C] rounded-xl text-[#C9A84C]">
          {String(fibNext).padStart(2,"0")}
        </span>
      </div>

      {/* Formulas */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "F(n) = a+b", formula: `${seeds2[2]}+${seeds2[1]}`, result: String(fibNext).padStart(2,"0"), color: "text-[#C9A84C]" },
          { label: "|a-b|", formula: `|${seeds2[2]}-${seeds2[1]}|`, result: String(fibDiff).padStart(2,"0"), color: "text-purple-400" },
          { label: "a × φ (1.618)", formula: `${seeds2[2]}×${PHI}`, result: String(phiA).padStart(2,"0"), color: "text-blue-400" },
          { label: "b × φ", formula: `${seeds2[1]}×${PHI}`, result: String(phiB).padStart(2,"0"), color: "text-blue-400" },
          { label: "Lucas (a+b+c)", formula: `${seeds2[2]}+${seeds2[1]}+${seeds2[0]}`, result: String(lucasNext).padStart(2,"0"), color: "text-emerald-400" },
          { label: "a ÷ φ", formula: `${seeds2[2]}÷${PHI}`, result: String(invPhiA).padStart(2,"0"), color: "text-orange-400" },
        ].map(({ label, formula, result, color }) => (
          <div key={label} className="bg-[#0F1117] rounded-xl p-2.5 flex items-center justify-between gap-2">
            <div>
              <p className="text-[10px] text-slate-600">{label}</p>
              <p className="text-[10px] text-slate-700 font-mono">{formula} mod 100</p>
            </div>
            <span className={`font-mono font-bold text-lg ${color}`}>{result}</span>
          </div>
        ))}
      </div>

      <div>
        <p className="text-xs text-slate-500 mb-2">candidates รวม permutation:</p>
        <div className="flex flex-wrap gap-1.5">
          {candidates2.slice(0, 25).map(n => (
            <span key={n} className={`font-mono text-xs px-1.5 py-0.5 rounded border
              ${entries2.find(e=>e.num===n)?.score===5 ? "border-[#C9A84C] text-[#C9A84C] bg-[#C9A84C]/10 font-bold"
              : "border-[#2A2D3E] text-slate-500"}`}>{n}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── KAPREKAR CHAIN VISUAL ───────────────────────────────────────
function KaprekarDisplay() {
  const { seeds2, chains2, candidates2 } = kaprekar;
  const chainColors = ["text-pink-400", "text-violet-400", "text-cyan-400", "text-amber-400"];
  const chainBorders = ["border-pink-500/30", "border-violet-500/30", "border-cyan-500/30", "border-amber-500/30"];
  const chainBgs = ["bg-pink-500/5", "bg-violet-500/5", "bg-cyan-500/5", "bg-amber-500/5"];

  return (
    <div className="bg-[#1A1D2E] border border-[#2A2D3E] rounded-2xl p-5 space-y-4">
      <SectionTitle
        icon={<Link2 size={18} className="text-pink-400" />}
        title="🔗 Kaprekar Chain — ห่วงโซ่ตัวเลข"
        sub={`seed: prize2back 4 งวดล่าสุด = ${seeds2.join(", ")} · แต่ละ seed สร้าง chain เวียนซ้ำ`}
      />

      {/* Chain Visualization */}
      <div className="space-y-3">
        {chains2.map((chain, i) => (
          <div key={i} className={`rounded-xl border p-3 ${chainBorders[i]} ${chainBgs[i]}`}>
            <div className="flex items-center gap-1 flex-wrap">
              <span className={`text-[10px] font-bold ${chainColors[i]} mr-1`}>งวด-{i+1}:</span>
              {chain.map((n, j) => (
                <span key={j} className="flex items-center gap-0.5">
                  <span className={`font-mono font-bold text-sm px-2 py-0.5 rounded-lg
                    ${j === 0
                      ? `border-2 ${chainBorders[i]} ${chainColors[i]} bg-[#0F1117]`
                      : "border border-[#2A2D3E] text-slate-400 bg-[#0F1117]"}`}>
                    {String(n).padStart(2, "0")}
                  </span>
                  {j < chain.length - 1 && (
                    <ArrowRight size={10} className="text-slate-700 shrink-0" />
                  )}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="bg-[#0F1117] rounded-xl p-3">
        <p className="text-[10px] text-slate-500 leading-relaxed">
          💡 <span className="text-slate-400">Kaprekar operation:</span> เรียงหลักใหม่ (มาก→น้อย) − (น้อย→มาก) mod 100
          {" "}เช่น 47 → sort desc = 74, asc = 47 → 74−47 = 27 → 72−27 = 45 → ...
        </p>
      </div>

      <div>
        <p className="text-xs text-slate-500 mb-2">candidates รวมจากทุก chain + permutation:</p>
        <div className="flex flex-wrap gap-1.5">
          {candidates2.slice(0, 30).map(n => (
            <span key={n} className={`font-mono text-xs px-1.5 py-0.5 rounded border
              ${entries2.find(e=>e.num===n)?.score===5 ? "border-[#C9A84C] text-[#C9A84C] bg-[#C9A84C]/10 font-bold"
              : "border-[#2A2D3E] text-slate-500"}`}>{n}</span>
          ))}
          {candidates2.length > 30 && <span className="text-xs text-slate-600">+{candidates2.length - 30} เลข</span>}
        </div>
      </div>
    </div>
  );
}

// ─── DIGIT TRANSITION VISUAL ─────────────────────────────────────
function TransitionDisplay() {
  const { matrix, nextDigits, candidates2 } = transition;
  const curNum = latest.prize2back;
  const curD1 = +curNum[0];
  const curD2 = +curNum[1];

  // Build vote bars for all 10 digits
  const votes = Array(10).fill(0) as number[];
  const ws = [0.4, 0.4, 0.15, 0.15];
  const curDigits4 = [
    +lotteryData[0].prize2back[0], +lotteryData[0].prize2back[1],
    +lotteryData[1].prize2back[0], +lotteryData[1].prize2back[1],
  ];
  curDigits4.forEach((cd, wi) => {
    matrix[cd].forEach((prob, nd) => { votes[nd] += prob * ws[wi]; });
  });
  const maxVote = Math.max(...votes);

  return (
    <div className="bg-[#1A1D2E] border border-[#2A2D3E] rounded-2xl p-5 space-y-4">
      <SectionTitle
        icon={<ArrowRight size={18} className="text-teal-400" />}
        title="🔀 Digit Transition — ห่วงโซ่มาร์คอฟ"
        sub={`เรียนรู้จากข้อมูล ${lotteryData.length} งวด ว่า digit ไหนมักตามหลัง digit ไหน`}
      />

      {/* Current draw → predicted */}
      <div className="bg-[#0F1117] rounded-xl p-3">
        <p className="text-[10px] text-slate-500 mb-2">งวดล่าสุด: <span className="font-mono font-bold text-teal-400">{curNum}</span> (d1={curD1}, d2={curD2}) → วิเคราะห์ top digit:</p>
        <div className="flex gap-2 flex-wrap">
          {nextDigits.map((d, i) => (
            <div key={d} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border
              ${i === 0 ? "border-teal-400/60 bg-teal-400/10" : "border-[#2A2D3E] bg-[#0F1117]"}`}>
              <span className={`font-mono font-bold text-lg ${i === 0 ? "text-teal-400" : "text-slate-400"}`}>{d}</span>
              <span className="text-[10px] text-slate-600">#{i+1}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Vote bars for all 10 digits */}
      <div className="space-y-1">
        <p className="text-[10px] text-slate-600 mb-1.5">คะแนน (weighted vote) ของแต่ละ digit:</p>
        {votes.map((v, d) => {
          const isTop = nextDigits.includes(d);
          const pct = maxVote > 0 ? (v / maxVote) * 100 : 0;
          return (
            <div key={d} className="flex items-center gap-2">
              <span className={`w-5 text-xs font-bold font-mono text-right shrink-0 ${isTop ? "text-teal-400" : "text-slate-600"}`}>{d}</span>
              <div className="flex-1 bg-[#0F1117] rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full rounded-full ${isTop ? "bg-teal-400" : "bg-slate-700"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className={`text-[10px] font-mono w-10 text-right shrink-0 ${isTop ? "text-teal-400" : "text-slate-700"}`}>
                {(v * 100).toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>

      {/* How it works */}
      <div className="bg-[#0F1117] rounded-xl p-3">
        <p className="text-[10px] text-slate-500 leading-relaxed">
          💡 <span className="text-slate-400">Markov Chain:</span> สร้าง matrix 10×10 จากประวัติ P(digit_j ตามหลัง digit_i)
          {" "}→ weighted vote โดย 2 งวดล่าสุด weight = 40% ต่องวด
        </p>
      </div>

      <div>
        <p className="text-xs text-slate-500 mb-2">candidates จาก top digit ({nextDigits.join(", ")}) + permutation:</p>
        <div className="flex flex-wrap gap-1.5">
          {candidates2.slice(0, 25).map(n => (
            <span key={n} className={`font-mono text-xs px-1.5 py-0.5 rounded border
              ${entries2.find(e=>e.num===n)?.score===5 ? "border-[#C9A84C] text-[#C9A84C] bg-[#C9A84C]/10 font-bold"
              : "border-[#2A2D3E] text-slate-500"}`}>{n}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── TRIPLE SCORE BOARD (5 Methods) ───────────────────────────────
function TripleScoreBoard() {
  const score5 = entries2.filter(e => e.score === 5);
  const score4 = entries2.filter(e => e.score === 4);
  const score3 = entries2.filter(e => e.score === 3);
  const score2 = entries2.filter(e => e.score === 2);
  const score1 = entries2.filter(e => e.score === 1).slice(0, 15);

  function methodBadges(e: typeof entries2[0]) {
    return [
      e.inLoShu ? "Lo Shu" : null,
      e.inRSI ? "RSI" : null,
      e.inFib ? "Fib" : null,
      e.inKaprekar ? "Kaprekar" : null,
      e.inTransition ? "Transition" : null,
    ].filter(Boolean).join(" + ");
  }

  return (
    <div className="bg-[#1A1D2E] border border-[#C9A84C]/30 rounded-2xl p-5 space-y-5">
      <div className="flex items-start gap-3">
        <Trophy size={18} className="text-[#C9A84C] mt-0.5 shrink-0" />
        <div>
          <h2 className="text-base font-bold text-slate-200">🏆 Triple Score V2 — เลขที่ผ่านหลายมิติ</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            5/5 = ผ่านทุก method · ยิ่งสูง ยิ่งโดดเด่นเชิงสถิติ
          </p>
        </div>
      </div>

      {/* 5/5 */}
      {score5.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-[#C9A84C] bg-[#C9A84C]/10 border border-[#C9A84C]/30 px-2 py-0.5 rounded-full">
              🥇 5/5 method
            </span>
            <span className="text-[10px] text-slate-600">ผ่านทุก: Lo Shu + RSI + Fib + Kaprekar + Transition</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {score5.map(e => <NumChip2 key={e.num} entry={e} />)}
          </div>
        </div>
      )}

      {/* 4/5 */}
      {score4.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-yellow-300 bg-yellow-400/10 border border-yellow-400/30 px-2 py-0.5 rounded-full">
              🥈 4/5 method
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {score4.map(e => <NumChip2 key={e.num} entry={e} />)}
          </div>
        </div>
      )}

      {/* 3/5 */}
      {score3.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-orange-300 bg-orange-400/10 border border-orange-400/30 px-2 py-0.5 rounded-full">
              🥉 3/5 method
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {score3.map(e => <NumChip2 key={e.num} entry={e} />)}
          </div>
        </div>
      )}

      {/* 2/5 */}
      {score2.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-blue-400 bg-blue-400/10 border border-blue-400/30 px-2 py-0.5 rounded-full">
              2/5 method
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {score2.slice(0, 20).map(e => <NumChip2 key={e.num} entry={e} />)}
            {score2.length > 20 && <span className="text-xs text-slate-600">+{score2.length-20}</span>}
          </div>
        </div>
      )}

      {/* 1/5 */}
      {score1.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-slate-500 bg-slate-700/30 border border-slate-600/30 px-2 py-0.5 rounded-full">
              1/5 method (อ้างอิง)
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {score1.map(e => <NumChip2 key={e.num} entry={e} />)}
            {entries2.filter(e=>e.score===1).length > 15 &&
              <span className="text-xs text-slate-600">+{entries2.filter(e=>e.score===1).length-15} เลข</span>}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="bg-[#0F1117] rounded-xl p-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500">
        <span><span className="text-[#C9A84C] font-bold">■</span> 5/5 = ทุก method เห็นพ้อง</span>
        <span><span className="text-yellow-300 font-bold">■</span> 4/5 = เกือบครบ</span>
        <span><span className="text-orange-400 font-bold">■</span> 3/5 = ครึ่งทาง</span>
        <span><span className="text-blue-400 font-bold">■</span> 2/5 = อ้างอิง</span>
      </div>
    </div>
  );
}

// ─── 3-DIGIT TRIPLE SCORE ─────────────────────────────────────────
function TripleScore3Board() {
  const score5 = entries3.filter(e => e.score === 5);
  const score4 = entries3.filter(e => e.score === 4);
  const score3 = entries3.filter(e => e.score === 3);
  const score2 = entries3.filter(e => e.score === 2);
  return (
    <div className="bg-[#1A1D2E] border border-[#2A2D3E] rounded-2xl p-5 space-y-4">
      <div>
        <h2 className="text-sm font-bold text-slate-300">Triple Score V2 — เลขท้าย 3 ตัว</h2>
        <p className="text-xs text-slate-500 mt-0.5">รวม permutation ทุกแบบ (เลขกลับนับด้วย)</p>
      </div>

      {score5.length > 0 && (
        <div>
          <p className="text-xs text-[#C9A84C] font-bold mb-2">🥇 5/5 method</p>
          <div className="flex flex-wrap gap-2">
            {score5.map(e => (
              <span key={e.num} className="font-mono font-bold text-sm px-2.5 py-1.5 rounded-lg border-2 border-[#C9A84C] text-[#C9A84C] bg-[#C9A84C]/10">
                {e.num}
              </span>
            ))}
          </div>
        </div>
      )}

      {score4.length > 0 && (
        <div>
          <p className="text-xs text-yellow-300 font-bold mb-2">🥈 4/5 method</p>
          <div className="flex flex-wrap gap-1.5">
            {score4.slice(0, 30).map(e => (
              <span key={e.num} className="font-mono text-xs px-1.5 py-0.5 rounded border border-yellow-400/40 text-yellow-300">
                {e.num}
              </span>
            ))}
            {score4.length > 30 && <span className="text-xs text-slate-600">+{score4.length-30}</span>}
          </div>
        </div>
      )}

      {score3.length > 0 && (
        <div>
          <p className="text-xs text-orange-400 font-bold mb-2">🥉 3/5 method</p>
          <div className="flex flex-wrap gap-1.5">
            {score3.slice(0, 30).map(e => (
              <span key={e.num} className="font-mono text-xs px-1.5 py-0.5 rounded border border-orange-400/40 text-orange-300">
                {e.num}
              </span>
            ))}
            {score3.length > 30 && <span className="text-xs text-slate-600">+{score3.length-30}</span>}
          </div>
        </div>
      )}

      {score2.length > 0 && (
        <div>
          <p className="text-xs text-blue-400 font-bold mb-2">2/5 method</p>
          <div className="flex flex-wrap gap-1.5">
            {score2.slice(0, 20).map(e => (
              <span key={e.num} className="font-mono text-xs px-1.5 py-0.5 rounded border border-blue-400/30 text-blue-400">
                {e.num}
              </span>
            ))}
            {score2.length > 20 && <span className="text-xs text-slate-600">+{score2.length-20}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────
export default function AnalysisPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

      {/* Header */}
      <section>
        <div className="flex items-center gap-3 mb-1 flex-wrap">
          <span className="text-2xl">🔱</span>
          <h1 className="text-2xl font-bold text-slate-200">Triple Score V2 Analysis</h1>
          <span className="inline-flex items-center gap-1.5 bg-[#1A1D2E] border border-[#C9A84C]/40 text-[#C9A84C] text-xs font-bold px-3 py-1 rounded-full">
            🇹🇭 หวยไทย · เลข 2 ตัว
          </span>
        </div>
        <p className="text-slate-500 text-sm">
          วิเคราะห์ 5 มิติพร้อมกัน — เลขที่ผ่านทุก method คือเลขที่โดดเด่นเชิงสถิติที่สุด
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 mt-3 scrollbar-none">
          {[
            { icon: "🟥", label: "Lo Shu Grid",    sub: "ตำแหน่งในตารางมังกรจีน",  color: "border-red-500/30 text-red-400"       },
            { icon: "📈", label: "RSI Score",       sub: "ดัชนีร้อน-เย็นแบบ stock", color: "border-emerald-500/30 text-emerald-400"},
            { icon: "🌀", label: "Fibonacci Flow",  sub: "การไหลด้วย φ = 1.618",    color: "border-purple-500/30 text-purple-400" },
            { icon: "🔗", label: "Kaprekar Chain",  sub: "ห่วงโซ่ตัวเลขแบบซ้ำ",    color: "border-pink-500/30 text-pink-400"     },
            { icon: "🔀", label: "Digit Transition",sub: "Markov Chain จากข้อมูลจริง",color: "border-teal-500/30 text-teal-400"   },
          ].map(({ icon, label, sub, color }) => (
            <div key={label} className={`shrink-0 bg-[#1A1D2E] border ${color} rounded-xl px-4 py-2`}>
              <p className="text-sm font-bold text-slate-300 whitespace-nowrap">{icon} {label}</p>
              <p className="text-[10px] text-slate-600 whitespace-nowrap">{sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Jump Nav */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
        {[
          { href: "#loshu",      label: "🟥 Lo Shu"    },
          { href: "#rsi",        label: "📈 RSI"        },
          { href: "#fibonacci",  label: "🌀 Fibonacci"  },
          { href: "#kaprekar",   label: "🔗 Kaprekar"   },
          { href: "#transition", label: "🔀 Transition" },
          { href: "#triple",     label: "🏆 Triple Score" },
        ].map(({ href, label }) => (
          <a key={href} href={href}
            className="shrink-0 whitespace-nowrap text-xs px-3 py-1.5 rounded-full bg-[#1A1D2E] border border-[#2A2D3E] text-slate-400 hover:border-[#C9A84C]/40 hover:text-slate-200 transition-colors">
            {label}
          </a>
        ))}
      </div>

      {/* Context Banner — งวดที่กำลังคำนวณ */}
      <div className="rounded-2xl overflow-hidden border border-[#C9A84C]/30">
        {/* บน: งวดเป้าหมาย */}
        <div className="bg-[#C9A84C]/10 px-5 py-3 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[#C9A84C] text-lg">🎯</span>
            <div>
              <p className="text-[10px] text-[#C9A84C]/70 uppercase tracking-wider font-semibold">กำลังคำนวณสำหรับงวด</p>
              <p className="text-lg font-bold text-[#C9A84C]">{nextDrawStr}</p>
            </div>
          </div>
          <span className="text-[10px] text-[#C9A84C]/60 bg-[#C9A84C]/10 px-2 py-1 rounded-full">
            อัปเดตอัตโนมัติทุกงวด
          </span>
        </div>
        {/* ล่าง: ข้อมูล seed */}
        <div className="bg-[#0F1117] px-5 py-2.5 flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-1.5">
            <Info size={11} className="text-slate-600" />
            <p className="text-[10px] text-slate-500">ใช้ข้อมูลล่าสุด:</p>
            <p className="text-[10px] font-semibold text-slate-400">{latest.dateDisplay}</p>
          </div>
          <div className="flex gap-3">
            <span className="text-[10px] text-slate-500">ท้าย 2: <span className="font-mono font-bold text-purple-400">{latest.prize2back}</span></span>
            <span className="text-[10px] text-slate-500">ท้าย 3: <span className="font-mono font-bold text-blue-400">{latest.prize3back.join(" / ")}</span></span>
          </div>
        </div>
      </div>

      {/* 5 Method Cards — 2 columns on large screens */}
      <div className="grid lg:grid-cols-2 gap-5">
        <div id="loshu"><LoShuGridDisplay /></div>
        <div id="rsi"><RSIDisplay /></div>
        <div id="fibonacci"><FibDisplay /></div>
        <div id="kaprekar"><KaprekarDisplay /></div>
        <div id="transition" className="lg:col-span-2"><TransitionDisplay /></div>
      </div>

      {/* Triple Score — 2 ตัว */}
      <div id="triple"><TripleScoreBoard /></div>

      {/* Triple Score — 3 ตัว */}
      <TripleScore3Board />

      {/* Disclaimer */}
      <div className="bg-[#1A1D2E] border border-yellow-500/20 rounded-xl p-4">
        <p className="text-xs text-slate-400 leading-relaxed">
          ⚠️ <span className="text-yellow-400 font-semibold">หมายเหตุสำคัญ:</span>{" "}
          Triple Score V2 คือการวิเคราะห์สถิติเชิงคณิตศาสตร์ 5 มิติ{" "}
          <span className="text-slate-300">ไม่ใช่การทำนายผล</span>{" "}
          หวยรัฐบาลไทยออกแบบมาเพื่อความสุ่มจริง ๆ — ไม่มีระบบใดการันตีได้ 100%
          ใช้เป็นข้อมูลประกอบการตัดสินใจเท่านั้น
        </p>
      </div>

      {/* Story Board CTA */}
      <div className="flex justify-center">
        <Link href="/leaderboard"
          className="text-sm text-slate-500 hover:text-[#C9A84C] transition-colors underline">
          ดู Story Board — Triple Score V2 vs ผลจริง 10 งวดล่าสุด →
        </Link>
      </div>

    </div>
  );
}
