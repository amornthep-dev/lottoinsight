export default function Footer() {
  return (
    <footer className="bg-[#1E1040] border-t border-[#3D2060] mt-12">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <p className="text-xs text-slate-600 text-center mb-4 leading-relaxed">
          ⚠️ ผลวิเคราะห์สถิติเท่านั้น ไม่สามารถยืนยันผลจริงได้ · ไม่มีระบบใดทำนายผลรางวัลได้
          · LottoInsight ไม่รับผิดชอบต่อการตัดสินใจของผู้ใช้
        </p>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-slate-600">
          <p>© 2569 LottoInsight</p>
          <p>ข้อมูลเพื่อการศึกษาด้านสถิติเท่านั้น</p>
        </div>
      </div>
    </footer>
  );
}
