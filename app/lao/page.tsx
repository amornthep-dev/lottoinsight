"use client";
import { useState, useEffect, useMemo } from "react";
import { Flame, Snowflake, Search, Calendar, TrendingUp, TrendingDown, Minus, Flag } from "lucide-react";
import laoData from "@/data/lao-lottery.json";
import {
  getDailyHotCold,
  getDayOfWeekPattern,
  getDailySignalConvergence,
  analyzeDailyNumber,
  getTodayDayThai,
  THAI_DAYS,
  type DailyEntry,
} from "@/lib/daily-lottery-stats";

const data = laoData as DailyEntry[];

// ─── Countdown ───────────────────────────────────────────────────────────────
// Lao: Mon–Sat at 20:30 ICT (UTC+7)

function getNextDrawDate(): Date {
  const now = new Date();
  const ict = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const day = ict.getUTCDay(); // 0=Sun
  const h = ict.getUTCHours();
  const m = ict.getUTCMinutes();
  const passedToday = h > 20 || (h === 20 && m >= 30);
  // Draw days: Mon(1), Wed(3), Fri(5)
  const isDrawDay = day === 1 || day === 3 || day === 5;

  let daysAhead = 0;
  if (isDrawDay && !passedToday) {
    daysAhead = 0; // draw today, not yet
  } else {
    // Find next Mon/Wed/Fri
    for (let i = 1; i <= 7; i++) {
      const next = (day + i) % 7;
      if (next === 1 || next === 3 || next === 5) { daysAhead = i; break; }
    }
  }

  const next = new Date(ict.getTime());
  next.setUTCDate(next.getUTCDate() + daysAhead);
  next.setUTCHours(13, 30, 0, 0); // 20:30 ICT = 13:30 UTC
  return new Date(next.getTime() - 7 * 60 * 60 * 1000); // back to UTC
}

function Countdown() {
  const [remaining, setRemaining] = useState("");
  const [nextStr, setNextStr] = useState("");

  useEffect(() => {
    function tick() {
      const now = Date.now();
      const target = getNextDrawDate().getTime();
      const diff = target - now;
      if (diff <= 0) { setRemaining("00:00:00"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
      // Next draw local display
      const d = getNextDrawDate();
      const ictMs = d.getTime() + 7 * 3600000;
      const ictDate = new Date(ictMs);
      const days = ["อาทิตย์","จันทร์","อังคาร","พุธ","พฤหัสบดี","ศุกร์","เสาร์"];
      setNextStr(`${days[ictDate.getUTCDay()]} 20:30 น.`);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="bg-[#1A1D2E] border border-[#2A2D3E] rounded-2xl p-5 text-center">
      <p className="text-xs text-slate-600 uppercase tracking-widest mb-2">นับถอยหลังงวดถัดไป</p>
      <p className="text-4xl font-mono font-bold text-[#C9A84C] tracking-widest">{remaining || "--:--:--"}</p>
      {nextStr && <p className="text-xs text-slate-500 mt-2">ออก {nextStr}</p>}
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="bg-[#1A1D2E] border border-[#2A2D3E] rounded-2xl p-10 text-center space-y-3">
      <p className="text-4xl">🇱🇦</p>
      <p className="text-slate-300 font-semibold">กำลังสะสมข้อมูล...</p>
      <p className="text-sm text-slate-600">ยังไม่มีข้อมูลผลหวยลาวในระบบ</p>
      <p className="text-xs text-slate-700">รันสคริปต์ fetch-lao.mjs เพื่อเพิ่มข้อมูลงวดแรก</p>
    </div>
  );
}

// ─── Hot / Cold ──────────────────────────────────────────────────────────────
function HotColdSection({ digit }: { digit: 2 | 3 }) {
  const { hot, cold } = useMemo(() => getDailyHotCold(data, digit), [digit]);
  if (data.length === 0) return null;

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="bg-[#1A1D2E] border border-[#2A2D3E] rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Flame size={14} className="text-red-400" />
          <p className="text-sm font-semibold text-slate-300">เลขร้อน — ออกบ่อยใน 30 งวดล่าสุด</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {hot.map((s) => (
            <div key={s.num} className="flex flex-col items-center bg-[#0F1117] border border-[#2A2D3E] rounded-xl px-2.5 py-1.5">
              <span className="font-mono font-bold text-base text-red-400">{s.num}</span>
              <span className="text-[9px] text-slate-600">{s.recent}x</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-[#1A1D2E] border border-[#2A2D3E] rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Snowflake size={14} className="text-blue-400" />
          <p className="text-sm font-semibold text-slate-300">เลขค้าง — ไม่ออกมานานที่สุด</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {cold.map((s) => (
            <div key={s.num} className="flex flex-col items-center bg-[#0F1117] border border-[#2A2D3E] rounded-xl px-2.5 py-1.5">
              <span className="font-mono font-bold text-base text-blue-400">{s.num}</span>
              <span className="text-[9px] text-slate-600">ค้าง {s.gap}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Day of Week Pattern ─────────────────────────────────────────────────────
function DayPatternSection({ digit }: { digit: 2 | 3 }) {
  const patterns = useMemo(() => getDayOfWeekPattern(data, digit), [digit]);
  const today = getTodayDayThai();
  if (patterns.length === 0) return null;

  return (
    <div className="bg-[#1A1D2E] border border-[#2A2D3E] rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Calendar size={14} className="text-[#C9A84C]" />
        <p className="text-sm font-semibold text-slate-300">แพทเทิร์นตามวัน — เลขที่ออกบ่อยแต่ละวัน</p>
      </div>
      <div className="space-y-2">
        {patterns.map((p) => (
          <div key={p.day} className={`flex items-center gap-3 rounded-xl px-3 py-2 ${
            p.day === today ? "bg-[#C9A84C]/10 border border-[#C9A84C]/30" : "bg-[#0F1117]"
          }`}>
            <span className={`text-xs font-semibold w-16 shrink-0 ${p.day === today ? "text-[#C9A84C]" : "text-slate-500"}`}>
              {p.day}{p.day === today ? " ◀" : ""}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {p.top2.map((n) => (
                <span key={n} className={`font-mono text-xs px-2 py-0.5 rounded-lg border ${
                  p.day === today
                    ? "text-[#C9A84C] border-[#C9A84C]/40 bg-[#C9A84C]/5"
                    : "text-slate-400 border-[#2A2D3E]"
                }`}>{n}</span>
              ))}
            </div>
            <span className="text-[10px] text-slate-700 ml-auto">{p.count} งวด</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Signal Convergence ──────────────────────────────────────────────────────
function SignalSection() {
  const signals = useMemo(() => getDailySignalConvergence(data), []);
  if (signals.length === 0) return null;

  const today = getTodayDayThai();

  return (
    <div className="bg-[#1A1D2E] border border-[#C9A84C]/20 rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm">⚡</span>
        <p className="text-sm font-semibold text-slate-300">Signal Convergence — เลขโดดเด่น{today}นี้</p>
        <span className="text-[10px] text-slate-600 ml-auto">จาก 5 สัญญาณ</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {signals.slice(0, 10).map((s) => (
          <div key={s.num} className="flex flex-col items-center bg-[#C9A84C]/10 border border-[#C9A84C]/30 rounded-xl px-3 py-2 min-w-[56px]">
            <span className="font-mono font-bold text-lg text-[#C9A84C]">{s.num}</span>
            <span className="text-[9px] text-[#C9A84C]/60">{s.score}/5 signal</span>
            <div className="flex flex-wrap gap-0.5 mt-1 justify-center">
              {s.signals.map((sig) => (
                <span key={sig} className="text-[8px] bg-[#C9A84C]/20 text-[#C9A84C]/80 px-1 rounded">{sig}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-slate-700">* คำนวณจากสัญญาณสถิติ — ไม่ใช่การทำนาย</p>
    </div>
  );
}

// ─── Number Checker ──────────────────────────────────────────────────────────
function CheckerSection() {
  const [input, setInput] = useState("");
  const [digit, setDigit] = useState<2 | 3>(2);

  const result = useMemo(() => {
    const num = input.trim().padStart(digit, "0");
    if (input.trim().length === 0 || num.length !== digit || !/^\d+$/.test(num)) return null;
    if (data.length === 0) return null;
    return analyzeDailyNumber(data, num, digit);
  }, [input, digit]);

  return (
    <div className="bg-[#1A1D2E] border border-[#2A2D3E] rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Search size={16} className="text-[#C9A84C]" />
        <p className="text-sm font-semibold text-slate-300">เช็คเลข</p>
      </div>

      <div className="flex gap-2">
        {([2, 3] as const).map((d) => (
          <button
            key={d}
            onClick={() => { setDigit(d); setInput(""); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              digit === d
                ? "bg-[#C9A84C] text-[#0F1117]"
                : "bg-[#0F1117] text-slate-400 border border-[#2A2D3E]"
            }`}
          >
            ท้าย {d} ตัว
          </button>
        ))}
      </div>

      <input
        type="text"
        maxLength={digit}
        value={input}
        onChange={(e) => { if (/^\d*$/.test(e.target.value)) setInput(e.target.value); }}
        placeholder={digit === 2 ? "เช่น  2 3" : "เช่น  5 2 3"}
        className="w-full bg-[#0F1117] border border-[#2A2D3E] rounded-xl px-4 py-3 text-3xl font-mono font-bold text-slate-200 placeholder-slate-800 focus:outline-none focus:border-[#C9A84C]/60 tracking-widest text-center transition-colors"
      />

      {data.length === 0 && (
        <p className="text-xs text-slate-600 text-center">ยังไม่มีข้อมูล — เพิ่มข้อมูลก่อนเพื่อใช้งาน</p>
      )}

      {result && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[#0F1117] rounded-xl p-3 text-center">
              <p className="text-xs text-slate-600">ออกทั้งหมด</p>
              <p className="text-2xl font-bold text-slate-200">{result.freq}</p>
              <p className="text-[10px] text-slate-700">ครั้ง</p>
            </div>
            <div className="bg-[#0F1117] rounded-xl p-3 text-center">
              <p className="text-xs text-slate-600">ค้างงวด</p>
              <p className={`text-2xl font-bold ${result.gap >= 15 ? "text-orange-400" : result.gap >= 7 ? "text-yellow-400" : "text-slate-300"}`}>
                {result.gap === result.total ? "∞" : result.gap}
              </p>
              <p className="text-[10px] text-slate-700">งวด</p>
            </div>
            <div className="bg-[#0F1117] rounded-xl p-3 text-center">
              <p className="text-xs text-slate-600">แนวโน้ม</p>
              <p className={`text-2xl font-bold ${result.trend === "up" ? "text-emerald-400" : result.trend === "down" ? "text-red-400" : "text-slate-500"}`}>
                {result.trend === "up" ? "↑" : result.trend === "down" ? "↓" : "→"}
              </p>
              <p className="text-[10px] text-slate-700">{result.trend === "up" ? "ขึ้น" : result.trend === "down" ? "ลง" : "ทรงตัว"}</p>
            </div>
          </div>

          {result.neverAppeared && (
            <div className="bg-yellow-500/5 border border-yellow-500/30 rounded-xl px-4 py-3">
              <p className="text-xs text-yellow-400">⚠️ ไม่เคยออกเลยในข้อมูลที่มี</p>
            </div>
          )}

          {result.lastSeen && (
            <p className="text-xs text-slate-600">ออกล่าสุด: <span className="text-slate-400">{result.lastSeen}</span></p>
          )}

          {/* Day breakdown */}
          <div className="bg-[#0F1117] rounded-xl p-3 space-y-2">
            <p className="text-xs text-slate-600">ออกบ่อยวันไหน</p>
            <div className="flex flex-wrap gap-2">
              {THAI_DAYS.filter((d) => result.dayBreakdown[d] > 0).map((d) => (
                <div key={d} className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-500">{d}</span>
                  <span className="font-bold text-[#C9A84C]">{result.dayBreakdown[d]}x</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LaoPage() {
  const [tab, setTab] = useState<2 | 3>(2);
  const latest = data[0] ?? null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

      {/* Header */}
      <section>
        <div className="flex items-center gap-3 mb-1">
          <Flag size={22} className="text-[#C9A84C]" />
          <h1 className="text-2xl font-bold text-slate-200">หวยลาวพัฒนา</h1>
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">ออก จันทร์ · พุธ · ศุกร์</span>
        </div>
        <p className="text-slate-500 text-sm">สถิติและวิเคราะห์หวยลาวพัฒนา — ออกผล 20:30 น.</p>
      </section>

      {/* Latest result */}
      {latest ? (
        <section className="bg-[#1A1D2E] border border-[#C9A84C]/30 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#2A2D3E] bg-[#C9A84C]/5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-bold text-slate-200">ผลล่าสุด — {latest.dateDisplay}</span>
            </div>
            <span className="text-xs text-slate-500">{latest.dayOfWeek}</span>
          </div>
          <div className="grid grid-cols-3 gap-px bg-[#2A2D3E]">
            {latest.prize1 && (
              <div className="bg-[#1A1D2E] px-3 py-4 text-center">
                <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1.5">รางวัลที่ 1</p>
                <p className="text-2xl font-bold text-[#C9A84C] tracking-widest font-mono">{latest.prize1}</p>
              </div>
            )}
            <div className="bg-[#1A1D2E] px-3 py-4 text-center">
              <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1.5">ท้าย 3 ตัว</p>
              <p className="text-2xl font-bold text-blue-400 tracking-widest font-mono">{latest.prize3back}</p>
            </div>
            <div className="bg-[#1A1D2E] px-3 py-4 text-center">
              <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1.5">ท้าย 2 ตัว</p>
              <p className="text-3xl font-bold text-purple-400 tracking-widest font-mono">{latest.prize2back}</p>
            </div>
          </div>
        </section>
      ) : (
        <section className="bg-[#1A1D2E] border border-[#2A2D3E] rounded-2xl p-6 text-center">
          <p className="text-slate-400 font-medium">รอผลงวดแรก</p>
          <p className="text-xs text-slate-600 mt-1">ข้อมูลจะแสดงเมื่อมีผลหวย</p>
        </section>
      )}

      {/* Countdown */}
      <Countdown />

      {/* Signal Convergence */}
      {data.length >= 5 && <SignalSection />}

      {/* Hot/Cold tabs */}
      {data.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-300">🔥 เลขร้อน / ❄️ เลขค้าง</p>
            <div className="flex gap-1">
              {([2, 3] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setTab(d)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    tab === d
                      ? "bg-[#C9A84C] text-[#0F1117]"
                      : "text-slate-500 hover:text-slate-300 bg-[#1A1D2E] border border-[#2A2D3E]"
                  }`}
                >
                  {d} ตัว
                </button>
              ))}
            </div>
          </div>
          <HotColdSection digit={tab} />
        </section>
      )}

      {/* Day Pattern */}
      {data.length >= 10 && (
        <section className="space-y-3">
          <p className="text-sm font-semibold text-slate-300">📅 แพทเทิร์นตามวันในสัปดาห์</p>
          <DayPatternSection digit={2} />
        </section>
      )}

      {/* Empty state when no data */}
      {data.length === 0 && <EmptyState />}

      {/* Checker */}
      <section>
        <CheckerSection />
      </section>

      {/* Disclaimer */}
      <p className="text-xs text-slate-700 text-center py-2">
        ⚠️ สถิติย้อนหลังเท่านั้น — ไม่มีระบบใดทำนายหวยได้ · การเล่นหวยมีความเสี่ยง
      </p>
    </div>
  );
}
