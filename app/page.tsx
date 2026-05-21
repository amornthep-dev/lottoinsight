import Link from "next/link";
import { LOTTERY_ORDER, LOTTERY_CONFIGS } from "@/lib/lottery-config";

const SCHEDULE_LABELS: Record<string, string> = {
  monthly_1_16: "ทุกวันที่ 1 และ 16",
  daily: "ทุกวัน",
  weekdays: "จันทร์–ศุกร์",
};

export default function HomePage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      {/* Hero */}
      <section className="text-center pt-2 pb-4">
        <div className="text-5xl mb-3">🎱</div>
        <h1 className="text-3xl font-bold text-[#A855F7] mb-2">LottoInsight</h1>
        <p className="text-slate-400 text-sm">
          วิเคราะห์สถิติหวย · อัปเดตทุกงวด · 6 ประเภท
        </p>
      </section>

      {/* Disclaimer */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
        <p className="text-xs text-amber-400/90 text-center leading-relaxed">
          ⚠️{" "}
          <strong className="text-amber-400">
            ผลวิเคราะห์สถิติเท่านั้น ไม่สามารถยืนยันผลจริงได้
          </strong>
          <br />
          ข้อมูลนี้มีวัตถุประสงค์เพื่อการศึกษาด้านสถิติเท่านั้น
        </p>
      </div>

      {/* Lottery cards */}
      <section className="space-y-3">
        <p className="text-xs text-slate-600 uppercase tracking-widest">
          เลือกหวยที่ต้องการดู
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {LOTTERY_ORDER.map((id) => {
            const cfg = LOTTERY_CONFIGS[id];
            return (
              <Link
                key={id}
                href={cfg.route}
                className="group bg-[#1E1040] border border-[#3D2060] hover:border-[#A855F7]/50 rounded-2xl p-4 flex items-center gap-4 transition-all hover:bg-[#1E1040]/80"
              >
                <span className="text-4xl shrink-0">{cfg.flag}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-200 group-hover:text-[#A855F7] transition-colors">
                    {cfg.name}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {SCHEDULE_LABELS[cfg.drawSchedule]} · {cfg.drawTimeICT} น.
                  </p>
                </div>
                <span className="text-slate-700 group-hover:text-[#A855F7] transition-colors text-lg">
                  →
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Info */}
      <section className="bg-[#1E1040] border border-[#3D2060] rounded-2xl p-5 space-y-3">
        <h2 className="text-sm font-bold text-slate-300">
          📌 วิเคราะห์อย่างไร?
        </h2>
        <ul className="space-y-2 text-xs text-slate-500">
          <li className="flex items-start gap-2">
            <span className="text-[#A855F7] shrink-0">①</span>
            <span>
              <strong className="text-slate-400">ความถี่สูงสุด</strong> —
              เลขที่ออกบ่อยที่สุดใน 30 งวดล่าสุด
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#A855F7] shrink-0">②</span>
            <span>
              <strong className="text-slate-400">ห่างนานที่สุด</strong> —
              เลขที่ไม่ออกมาให้เห็นนานที่สุด
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#A855F7] shrink-0">③</span>
            <span>
              <strong className="text-slate-400">ร้อนแรง</strong> —
              เลขที่ออกซ้ำใน 7 งวดล่าสุด
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#A855F7] shrink-0">④</span>
            <span>
              <strong className="text-slate-400">รูปแบบผลรวม</strong> —
              เลขที่มีผลรวมหลักตรงกับที่พบบ่อย
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#A855F7] shrink-0">⑤</span>
            <span>
              <strong className="text-slate-400">เย็นชา</strong> — เลขที่ยังไม่เคยออกใน 30 งวด
            </span>
          </li>
        </ul>
      </section>
    </div>
  );
}
