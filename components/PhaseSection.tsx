"use client";
import { useEffect, useState } from "react";
import { Lock, ChevronRight, AlertTriangle, TrendingDown, CheckCircle, CalendarDays } from "lucide-react";
import { getPhase1, getPhase2, getPhase3, phaseAlgorithmDesc } from "@/lib/lottery-stats";
import PhaseMethodology from "@/components/PhaseMethodology";
import lotteryData from "@/data/lottery.json";

const THAI_MONTHS = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน",
  "กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];

function getNextDrawLabel(): string {
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth(), d = now.getDate();
  const be = y + 543;
  if (d < 16 && new Date(y, m, 16, 9, 30) > now)
    return `16 ${THAI_MONTHS[m]} ${be}`;
  const nm = m + 1 > 11 ? 0 : m + 1;
  const ny = nm === 0 ? y + 1 : y;
  return `1 ${THAI_MONTHS[nm]} ${ny + 543}`;
}

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

const PREVIEW_COUNT = 8;

export default function PhaseSection() {
  const [daysLeft, setDaysLeft] = useState(0);
  const [hoursLeft, setHoursLeft] = useState(0);
  const [currentPhase, setCurrentPhase] = useState(1);
  const [mounted, setMounted] = useState(false);
  const [expandedPhases, setExpandedPhases] = useState<Set<number>>(new Set());

  const toggleExpand = (phaseId: number) =>
    setExpandedPhases(prev => {
      const next = new Set(prev);
      if (next.has(phaseId)) next.delete(phaseId); else next.add(phaseId);
      return next;
    });

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

  if (!mounted) return (
    <section className="space-y-4 animate-pulse">
      <div className="h-7 w-48 bg-[#1A1D2E] rounded-lg" />
      <div className="h-4 w-64 bg-[#1A1D2E] rounded" />
      <div className="h-[160px] bg-[#1A1D2E] border border-[#2A2D3E] rounded-2xl" />
    </section>
  );

  const nextLocked = phases.find((p) => p.id === currentPhase + 1);
  const daysUntilNext = nextLocked ? Math.max(0, daysLeft - nextLocked.triggerDays) : null;

  const nextDrawLabel = getNextDrawLabel();
  const latestDate = lotteryData[0]?.dateDisplay ?? "";

  return (
    <section className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-lg font-semibold text-slate-300">📊 กลุ่มเลขสถิติสูงประจำงวด</h2>
          <div className="flex items-center gap-1.5 bg-[#C9A84C]/10 border border-[#C9A84C]/30 rounded-lg px-3 py-1.5 shrink-0">
            <CalendarDays size={13} className="text-[#C9A84C]" />
            <span className="text-xs font-bold text-[#C9A84C]">งวด {nextDrawLabel}</span>
          </div>
        </div>
        <p className="text-xs text-slate-600">
          วิเคราะห์จาก {lotteryData.length} งวด · ข้อมูลล่าสุด {latestDate}
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
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${p.badge}`}>{p.label}</span>
                    {isCurrent
                      ? <span className="text-xs bg-[#C9A84C] text-[#0F1117] px-2 py-0.5 rounded-full font-bold animate-pulse">● ปัจจุบัน</span>
                      : <span className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle size={10} /> เปิดแล้ว</span>
                    }
                    <span className={`text-lg font-bold whitespace-nowrap ${isCurrent ? "text-slate-200" : "text-slate-600"}`}>{p.sets} ชุด</span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 -mt-2">Algorithm: {phaseAlgorithmDesc[p.id]}</p>

                {/* Disclaimer — compact */}
                {isCurrent && (
                  <div className="flex items-center gap-2 bg-yellow-500/5 border border-yellow-600/20 rounded-lg px-3 py-2">
                    <AlertTriangle size={12} className="text-yellow-500 shrink-0" />
                    <p className="text-[11px] text-slate-500 leading-tight">
                      <span className="text-yellow-500 font-medium">สถิติย้อนหลังเท่านั้น</span>
                      {" "}— ไม่ใช่การทำนาย · ผลจริงขึ้นอยู่กับโชค ·{" "}
                      <span className="text-red-400/70">มีความเสี่ยงสูญเสียเงิน</span>
                    </p>
                  </div>
                )}

                {/* Numbers */}
                {(() => {
                  const isExpanded = expandedPhases.has(p.id);
                  return (
                    <div className="space-y-3">
                      {[
                        { label: "ท้าย 3 ตัว", nums: data.prize3back },
                        { label: "ท้าย 2 ตัว", nums: data.prize2back },
                      ].map(({ label, nums }) => {
                        const visible = isExpanded ? nums : nums.slice(0, PREVIEW_COUNT);
                        const hasMore = nums.length > PREVIEW_COUNT;
                        return (
                          <div key={label}>
                            <div className="flex items-center gap-2 mb-2">
                              <TrendingDown size={12} className="text-slate-600" />
                              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
                              <span className="text-[10px] text-slate-700 bg-[#0F1117] px-1.5 py-0.5 rounded">{nums.length} ชุด</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {visible.map((n, i) => (
                                <span key={i}
                                  className={`font-mono font-bold text-sm px-2.5 py-1 bg-[#0F1117] rounded-lg border ${
                                    isCurrent
                                      ? `border-current/30 ${p.numColor}`
                                      : "border-[#2A2D3E] text-slate-600"
                                  }`}>
                                  {n}
                                </span>
                              ))}
                              {hasMore && !isExpanded && (
                                <button
                                  onClick={() => toggleExpand(p.id)}
                                  className={`font-mono text-sm px-2.5 py-1 bg-[#0F1117] rounded-lg border border-dashed ${
                                    isCurrent ? `border-current/20 ${p.numColor} opacity-60` : "border-[#2A2D3E] text-slate-700"
                                  } hover:opacity-100 transition-opacity`}>
                                  +{nums.length - PREVIEW_COUNT}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {expandedPhases.has(p.id) && (
                        <button
                          onClick={() => toggleExpand(p.id)}
                          className="text-xs text-slate-600 hover:text-slate-400 transition-colors mt-1">
                          ▲ ย่อลง
                        </button>
                      )}
                    </div>
                  );
                })()}

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
