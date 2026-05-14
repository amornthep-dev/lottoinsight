"use client";
import { useState, useEffect } from "react";
import { ThumbsUp, Users } from "lucide-react";
import lotteryData from "@/data/lottery.json";

// ข้อมูลจำลอง Vote (จะเชื่อม Supabase ทีหลัง)
const MOCK_VOTES: Record<string, number> = {
  "512": 142, "347": 98, "891": 76, "234": 65, "673": 54,
  "89": 187, "12": 143, "35": 89, "67": 72, "78": 45,
};

const CURRENT_PHASE = 3; // Phase ปัจจุบัน (จะคำนวณจริงทีหลัง)

// เลขตัวอย่างสำหรับ vote (รวมจาก Phase 1-3)
const VOTE_NUMS_3 = ["512", "347", "891", "234", "673", "093", "415", "819", "672", "815"];
const VOTE_NUMS_2 = ["89", "12", "35", "67", "78", "45", "23", "90", "56", "34"];

export default function PollSection() {
  const [voted3, setVoted3] = useState<string | null>(null);
  const [voted2, setVoted2] = useState<string | null>(null);
  const [votes3, setVotes3] = useState<Record<string, number>>(
    Object.fromEntries(VOTE_NUMS_3.map(n => [n, MOCK_VOTES[n] || Math.floor(Math.random() * 80) + 10]))
  );
  const [votes2, setVotes2] = useState<Record<string, number>>(
    Object.fromEntries(VOTE_NUMS_2.map(n => [n, MOCK_VOTES[n] || Math.floor(Math.random() * 120) + 20]))
  );
  const [tab, setTab] = useState<"3" | "2">("2");

  const latest = lotteryData[0];

  const handleVote = (num: string, digits: "3" | "2") => {
    if (digits === "3" && !voted3) {
      setVoted3(num);
      setVotes3(prev => ({ ...prev, [num]: (prev[num] || 0) + 1 }));
    } else if (digits === "2" && !voted2) {
      setVoted2(num);
      setVotes2(prev => ({ ...prev, [num]: (prev[num] || 0) + 1 }));
    }
  };

  const votes = tab === "2" ? votes2 : votes3;
  const voted = tab === "2" ? voted2 : voted3;
  const nums = tab === "2" ? VOTE_NUMS_2 : VOTE_NUMS_3;
  const total = Object.values(votes).reduce((a, b) => a + b, 0);
  const maxVote = Math.max(...Object.values(votes), 1);

  return (
    <section className="bg-[#1A1D2E] border border-[#2A2D3E] rounded-2xl p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-300">🗳️ Poll งวดนี้ — เลขไหนจะออก?</h2>
          <p className="text-xs text-slate-500 mt-0.5">โหวตจากเลขแนะนำทุก Phase · ทุกคนโหวตได้ · สมาชิกน้ำหนัก ×2</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Users size={13} />
          <span>{total.toLocaleString()} โหวต</span>
        </div>
      </div>

      {/* Tab */}
      <div className="flex gap-2">
        {[{ id: "2", label: "ท้าย 2 ตัว" }, { id: "3", label: "ท้าย 3 ตัว" }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as "2" | "3")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              tab === t.id ? "bg-[#C9A84C] text-[#0F1117]" : "bg-[#0F1117] text-slate-400 border border-[#2A2D3E]"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Vote Items */}
      <div className="space-y-2">
        {nums.map(num => {
          const v = votes[num] || 0;
          const pct = Math.round((v / total) * 100);
          const isVoted = voted === num;
          const isLeader = v === maxVote;

          return (
            <div key={num} className="group">
              <div className="flex items-center gap-3">
                {/* Number */}
                <button
                  onClick={() => handleVote(num, tab)}
                  disabled={!!voted}
                  className={`font-mono font-bold text-lg w-16 py-1.5 rounded-xl border transition-all shrink-0 ${
                    isVoted
                      ? "bg-[#C9A84C] text-[#0F1117] border-[#C9A84C]"
                      : voted
                      ? "bg-[#0F1117] text-slate-600 border-[#2A2D3E] cursor-default"
                      : "bg-[#0F1117] text-slate-300 border-[#2A2D3E] hover:border-[#C9A84C]/50 hover:text-[#C9A84C] cursor-pointer"
                  }`}>
                  {num}
                </button>

                {/* Bar */}
                <div className="flex-1 relative">
                  <div className="h-6 bg-[#0F1117] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: voted ? `${pct}%` : "0%",
                        backgroundColor: isVoted ? "#C9A84C" : isLeader && voted ? "#C9A84C44" : "#2A2D3E",
                      }}
                    />
                  </div>
                  {voted && (
                    <div className="absolute inset-0 flex items-center px-3">
                      <span className="text-xs font-medium text-slate-400">{v} โหวต ({pct}%)</span>
                    </div>
                  )}
                </div>

                {/* Leader crown */}
                {isLeader && voted && (
                  <span className="text-sm shrink-0">👑</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!voted && (
        <p className="text-xs text-slate-600 text-center">
          👆 แตะเลขเพื่อโหวต · ผลโหวตจะแสดงหลังเลือก
        </p>
      )}

      {voted && (
        <div className="bg-[#C9A84C]/10 border border-[#C9A84C]/30 rounded-xl p-3 text-center">
          <p className="text-sm text-[#C9A84C] font-semibold">✅ โหวตแล้ว! ขอให้ถูกนะ 🍀</p>
          <p className="text-xs text-slate-500 mt-0.5">ผลจะรู้ {latest.dateDisplay.split(" ").slice(-2).join(" ")}</p>
        </div>
      )}
    </section>
  );
}
