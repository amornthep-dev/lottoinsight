import { Clapperboard, CheckCircle, ChevronRight } from "lucide-react";
import Link from "next/link";
import lotteryData from "@/data/lottery.json";

type DrawEntry = typeof lotteryData[0];

function countFreq(nums: string[]): Record<string, number> {
  return nums.reduce((acc, n) => ({ ...acc, [n]: (acc[n] || 0) + 1 }), {} as Record<string, number>);
}
function topN(scores: Record<string, number>, n: number): string[] {
  return Object.entries(scores).filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]).slice(0, n).map(([k]) => k);
}

function getP4(pastData: DrawEntry[]) {
  if (pastData.length < 5) return { p4_3: [], p4_2: [] };
  const freq3 = countFreq(pastData.flatMap(d => d.prize3back));
  const freq2 = countFreq(pastData.map(d => d.prize2back));
  const r30f3 = countFreq(pastData.slice(0, 30).flatMap(d => d.prize3back));
  const r30f2 = countFreq(pastData.slice(0, 30).map(d => d.prize2back));
  const rec3: Record<string, number> = {};
  const rec2: Record<string, number> = {};
  const w = [1.0, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.35, 0.3, 0.25, 0.2, 0.15];
  pastData.forEach((d, i) => {
    const wt = i < w.length ? w[i] : 0.1;
    d.prize3back.forEach(n => { rec3[n] = (rec3[n] || 0) + wt; });
    rec2[d.prize2back] = (rec2[d.prize2back] || 0) + wt;
  });
  const all3 = pastData.flatMap(d => d.prize3back);
  const all2 = pastData.map(d => d.prize2back);
  const sc3: Record<string, number> = {};
  const sc2: Record<string, number> = {};
  for (const n of Object.keys(freq3)) {
    const gap = all3.indexOf(n) === -1 ? all3.length : all3.indexOf(n);
    sc3[n] = (freq3[n] || 0) * 0.25 + (r30f3[n] || 0) * 0.35 + (rec3[n] || 0) * 0.8 + (gap > 5 ? gap * 0.4 : 0);
  }
  for (const n of Object.keys(freq2)) {
    const gap = all2.indexOf(n) === -1 ? all2.length : all2.indexOf(n);
    sc2[n] = (freq2[n] || 0) * 0.25 + (r30f2[n] || 0) * 0.35 + (rec2[n] || 0) * 0.8 + (gap > 4 ? gap * 0.6 : 0);
  }
  const p3_3 = topN(sc3, 5);
  const p3_2 = topN(sc2, 3);
  const sc4_3: Record<string, number> = {};
  const sc4_2: Record<string, number> = {};
  const p1_3 = topN(freq3, 20); const p1_2 = topN(freq2, 10);
  const p2_3 = topN(Object.fromEntries(Object.keys(freq3).map(n => [n, (freq3[n] || 0) * 0.4 + (r30f3[n] || 0) * 1.2])), 10);
  const p2_2 = topN(Object.fromEntries(Object.keys(freq2).map(n => [n, (freq2[n] || 0) * 0.4 + (r30f2[n] || 0) * 1.2])), 5);
  [p1_3, p2_3, p3_3].forEach((arr, wi) => arr.forEach((n, i) => { sc4_3[n] = (sc4_3[n] || 0) + (arr.length - i) * [0.3, 0.4, 0.3][wi]; }));
  [p1_2, p2_2, p3_2].forEach((arr, wi) => arr.forEach((n, i) => { sc4_2[n] = (sc4_2[n] || 0) + (arr.length - i) * [0.3, 0.4, 0.3][wi]; }));
  return { p4_3: topN(sc4_3, 2), p4_2: topN(sc4_2, 2) };
}

// คำนวณ 3 งวดล่าสุดสำหรับ teaser
const TEASER = Array.from({ length: 3 }, (_, i) => {
  const idx = i + 1;
  const draw = lotteryData[idx];
  if (!draw) return null;
  const past = lotteryData.slice(idx + 1);
  const { p4_3, p4_2 } = getP4(past);
  const hit3 = p4_3.some(n => draw.prize3back.includes(n));
  const hit2 = p4_2.some(n => n === draw.prize2back);
  return { date: draw.dateDisplay, actual2: draw.prize2back, p4_3, p4_2, hit3, hit2 };
}).filter(Boolean) as NonNullable<{
  date: string; actual2: string; p4_3: string[]; p4_2: string[]; hit3: boolean; hit2: boolean;
}>[];

export default function LeaderboardTeaser() {
  const hitCount = TEASER.filter(d => d.hit2 || d.hit3).length;

  return (
    <section className="bg-[#1E1040] border border-[#3D2060] rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clapperboard size={16} className="text-[#A855F7]" />
          <div>
            <h2 className="text-base font-semibold text-slate-300">Backtest ย้อนหลัง</h2>
            <p className="text-xs text-slate-600">Phase vs ผลจริง — 3 งวดล่าสุด</p>
          </div>
        </div>
        <Link href="/leaderboard"
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-[#A855F7] transition-colors">
          ดูทั้งหมด <ChevronRight size={12} />
        </Link>
      </div>

      {/* Phase 4 hit summary */}
      <div className="bg-[#120820] rounded-xl px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500">Phase 4 ถูก (3 งวดล่าสุด)</p>
          <p className="text-2xl font-bold text-[#A855F7] mt-0.5">{hitCount}<span className="text-sm text-slate-500">/{TEASER.length} งวด</span></p>
        </div>
        <span className="text-3xl">{hitCount >= 2 ? "🎯" : hitCount === 1 ? "✅" : "📊"}</span>
      </div>

      {/* 3 recent draws */}
      <div className="space-y-2">
        {TEASER.map((d, i) => (
          <div key={i} className={`rounded-xl px-3 py-2.5 border ${(d.hit2 || d.hit3) ? "border-[#A855F7]/30 bg-[#A855F7]/5" : "border-[#3D2060] bg-[#120820]/50"}`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-500">{d.date}</span>
              {(d.hit2 || d.hit3) && (
                <span className="text-[10px] text-[#A855F7] font-bold flex items-center gap-0.5">
                  <CheckCircle size={9} /> Phase 4 ถูก
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-slate-600">P4 คาด:</span>
                {d.p4_2.map(n => (
                  <span key={n} className={`font-mono text-xs font-bold px-1.5 py-0.5 rounded border ${n === d.actual2 ? "border-[#A855F7] text-[#A855F7] bg-[#A855F7]/10" : "border-[#3D2060] text-slate-600"}`}>{n}</span>
                ))}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-slate-600">ออกจริง:</span>
                <span className="font-mono text-xs font-bold text-purple-400">{d.actual2}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Link href="/leaderboard"
        className="block w-full text-center bg-[#A855F7]/10 border border-[#A855F7]/30 text-[#A855F7] text-xs font-bold py-2 rounded-xl hover:bg-[#A855F7]/20 transition-colors">
        ดู Backtest เต็ม 10 งวด →
      </Link>
    </section>
  );
}
