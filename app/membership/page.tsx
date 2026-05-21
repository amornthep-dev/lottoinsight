"use client";
import { useState } from "react";
import { Lock, CheckCircle, Star, Zap, X, Bell } from "lucide-react";

const BENEFITS_FREE = [
  "Phase 1 — เลขแนะนำ 20 ชุด (เปิดหลังออกผล 3-5 วัน)",
  "Phase 2 — เลขแนะนำ 10 ชุด (7 วันก่อนออก)",
  "Phase 3 — เลขแนะนำ 5 ชุด (3 วันก่อนออก)",
  "ดูสถิติทุกประเภท (ความถี่, Gap, Trend, Heat Map)",
  "ประวัติผลย้อนหลังทุกงวด",
  "Triple Score Analysis (Lo Shu · RSI · Fibonacci)",
];

const BENEFITS_MEMBER = [
  "Phase 4 — 2 กลุ่มเลขสถิติสูงกว่าค่าเฉลี่ย (วิเคราะห์จากทุกเกณฑ์)",
  "Hot Streak + Pair Correlation (สถิติเชิงลึก)",
  "แจ้งเตือน LINE เมื่อ Phase ใหม่เปิด",
  "Backtest ย้อนหลัง — ดูสถิติ Phase 4 vs ผลจริง",
  "Vote เลขร่วมกับชุมชน (น้ำหนัก 2x)",
  "Export ข้อมูลสถิติ (CSV)",
];

function ComingSoonModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    try {
      await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
    } catch {
      // บันทึกไม่สำเร็จ แต่ยังแสดง success ให้ user
    }
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1E1040] border border-[#A855F7]/40 rounded-2xl p-6 max-w-sm w-full space-y-4 relative">
        <button onClick={onClose}
          className="absolute top-4 right-4 text-slate-600 hover:text-slate-400 transition-colors">
          <X size={18} />
        </button>

        {submitted ? (
          <div className="text-center py-4 space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
              <CheckCircle size={24} className="text-emerald-400" />
            </div>
            <p className="font-bold text-slate-200">บันทึกแล้ว!</p>
            <p className="text-sm text-slate-400">
              เราจะแจ้งเตือนที่ <span className="text-[#A855F7]">{email}</span> เมื่อระบบสมาชิกพร้อมใช้งาน
            </p>
            <button onClick={onClose}
              className="w-full bg-[#A855F7] text-[#120820] font-bold py-2.5 rounded-xl hover:bg-[#C084FC] transition-colors text-sm">
              ปิด
            </button>
          </div>
        ) : (
          <>
            <div className="text-center space-y-1">
              <div className="text-3xl mb-2">🚀</div>
              <h3 className="text-lg font-bold text-slate-200">เปิดให้สมัครเร็วๆ นี้</h3>
              <p className="text-sm text-slate-400">ฝากอีเมลไว้ เราจะแจ้งเตือนเมื่อระบบพร้อม</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full bg-[#120820] border border-[#3D2060] focus:border-[#A855F7]/60 rounded-xl px-4 py-3 text-slate-200 text-sm placeholder-slate-700 outline-none transition-colors"
              />
              <button type="submit"
                className="w-full bg-[#A855F7] text-[#120820] font-bold py-3 rounded-xl hover:bg-[#C084FC] transition-colors flex items-center justify-center gap-2">
                <Bell size={15} /> แจ้งเตือนฉัน
              </button>
            </form>

            <p className="text-[10px] text-slate-700 text-center">
              ไม่มีสแปม · ยกเลิกได้ตลอดเวลา
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function MembershipPage() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-10">

      {showModal && <ComingSoonModal onClose={() => setShowModal(false)} />}

      {/* Hero */}
      <section className="text-center py-6">
        <div className="inline-flex items-center gap-2 bg-[#A855F7]/10 border border-[#A855F7]/30 rounded-full px-4 py-1.5 mb-4">
          <Star size={14} className="text-[#A855F7]" />
          <span className="text-sm text-[#A855F7] font-semibold">LottoInsight Premium — เร็วๆ นี้</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-200 mb-3">
          ข้อมูลสถิติชั้นสูง <span className="text-[#A855F7]">Phase 4</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-xl mx-auto">
          2 กลุ่มเลขที่มีสถิติสูงกว่าค่าเฉลี่ย คัดกรองจากทุกเกณฑ์ — ข้อมูลเชิงสถิติ ไม่ใช่การทำนาย
        </p>
      </section>

      {/* Pricing Card */}
      <div className="max-w-sm mx-auto">
        <div className="bg-[#1E1040] border border-[#A855F7]/50 rounded-2xl overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-b from-[#A855F7]/5 to-transparent pointer-events-none" />

          {/* Coming Soon Banner */}
          <div className="bg-[#A855F7]/15 border-b border-[#A855F7]/30 px-4 py-2 text-center">
            <span className="text-xs font-bold text-[#A855F7] uppercase tracking-wider">🚀 เปิดให้สมัครเร็วๆ นี้</span>
          </div>

          <div className="p-8 text-center">
            <p className="text-slate-400 text-sm mb-2">สมาชิกรายเดือน</p>
            <div className="flex items-end justify-center gap-1 mb-1">
              <span className="text-5xl font-bold text-[#A855F7]">49</span>
              <span className="text-slate-400 mb-2">บาท</span>
            </div>
            <p className="text-slate-600 text-sm mb-8">ต่อเดือน · ยกเลิกได้ตลอดเวลา</p>

            <button
              onClick={() => setShowModal(true)}
              className="w-full bg-[#A855F7] text-[#120820] font-bold py-3.5 rounded-xl hover:bg-[#C084FC] transition-all text-lg">
              แจ้งเตือนเมื่อเปิดสมัคร 🔔
            </button>
            <p className="text-xs text-slate-600 mt-3">💳 รองรับ PromptPay · บัตรเครดิต · Omise</p>
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <section className="grid md:grid-cols-2 gap-6">
        {/* Free */}
        <div className="bg-[#1E1040] border border-[#3D2060] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
              <Zap size={15} className="text-slate-400" />
            </div>
            <div>
              <p className="font-bold text-slate-300">ฟรี</p>
              <p className="text-xs text-slate-600">0 บาท / เดือน · ใช้ได้เลย</p>
            </div>
          </div>
          <ul className="space-y-3">
            {BENEFITS_FREE.map(b => (
              <li key={b} className="flex items-start gap-2 text-sm text-slate-400">
                <CheckCircle size={14} className="text-slate-500 shrink-0 mt-0.5" />
                {b}
              </li>
            ))}
          </ul>
        </div>

        {/* Premium */}
        <div className="bg-[#A855F7]/5 border border-[#A855F7]/40 rounded-2xl p-6 relative">
          <div className="absolute top-4 right-4 bg-[#A855F7] text-[#120820] text-xs font-bold px-2.5 py-1 rounded-full">
            เร็วๆ นี้
          </div>
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-full bg-[#A855F7]/20 flex items-center justify-center">
              <Star size={15} className="text-[#A855F7]" />
            </div>
            <div>
              <p className="font-bold text-[#A855F7]">Premium</p>
              <p className="text-xs text-slate-500">49 บาท / เดือน</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 mb-3">รวมทุกอย่างในแพลนฟรี บวก:</p>
          <ul className="space-y-3">
            {BENEFITS_MEMBER.map(b => (
              <li key={b} className="flex items-start gap-2 text-sm text-slate-300">
                <CheckCircle size={14} className="text-[#A855F7] shrink-0 mt-0.5" />
                {b}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Phase 4 Preview (Blurred) */}
      <section className="bg-[#1E1040] border border-[#A855F7]/30 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-[#A855F7]/20">
          <div className="flex items-center gap-2">
            <Lock size={15} className="text-[#A855F7]" />
            <span className="text-sm font-bold text-[#A855F7]">Phase 4 — ตัวอย่าง</span>
            <span className="text-xs text-slate-600">(สมาชิกเท่านั้น)</span>
          </div>
        </div>
        <div className="p-5 relative">
          <div className="filter blur-sm select-none pointer-events-none">
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 mb-2">เลขท้าย 3 ตัว (2 ชุด)</p>
                <div className="flex gap-3">
                  {["512", "347"].map(n => (
                    <span key={n} className="font-mono font-bold text-2xl px-4 py-2 bg-[#120820] border border-[#A855F7]/30 rounded-xl text-[#A855F7]">{n}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-2">เลขท้าย 2 ตัว (2 ชุด)</p>
                <div className="flex gap-3">
                  {["89", "12"].map(n => (
                    <span key={n} className="font-mono font-bold text-2xl px-4 py-2 bg-[#120820] border border-[#A855F7]/30 rounded-xl text-[#A855F7]">{n}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-[#120820]/60 backdrop-blur-[2px]">
            <div className="text-center">
              <Lock size={28} className="text-[#A855F7] mx-auto mb-2" />
              <p className="text-sm font-bold text-[#A855F7]">เปิดให้สมัครเร็วๆ นี้</p>
              <button
                onClick={() => setShowModal(true)}
                className="mt-3 inline-block bg-[#A855F7] text-[#120820] px-5 py-2 rounded-full text-sm font-bold hover:bg-[#C084FC] transition-colors cursor-pointer">
                แจ้งเตือนฉัน 🔔
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-300">❓ คำถามที่พบบ่อย</h2>
        <div className="space-y-3">
          {[
            {
              q: "Phase 4 ดีกว่า Phase 1-3 อย่างไร?",
              a: "Phase 4 ใช้เกณฑ์สถิติมากกว่าและคัดกรองเหลือเพียง 2 กลุ่มที่มีสถิติสูงกว่าค่าเฉลี่ย แต่ทั้งหมดเป็นการวิเคราะห์เชิงสถิติเท่านั้น ไม่ใช่การทำนาย และไม่มีระบบใดการันตีผลได้",
            },
            {
              q: "ยกเลิกสมาชิกได้ตอนไหน?",
              a: "ยกเลิกได้ตลอดเวลา ก่อนต่ออายุในรอบถัดไป สิทธิ์ยังคงอยู่จนสิ้นสุดรอบที่ชำระ",
            },
            {
              q: "ชำระด้วยอะไรได้บ้าง?",
              a: "PromptPay, บัตรเครดิต/เดบิต, และช่องทางอื่นผ่านระบบ Omise",
            },
            {
              q: "มีการรับประกันผลหรือไม่?",
              a: "ไม่มี การลงทุนในสลากกินแบ่งมีความเสี่ยงสูง เว็บนี้ให้ข้อมูลสถิติเพื่อการศึกษาเท่านั้น",
            },
          ].map(({ q, a }) => (
            <div key={q} className="bg-[#1E1040] border border-[#3D2060] rounded-xl p-4">
              <p className="text-sm font-semibold text-slate-300 mb-1">{q}</p>
              <p className="text-sm text-slate-500">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Risk Disclaimer */}
      <div className="border border-red-500/20 bg-red-500/5 rounded-xl p-4 text-xs text-slate-400 leading-relaxed">
        ⚠️ <span className="text-red-400 font-semibold">คำเตือนความเสี่ยง:</span> สลากกินแบ่งรัฐบาลเป็นการพนันที่ถูกกฎหมาย
        ข้อมูลสถิติทั้งหมดในเว็บนี้มีไว้เพื่อการวิเคราะห์และความบันเทิงทางสถิติเท่านั้น
        ไม่ถือเป็นคำแนะนำการลงทุน ผู้ใช้ต้องรับผิดชอบต่อการตัดสินใจซื้อสลากเองทั้งสิ้น
      </div>
    </div>
  );
}
