import { Lock, CheckCircle, TrendingUp, Bell, Star, Zap } from "lucide-react";

const BENEFITS_FREE = [
  "Phase 1 — เลขแนะนำ 20 ชุด (เปิดหลังออกผล 3-5 วัน)",
  "Phase 2 — เลขแนะนำ 10 ชุด (7 วันก่อนออก)",
  "Phase 3 — เลขแนะนำ 5 ชุด (3 วันก่อนออก)",
  "ดูสถิติทุกประเภท (ความถี่, Gap, Trend, Heat Map)",
  "ประวัติผลย้อนหลังทุกงวด",
  "เปรียบเทียบผลรางวัลกับเลขแนะนำ",
];

const BENEFITS_MEMBER = [
  "Phase 4 — 2 กลุ่มเลขสถิติสูงกว่าค่าเฉลี่ย (วิเคราะห์จากทุกเกณฑ์)",
  "Hot Streak + Pair Correlation (สถิติเชิงลึก)",
  "แจ้งเตือน LINE เมื่อ Phase ใหม่เปิด",
  "Story Board — ดูสถิติย้อนหลัง Phase 4 vs ผลจริง",
  "Vote เลขร่วมกับชุมชน (น้ำหนัก 2x)",
  "Badge สมาชิกในระบบ Comment",
  "Export ข้อมูลสถิติ (CSV)",
];

export default function MembershipPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-10">
      {/* Hero */}
      <section className="text-center py-6">
        <div className="inline-flex items-center gap-2 bg-[#C9A84C]/10 border border-[#C9A84C]/30 rounded-full px-4 py-1.5 mb-4">
          <Star size={14} className="text-[#C9A84C]" />
          <span className="text-sm text-[#C9A84C] font-semibold">LottoInsight Premium</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-200 mb-3">
          ข้อมูลสถิติชั้นสูง <span className="text-[#C9A84C]">Phase 4</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-xl mx-auto">
          2 กลุ่มเลขที่มีสถิติสูงกว่าค่าเฉลี่ย คัดกรองจากทุกเกณฑ์ — ข้อมูลเชิงสถิติ ไม่ใช่การทำนาย
        </p>
      </section>

      {/* Pricing Card */}
      <div className="max-w-sm mx-auto">
        <div className="bg-[#1A1D2E] border border-[#C9A84C]/50 rounded-2xl overflow-hidden relative">
          {/* Glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#C9A84C]/5 to-transparent pointer-events-none" />

          <div className="p-8 text-center">
            <p className="text-slate-400 text-sm mb-2">สมาชิกรายเดือน</p>
            <div className="flex items-end justify-center gap-1 mb-1">
              <span className="text-5xl font-bold text-[#C9A84C]">49</span>
              <span className="text-slate-400 mb-2">บาท</span>
            </div>
            <p className="text-slate-600 text-sm mb-8">ต่อเดือน · ยกเลิกได้ตลอดเวลา</p>

            <button className="w-full bg-[#C9A84C] text-[#0F1117] font-bold py-3.5 rounded-xl hover:bg-[#F0D080] transition-all text-lg">
              สมัครสมาชิกตอนนี้
            </button>
            <p className="text-xs text-slate-600 mt-3">💳 ชำระผ่าน Omise · PromptPay · บัตรเครดิต</p>
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <section className="grid md:grid-cols-2 gap-6">
        {/* Free */}
        <div className="bg-[#1A1D2E] border border-[#2A2D3E] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
              <Zap size={15} className="text-slate-400" />
            </div>
            <div>
              <p className="font-bold text-slate-300">ฟรี</p>
              <p className="text-xs text-slate-600">0 บาท / เดือน</p>
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
        <div className="bg-[#C9A84C]/5 border border-[#C9A84C]/40 rounded-2xl p-6 relative">
          <div className="absolute top-4 right-4 bg-[#C9A84C] text-[#0F1117] text-xs font-bold px-2.5 py-1 rounded-full">
            แนะนำ
          </div>
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-full bg-[#C9A84C]/20 flex items-center justify-center">
              <Star size={15} className="text-[#C9A84C]" />
            </div>
            <div>
              <p className="font-bold text-[#C9A84C]">Premium</p>
              <p className="text-xs text-slate-500">49 บาท / เดือน</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 mb-3">รวมทุกอย่างในแพลนฟรี บวก:</p>
          <ul className="space-y-3">
            {BENEFITS_MEMBER.map(b => (
              <li key={b} className="flex items-start gap-2 text-sm text-slate-300">
                <CheckCircle size={14} className="text-[#C9A84C] shrink-0 mt-0.5" />
                {b}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Phase 4 Preview (Blurred) */}
      <section className="bg-[#1A1D2E] border border-[#C9A84C]/30 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-[#C9A84C]/20">
          <div className="flex items-center gap-2">
            <Lock size={15} className="text-[#C9A84C]" />
            <span className="text-sm font-bold text-[#C9A84C]">Phase 4 — Preview</span>
            <span className="text-xs text-slate-600">(ต้องสมัครสมาชิกเพื่อดูเลขจริง)</span>
          </div>
        </div>
        <div className="p-5 relative">
          {/* Blurred numbers */}
          <div className="filter blur-sm select-none pointer-events-none">
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 mb-2">เลขท้าย 3 ตัว (2 ชุดสุดท้าย)</p>
                <div className="flex gap-3">
                  {["512", "347"].map(n => (
                    <span key={n} className="font-mono font-bold text-2xl px-4 py-2 bg-[#0F1117] border border-[#C9A84C]/30 rounded-xl text-[#C9A84C]">{n}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-2">เลขท้าย 2 ตัว (2 ชุดสุดท้าย)</p>
                <div className="flex gap-3">
                  {["89", "12"].map(n => (
                    <span key={n} className="font-mono font-bold text-2xl px-4 py-2 bg-[#0F1117] border border-[#C9A84C]/30 rounded-xl text-[#C9A84C]">{n}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {/* Paywall overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-[#0F1117]/60 backdrop-blur-[2px]">
            <div className="text-center">
              <Lock size={28} className="text-[#C9A84C] mx-auto mb-2" />
              <p className="text-sm font-bold text-[#C9A84C]">สมาชิกเท่านั้น</p>
              <a href="/membership"
                className="mt-3 inline-block bg-[#C9A84C] text-[#0F1117] px-5 py-2 rounded-full text-sm font-bold hover:bg-[#F0D080] transition-colors">
                สมัคร 49 บาท/เดือน
              </a>
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
            <div key={q} className="bg-[#1A1D2E] border border-[#2A2D3E] rounded-xl p-4">
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
