"use client";
import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";

const THAI_MONTHS = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน",
  "กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];

function getNextDrawDate(): Date {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();
  let nextDraw: Date;
  if (day < 16) {
    nextDraw = new Date(year, month, 16, 9, 30, 0);
  } else {
    nextDraw = new Date(year, month + 1, 1, 9, 30, 0);
  }
  if (nextDraw <= now) {
    nextDraw = new Date(year, month + 1, 1, 9, 30, 0);
  }
  return nextDraw;
}

function toThaiDate(d: Date): string {
  const be = d.getFullYear() + 543;
  return `${d.getDate()} ${THAI_MONTHS[d.getMonth()]} ${be}`;
}

export default function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [drawDateStr, setDrawDateStr] = useState("");
  const [phase, setPhase] = useState(1);

  useEffect(() => {
    const draw = getNextDrawDate();
    setDrawDateStr(toThaiDate(draw));

    const timer = setInterval(() => {
      const now = new Date();
      const diff = draw.getTime() - now.getTime();
      if (diff <= 0) { clearInterval(timer); return; }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ days, hours, minutes, seconds });
      if (days <= 3) setPhase(3);
      else if (days <= 7) setPhase(2);
      else setPhase(1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const phaseInfo = {
    1: { label: "Phase 1", sets: "20 ชุด", color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/30" },
    2: { label: "Phase 2", sets: "10 ชุด", color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/30" },
    3: { label: "Phase 3", sets: "5 ชุด", color: "text-orange-400", bg: "bg-orange-400/10 border-orange-400/30" },
  };
  const current = phaseInfo[phase as keyof typeof phaseInfo];

  return (
    <section className="bg-[#1A1D2E] border border-[#2A2D3E] rounded-2xl overflow-hidden">
      {/* 🔑 Draw date banner */}
      <div className="bg-[#C9A84C]/10 border-b border-[#C9A84C]/20 px-5 py-3 flex items-center gap-2">
        <CalendarDays size={15} className="text-[#C9A84C] shrink-0" />
        <p className="text-sm text-slate-300">
          กำลังคำนวณสำหรับงวด{" "}
          <span className="font-bold text-[#C9A84C]">{drawDateStr || "..."}</span>
        </p>
      </div>

      <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Countdown */}
        <div>
          <p className="text-slate-400 text-sm mb-3">⏳ นับถอยหลัง</p>
          <div className="flex gap-4">
            {[
              { value: timeLeft.days, label: "วัน" },
              { value: timeLeft.hours, label: "ชั่วโมง" },
              { value: timeLeft.minutes, label: "นาที" },
              { value: timeLeft.seconds, label: "วินาที" },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-3xl font-bold text-[#C9A84C] w-14 text-center">
                  {String(value).padStart(2, "0")}
                </div>
                <div className="text-xs text-slate-500 mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Phase Badge */}
        <div className={`border rounded-xl p-4 text-center min-w-40 ${current.bg}`}>
          <p className="text-xs text-slate-400 mb-1">กลุ่มเลขสถิติตอนนี้</p>
          <p className={`text-lg font-bold ${current.color}`}>{current.label}</p>
          <p className={`text-2xl font-bold ${current.color}`}>{current.sets}</p>
          <p className="text-xs text-slate-500 mt-1">ต่องวดนี้</p>
        </div>
      </div>
    </section>
  );
}
