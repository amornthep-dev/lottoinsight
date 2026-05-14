import lotteryData from "@/data/lottery.json";
import PhaseSection from "@/components/PhaseSection";
import CountdownTimer from "@/components/CountdownTimer";
import ShareCard from "@/components/ShareCard";
import LeaderboardTeaser from "@/components/LeaderboardTeaser";
import TrackRecord from "@/components/TrackRecord";
import HotColdNumbers from "@/components/HotColdNumbers";
import MonthlyPattern from "@/components/MonthlyPattern";
import FeedbackSection from "@/components/FeedbackSection";
import Link from "next/link";
import { BarChart2, Search, FlaskConical } from "lucide-react";
import { calcTripleScore } from "@/lib/signature-methods";

const tripleData = calcTripleScore(lotteryData as typeof lotteryData);

const latest = lotteryData[0];

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">

      {/* Hero */}
      <section className="text-center py-6">
        <h1 className="text-3xl md:text-4xl font-bold text-[#C9A84C] mb-2">
          🎱 LottoInsight
        </h1>
        <p className="text-slate-400 text-lg">
          สถิติหวยไทย 100 งวดย้อนหลัง — ข้อมูลที่คนซื้อหวยควรรู้ก่อนตัดสินใจ
        </p>
        <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
          <Link href="/statistics"
            className="flex items-center gap-2 bg-[#1A1D2E] border border-[#2A2D3E] text-slate-300 px-4 py-2 rounded-xl text-sm hover:border-[#C9A84C]/40 hover:text-[#C9A84C] transition-colors">
            <BarChart2 size={15} /> ดูสถิติเต็ม
          </Link>
          <Link href="/history"
            className="flex items-center gap-2 bg-[#1A1D2E] border border-[#2A2D3E] text-slate-300 px-4 py-2 rounded-xl text-sm hover:border-[#C9A84C]/40 hover:text-[#C9A84C] transition-colors">
            📜 ประวัติย้อนหลัง
          </Link>
        </div>
      </section>

      {/* ผลล่าสุด */}
      <section>
        <h2 className="text-lg font-semibold text-slate-300 mb-4">
          📋 ผลรางวัลล่าสุด — {latest.dateDisplay}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#1A1D2E] border border-[#2A2D3E] rounded-xl p-4 text-center">
            <p className="text-xs text-slate-500 mb-1">รางวัลที่ 1</p>
            <p className="text-3xl font-bold text-[#C9A84C] tracking-widest">{latest.prize1}</p>
          </div>
          <div className="bg-[#1A1D2E] border border-[#2A2D3E] rounded-xl p-4 text-center">
            <p className="text-xs text-slate-500 mb-1">เลขหน้า 3 ตัว</p>
            <div className="flex justify-center gap-3 mt-1">
              {latest.prize3front.map((n, i) => (
                <span key={i} className="text-xl font-bold text-emerald-400">{n}</span>
              ))}
            </div>
          </div>
          <div className="bg-[#1A1D2E] border border-[#2A2D3E] rounded-xl p-4 text-center">
            <p className="text-xs text-slate-500 mb-1">เลขท้าย 3 ตัว</p>
            <div className="flex justify-center gap-3 mt-1">
              {latest.prize3back.map((n, i) => (
                <span key={i} className="text-xl font-bold text-blue-400">{n}</span>
              ))}
            </div>
          </div>
          <div className="bg-[#1A1D2E] border border-[#2A2D3E] rounded-xl p-4 text-center">
            <p className="text-xs text-slate-500 mb-1">เลขท้าย 2 ตัว</p>
            <p className="text-3xl font-bold text-purple-400 tracking-widest">{latest.prize2back}</p>
          </div>
        </div>
      </section>

      {/* Countdown */}
      <CountdownTimer />

      {/* Phase Section — เลขแนะนำ */}
      <PhaseSection />

      {/* Hot/Cold + Monthly Pattern — 2 columns on md+ */}
      <div className="grid md:grid-cols-2 gap-6">
        <HotColdNumbers />
        <MonthlyPattern />
      </div>

      {/* Track Record */}
      <TrackRecord />

      {/* Number Checker CTA */}
      <section className="bg-gradient-to-r from-[#1A1D2E] to-[#1A1D2E] border border-[#C9A84C]/20 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
            <Search size={18} className="text-[#C9A84C]" /> เช็คเลขที่คุณคิดจะซื้อ
          </h2>
          <p className="text-sm text-slate-500 mt-1">วิเคราะห์สถิติย้อนหลัง ความถี่ · แนวโน้ม · คะแนนรวม 0-100</p>
        </div>
        <Link href="/checker"
          className="bg-[#C9A84C] text-[#0F1117] px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-[#F0D080] transition-colors shrink-0">
          ไปเช็คเลข →
        </Link>
      </section>

      {/* Triple Score Teaser */}
      <section className="bg-[#1A1D2E] border border-[#2A2D3E] rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FlaskConical size={16} className="text-[#C9A84C]" />
            <div>
              <h2 className="text-base font-semibold text-slate-300">🔱 Triple Score Analysis</h2>
              <p className="text-xs text-slate-600">Lo Shu · RSI · Fibonacci — 3 มิติ Signature ของเว็บเรา</p>
            </div>
          </div>
          <Link href="/analysis" className="text-xs text-slate-500 hover:text-[#C9A84C] transition-colors">
            ดูเต็ม →
          </Link>
        </div>

        {/* Top numbers preview */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#0F1117] rounded-xl p-3">
            <p className="text-[10px] text-slate-500 mb-2">🥇 ท้าย 2 ตัว — ผ่าน 3/3 method</p>
            <div className="flex flex-wrap gap-1.5">
              {tripleData.top2.filter(e => e.score === 3).slice(0, 8).map(e => (
                <span key={e.num} className="font-mono font-bold text-sm px-2 py-1 rounded-lg border border-[#C9A84C] text-[#C9A84C] bg-[#C9A84C]/10">
                  {e.num}
                </span>
              ))}
              {tripleData.top2.filter(e => e.score === 3).length === 0 && (
                <span className="text-xs text-slate-600">ไม่มีเลขผ่านครบ 3 method</span>
              )}
            </div>
          </div>
          <div className="bg-[#0F1117] rounded-xl p-3">
            <p className="text-[10px] text-slate-500 mb-2">🥈 ท้าย 2 ตัว — ผ่าน 2/3 method</p>
            <div className="flex flex-wrap gap-1.5">
              {tripleData.top2.filter(e => e.score === 2).slice(0, 8).map(e => (
                <span key={e.num} className="font-mono font-bold text-sm px-2 py-1 rounded-lg border border-orange-400/40 text-orange-300 bg-orange-400/5">
                  {e.num}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap text-[10px] text-slate-600">
          <span className="bg-[#0F1117] px-2 py-1 rounded-lg">🟥 Lo Shu = ตำแหน่งในตารางมังกรจีน</span>
          <span className="bg-[#0F1117] px-2 py-1 rounded-lg">📈 RSI = ดัชนีร้อน-เย็นแบบ stock</span>
          <span className="bg-[#0F1117] px-2 py-1 rounded-lg">🌀 Fibonacci = การไหล φ=1.618</span>
        </div>

        <Link href="/analysis"
          className="block w-full text-center bg-[#C9A84C]/10 border border-[#C9A84C]/30 text-[#C9A84C] text-xs font-bold py-2 rounded-xl hover:bg-[#C9A84C]/20 transition-colors">
          ดู Triple Score Analysis เต็ม →
        </Link>
      </section>

      {/* Story Board Teaser */}
      <LeaderboardTeaser />

      {/* Share */}
      <ShareCard />

      {/* Feedback */}
      <FeedbackSection />

    </div>
  );
}
