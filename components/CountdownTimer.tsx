"use client";
import { useEffect, useState } from "react";
import type { LotteryConfig } from "@/lib/lottery-config";
import { getNextDrawTime } from "@/lib/draw-time";

const ICT_OFFSET = 7 * 60 * 60 * 1000;
const THAI_MONTHS = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];

function formatDrawDate(utcDate: Date): string {
  const ict = new Date(utcDate.getTime() + ICT_OFFSET);
  const day = ict.getUTCDate();
  const mo = THAI_MONTHS[ict.getUTCMonth()];
  const year = ict.getUTCFullYear() + 543;
  const hh = String(ict.getUTCHours()).padStart(2, "0");
  const mm = String(ict.getUTCMinutes()).padStart(2, "0");
  return `${day} ${mo} ${year}  ·  ${hh}:${mm} น.`;
}

interface Props {
  config: Pick<LotteryConfig, "drawSchedule" | "drawTimeICT">;
}

export default function CountdownTimer({ config }: Props) {
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 });
  const [drawLabel, setDrawLabel] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let rafId: number;

    const tick = () => {
      const now = new Date();
      const drawTime = getNextDrawTime(config as LotteryConfig, now);
      setDrawLabel(formatDrawDate(drawTime));

      const diff = drawTime.getTime() - now.getTime();
      if (diff > 0) {
        const totalSec = Math.floor(diff / 1000);
        const h = Math.floor(totalSec / 3600);
        const m = Math.floor((totalSec % 3600) / 60);
        const s = totalSec % 60;
        setTimeLeft({ h, m, s });
      } else {
        setTimeLeft({ h: 0, m: 0, s: 0 });
      }
      setReady(true);
      rafId = window.setTimeout(tick, 1000);
    };

    tick();
    return () => clearTimeout(rafId);
  }, [config]);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="bg-[#1E1040] border border-[#3D2060] rounded-xl px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
      <div>
        <p className="text-[11px] text-slate-500 mb-0.5">ออกรางวัลรอบถัดไป</p>
        <p className="text-sm font-semibold text-slate-200">
          {ready ? drawLabel : "..."}
        </p>
      </div>

      {ready && (
        <div className="flex items-center gap-1.5">
          {[
            { v: timeLeft.h, l: "ชม." },
            { v: timeLeft.m, l: "นาที" },
            { v: timeLeft.s, l: "วิ" },
          ].map(({ v, l }) => (
            <div key={l} className="text-center">
              <div className="bg-[#120820] rounded-lg w-10 h-9 flex items-center justify-center">
                <span className="text-base font-bold text-[#A855F7] font-mono tabular-nums">
                  {pad(v)}
                </span>
              </div>
              <p className="text-[9px] text-slate-600 mt-0.5">{l}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
