export default function Footer() {
  return (
    <footer className="bg-[#1A1D2E] border-t border-[#2A2D3E] mt-16">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Disclaimer */}
        <p className="text-xs text-slate-600 text-center mb-6">
          ⚠️ ข้อมูลสถิติเพื่อการศึกษาเท่านั้น — ไม่มีระบบใดทำนายลอตเตอรีได้ · LottoInsight ไม่รับผิดชอบต่อการตัดสินใจของผู้ใช้
        </p>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
          <p>© 2568 LottoInsight — วิเคราะห์สถิติหวยไทย</p>
          <p>ข้อมูลอ้างอิงจากสำนักงานสลากกินแบ่งรัฐบาล (GLO)</p>
        </div>
      </div>
    </footer>
  );
}
