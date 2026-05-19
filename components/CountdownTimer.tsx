"use client";
import { useEffect, useState } from "react";
import { CalendarDays, RefreshCw } from "lucide-react";

const THAI_MONTHS = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน",
  "กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];

function getNextDrawDate(): Date {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();
  const try16 = new Date(year, month, 16, 9, 30, 0);
  const try01 = new Date(year, month + 1, 1, 9, 30, 0);
  if (day < 16 && try16 > now) return try16;
  if (try01 > now) return try01;
  return new Date(year, month + 1, 16, 9, 30, 0);
}

function toThaiDate(d: Date): string {
  const be = d.getFullYear() + 543;
  return `${d.getDate()} ${THAI_MONTHS[d.getMonth()]} ${be}`;
}

// วันที่ถัดไปที่จะอัปเดตข้อมูล = วันหลังงวดออก ~15:00
function getUpdateLabel(draw: Date): string {
  const update = new Date(draw);
  update.setHours(15, 0, 0, 0);
  const be = update.getFullYear() + 543;
  return `${update.getDate()} ${THAI_MONTHS[update.getMonth()]} ${be} · 15:00 น.`;
}

const phaseInfo = {
  1: {
    label: "Phase 1", color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/30",
    nextLabel: "Phase 2 เปิดใน", nextThreshold: 7,
  },
  2: {
    label: "Phase 2", color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/30",
    nextLabel: "Phase 3 เปิดใน", nextThreshold: 3,
  },
  3: {
    label: "Phase 3 🔴", color: "text-orange-400", bg: "bg-orange-400/10 border-orange-400/30",
    nextLabel: null, nextThreshold: 0,
  },
} as const;

export default function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [drawDateStr, setDrawDateStr] = useState("");
  const [updateLabel, setUpdateLabel] = useState("");
  const [phase, setPhase] = useState<1|2|3>(1);

  useEffect(() => {
    const draw = getNextDrawDate();
    setDrawDateStr(toThaiDate(draw));
    setUpdateLabel(getUpdateLabel(draw));

    const tick = () => {
      const now = new Date();
      const diff = draw.getTime() - now.getTime();
      if (diff <= 0) { clearInterval(timer); return; }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ days, hours, minutes, seconds });
      setPhase(days <= 3 ? 3 : days <= 7 ? 2 : 1);
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  const current = phaseInfo[phase];

  return (
    <section className="bg-[#1A1D2E] border border-[#2A2D3E] rounded-2xl overflow-hidden">
      {/* Draw date banner */}
      <div className="bg-[#C9A84C]/10 border-b border-[#C9A84C]/20 px-5 py-2.5 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <CalendarDays size={14} className="text-[#C9A84C] shrink-0" />
          <p className="text-sm text-slate-300">
            งวด <span className="font-bold text-[#C9A84C]">{drawDateStr || "..."}</span>
          </p>
        </div>
        {updateLabel && (
          <div className="flex items-center gap-1.5">
            <RefreshCw size={11} className="text-slate-600 shrink-0" />
            <p className="text-[11px] text-slate-600">อัปเดตข้อมูล {updateLabel}</p>
          </div>
        )}
      </div>

      <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Countdown boxes */}
        <div className="w-full sm:w-auto">
          <p className="text-slate-500 text-xs mb-2 text-center sm:text-left">⏳ นับถอยหลังถึงงวด</p>
          <div className="flex justify-center sm:justify-start gap-2">
            {[
              { value: timeLeft.days,    label: "วัน"   },
              { value: timeLeft.hours,   label: "ชม."   },
              { value: timeLeft.minutes, label: "นาที"  },
              { value: timeLeft.seconds, label: "วิ"    },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="bg-[#0F1117] rounded-xl w-12 h-12 flex items-center justify-center">
                  <span className="text-xl font-bold text-[#C9A84C] font-mono tabular-nums">
                    {String(value).padStart(2, "0")}
                  </span>
                </div>
                <div className="text-[10px] text-slate-600 mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Phase status badge */}
        <div className={`border rounded-xl px-4 py-3 text-center shrink-0 min-w-[130px] ${current.bg}`}>
          <p className="text-[10px] text-slate-500 mb-1">Phase ปัจจุบัน</p>
          <p className={`text-base font-bold ${current.color}`}>{current.label}</p>
          {current.nextLabel ? (
            <p className="text-[10px] text-slate-500 mt-1.5 leading-tight">
              {current.nextLabel}<br/>
              <span className={`font-bold text-sm ${current.color}`}>
                {phase === 1
                  ? `${Math.max(0, timeLeft.days - 7)} วัน`
                  : `${Math.max(0, timeLeft.days - 3)} วัน`}
              </span>
            </p>
          ) : (
            <p className="text-[10px] text-orange-400/70 mt-1.5">เปิดทุก Phase แล้ว</p>
          )}
        </div>
      </div>
    </section>
  );
}
