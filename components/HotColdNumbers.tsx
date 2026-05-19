"use client";
import { useState } from "react";
import { Flame, Snowflake } from "lucide-react";
import lotteryData from "@/data/lottery.json";

function analyze(digits: 2 | 3) {
  const all = digits === 2
    ? lotteryData.map(d => d.prize2back)
    : lotteryData.flatMap(d => d.prize3back);
  const recent = all.slice(0, 10);

  const freqAll: Record<string,number> = {};
  const freqRecent: Record<string,number> = {};
  all.forEach(n => { freqAll[n] = (freqAll[n]||0)+1; });
  recent.forEach(n => { freqRecent[n] = (freqRecent[n]||0)+1; });

  // gap = จำนวนงวดที่ผ่านมาตั้งแต่ออกครั้งล่าสุด
  const gapMap: Record<string,number> = {};
  const appeared = new Set<string>();
  all.forEach((n, i) => { if (!appeared.has(n)) { gapMap[n] = i; appeared.add(n); } });

  const nums = [...new Set(all)];
  const scored = nums.map(n => ({
    n,
    freq: freqAll[n]||0,
    recent: freqRecent[n]||0,
    gap: gapMap[n]??all.length,
  }));

  // Hot = top 8 ที่ออกบ่อยสุดใน 10 งวดล่าสุด (อย่างน้อย 1 ครั้ง)
  const hot = scored
    .filter(s => s.recent >= 1)
    .sort((a,b) => b.recent - a.recent || b.freq - a.freq)
    .slice(0, 8);

  const cold = scored
    .filter(s => s.gap >= 8)
    .sort((a,b) => b.gap - a.gap)
    .slice(0, 8);
  return { hot, cold };
}

export default function HotColdNumbers() {
  const [tab, setTab] = useState<2|3>(2);
  const { hot, cold } = analyze(tab);

  return (
    <section className="bg-[#1A1D2E] border border-[#2A2D3E] rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-300">🔥 เลขร้อน / ❄️ เลขเย็น</h2>
          <p className="text-xs text-slate-500 mt-0.5">ร้อน = ออกบ่อยใน 10 งวดล่าสุด · เย็น = ไม่ออกมานาน</p>
        </div>
        <div className="flex gap-2">
          {([2,3] as const).map(d => (
            <button key={d} onClick={() => setTab(d)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                tab === d ? "bg-[#C9A84C] text-[#0F1117]" : "bg-[#0F1117] text-slate-400 border border-[#2A2D3E]"
              }`}>
              ท้าย {d} ตัว
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Hot */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Flame size={14} className="text-orange-400" />
            <span className="text-xs font-semibold text-orange-400">เลขร้อน</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {hot.map(({ n, recent, freq }) => (
              <div key={n} title={`ออก ${recent} ครั้งใน 10 งวดล่าสุด · รวม ${freq} ครั้ง`}
                className="flex flex-col items-center px-2.5 py-1.5 bg-orange-500/10 border border-orange-500/30 rounded-xl cursor-default">
                <span className="font-mono font-bold text-orange-300 text-base">{n}</span>
                <span className="text-[9px] text-orange-500">{recent}x ล่าสุด</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cold */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Snowflake size={14} className="text-sky-400" />
            <span className="text-xs font-semibold text-sky-400">เลขเย็น</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {cold.map(({ n, gap }) => (
              <div key={n} title={`ไม่ออกมาแล้ว ${gap} งวด`}
                className="flex flex-col items-center px-2.5 py-1.5 bg-sky-500/10 border border-sky-500/30 rounded-xl cursor-default">
                <span className="font-mono font-bold text-sky-300 text-base">{n}</span>
                <span className="text-[9px] text-sky-500">ห่าง {gap} งวด</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-700">
        เลขร้อนไม่ได้หมายความว่าจะออกต่อ · เลขเย็นไม่ได้หมายความว่าถึงเวลาออก — ดูประกอบเท่านั้น
      </p>
    </section>
  );
}
