"use client";
import { useEffect, useState } from "react";
import { Lock, ChevronRight, AlertTriangle, TrendingDown, CheckCircle } from "lucide-react";
import { getPhase1, getPhase2, getPhase3, phaseAlgorithmDesc } from "@/lib/lottery-stats";
import PhaseMethodology from "@/components/PhaseMethodology";

function getNextDrawDate(): Date {
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth(), d = now.getDate();
  if (d < 16) return new Date(y, m, 16, 9, 30, 0);
  return new Date(y, m + 1, 1, 9, 30, 0);
}

function getCurrentPhase(daysLeft: number): number {
  if (daysLeft <= 3) return 3;
  if (daysLeft <= 7) return 2;
  return 1;
}

const phases = [
  {
    id: 1, label: "Phase 1", sets: 20, openAt: "หลังผลออก 3-5 วัน", triggerDays: 999,
    border: "border-emerald-500/40", bg: "bg-emerald-500/5",
    badge: "bg-emerald-500/20 text-emerald-400", numColor: "text-emerald-400",
    dot: "bg-emerald-400", hexColor: "#34d399",
    getData: getPhase1,
  },
  {
    id: 2, label: "Phase 2", sets: 10, openAt: "7 วันก่อนออก", triggerDays: 7,
    border: "border-blue-500/40", bg: "bg-blue-500/5",
    badge: "bg-blue-500/20 text-blue-400", numColor: "text-blue-400",
    dot: "bg-blue-400", hexColor: "#60a5fa",
    getData: getPhase2,
  },
  {
    id: 3, label: "Phase 3", sets: 5, openAt: "3 วันก่อนออก", triggerDays: 3,
    border: "border-orange-500/40", bg: "bg-orange-500/5",
    badge: "bg-orange-500/20 text-orange-400", numColor: "text-orange-400",
    dot: "bg-orange-400", hexColor: "#fb923c",
    getData: getPhase3,
  },
];

export default function PhaseSection() {
  const [daysLeft, setDaysLeft] = useState(0);
  const [hoursLeft, setHoursLeft] = useState(0);
  const [currentPhase, setCurrentPhase] = useState(1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const update = () => {
      const now = new Date();
      const next = getNextDrawDate();
      const diff = next.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      setDaysLeft(days); setHoursLeft(hours);
      setCurrentPhase(getCurrentPhase(days));
    };
    update();
    const t = setInterval(update, 60000);
    return () => clearInterval(t);
  }, []);

  if (!mounted) return null;

  const nextLocked = phases.find((p) => p.id === currentPhase + 1);
  const daysUntilNext = nextLocked ? Math.max(0, daysLeft - nextLocked.triggerDays) : null;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-300">📊 กลุ่มเลขสถิติสูงประจำงวด</h2>
        <p className="text-sm text-slate-500 mt-1">
          วิเคราะห์จากสถิติย้อนหลัง 100 งวด · แต่ละ Phase คัดกรองด้วยเกณฑ์ต่างกัน — ข้อมูลประกอบการตัดสินใจ ไม่ใช่การทำนาย
        </p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 text-xs flex-wrap">
        {phases.map((p) => {
          const isOpen = p.id <= currentPhase;
          const isCurrent = p.id === currentPhase;
          return (
            <div key={p.id} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all ${
                isCurrent ? `${p.badge} ${p.border} font-bold`
                  : isOpen ? "bg-slate-700/40 text-slate-400 border-slate-700"
                  : "text-slate-700 border-slate-800"}`}>
                {isCurrent && <span className={`w-1.5 h-1.5 rounded-full ${p.dot} animate-pulse`} />}
                {isOpen && !isCurrent && <CheckCircle size={10} className="text-slate-500" />}
                {p.label}
              </div>
              {p.id < 3 && <ChevronRight size={12} className="text-slate-700" />}
            </div>
          );
        })}
      </div>

      <div className="space-y-4">
        {phases.map((p) => {
          const isOpen = p.id <= currentPhase;
          const isCurrent = p.id === currentPhase;

          if (isOpen) {
            const data = p.getData();
            return (
              <div key={p.id}
                className={`border ${p.border} ${p.bg} rounded-2xl p-6 space-y-5 ${isCurrent ? "ring-1 ring-current/10" : "opacity-75"}`}>

                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${p.badge}`}>{p.label}</span>
                      {isCurrent
                        ? <span className="text-xs bg-[#C9A84C] text-[#0F1117] px-2 py-0.5 rounded-full font-bold animate-pulse">● ปัจจุบัน</span>
                        : <span className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle size={10} /> เปิดแล้ว</span>
                      }
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">Algorithm: {phaseAlgorithmDesc[p.id]}</p>
                  </div>
                  <span className={`text-2xl font-bold ${isCurrent ? "text-slate-200" : "text-slate-600"}`}>{p.sets} ชุด</span>
                </div>

                {/* Disclaimer */}
                {isCurrent && (
                  <div className="bg-[#0F1117] border border-yellow-600/20 rounded-xl p-4 flex gap-3">
                    <AlertTriangle size={15} className="text-yellow-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-400 leading-relaxed">
                      <span className="text-yellow-400 font-semibold">ข้อมูลวิเคราะห์สถิติ — </span>
                      คัดกรองจากสถิติย้อนหลัง 100 งวด{" "}
                      <span className="text-slate-300 font-semibold">ไม่ใช่การทำนาย</span>{" "}
                      ใช้เป็นข้อมูลประกอบการตัดสินใจเท่านั้น ผลจริงขึ้นอยู่กับโชค
                      <span className="text-red-400"> การซื้อสลากมีความเสี่ยง คุณอาจสูญเสียเงินทั้งหมด</span>
                    </p>
                  </div>
                )}

                {/* Numbers */}
                <div className="space-y-4">
                  {[
                    { label: "เลขท้าย 3 ตัว", nums: data.prize3back },
                    { label: "เลขท้าย 2 ตัว", nums: data.prize2back },
                  ].map(({ label, nums }) => (
                    <div key={label}>
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingDown size={13} className="text-slate-500" />
                        <p className="text-sm font-medium text-slate-300">{label}</p>
                        <span className="text-xs text-slate-600">({nums.length} ชุด)</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {nums.map((n, i) => (
                          <span key={i}
                            className={`font-mono font-bold text-xl px-3 py-1.5 bg-[#0F1117] rounded-xl border border-[#2A2D3E] ${isCurrent ? p.numColor : "text-slate-600"}`}>
                            {n}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* ปุ่มดูวิธีคำนวณ */}
                <PhaseMethodology
                  phaseId={p.id}
                  selected3={data.prize3back}
                  selected2={data.prize2back}
                  phaseColor={p.hexColor}
                />
              </div>
            );
          }

          // ล็อก
          return (
            <div key={p.id} className="border border-[#2A2D3E] rounded-2xl p-5 bg-[#1A1D2E]/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Lock size={16} className="text-slate-600" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-500">{p.label}</span>
                      <span className="text-xs text-slate-700 border border-slate-700 px-2 py-0.5 rounded-full">{p.sets} ชุด</span>
                    </div>
                    <p className="text-xs text-slate-700 mt-0.5">เปิดเมื่อ{p.openAt}</p>
                  </div>
                </div>
                {p.id === currentPhase + 1 && daysUntilNext !== null && (
                  <div className="text-right">
                    <p className="text-xs text-slate-700">อีกประมาณ</p>
                    <p className="text-sm font-bold text-slate-500">{daysUntilNext} วัน {hoursLeft} ชม.</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}

      </div>
    </section>
  );
}
