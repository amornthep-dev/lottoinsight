"use client";
import { useState } from "react";
import { Share2, Copy, CheckCheck } from "lucide-react";
import { getPhase1, getPhase2, getPhase3 } from "@/lib/lottery-stats";
import lotteryData from "@/data/lottery.json";

export default function ShareCard() {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const p1 = getPhase1();
  const p2 = getPhase2();
  const p3 = getPhase3();
  const latest = lotteryData[0];
  const nextDraw = latest.dateDisplay; // ตัวอย่าง

  const shareText = `🎱 LottoInsight — เลขแนะนำประจำงวด
━━━━━━━━━━━━━━━━
📊 Phase 1 (ท้าย 3 ตัว): ${p1.prize3back.slice(0, 5).join(", ")}
📊 Phase 2 (ท้าย 3 ตัว): ${p2.prize3back.slice(0, 3).join(", ")}
🎯 Phase 3 (ท้าย 3 ตัว): ${p3.prize3back.join(", ")}
━━━━━━━━━━━━━━━━
📊 Phase 1 (ท้าย 2 ตัว): ${p1.prize2back.slice(0, 5).join(", ")}
🎯 Phase 3 (ท้าย 2 ตัว): ${p3.prize2back.join(", ")}
━━━━━━━━━━━━━━━━
คำนวณจากสถิติย้อนหลัง ≠ การทำนาย
🌐 lottoinsight.com`;

  const canNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    try {
      await navigator.share({ title: "LottoInsight — เลขแนะนำ", text: shareText, url: "https://lottoinsight.com" });
    } catch { /* user cancelled */ }
  };

  const handleLine = () => {
    const encoded = encodeURIComponent(shareText);
    window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent("https://lottoinsight.com")}&text=${encoded}`, "_blank");
  };

  const handleFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent("https://lottoinsight.com")}`, "_blank");
  };

  return (
    <section className="bg-[#1E1040] border border-[#3D2060] rounded-2xl overflow-hidden">
      <button
        onClick={canNativeShare ? handleNativeShare : () => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 hover:bg-[#3D2060]/20 transition-colors">
        <div className="flex items-center gap-2 min-w-0">
          <Share2 size={16} className="text-[#A855F7] shrink-0" />
          <span className="text-sm font-semibold text-slate-300 whitespace-nowrap">แชร์เลขแนะนำ</span>
          <span className="text-xs text-slate-600 whitespace-nowrap">
            {canNativeShare ? "แตะเพื่อแชร์" : "LINE · Facebook · Copy"}
          </span>
        </div>
        <span className="text-slate-600 text-sm">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-[#3D2060]">
          {/* Preview Card */}
          <div className="mt-4 bg-[#120820] border border-[#3D2060] rounded-xl p-4 font-mono text-xs text-slate-400 leading-relaxed whitespace-pre-wrap">
            {shareText}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {/* LINE */}
            <button onClick={handleLine}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{ backgroundColor: "#06C755", color: "white" }}>
              <span className="text-base">💬</span> แชร์ LINE
            </button>

            {/* Facebook */}
            <button onClick={handleFacebook}
              className="flex items-center gap-2 bg-[#1877F2] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#166DE0] transition-all">
              <span className="text-base">📘</span> Facebook
            </button>

            {/* Copy */}
            <button onClick={handleCopy}
              className="flex items-center gap-2 bg-[#3D2060] text-slate-300 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#3A3D4E] transition-all">
              {copied ? <CheckCheck size={15} className="text-emerald-400" /> : <Copy size={15} />}
              {copied ? "คัดลอกแล้ว!" : "Copy ข้อความ"}
            </button>
          </div>

          <p className="text-xs text-slate-600">
            ⚠️ กรุณาแชร์พร้อมคำเตือน "คำนวณจากสถิติ ≠ การทำนาย" ทุกครั้ง
          </p>
        </div>
      )}
    </section>
  );
}
