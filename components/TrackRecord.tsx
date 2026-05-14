"use client";
import { useState } from "react";
import { CheckCircle, XCircle, ChevronRight, TrendingUp } from "lucide-react";
import { getPhase1, getPhase2, getPhase3 } from "@/lib/lottery-stats";
import lotteryData from "@/data/lottery.json";

// คำนวณ hit rate ย้อนหลัง — เช็คว่าเลขที่ Phase แนะนำ (คำนวณจาก data ก่อนงวดนั้น) ตรงกับผลจริงไหม
function computeRecord() {
  const records = [];
  // ตรวจ 8 งวดล่าสุด (งวดที่ 1 คือปัจจุบัน ยังไม่ออก → เริ่มจากงวดที่ 2)
  for (let i = 1; i <= 8; i++) {
    const actual = lotteryData[i];
    if (!actual) break;
    // ใช้ข้อมูลตั้งแต่งวดที่ i+1 เป็นต้นไป (ไม่รวมงวดที่กำลังตรวจ) จำลอง algo ณ เวลานั้น
    const pastData = lotteryData.slice(i + 1);
    if (pastData.length < 5) break;

    // Phase 1 top 20
    const freq3 = pastData.flatMap((d: typeof lotteryData[0]) => d.prize3back)
      .reduce((a: Record<string,number>, n: string) => ({ ...a, [n]: (a[n]||0)+1 }), {});
    const freq2 = pastData.map((d: typeof lotteryData[0]) => d.prize2back)
      .reduce((a: Record<string,number>, n: string) => ({ ...a, [n]: (a[n]||0)+1 }), {});
    const top20_3 = Object.entries(freq3).sort((a,b)=>b[1]-a[1]).slice(0,20).map(([k])=>k);
    const top10_2 = Object.entries(freq2).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([k])=>k);
    const top5_3 = top20_3.slice(0,5);
    const top5_2 = top10_2.slice(0,5);

    const hit3_p1 = actual.prize3back.some((n: string) => top20_3.includes(n));
    const hit2_p1 = top10_2.includes(actual.prize2back);
    const hit3_p3 = actual.prize3back.some((n: string) => top5_3.includes(n));
    const hit2_p3 = top5_2.includes(actual.prize2back);

    records.push({
      date: actual.dateDisplay,
      actual3: actual.prize3back,
      actual2: actual.prize2back,
      hit3_p1, hit2_p1,
      hit3_p3, hit2_p3,
    });
  }
  return records;
}

const RECORDS = computeRecord();
const hitRate2_p1 = Math.round((RECORDS.filter(r=>r.hit2_p1).length / RECORDS.length) * 100);
const hitRate3_p1 = Math.round((RECORDS.filter(r=>r.hit3_p1).length / RECORDS.length) * 100);
const hitRate2_p3 = Math.round((RECORDS.filter(r=>r.hit2_p3).length / RECORDS.length) * 100);

export default function TrackRecord() {
  const [open, setOpen] = useState(false);

  return (
    <section className="bg-[#1A1D2E] border border-[#2A2D3E] rounded-2xl overflow-hidden">
      {/* Header */}
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 hover:bg-[#2A2D3E]/20 transition-colors">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-emerald-400" />
          <span className="text-sm font-semibold text-slate-300">Track Record — ผลย้อนหลัง</span>
          <span className="text-xs text-slate-600">Phase แนะนำอะไร vs ผลจริง</span>
        </div>
        <span className="text-slate-600 text-sm">{open ? "▲" : "▼"}</span>
      </button>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-px bg-[#2A2D3E]">
        {[
          { label: "ท้าย 2 ตัว (Phase 1 · 10 เลข)", rate: hitRate2_p1, color: "text-emerald-400" },
          { label: "ท้าย 3 ตัว (Phase 1 · 20 เลข)", rate: hitRate3_p1, color: "text-blue-400" },
          { label: "ท้าย 2 ตัว (Phase 3 · 5 เลข)", rate: hitRate2_p3, color: "text-orange-400" },
        ].map(({ label, rate, color }) => (
          <div key={label} className="bg-[#1A1D2E] p-4 text-center">
            <p className={`text-2xl font-bold ${color}`}>{rate}%</p>
            <p className="text-xs text-slate-600 mt-0.5 leading-tight">{label}</p>
          </div>
        ))}
      </div>

      {open && (
        <div className="border-t border-[#2A2D3E]">
          <p className="text-xs text-slate-600 px-5 pt-4 pb-2">
            ⚠️ Track Record นี้คำนวณจากข้อมูลย้อนหลัง ไม่ใช่การการันตีอนาคต
          </p>
          <div className="divide-y divide-[#2A2D3E]/50">
            {RECORDS.map((r, i) => (
              <div key={i} className="px-5 py-3 flex items-center gap-4 flex-wrap">
                <span className="text-xs text-slate-500 w-32 shrink-0">{r.date}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600">ท้าย 3:</span>
                  {r.actual3.map((n: string) => (
                    <span key={n} className="font-mono text-sm font-bold text-blue-400">{n}</span>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600">ท้าย 2:</span>
                  <span className="font-mono text-sm font-bold text-purple-400">{r.actual2}</span>
                </div>
                <div className="flex items-center gap-3 ml-auto">
                  <span className="text-xs text-slate-600">P1:</span>
                  {r.hit3_p1
                    ? <CheckCircle size={13} className="text-emerald-400" />
                    : <XCircle size={13} className="text-slate-700" />}
                  {r.hit2_p1
                    ? <CheckCircle size={13} className="text-emerald-400" />
                    : <XCircle size={13} className="text-slate-700" />}
                  <span className="text-xs text-slate-600">P3:</span>
                  {r.hit3_p3
                    ? <CheckCircle size={13} className="text-orange-400" />
                    : <XCircle size={13} className="text-slate-700" />}
                  {r.hit2_p3
                    ? <CheckCircle size={13} className="text-orange-400" />
                    : <XCircle size={13} className="text-slate-700" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
