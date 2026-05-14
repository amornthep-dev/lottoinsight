"use client";
import { useMemo, useState } from "react";
import {
  FlaskConical, AlertTriangle, ChevronDown, ChevronUp, CheckCircle,
} from "lucide-react";
import Link from "next/link";
import {
  runNarrowBacktest,
  type MethodKey,
  type NarrowBacktestDraw,
} from "@/lib/signature-methods";

// ─── Method display config ─────────────────────────────────────────
const METHOD_CFG: Record<MethodKey, {
  label: string; short: string;
  color: string; bg: string; border: string;
}> = {
  rsi:        { label: "Multi-RSI",        short: "RSI",   color: "text-blue-400",    bg: "bg-blue-400/10",    border: "border-blue-400/30"    },
  transition: { label: "Digit Transition", short: "Trans", color: "text-purple-400",  bg: "bg-purple-400/10",  border: "border-purple-400/30"  },
  loshu:      { label: "Lo Shu Grid",      short: "LoShu", color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/30" },
  fib:        { label: "Fibonacci",        short: "Fib",   color: "text-yellow-400",  bg: "bg-yellow-400/10",  border: "border-yellow-400/30"  },
  kaprekar:   { label: "Kaprekar Chain",   short: "Kap",   color: "text-orange-400",  bg: "bg-orange-400/10",  border: "border-orange-400/30"  },
};

const METHODS_ORDER: MethodKey[] = ["rsi", "transition", "loshu", "fib", "kaprekar"];

// ─── client-side perm helper (for highlighting) ────────────────────
function permsOf2(s: string): string[] {
  if (s.length <= 1) return [s];
  const res = new Set<string>();
  for (let i = 0; i < s.length; i++) {
    const rest = s.slice(0, i) + s.slice(i + 1);
    for (const p of permsOf2(rest)) res.add(s[i] + p);
  }
  return [...res];
}

// ─── Number chip ──────────────────────────────────────────────────
function NumChip({ n, actual }: { n: string; actual: string }) {
  const hit = permsOf2(actual).includes(n);
  if (hit) return (
    <span className="relative inline-flex items-center justify-center font-mono font-bold text-sm px-2 py-1 rounded-lg border-2 border-[#C9A84C] bg-[#C9A84C]/15 text-[#C9A84C]">
      {n}
      <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-emerald-500 rounded-full flex items-center justify-center">
        <CheckCircle size={9} className="text-white" />
      </span>
    </span>
  );
  return (
    <span className="inline-flex items-center justify-center font-mono font-bold text-sm px-2 py-1 rounded-lg border border-[#2A2D3E] bg-[#0F1117] text-slate-500">
      {n}
    </span>
  );
}

// ─── Draw card ────────────────────────────────────────────────────
function DrawCard({ draw, isOpen, onToggle }: {
  draw: NarrowBacktestDraw;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const exactHitsCount = METHODS_ORDER.filter(m => draw.methods[m].exactHit).length;
  const permHitsCount  = METHODS_ORDER.filter(m => draw.methods[m].permHit).length;
  const anyHit = permHitsCount > 0;

  return (
    <div className={`bg-[#1A1D2E] border rounded-2xl overflow-hidden transition-all ${
      anyHit ? "border-[#C9A84C]/40" : "border-[#2A2D3E]"
    }`}>
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#2A2D3E]/20 transition-colors text-left"
      >
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <p className="text-[10px] text-slate-600 uppercase tracking-wide">งวด</p>
            <p className="text-sm font-bold text-slate-200">{draw.date}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-600">ออก:</span>
            <span className="font-mono font-bold text-xl text-[#C9A84C]">{draw.actual2}</span>
          </div>
          {/* Method badges */}
          <div className="hidden sm:flex items-center gap-1 flex-wrap">
            {METHODS_ORDER.map(m => {
              const hit  = draw.methods[m].exactHit;
              const perm = draw.methods[m].permHit;
              const cfg  = METHOD_CFG[m];
              return (
                <span key={m} className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  hit  ? `${cfg.bg} ${cfg.color} border ${cfg.border}` :
                  perm ? `bg-emerald-400/10 text-emerald-400 border border-emerald-400/30` :
                  "bg-[#0F1117] text-slate-700 border border-[#1A1D2E]"
                }`}>
                  {hit ? "✓" : perm ? "↔" : "·"} {cfg.short}
                </span>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {exactHitsCount > 0 && (
            <span className="text-xs font-bold text-[#C9A84C] bg-[#C9A84C]/10 px-2 py-0.5 rounded-full">
              {exactHitsCount} method ถูก
            </span>
          )}
          {isOpen
            ? <ChevronUp  size={16} className="text-slate-600" />
            : <ChevronDown size={16} className="text-slate-600" />
          }
        </div>
      </button>

      {/* Expanded body */}
      {isOpen && (
        <div className="border-t border-[#2A2D3E] divide-y divide-[#2A2D3E]/40">
          {METHODS_ORDER.map(m => {
            const { core, exactHit, permHit } = draw.methods[m];
            const cfg = METHOD_CFG[m];
            return (
              <div key={m} className={`px-5 py-3.5 ${exactHit ? cfg.bg + "/30" : ""}`}>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                    {cfg.label}
                  </span>
                  <span className="text-[10px] text-slate-600">{core.length} core เลข</span>
                  {exactHit && (
                    <span className="text-xs font-bold text-[#C9A84C] flex items-center gap-1">
                      <CheckCircle size={11} /> ถูก exact ✨
                    </span>
                  )}
                  {!exactHit && permHit && (
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle size={11} /> ถูก (เลขกลับ)
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {core.map(n => <NumChip key={n} n={n} actual={draw.actual2} />)}
                </div>
              </div>
            );
          })}

          {/* Score ≥2 consensus row */}
          <div className="px-5 py-3.5 bg-[#0F1117]/60">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-700/60 text-slate-400">
                Score ≥2 (2+ method เห็นพ้อง)
              </span>
              <span className="text-[10px] text-slate-600">
                {draw.top.length} เลข → +เลขกลับ: {draw.focusedPoolSize} เลข
              </span>
              {draw.focusedPerm && (
                <span className="text-xs font-bold text-[#C9A84C]">🎯 อยู่ใน Focused Pool</span>
              )}
            </div>
            {draw.top.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {draw.top.map(e => {
                  const isActualPerm = permsOf2(draw.actual2).includes(e.num);
                  return (
                    <span key={e.num} className={`inline-flex items-center gap-1 font-mono font-bold text-sm px-2 py-1 rounded-lg border ${
                      isActualPerm
                        ? "border-[#C9A84C] bg-[#C9A84C]/15 text-[#C9A84C]"
                        : "border-[#2A2D3E] bg-[#0F1117] text-slate-400"
                    }`}>
                      {e.num}
                      <span className="text-[9px] opacity-50">{e.sc}/5</span>
                    </span>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-700 italic">ไม่มีเลขที่ 2+ method เห็นพ้องงวดนี้</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────
export default function LeaderboardPage() {
  const bt = useMemo(() => runNarrowBacktest(10), []);
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

      {/* Header */}
      <section>
        <h1 className="text-2xl font-bold text-slate-200 flex items-center gap-2">
          <FlaskConical size={24} className="text-[#C9A84C]" />
          Triple Score V2 — Story Board
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          Backtest {bt.total} งวดล่าสุด · คำนวณด้วยข้อมูลก่อนงวดนั้นเท่านั้น ·{" "}
          <span className="text-slate-600">อัปเดตอัตโนมัติทุกงวดใหม่</span>
        </p>
      </section>

      {/* Backtest clarification banner */}
      <div className="rounded-2xl overflow-hidden border border-blue-500/20">
        <div className="bg-blue-500/8 px-5 py-3 flex items-start gap-3">
          <span className="text-xl shrink-0">📋</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-200">
              นี่คือ <span className="text-blue-400">Backtest ย้อนหลัง</span> — ไม่ใช่ prediction งวดนี้
            </p>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              ทดสอบระบบกับผลจริง {bt.total} งวดที่ผ่านมา เพื่อแสดงว่าแต่ละ method แม่นแค่ไหน
              ในข้อมูลจริง — ใช้เป็นเกณฑ์ประเมินความน่าเชื่อถือของระบบ
            </p>
          </div>
          <Link
            href="/analysis"
            className="shrink-0 text-xs font-bold text-[#C9A84C] bg-[#C9A84C]/10 border border-[#C9A84C]/30 px-3 py-1.5 rounded-lg hover:bg-[#C9A84C]/20 transition-colors whitespace-nowrap"
          >
            ดู Triple Score งวดนี้ →
          </Link>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-[#0F1117] border border-yellow-600/20 rounded-xl p-4 flex gap-3">
        <AlertTriangle size={15} className="text-yellow-500 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-400 leading-relaxed">
          <span className="text-yellow-400 font-semibold">สถิติย้อนหลัง — ไม่ใช่การทำนาย </span>
          หวยเป็นการจับสลากสุ่ม ไม่มีสูตรใดการันตีผลได้ ตัวเลขด้านล่างคือสถิติที่ซื่อสัตย์จากข้อมูลจริง
          <span className="text-red-400"> การซื้อสลากมีความเสี่ยง คุณอาจสูญเสียเงินทั้งหมด</span>
        </p>
      </div>

      {/* Method summary */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
          ประสิทธิภาพแต่ละ Method — {bt.total} งวดล่าสุด
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {METHODS_ORDER.map(m => {
            const stats = bt.byMethod[m];
            const hitPct = bt.total > 0 ? (stats.exact / bt.total) * 100 : 0;
            const efficiency = stats.avgPool > 0 ? hitPct / stats.avgPool : 0;
            const cfg = METHOD_CFG[m];
            const isGood = efficiency >= 1.5;

            return (
              <div key={m} className={`bg-[#1A1D2E] border rounded-xl p-4 text-center space-y-1 ${
                isGood ? cfg.border : "border-[#2A2D3E]"
              }`}>
                <p className={`text-2xl font-bold ${isGood ? cfg.color : "text-slate-300"}`}>
                  {stats.exact}
                  <span className="text-base text-slate-500">/{bt.total}</span>
                </p>
                <p className="text-xs font-semibold text-slate-300 leading-tight">{cfg.label}</p>
                <p className="text-[10px] text-slate-600">pool ~{stats.avgPool} เลข</p>
                <p className={`text-[10px] font-bold mt-1 ${isGood ? cfg.color : "text-slate-700"}`}>
                  {efficiency >= 0.1 ? `≈ ${efficiency.toFixed(1)}× สุ่ม` : "< 1× สุ่ม"}
                </p>
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-slate-600 leading-relaxed">
          * "×สุ่ม" = อัตราถูก ÷ % random baseline (pool 9 เลข = สุ่ม 9%/งวด) ·
          ✓ = exact match · ↔ = เลขกลับ · pool = จำนวน core candidates ก่อน expand permutation
        </p>
      </section>

      {/* How to read */}
      <div className="bg-[#1A1D2E] border border-[#2A2D3E] rounded-xl p-5 grid md:grid-cols-3 gap-5 text-xs">
        <div>
          <p className="font-bold text-slate-300 mb-1.5">🔢 Core Pool คืออะไร?</p>
          <p className="text-slate-500 leading-relaxed">
            แต่ละ method คำนวณ "เลข core" 8–12 ตัวจากสูตรของตัวเอง
            <strong className="text-slate-400"> โดยไม่รวมเลขกลับก่อน</strong> เพื่อให้ pool มีขนาดเล็กและมีความหมาย
          </p>
        </div>
        <div>
          <p className="font-bold text-slate-300 mb-1.5">🎯 Score ≥2 คืออะไร?</p>
          <p className="text-slate-500 leading-relaxed">
            เลขที่ปรากฏใน 2+ method พร้อมกัน = "เห็นพ้อง" ค่อย expand รวมเลขกลับ
            → Focused Pool ~{bt.avgFocused} เลข (จาก ~{bt.avgCore} core)
          </p>
        </div>
        <div>
          <p className="font-bold text-slate-300 mb-1.5">📊 ×สุ่ม หมายความว่า?</p>
          <p className="text-slate-500 leading-relaxed">
            RSI pool ~9 เลข = สุ่มได้ถูก 9%/งวด ·
            RSI ถูก {bt.byMethod.rsi.exact}/{bt.total} = {bt.total > 0 ? ((bt.byMethod.rsi.exact/bt.total)*100).toFixed(0) : 0}% ·
            = <span className={`font-bold ${bt.byMethod.rsi.avgPool > 0 && (bt.byMethod.rsi.exact/bt.total*100/bt.byMethod.rsi.avgPool) >= 1.5 ? "text-blue-400" : "text-slate-400"}`}>
              {bt.byMethod.rsi.avgPool > 0
                ? `${(bt.byMethod.rsi.exact/bt.total*100/bt.byMethod.rsi.avgPool).toFixed(1)}× ดีกว่าสุ่ม`
                : "-"}
            </span>
          </p>
        </div>
      </div>

      {/* Draw cards */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
          ผลรายงวด — คลิกเพื่อดูรายละเอียด
        </h2>
        {bt.draws.map((draw, idx) => (
          <DrawCard
            key={idx}
            draw={draw}
            isOpen={openIdx === idx}
            onToggle={() => setOpenIdx(openIdx === idx ? null : idx)}
          />
        ))}
      </section>

      {/* CTA */}
      <section className="bg-[#1A1D2E] border border-[#2A2D3E] rounded-2xl p-6 text-center space-y-3">
        <p className="text-3xl">🔱</p>
        <h3 className="text-lg font-bold text-slate-200">ดู Triple Score งวดนี้แบบ Real-time</h3>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          คำนวณด้วย 5 Method พร้อมกัน — Lo Shu · RSI · Fibonacci · Kaprekar · Digit Transition
          พร้อม visualization แต่ละสูตร
        </p>
        <Link
          href="/analysis"
          className="inline-flex items-center gap-2 bg-[#C9A84C] text-[#0F1117] px-8 py-2.5 rounded-xl font-bold hover:bg-[#F0D080] transition-colors"
        >
          <FlaskConical size={16} />
          ไปดู Triple Score งวดนี้ →
        </Link>
      </section>

    </div>
  );
}
