export default function Footer() {
  return (
    <footer className="bg-[#1A1D2E] border-t border-[#2A2D3E] mt-16">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Disclaimer */}
        <div className="bg-[#0F1117] border border-yellow-600/30 rounded-xl p-4 mb-6">
          <p className="text-yellow-500 font-semibold text-sm mb-1">⚠️ ข้อความสำคัญ (Disclaimer)</p>
          <p className="text-slate-400 text-sm leading-relaxed">
            เลขทั้งหมดในเว็บนี้<strong className="text-slate-300">คำนวณจากสถิติข้อมูลในอดีตเท่านั้น ไม่ใช่การทำนายผล</strong>
            การลงทุนซื้อสลากมีความเสี่ยง คุณอาจสูญเสียเงินลงทุนทั้งหมด
            LottoInsight ไม่รับผิดชอบต่อผลการตัดสินใจของผู้ใช้งานทุกกรณี
          </p>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
          <p>© 2568 LottoInsight — วิเคราะห์สถิติหวยไทย</p>
          <p>ข้อมูลอ้างอิงจากสำนักงานสลากกินแบ่งรัฐบาล (GLO)</p>
        </div>
      </div>
    </footer>
  );
}
