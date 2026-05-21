"use client";
import { useState, useMemo, useEffect } from "react";
import { Search, TrendingUp, TrendingDown, Minus, BarChart2, Calendar, AlertTriangle, Flame, Snowflake, FlaskConical } from "lucide-react";
import lotteryData from "@/data/lottery.json";
import { calcTripleScore } from "@/lib/signature-methods";
import Link from "next/link";

// ─── Pre-compute Triple Score (static, for next draw) ─────────────
const tripleScore = calcTripleScore(lotteryData as typeof lotteryData);

// ─── Pre-compute hot/cold numbers for landing state ───────────────
function getHotCold(digits: 2 | 3) {
  const all = digits === 2
    ? lotteryData.map(d => d.prize2back)
    : lotteryData.flatMap(d => d.prize3back);
  const recent = all.slice(0, 12);
  const unique = [...new Set(all)];

  const stats = unique.map(n => ({
    n,
    freq: all.filter(x => x === n).length,
    recent: recent.filter(x => x === n).length,
    gap: all.indexOf(n) === -1 ? all.length : all.indexOf(n),
  }));

  const hot = [...stats].sort((a, b) => b.recent - a.recent || b.freq - a.freq).slice(0, 8);
  const cold = [...stats].filter(s => s.gap > 0).sort((a, b) => b.gap - a.gap).slice(0, 8);
  return { hot, cold };
}

// ─── Analyze number ───────────────────────────────────────────────
function analyzeNumber(num: string, digits: 2 | 3) {
  const all = digits === 2
    ? lotteryData.map(d => d.prize2back)
    : lotteryData.flatMap(d => d.prize3back);
  const total = all.length;

  const freq = all.filter(n => n === num).length;
  const rank = [...new Set(all)]
    .map(n => ({ n, c: all.filter(x => x === n).length }))
    .sort((a, b) => b.c - a.c)
    .findIndex(x => x.n === num) + 1;
  const totalUnique = new Set(all).size;

  const appearedDates: string[] = digits === 2
    ? lotteryData.filter(d => d.prize2back === num).map(d => d.dateDisplay)
    : lotteryData.filter(d => d.prize3back.includes(num)).map(d => d.dateDisplay);

  const lastIdx = all.indexOf(num);
  const gap = lastIdx === -1 ? total : lastIdx;

  const weights = [1.0, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.35, 0.3, 0.25, 0.2, 0.15];
  let recency = 0;
  all.forEach((n, i) => { if (n === num) recency += (i < weights.length ? weights[i] : 0.1); });

  const digitSum = num.split("").reduce((a, b) => a + +b, 0);

  const draws1 = lotteryData.filter(d => d.date.endsWith("-01"));
  const draws16 = lotteryData.filter(d => d.date.endsWith("-16"));
  const in1 = digits === 2
    ? draws1.filter(d => d.prize2back === num).length
    : draws1.filter(d => d.prize3back.includes(num)).length;
  const in16 = digits === 2
    ? draws16.filter(d => d.prize2back === num).length
    : draws16.filter(d => d.prize3back.includes(num)).length;

  const r12 = all.slice(0, 12).filter(n => n === num).length;
  const r12to24 = all.slice(12, 24).filter(n => n === num).length;
  const trend = r12 > r12to24 ? "up" : r12 < r12to24 ? "down" : "flat";

  // timeline: lotteryData ordered newest→oldest, mark hits
  const timeline = digits === 2
    ? lotteryData.map(d => d.prize2back === num)
    : lotteryData.map(d => d.prize3back.includes(num));

  const score = Math.min(100, Math.round(
    (freq / Math.max(...[...new Set(all)].map(n => all.filter(x => x === n).length))) * 30 +
    (recency / 5) * 25 +
    (gap > 8 ? 20 : gap > 4 ? 10 : 5) +
    r12 * 5 +
    (trend === "up" ? 10 : 0) +
    (rank <= 5 ? 10 : rank <= 10 ? 5 : 0)
  ));

  // Triple Score check (2-digit only for now)
  const tripleCheck = digits === 2 ? {
    loshu:      tripleScore.loshu.candidates2.includes(num),
    rsi:        tripleScore.rsi.candidates2.includes(num),
    fib:        tripleScore.fib.candidates2.includes(num),
    kaprekar:   tripleScore.kaprekar.candidates2.includes(num),
    transition: tripleScore.transition.candidates2.includes(num),
  } : null;
  const tripleCount = tripleCheck ? Object.values(tripleCheck).filter(Boolean).length : 0;

  return {
    freq, rank, totalUnique, total, gap, recency, digitSum,
    in1, in16, r12, trend, score, neverAppeared: freq === 0,
    appearedDates, timeline, tripleCheck, tripleCount,
  };
}

// ─── Verdict ──────────────────────────────────────────────────────
type VerdictKey = "strong" | "moderate" | "weak" | "never";

function getVerdictKey(r: ReturnType<typeof analyzeNumber>): VerdictKey {
  if (r.neverAppeared) return "never";
  if (r.score >= 65 && (r.tripleCount >= 2 || r.r12 >= 2)) return "strong";
  if (r.score >= 40) return "moderate";
  return "weak";
}

const VERDICT_CONFIG: Record<VerdictKey, {
  icon: string; label: string; sublabel: string;
  border: string; bg: string; color: string;
}> = {
  strong:   { icon: "🟢", label: "สัญญาณดี — น่าพิจารณา",    sublabel: "เลขนี้ผ่านหลาย signal ทางสถิติ",     border: "border-emerald-500/40", bg: "bg-emerald-500/5",  color: "text-emerald-400" },
  moderate: { icon: "🟡", label: "สัญญาณปานกลาง",             sublabel: "มีสถิติบ้าง แต่ไม่โดดเด่นมาก",      border: "border-yellow-500/30",  bg: "bg-yellow-500/5",   color: "text-yellow-400"  },
  weak:     { icon: "🔴", label: "สัญญาณต่ำ",                 sublabel: "สถิติย้อนหลังไม่สนับสนุนเลขนี้",    border: "border-red-500/30",     bg: "bg-red-500/5",      color: "text-red-400"     },
  never:    { icon: "⚠️", label: "ไม่มีข้อมูลในฐานข้อมูล",   sublabel: "ไม่เคยออกเลยใน 100 งวดที่วิเคราะห์", border: "border-yellow-600/30",  bg: "bg-yellow-500/5",   color: "text-yellow-400"  },
};

function buildReasons(r: ReturnType<typeof analyzeNumber>, digits: 2 | 3): Array<{ ok: boolean; text: string }> {
  const reasons: Array<{ ok: boolean; text: string }> = [];
  if (!r.neverAppeared) {
    reasons.push({ ok: r.freq >= 3,   text: `ออก ${r.freq} ครั้ง / 100 งวด (อันดับ #${r.rank})` });
    reasons.push({ ok: r.r12 >= 2,    text: `12 งวดล่าสุด: ออก ${r.r12} ครั้ง` });
    reasons.push({ ok: r.gap >= 8,    text: `ค้างงวด: ${r.gap >= r.total ? "∞" : r.gap} งวด${r.gap >= 8 ? " (นานมาก)" : ""}` });
    reasons.push({ ok: r.trend === "up", text: `แนวโน้ม${r.trend === "up" ? "กำลังขึ้น ↑" : r.trend === "down" ? "กำลังลง ↓" : "ทรงตัว →"}` });
  }
  if (digits === 2) {
    reasons.push({ ok: r.tripleCount >= 2, text: `Triple Score: อยู่ใน ${r.tripleCount}/5 method` });
  }
  return reasons;
}

function VerdictCard({ r, digits }: { r: ReturnType<typeof analyzeNumber>; digits: 2 | 3 }) {
  const key = getVerdictKey(r);
  const cfg = VERDICT_CONFIG[key];
  const reasons = buildReasons(r, digits);
  return (
    <div className={`border ${cfg.border} ${cfg.bg} rounded-2xl p-4 space-y-3`}>
      <div className="flex items-center gap-3">
        <span className="text-2xl leading-none">{cfg.icon}</span>
        <div>
          <p className={`text-base font-bold ${cfg.color}`}>{cfg.label}</p>
          <p className="text-xs text-slate-500">{cfg.sublabel}</p>
        </div>
      </div>
      {reasons.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {reasons.map((reason, i) => (
            <span key={i} className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium ${
              reason.ok
                ? `${cfg.color} border-current/30 bg-current/5`
                : "text-slate-600 border-[#3D2060] bg-[#120820]"
            }`}>
              {reason.ok ? "✓" : "·"} {reason.text}
            </span>
          ))}
        </div>
      )}
      <p className="text-[10px] text-slate-700">
        ⚠️ Verdict นี้คำนวณจากสถิติย้อนหลัง — ไม่ใช่การทำนายผล
      </p>
    </div>
  );
}

// ─── Alternatives ─────────────────────────────────────────────────
function AlternativesCard({
  current, digits, setInput,
}: { current: string; digits: 2 | 3; setInput: (v: string) => void }) {
  // Only meaningful for 2-digit (Triple Score covers 2-digit well)
  if (digits !== 2) return null;

  const alts = tripleScore.top2
    .filter(e => e.num !== current && e.score >= 2)
    .slice(0, 5);

  if (alts.length === 0) return null;

  return (
    <div className="bg-[#1E1040] border border-[#A855F7]/20 rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm">💡</span>
        <p className="text-sm font-semibold text-slate-300">เลขที่สัญญาณดีกว่า — งวดนี้</p>
        <span className="text-[10px] text-slate-600 ml-auto">จาก Triple Score</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {alts.map(a => (
          <button
            key={a.num}
            onClick={() => setInput(a.num)}
            className="flex flex-col items-center bg-[#120820] border border-[#A855F7]/25 hover:border-[#A855F7]/70 hover:bg-[#A855F7]/5 rounded-xl px-3 py-2 transition-all">
            <span className="font-mono font-bold text-lg text-[#A855F7]">{a.num}</span>
            <span className="text-[9px] text-[#A855F7]/60">{a.score}/5 method</span>
          </button>
        ))}
      </div>
      <p className="text-[10px] text-slate-700">แตะเพื่อเช็คสถิติเลขนั้น</p>
    </div>
  );
}

// ─── Components ───────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const color = score >= 70 ? "#34d399" : score >= 40 ? "#A855F7" : "#f87171";
  const label = score >= 70 ? "สถิติดี" : score >= 40 ? "ปานกลาง" : "สถิติต่ำ";
  const r = 28, circ = 2 * Math.PI * r;
  const progress = (score / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} fill="none" stroke="#1E1040" strokeWidth="6" />
        <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={`${progress} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 36 36)"
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
        <text x="36" y="40" textAnchor="middle" fill={color} fontSize="16" fontWeight="bold">{score}</text>
      </svg>
      <span className="text-[10px] font-semibold" style={{ color }}>{label}</span>
    </div>
  );
}

function Timeline({ timeline, dates }: { timeline: boolean[]; dates: typeof lotteryData }) {
  return (
    <div>
      <p className="text-xs text-slate-500 mb-2">Timeline — 100 งวดล่าสุด (ซ้าย = ใหม่, ขวา = เก่า)</p>
      <div className="flex flex-wrap gap-[3px]">
        {timeline.map((hit, i) => (
          <div
            key={i}
            title={`${dates[i]?.dateDisplay ?? ""}`}
            className={`w-[18px] h-[18px] rounded-sm transition-colors ${
              hit
                ? "bg-[#A855F7] border border-[#A855F7]"
                : i === 0
                ? "bg-blue-500/20 border border-blue-500/30"
                : "bg-[#120820] border border-[#3D2060]"
            }`}
          />
        ))}
      </div>
      <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-600">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-[#A855F7] inline-block" /> ออก</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-[#120820] border border-[#3D2060] inline-block" /> ไม่ออก</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-blue-500/20 border border-blue-500/30 inline-block" /> งวดล่าสุด</span>
      </div>
    </div>
  );
}

const METHOD_LABELS: Record<string, { label: string; color: string }> = {
  loshu:      { label: "Lo Shu",      color: "text-emerald-400" },
  rsi:        { label: "RSI",         color: "text-blue-400"    },
  fib:        { label: "Fibonacci",   color: "text-yellow-400"  },
  kaprekar:   { label: "Kaprekar",    color: "text-orange-400"  },
  transition: { label: "Transition",  color: "text-purple-400"  },
};

// ─── Landing content (no search yet) ──────────────────────────────
function LandingContent({ digits }: { digits: 2 | 3 }) {
  const { hot, cold } = useMemo(() => getHotCold(digits), [digits]);

  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-2 gap-4">
        {/* Hot */}
        <div className="bg-[#1E1040] border border-[#3D2060] rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Flame size={14} className="text-red-400" />
            <p className="text-sm font-semibold text-slate-300">🔥 เลขร้อน — ออกบ่อยใน 12 งวดล่าสุด</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {hot.map(s => (
              <div key={s.n} className="flex flex-col items-center bg-[#120820] border border-[#3D2060] rounded-xl px-2.5 py-1.5">
                <span className="font-mono font-bold text-base text-red-400">{s.n}</span>
                <span className="text-[9px] text-slate-600">{s.recent}x</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cold */}
        <div className="bg-[#1E1040] border border-[#3D2060] rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Snowflake size={14} className="text-blue-400" />
            <p className="text-sm font-semibold text-slate-300">❄️ เลขค้าง — ไม่ออกมานานที่สุด</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {cold.map(s => (
              <div key={s.n} className="flex flex-col items-center bg-[#120820] border border-[#3D2060] rounded-xl px-2.5 py-1.5">
                <span className="font-mono font-bold text-base text-blue-400">{s.n}</span>
                <span className="text-[9px] text-slate-600">ค้าง {s.gap}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Triple Score top (2-digit only) */}
      {digits === 2 && tripleScore.top2.length > 0 && (
        <div className="bg-[#1E1040] border border-[#A855F7]/20 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FlaskConical size={14} className="text-[#A855F7]" />
              <p className="text-sm font-semibold text-slate-300">🔱 Triple Score — เลขโดดเด่นงวดนี้</p>
            </div>
            <Link href="/analysis" className="text-[10px] text-[#A855F7] hover:underline">ดูทั้งหมด →</Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {tripleScore.top2.slice(0, 10).map(e => (
              <div key={e.num} className="flex flex-col items-center bg-[#A855F7]/10 border border-[#A855F7]/30 rounded-xl px-3 py-2">
                <span className="font-mono font-bold text-lg text-[#A855F7]">{e.num}</span>
                <span className="text-[10px] text-[#A855F7]/60">{e.score}/5 method</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-700">* คำนวณจาก 5 method ทางคณิตศาสตร์ — ไม่ใช่การทำนาย</p>
        </div>
      )}

      <p className="text-xs text-slate-700 text-center pt-2">
        พิมพ์เลขด้านบนเพื่อดูสถิติแบบละเอียด
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────
export default function CheckerPage() {
  const [input, setInput] = useState("");
  const [digits, setDigits] = useState<2 | 3>(2);
  const [isNextDraw1, setIsNextDraw1] = useState(false);

  useEffect(() => {
    setIsNextDraw1(new Date().getDate() >= 16);
  }, []);

  const result = useMemo(() => {
    const num = input.trim().padStart(digits, "0");
    if (num.length !== digits || !/^\d+$/.test(num) || input.trim().length === 0) return null;
    return { num, data: analyzeNumber(num, digits) };
  }, [input, digits]);

  const r = result?.data ?? null;
  const checked = result?.num ?? "";

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

      {/* Header */}
      <section>
        <h1 className="text-2xl font-bold text-slate-200 flex items-center gap-2">
          <Search size={22} className="text-[#A855F7]" /> เช็คเลข
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          วิเคราะห์สถิติย้อนหลัง 100 งวด — พิมพ์เลขแล้วผลขึ้นทันที
        </p>
      </section>

      {/* Input */}
      <div className="bg-[#1E1040] border border-[#3D2060] rounded-2xl p-5 space-y-4">
        <div className="flex gap-2">
          {([2, 3] as const).map(d => (
            <button key={d} onClick={() => { setDigits(d); setInput(""); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                digits === d
                  ? "bg-[#A855F7] text-[#120820]"
                  : "bg-[#120820] text-slate-400 border border-[#3D2060]"
              }`}>
              ท้าย {d} ตัว
            </button>
          ))}
        </div>

        <div className="relative">
          <input
            type="text"
            maxLength={digits}
            value={input}
            onChange={e => { if (/^\d*$/.test(e.target.value)) setInput(e.target.value); }}
            placeholder={digits === 2 ? "เช่น  8 9" : "เช่น  5 1 2"}
            className="w-full bg-[#120820] border border-[#3D2060] rounded-xl px-4 py-3 sm:py-4 text-2xl sm:text-4xl font-mono font-bold text-slate-200 placeholder-slate-800 focus:outline-none focus:border-[#A855F7]/60 tracking-[0.2em] sm:tracking-[0.4em] text-center transition-colors"
            autoFocus
          />
          {input.length > 0 && input.length < digits && (
            <p className="absolute -bottom-5 left-0 text-[10px] text-slate-600">
              พิมพ์อีก {digits - input.length} หลัก...
            </p>
          )}
          {result && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <ScoreRing score={r!.score} />
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {r && checked ? (
        <div className="space-y-4">

          {/* Hero card */}
          <div className={`bg-[#1E1040] border rounded-2xl p-5 space-y-4 ${
            r.neverAppeared
              ? "border-yellow-500/30"
              : r.score >= 70
              ? "border-emerald-500/30"
              : "border-[#3D2060]"
          }`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-600 uppercase tracking-wider">วิเคราะห์เลข</p>
                <p className="text-5xl font-mono font-bold text-slate-100 tracking-widest mt-0.5">{checked}</p>
                <p className="text-xs text-slate-500 mt-2">
                  {r.neverAppeared
                    ? "⚠️ ไม่เคยออกเลยใน 100 งวด"
                    : `ออก ${r.freq} ครั้ง / 100 งวด · อันดับ #${r.rank} จาก ${r.totalUnique} เลข`}
                </p>
              </div>
              <div className="flex flex-col items-center">
                <ScoreRing score={r.score} />
                <p className="text-[10px] text-slate-600 mt-1">คะแนนรวม</p>
              </div>
            </div>

            {/* Quick stats row */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-[#120820] rounded-xl p-3 text-center">
                <p className="text-xs text-slate-600">ค้างงวด</p>
                <p className={`text-2xl font-bold ${r.gap >= 10 ? "text-orange-400" : r.gap >= 5 ? "text-yellow-400" : "text-slate-300"}`}>
                  {r.gap === r.total ? "∞" : r.gap}
                </p>
                <p className="text-[10px] text-slate-700">{r.gap >= 10 ? "นานมาก" : r.gap === 0 ? "ออกล่าสุด" : "งวดที่ผ่านมา"}</p>
              </div>
              <div className="bg-[#120820] rounded-xl p-3 text-center">
                <p className="text-xs text-slate-600">12 งวดล่าสุด</p>
                <p className={`text-2xl font-bold ${r.r12 >= 3 ? "text-red-400" : r.r12 >= 1 ? "text-emerald-400" : "text-slate-500"}`}>
                  {r.r12}
                </p>
                <p className="text-[10px] text-slate-700">ครั้ง</p>
              </div>
              <div className="bg-[#120820] rounded-xl p-3 text-center">
                <p className="text-xs text-slate-600">แนวโน้ม</p>
                <p className={`text-2xl font-bold ${r.trend === "up" ? "text-emerald-400" : r.trend === "down" ? "text-red-400" : "text-slate-500"}`}>
                  {r.trend === "up" ? "↑" : r.trend === "down" ? "↓" : "→"}
                </p>
                <p className="text-[10px] text-slate-700">{r.trend === "up" ? "กำลังขึ้น" : r.trend === "down" ? "กำลังลง" : "ทรงตัว"}</p>
              </div>
            </div>
          </div>

          {/* Verdict card */}
          <VerdictCard r={r} digits={digits} />

          {/* Alternatives — show when signal is low or never appeared */}
          {(r.score < 40 || r.neverAppeared) && (
            <AlternativesCard current={checked} digits={digits} setInput={setInput} />
          )}

          {/* Never appeared — extra context */}
          {r.neverAppeared && (
            <div className="bg-[#120820] border border-[#3D2060] rounded-xl px-4 py-3 flex gap-3">
              <AlertTriangle size={14} className="text-yellow-500 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-500">
                <span className="text-yellow-400 font-medium">มุมมองที่ 1:</span> "ถึงเวลาออกแล้ว" ·{" "}
                <span className="text-slate-400 font-medium">มุมมองที่ 2:</span> "ไม่มีหลักฐานทางสถิติ" — ขึ้นอยู่กับการตีความ
              </p>
            </div>
          )}

          {/* Triple Score (2-digit only) */}
          {r.tripleCheck && (
            <div className={`bg-[#1E1040] border rounded-2xl p-4 space-y-3 ${
              r.tripleCount >= 3 ? "border-[#A855F7]/40" : r.tripleCount >= 1 ? "border-[#3D2060]" : "border-[#3D2060]"
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FlaskConical size={14} className="text-[#A855F7]" />
                  <p className="text-sm font-semibold text-slate-300">Triple Score งวดนี้</p>
                </div>
                {r.tripleCount > 0
                  ? <span className="text-xs font-bold text-[#A855F7] bg-[#A855F7]/10 border border-[#A855F7]/30 px-2 py-0.5 rounded-full">
                      อยู่ใน {r.tripleCount}/5 method ✨
                    </span>
                  : <span className="text-xs text-slate-700 bg-[#120820] px-2 py-0.5 rounded-full">ไม่อยู่ใน method ใด</span>
                }
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(r.tripleCheck).map(([m, inPool]) => {
                  const cfg = METHOD_LABELS[m];
                  return (
                    <span key={m} className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${
                      inPool
                        ? `${cfg.color} bg-current/10 border-current/30`
                        : "text-slate-700 border-[#3D2060] bg-[#120820]"
                    }`}
                    style={inPool ? { backgroundColor: "rgba(var(--tw-text-opacity),0.05)" } : {}}>
                      {inPool ? "✓" : "·"} {cfg.label}
                    </span>
                  );
                })}
              </div>
              {r.tripleCount === 0 && (
                <p className="text-[10px] text-slate-700">เลขนี้ไม่อยู่ใน Triple Score pool งวดนี้ — ดูเลขที่อยู่ได้ที่ <Link href="/analysis" className="text-[#A855F7] hover:underline">Triple Score</Link></p>
              )}
            </div>
          )}

          {/* Timeline */}
          <div className="bg-[#1E1040] border border-[#3D2060] rounded-2xl p-4">
            <Timeline timeline={r.timeline} dates={lotteryData} />
          </div>

          {/* Draw date preference */}
          <div className="bg-[#1E1040] border border-[#3D2060] rounded-xl p-4 grid grid-cols-3 gap-3 text-center text-sm">
            <div>
              <p className="text-xs text-slate-600 mb-1">งวด 1</p>
              <p className="font-bold text-blue-400 text-xl">{r.in1}</p>
              <p className="text-[10px] text-slate-700">ครั้ง</p>
            </div>
            <div>
              <p className="text-xs text-slate-600 mb-1">งวด 16</p>
              <p className="font-bold text-orange-400 text-xl">{r.in16}</p>
              <p className="text-[10px] text-slate-700">ครั้ง</p>
            </div>
            <div>
              <p className="text-xs text-slate-600 mb-1">งวดถัดไป ({isNextDraw1 ? "1" : "16"})</p>
              <p className={`font-bold text-xl ${
                (isNextDraw1 ? r.in1 : r.in16) > (isNextDraw1 ? r.in16 : r.in1)
                  ? "text-emerald-400" : "text-slate-600"
              }`}>
                {(isNextDraw1 ? r.in1 : r.in16) > (isNextDraw1 ? r.in16 : r.in1) ? "✅" : "❌"}
              </p>
              <p className="text-[10px] text-slate-700">
                {(isNextDraw1 ? r.in1 : r.in16) > (isNextDraw1 ? r.in16 : r.in1) ? "ออกบ่อยกว่า" : "ไม่ค่อยออก"}
              </p>
            </div>
          </div>

          {/* History list */}
          {r.appearedDates.length > 0 && (
            <div className="bg-[#1E1040] border border-[#3D2060] rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[#3D2060] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-[#A855F7]" />
                  <span className="text-sm font-semibold text-slate-300">งวดที่เคยออก</span>
                </div>
                <span className="text-xs text-slate-600 bg-[#120820] px-2.5 py-0.5 rounded-full">
                  {r.appearedDates.length} ครั้ง
                </span>
              </div>
              <div className="divide-y divide-[#3D2060]/50 max-h-52 overflow-y-auto">
                {r.appearedDates.map((date, i) => (
                  <div key={i} className="px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-slate-600 w-5 text-right">{i + 1}.</span>
                      <span className="text-sm text-slate-300">{date}</span>
                    </div>
                    {i === 0 && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-400/10 border border-emerald-400/30 text-emerald-400">
                        ล่าสุด
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <p className="text-xs text-slate-700 text-center">
            ⚠️ สถิติย้อนหลังเท่านั้น — ไม่มีระบบใดทำนายลอตเตอรีได้ · การซื้อสลากมีความเสี่ยง
          </p>
        </div>
      ) : (
        <LandingContent digits={digits} />
      )}
    </div>
  );
}
