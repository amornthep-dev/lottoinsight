"use client";
import { useMemo } from "react";
import { Zap } from "lucide-react";
import lotteryData from "@/data/lottery.json";
import { getPhase1, getPhase3, getRecencyWeighted } from "@/lib/lottery-stats";
import { calcTripleScore } from "@/lib/signature-methods";

// Compute once at module level (expensive)
const _triple = calcTripleScore(lotteryData as typeof lotteryData);

interface Signal {
  key: string;
  label: string;
  short: string;
  bg: string;
  text: string;
  weight: number;
}

const SIGNALS: Signal[] = [
  { key: "p1",     label: "Phase 1",     short: "P1",    bg: "bg-emerald-500/15", text: "text-emerald-400", weight: 1 },
  { key: "p3",     label: "Phase 3",     short: "P3 ×2", bg: "bg-orange-500/15",  text: "text-orange-400",  weight: 2 },
  { key: "hot",    label: "เลขร้อน",    short: "Hot",   bg: "bg-red-500/15",     text: "text-red-400",     weight: 1 },
  { key: "month",  label: "เดือนนี้",   short: "เดือน", bg: "bg-yellow-500/15",  text: "text-[#A855F7]",  weight: 1 },
  { key: "triple", label: "Triple ×2",  short: "Tri ×2",bg: "bg-purple-500/15",  text: "text-purple-400",  weight: 2 },
  { key: "recency",label: "Recency",     short: "Rec",   bg: "bg-blue-500/15",    text: "text-blue-400",    weight: 1 },
];

function computeConvergence() {
  // Signal sets
  const p1Set     = new Set(getPhase1().prize2back);
  const p3Set     = new Set(getPhase3().prize2back);

  const all2      = lotteryData.map(d => d.prize2back);
  const hotFreq: Record<string, number> = {};
  all2.slice(0, 10).forEach(n => { hotFreq[n] = (hotFreq[n] || 0) + 1; });
  const hotSet    = new Set(Object.keys(hotFreq).filter(n => hotFreq[n] >= 1));

  const currentMonth = new Date().getMonth();
  const monthFreq: Record<string, number> = {};
  lotteryData
    .filter(d => parseInt(d.date.split("-")[1]) - 1 === currentMonth)
    .forEach(d => { monthFreq[d.prize2back] = (monthFreq[d.prize2back] || 0) + 1; });
  const monthSet  = new Set(
    Object.entries(monthFreq).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k]) => k)
  );

  const tripleSet = new Set(_triple.top2.slice(0, 12).map(e => e.num));

  const recency   = getRecencyWeighted(2);
  const recencySorted = Object.entries(recency).sort((a, b) => b[1] - a[1]);
  const recencySet = new Set(recencySorted.slice(0, 15).map(([k]) => k));

  const signalSets: Record<string, Set<string>> = {
    p1: p1Set, p3: p3Set, hot: hotSet, month: monthSet, triple: tripleSet, recency: recencySet,
  };

  // Score all 00-99
  const scored: Array<{ num: string; total: number; matched: Signal[] }> = [];
  for (let i = 0; i <= 99; i++) {
    const n = String(i).padStart(2, "0");
    const matched: Signal[] = [];
    let total = 0;
    SIGNALS.forEach(s => {
      if (signalSets[s.key].has(n)) {
        matched.push(s);
        total += s.weight;
      }
    });
    if (total >= 3) scored.push({ num: n, total, matched }); // minimum 3 points to show
  }

  scored.sort((a, b) => b.total - a.total);
  return scored.slice(0, 8);
}

export default function SignalConvergence() {
  const results = useMemo(computeConvergence, []);

  if (results.length === 0) return null;

  const maxTotal = results[0].total;

  return (
    <section className="bg-[#1E1040] border border-[#A855F7]/25 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-[#3D2060] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Zap size={15} className="text-[#A855F7]" />
          <span className="text-sm font-bold text-slate-200">สัญญาณรวม</span>
          <span className="text-xs text-slate-600">Signal Convergence</span>
        </div>
        <span className="text-[10px] text-slate-600 bg-[#120820] border border-[#3D2060] px-2 py-0.5 rounded-full">
          ท้าย 2 ตัว
        </span>
      </div>

      <div className="p-4 space-y-4">
        {/* Description + signal legend */}
        <div className="space-y-2">
          <p className="text-xs text-slate-500 leading-relaxed">
            เลขที่ <span className="text-slate-300 font-medium">ผ่านหลาย signal พร้อมกัน</span>{" "}
            — Phase · เลขร้อน · เดือนนี้ · Triple Score · Recency ยิ่งผ่านมาก ยิ่งโดดเด่นเชิงสถิติ
          </p>
          <div className="flex flex-wrap gap-1.5">
            {SIGNALS.map(s => (
              <span key={s.key} className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}>
                {s.short}
              </span>
            ))}
          </div>
        </div>

        {/* Number list */}
        <div className="space-y-1.5">
          {results.map(({ num, total, matched }, i) => {
            const isTop  = total === maxTotal;
            const pct    = Math.round((total / maxTotal) * 100);
            return (
              <div
                key={num}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 transition-colors ${
                  isTop ? "bg-[#A855F7]/8 border border-[#A855F7]/15" : "bg-[#120820]/50"
                }`}
              >
                {/* Rank + number */}
                <div className="flex items-center gap-2 w-14 shrink-0">
                  <span className={`text-[10px] font-bold w-5 text-center ${i === 0 ? "text-[#A855F7]" : "text-slate-700"}`}>
                    {i === 0 ? "🏆" : `#${i + 1}`}
                  </span>
                  <span className={`font-mono font-bold text-lg ${isTop ? "text-[#A855F7]" : "text-slate-300"}`}>
                    {num}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="flex-1 h-1.5 bg-[#3D2060] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, backgroundColor: isTop ? "#A855F7" : "#4A4D5E" }}
                  />
                </div>

                {/* Signal tags */}
                <div className="flex flex-wrap gap-1 justify-end shrink-0 max-w-[120px]">
                  {matched.map(s => (
                    <span key={s.key} className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${s.bg} ${s.text}`}>
                      {s.short}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Disclaimer */}
        <p className="text-[10px] text-slate-700 pt-1 border-t border-[#3D2060]">
          ⚠️ Signal convergence ≠ การทำนาย · หวยคือการจับสลากสุ่ม · การซื้อสลากมีความเสี่ยง
        </p>
      </div>
    </section>
  );
}
