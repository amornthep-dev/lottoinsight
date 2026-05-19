import lotteryData from "@/data/lottery.json";
import PhaseSection from "@/components/PhaseSection";
import CountdownTimer from "@/components/CountdownTimer";
import SignalConvergence from "@/components/SignalConvergence";
import ShareCard from "@/components/ShareCard";
import TrackRecord from "@/components/TrackRecord";
import HotColdNumbers from "@/components/HotColdNumbers";
import MonthlyPattern from "@/components/MonthlyPattern";
import Link from "next/link";
import { BarChart2, Search, FlaskConical, Clock, Flag, Globe } from "lucide-react";

const latest = lotteryData[0];
const prev = lotteryData[1];

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">

      {/* ─── Hero ─────────────────────────────────────────────── */}
      <section className="text-center py-4">
        <p className="text-xs text-slate-600 uppercase tracking-widest mb-2">สถิติหวยไทย · อัปเดตทุกงวด</p>
        <h1 className="text-3xl md:text-4xl font-bold text-[#C9A84C] mb-3">
          🎱 LottoInsight
        </h1>
        <p className="text-slate-400">
          สถิติหวยไทย · เช็คเลข · ดูแนวโน้ม · กลุ่มเลขสถิติสูง
        </p>
      </section>

      {/* ─── ผลล่าสุด ─────────────────────────────────────────── */}
      <section className="bg-[#1A1D2E] border border-[#C9A84C]/30 rounded-2xl overflow-hidden">
        {/* Header งวด */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#2A2D3E] bg-[#C9A84C]/5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm font-bold text-slate-200">ผลล่าสุด — {latest.dateDisplay}</span>
          </div>
          <Link href="/history" className="flex items-center gap-1 text-xs text-slate-500 hover:text-[#C9A84C] transition-colors">
            <Clock size={12} /> ดูย้อนหลัง
          </Link>
        </div>

        {/* รางวัล */}
        {/* รางวัลหลัก — 2 แถว mobile, 4 คอลัมน์ desktop */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#2A2D3E]">
          <div className="bg-[#1A1D2E] px-3 py-4 text-center">
            <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1.5">รางวัลที่ 1</p>
            <p className="text-xl sm:text-2xl font-bold text-[#C9A84C] tracking-widest font-mono">{latest.prize1}</p>
          </div>
          <div className="bg-[#1A1D2E] px-3 py-4 text-center">
            <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1.5">ท้าย 2 ตัว</p>
            <p className="text-2xl sm:text-3xl font-bold text-purple-400 tracking-widest font-mono">{latest.prize2back}</p>
          </div>
          <div className="bg-[#1A1D2E] px-3 py-4 text-center">
            <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1.5">ท้าย 3 ตัว</p>
            <div className="flex justify-center gap-2">
              {latest.prize3back.map((n, i) => (
                <span key={i} className="text-base sm:text-xl font-bold text-blue-400 font-mono">{n}</span>
              ))}
            </div>
          </div>
          <div className="bg-[#1A1D2E] px-3 py-4 text-center">
            <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1.5">หน้า 3 ตัว</p>
            <div className="flex justify-center gap-2">
              {latest.prize3front.map((n, i) => (
                <span key={i} className="text-base sm:text-xl font-bold text-emerald-400 font-mono">{n}</span>
              ))}
            </div>
          </div>
        </div>

        {/* งวดก่อนหน้า */}
        <div className="px-5 py-2.5 border-t border-[#2A2D3E] flex items-center gap-3 flex-wrap">
          <span className="text-[10px] text-slate-700">งวดก่อน ({prev.dateDisplay}):</span>
          <span className="text-[10px] text-slate-600">รางวัลที่ 1 <span className="font-mono text-slate-500">{prev.prize1}</span></span>
          <span className="text-[10px] text-slate-600">ท้าย 2 <span className="font-mono text-slate-500">{prev.prize2back}</span></span>
          <span className="text-[10px] text-slate-600">ท้าย 3 <span className="font-mono text-slate-500">{prev.prize3back.join(", ")}</span></span>
        </div>
      </section>

      {/* ─── Countdown ────────────────────────────────────────── */}
      <CountdownTimer />

      {/* ─── Signal Convergence ───────────────────────────────── */}
      <SignalConvergence />

      {/* ─── กลุ่มเลขสถิติสูง (Phase) ───────────────────────── */}
      <PhaseSection />

      {/* ─── Hot/Cold + Monthly Pattern ─────────────────────── */}
      <div className="grid md:grid-cols-2 gap-6">
        <HotColdNumbers />
        <MonthlyPattern />
      </div>

      {/* ─── Track Record ─────────────────────────────────────── */}
      <TrackRecord />

      {/* ─── Quick Nav (Statistics + Checker + Analysis) ──────── */}
      <section className="grid sm:grid-cols-3 gap-3">
        <Link href="/statistics"
          className="flex items-center gap-3 bg-[#1A1D2E] border border-[#2A2D3E] hover:border-[#C9A84C]/40 rounded-xl p-4 transition-colors group">
          <BarChart2 size={20} className="text-[#C9A84C] shrink-0" />
          <div>
            <p className="text-sm font-semibold text-slate-300 group-hover:text-slate-200">สถิติเต็ม</p>
            <p className="text-xs text-slate-600">Heat Map · Gap · Trend</p>
          </div>
        </Link>
        <Link href="/checker"
          className="flex items-center gap-3 bg-[#C9A84C]/10 border border-[#C9A84C]/30 hover:border-[#C9A84C]/60 rounded-xl p-4 transition-colors group">
          <Search size={20} className="text-[#C9A84C] shrink-0" />
          <div>
            <p className="text-sm font-semibold text-[#C9A84C]">เช็คเลข</p>
            <p className="text-xs text-[#C9A84C]/60">วิเคราะห์เลขที่คิดจะซื้อ</p>
          </div>
        </Link>
        <Link href="/analysis"
          className="flex items-center gap-3 bg-[#1A1D2E] border border-[#2A2D3E] hover:border-[#C9A84C]/40 rounded-xl p-4 transition-colors group">
          <FlaskConical size={20} className="text-[#C9A84C] shrink-0" />
          <div>
            <p className="text-sm font-semibold text-slate-300 group-hover:text-slate-200">Triple Score</p>
            <p className="text-xs text-slate-600">Lo Shu · RSI · Fibonacci</p>
          </div>
        </Link>
      </section>

      {/* ─── หวยต่างประเทศ ────────────────────────────────────── */}
      <section className="space-y-3">
        <p className="text-xs text-slate-600 uppercase tracking-widest">หวยต่างประเทศ</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <Link href="/lao"
            className="flex items-center gap-3 bg-[#1A1D2E] border border-[#2A2D3E] hover:border-[#C9A84C]/40 rounded-xl p-4 transition-colors group">
            <Flag size={20} className="text-[#C9A84C] shrink-0" />
            <div>
              <p className="text-sm font-semibold text-slate-300 group-hover:text-slate-200">หวยลาวพัฒนา</p>
              <p className="text-xs text-slate-600">ออกทุกวัน จันทร์–เสาร์ 20:30 น.</p>
            </div>
            <span className="ml-auto text-xs text-slate-700 group-hover:text-slate-500">→</span>
          </Link>
          <Link href="/hanoi"
            className="flex items-center gap-3 bg-[#1A1D2E] border border-[#2A2D3E] hover:border-[#C9A84C]/40 rounded-xl p-4 transition-colors group">
            <Globe size={20} className="text-[#C9A84C] shrink-0" />
            <div>
              <p className="text-sm font-semibold text-slate-300 group-hover:text-slate-200">หวยฮานอย</p>
              <p className="text-xs text-slate-600">ออกทุกวัน 18:10 น.</p>
            </div>
            <span className="ml-auto text-xs text-slate-700 group-hover:text-slate-500">→</span>
          </Link>
        </div>
      </section>

      {/* ─── Share ────────────────────────────────────────────── */}
      <ShareCard />


    </div>
  );
}
