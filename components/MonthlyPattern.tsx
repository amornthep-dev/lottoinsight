"use client";
import { useState } from "react";
import { Calendar } from "lucide-react";
import lotteryData from "@/data/lottery.json";

const THAI_MONTHS = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน",
  "กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];

function getMonthStats(monthIdx: number, digits: 2|3) {
  // เดือนใน date field เช่น "2569-05-01" → เดือน 5 (1-based)
  const monthDraws = lotteryData.filter(d => {
    const m = parseInt(d.date.split("-")[1]) - 1; // 0-based
    return m === monthIdx;
  });
  if (monthDraws.length === 0) return [];

  const nums = digits === 2
    ? monthDraws.map(d => d.prize2back)
    : monthDraws.flatMap(d => d.prize3back);

  const freq: Record<string,number> = {};
  nums.forEach(n => { freq[n] = (freq[n]||0)+1; });

  return Object.entries(freq)
    .sort((a,b) => b[1]-a[1])
    .slice(0, 8)
    .map(([n, count]) => ({ n, count, total: monthDraws.length }));
}

export default function MonthlyPattern() {
  const currentMonth = new Date().getMonth(); // 0-based
  const [tab, setTab] = useState<2|3>(2);
  const stats = getMonthStats(currentMonth, tab);
  const monthName = THAI_MONTHS[currentMonth];

  return (
    <section className="bg-[#1E1040] border border-[#3D2060] rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Calendar size={15} className="text-[#A855F7]" />
          <div>
            <h2 className="text-base font-semibold text-slate-300">
              เลขเด่นประจำเดือน<span className="text-[#A855F7]"> {monthName}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">เลขที่ออกบ่อยในเดือนนี้ของทุกปีย้อนหลัง</p>
          </div>
        </div>
        <div className="flex gap-2">
          {([2,3] as const).map(d => (
            <button key={d} onClick={() => setTab(d)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                tab === d ? "bg-[#A855F7] text-[#120820]" : "bg-[#120820] text-slate-400 border border-[#3D2060]"
              }`}>
              ท้าย {d} ตัว
            </button>
          ))}
        </div>
      </div>

      {stats.length === 0 ? (
        <p className="text-slate-600 text-sm text-center py-4">ไม่มีข้อมูลสำหรับเดือนนี้</p>
      ) : (
        <div className="space-y-2">
          {stats.map(({ n, count, total }, i) => (
            <div key={n} className="flex items-center gap-3">
              <span className={`text-xs font-bold w-4 text-center ${i < 3 ? "text-[#A855F7]" : "text-slate-600"}`}>
                {i+1}
              </span>
              <span className="font-mono font-bold text-slate-200 text-base w-12">{n}</span>
              <div className="flex-1 h-2 bg-[#120820] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all"
                  style={{
                    width: `${(count / Math.max(...stats.map(s=>s.count))) * 100}%`,
                    backgroundColor: i < 3 ? "#A855F7" : "#3D2060",
                  }} />
              </div>
              <span className="text-xs text-slate-500 shrink-0">
                {count}/{total} ปี
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="bg-[#120820] rounded-xl p-3">
        <p className="text-xs text-slate-500">
          📊 ข้อมูลจาก {lotteryData.filter(d => parseInt(d.date.split("-")[1])-1 === currentMonth).length} งวดของเดือน{monthName}ในฐานข้อมูล
          · Pattern นี้ใช้ประกอบการตัดสินใจเท่านั้น
        </p>
      </div>
    </section>
  );
}
