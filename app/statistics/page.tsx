"use client";
import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, CartesianGrid, Legend,
} from "recharts";
import lotteryData from "@/data/lottery.json";
import { getDetailedStats, getNeverAppeared2, getNeverAppeared3 } from "@/lib/lottery-stats";

const stats = getDetailedStats();

// ─── Heat Map 00-99 ──────────────────────────────────────────
function HeatMap2() {
  const max = Math.max(...Object.values(stats.allTimeFreq2), 1);
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-300 mb-3">🗺️ Heat Map เลขท้าย 2 ตัว (00–99)</h3>
      <div className="grid grid-cols-10 gap-1">
        {Array.from({ length: 100 }, (_, i) => {
          const n = String(i).padStart(2, "0");
          const freq = stats.allTimeFreq2[n] || 0;
          const intensity = freq / max;
          return (
            <div key={n}
              title={`${n}: ออก ${freq} ครั้ง`}
              className="aspect-square rounded flex items-center justify-center text-[9px] font-bold cursor-default transition-transform hover:scale-110"
              style={{
                backgroundColor: freq === 0
                  ? "#1A1D2E"
                  : `rgba(201,168,76,${0.15 + intensity * 0.85})`,
                color: intensity > 0.5 ? "#0F1117" : intensity > 0 ? "#C9A84C" : "#3A3D4E",
                border: `1px solid ${freq === 0 ? "#2A2D3E" : `rgba(201,168,76,${0.3 + intensity * 0.5})`}`,
              }}>
              {n}
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-[#1A1D2E] border border-[#2A2D3E]" /> ไม่เคยออก
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: "rgba(201,168,76,0.3)" }} /> ออกน้อย
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: "rgba(201,168,76,0.9)" }} /> ออกมาก
        </div>
      </div>
    </div>
  );
}

// ─── Frequency Bar Chart ─────────────────────────────────────
function FreqBar({ data, color, label }: { data: Record<string,number>, color: string, label: string }) {
  const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 20);
  const chartData = sorted.map(([num, count]) => ({ num, count }));
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-300 mb-3">{label}</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 16, top: 4, bottom: 4 }}>
          <XAxis type="number" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis dataKey="num" type="category" tick={{ fill: "#94a3b8", fontSize: 11, fontFamily: "monospace" }}
            width={36} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: "#1A1D2E", border: "1px solid #2A2D3E", borderRadius: 8 }}
            labelStyle={{ color: "#e2e8f0", fontFamily: "monospace" }}
            itemStyle={{ color }}
            formatter={(v) => [`${v} ครั้ง`, "ออก"]}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {chartData.map((_, i) => <Cell key={i} fill={i < 5 ? color : `${color}55`} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Trend Line Chart ────────────────────────────────────────
function TrendLine() {
  // Top 5 เลขท้าย 2 ตัวที่ออกบ่อยที่สุด
  const top5_2 = Object.entries(stats.allTimeFreq2).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([n]) => n);
  const colors = ["#C9A84C", "#60a5fa", "#34d399", "#f472b6", "#a78bfa"];

  // สร้างข้อมูล timeline ย้อนหลัง 15 งวด
  const timeline = lotteryData.slice(0, 15).reverse().map(d => {
    const obj: Record<string, number | string> = { date: d.dateDisplay.split(" ").slice(0,2).join(" ") };
    top5_2.forEach(n => { obj[n] = d.prize2back === n ? 1 : 0; });
    return obj;
  });

  // cumulative count
  const cum: Record<string, number> = {};
  const cumData = lotteryData.slice(0, 15).reverse().map(d => {
    top5_2.forEach(n => { cum[n] = (cum[n]||0) + (d.prize2back === n ? 1 : 0); });
    return { date: d.dateDisplay.split(" ").slice(0,2).join(" "), ...Object.fromEntries(top5_2.map(n => [n, cum[n]])) };
  });

  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-300 mb-3">📈 แนวโน้มสะสม เลขท้าย 2 ตัว (Top 5)</h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={cumData} margin={{ left: 4, right: 16, top: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2A2D3E" />
          <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 9 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: "#1A1D2E", border: "1px solid #2A2D3E", borderRadius: 8 }}
            labelStyle={{ color: "#e2e8f0" }}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
          {top5_2.map((n, i) => (
            <Line key={n} type="monotone" dataKey={n} stroke={colors[i]} strokeWidth={2} dot={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Position Freq Chart ─────────────────────────────────────
function PositionFreqChart() {
  const pos = stats.posFreq;
  const positions = ["หลักร้อย", "หลักสิบ", "หลักหน่วย"];
  const colors = ["#34d399", "#60a5fa", "#fb923c"];
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-300 mb-4">🔢 ความถี่รายตำแหน่ง เลขท้าย 3 ตัว</h3>
      <div className="grid grid-cols-3 gap-4">
        {positions.map((label, pi) => {
          const data = Array.from({ length: 10 }, (_, d) => ({
            digit: String(d),
            count: pos[pi][String(d)] || 0,
          })).sort((a, b) => b.count - a.count);
          const maxC = Math.max(...data.map(d => d.count), 1);
          return (
            <div key={label}>
              <p className="text-xs text-slate-500 mb-2 text-center">{label}</p>
              <div className="space-y-1">
                {data.map(({ digit, count }) => (
                  <div key={digit} className="flex items-center gap-2">
                    <span className="text-xs font-mono w-4 text-slate-400">{digit}</span>
                    <div className="flex-1 bg-[#2A2D3E] rounded-full h-2">
                      <div className="h-2 rounded-full transition-all"
                        style={{ width: `${(count / maxC) * 100}%`, backgroundColor: colors[pi] }} />
                    </div>
                    <span className="text-xs text-slate-600 w-4 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Gap Analysis ─────────────────────────────────────────────
function GapAnalysis({ digits }: { digits: 2 | 3 }) {
  const gapData = digits === 2 ? stats.gapScore2 : stats.gapScore3;
  const freq = digits === 2 ? stats.allTimeFreq2 : stats.allTimeFreq3;
  const color = digits === 2 ? "#a78bfa" : "#60a5fa";

  const sorted = Object.entries(gapData).sort((a, b) => b[1] - a[1]).slice(0, 15);
  const chartData = sorted.map(([num, gap]) => ({ num, gap, freq: freq[num] || 0 }));

  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-300 mb-3">
        ⏳ เลข{digits === 2 ? "ท้าย 2 ตัว" : "ท้าย 3 ตัว"}ที่ห่างจากการออกครั้งล่าสุดมากที่สุด (top 15)
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 16, top: 4, bottom: 4 }}>
          <XAxis type="number" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis dataKey="num" type="category" tick={{ fill: "#94a3b8", fontSize: 11, fontFamily: "monospace" }}
            width={36} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: "#1A1D2E", border: "1px solid #2A2D3E", borderRadius: 8 }}
            labelStyle={{ color: "#e2e8f0", fontFamily: "monospace" }}
            formatter={(v, name) => [name === "gap" ? `${v} งวด` : `${v} ครั้ง`, name === "gap" ? "ห่าง" : "ออกทั้งหมด"]}
          />
          <Bar dataKey="gap" radius={[0, 4, 4, 0]} fill={color} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Never Appeared ──────────────────────────────────────────
function NeverAppearedSection() {
  const never2 = getNeverAppeared2();
  const never3 = getNeverAppeared3();
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-300">🚫 เลขที่ยังไม่เคยออกใน Dataset นี้</h3>
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-xs text-yellow-300 leading-relaxed">
        ⚠️ ข้อมูลนี้มี 2 มุมมอง: (1) <strong>ถึงคิว</strong> — เลขพวกนี้ยังไม่เคยออก จึงมีโอกาสออก
        · (2) <strong>ไม่มีแนวโน้ม</strong> — สถิติย้อนหลังไม่มีหลักฐานสนับสนุนเลย
      </div>
      <div>
        <p className="text-xs text-slate-500 mb-2">เลขท้าย 2 ตัว ที่ไม่เคยออก ({never2.length} เลข)</p>
        <div className="flex flex-wrap gap-1.5">
          {never2.map(n => (
            <span key={n} className="font-mono text-sm px-2 py-0.5 bg-[#1A1D2E] border border-[#2A2D3E] rounded-lg text-slate-600">{n}</span>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs text-slate-500 mb-2">เลขท้าย 3 ตัว ที่ไม่เคยออก ({never3.length} เลข)</p>
        <div className="flex flex-wrap gap-1 max-h-40 overflow-y-auto">
          {never3.slice(0, 60).map(n => (
            <span key={n} className="font-mono text-xs px-1.5 py-0.5 bg-[#1A1D2E] border border-[#2A2D3E] rounded text-slate-600">{n}</span>
          ))}
          {never3.length > 60 && <span className="text-xs text-slate-600 self-center">+{never3.length - 60} เลข</span>}
        </div>
      </div>
    </div>
  );
}

// ─── Draw Date Split Chart ────────────────────────────────────
function DrawDateSplitChart({ digits }: { digits: 2 | 3 }) {
  const { draw1_2, draw16_2, draw1_3, draw16_3 } = stats.drawSplit;
  const d1 = digits === 2 ? draw1_2 : draw1_3;
  const d16 = digits === 2 ? draw16_2 : draw16_3;
  const allNums = [...new Set([...Object.keys(d1), ...Object.keys(d16)])];
  const sorted = allNums
    .map(n => ({ num: n, งวด1: d1[n]||0, งวด16: d16[n]||0, total: (d1[n]||0)+(d16[n]||0) }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 12);

  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-300 mb-3">
        📅 ความถี่แยกงวด 1 vs งวด 16 · {digits === 2 ? "ท้าย 2 ตัว" : "ท้าย 3 ตัว"}
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={sorted} layout="vertical" margin={{ left: 20, right: 16, top: 4, bottom: 4 }}>
          <XAxis type="number" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis dataKey="num" type="category" tick={{ fill: "#94a3b8", fontSize: 11, fontFamily: "monospace" }}
            width={36} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: "#1A1D2E", border: "1px solid #2A2D3E", borderRadius: 8 }}
            labelStyle={{ color: "#e2e8f0", fontFamily: "monospace" }}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
          <Bar dataKey="งวด1" stackId="a" fill="#60a5fa" radius={[0, 0, 0, 0]} />
          <Bar dataKey="งวด16" stackId="a" fill="#fb923c" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Digit Sum Chart ──────────────────────────────────────────
function DigitSumSection({ digits }: { digits: 2 | 3 }) {
  const freq = digits === 2 ? stats.digitSum2 : stats.digitSum3;
  const maxSum = digits === 2 ? 18 : 27;
  const data = Array.from({ length: maxSum + 1 }, (_, s) => ({ sum: String(s), count: freq[s] || 0 }));
  const maxCount = Math.max(...data.map(d => d.count), 1);
  const hotSums = data.sort((a, b) => b.count - a.count).slice(0, 3).map(d => d.sum);
  data.sort((a, b) => +a.sum - +b.sum);

  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-300 mb-3">
        ∑ ผลรวมหลัก · {digits === 2 ? "ท้าย 2 ตัว" : "ท้าย 3 ตัว"}
      </h3>
      <div className="flex items-end gap-1 h-28">
        {data.map(({ sum, count }) => {
          const isHot = hotSums.includes(sum);
          return (
            <div key={sum} className="flex-1 flex flex-col items-center gap-0.5">
              <div className="w-full rounded-t transition-all"
                style={{
                  height: `${(count / maxCount) * 80}px`,
                  minHeight: count > 0 ? 2 : 0,
                  backgroundColor: isHot ? "#C9A84C" : "#2A2D3E",
                }} />
              <span className="text-[8px] text-slate-600">{sum}</span>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-slate-500 mt-2">
        🔥 ผลรวมร้อน: {hotSums.map(s => `${s} (ออก ${freq[+s]||0} ครั้ง)`).join(", ")}
      </p>
    </div>
  );
}

// ─── TABS ────────────────────────────────────────────────────
type Tab = "overview" | "freq3" | "freq2" | "gap" | "trend" | "datesum" | "never";
const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "ภาพรวม" },
  { id: "freq3", label: "ท้าย 3 ตัว" },
  { id: "freq2", label: "ท้าย 2 ตัว" },
  { id: "gap", label: "Gap วิเคราะห์" },
  { id: "trend", label: "แนวโน้ม" },
  { id: "datesum", label: "งวด & ผลรวม" },
  { id: "never", label: "ไม่เคยออก" },
];

export default function StatisticsPage() {
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <section>
        <h1 className="text-2xl font-bold text-slate-200">📊 สถิติเลขหวยไทย</h1>
        <p className="text-slate-500 mt-1 text-sm">
          วิเคราะห์จาก {stats.totalDraws} งวด · ข้อมูลตัวอย่าง — สถิติที่แท้จริงจะลึกกว่านี้เมื่อมีข้อมูลย้อนหลัง 10 ปี
        </p>
      </section>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "งวดทั้งหมด", value: String(stats.totalDraws), color: "text-[#C9A84C]" },
          { label: "เลขท้าย 2 ตัวที่ออก", value: String(Object.keys(stats.allTimeFreq2).length), color: "text-emerald-400" },
          { label: "เลขท้าย 3 ตัวที่ออก", value: String(Object.keys(stats.allTimeFreq3).length), color: "text-blue-400" },
          { label: "ไม่เคยออก (2 ตัว)", value: String(getNeverAppeared2().length), color: "text-orange-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-[#1A1D2E] border border-[#2A2D3E] rounded-xl p-4 text-center">
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap shrink-0 ${
              tab === t.id
                ? "bg-[#C9A84C] text-[#0F1117]"
                : "bg-[#1A1D2E] text-slate-400 border border-[#2A2D3E] hover:border-[#C9A84C]/40 hover:text-slate-300"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-[#1A1D2E] border border-[#2A2D3E] rounded-2xl p-6 space-y-8">

        {tab === "overview" && (
          <>
            <HeatMap2 />
            <hr className="border-[#2A2D3E]" />
            <TrendLine />
            <hr className="border-[#2A2D3E]" />
            <PositionFreqChart />
          </>
        )}

        {tab === "freq3" && (
          <>
            <FreqBar data={stats.allTimeFreq3} color="#60a5fa" label="📊 ความถี่ตลอดกาล — เลขท้าย 3 ตัว (Top 20)" />
            <hr className="border-[#2A2D3E]" />
            <FreqBar data={stats.recent30Freq3} color="#34d399" label="🕐 ความถี่ใน 30 งวดล่าสุด — เลขท้าย 3 ตัว" />
            <hr className="border-[#2A2D3E]" />
            <PositionFreqChart />
          </>
        )}

        {tab === "freq2" && (
          <>
            <HeatMap2 />
            <hr className="border-[#2A2D3E]" />
            <FreqBar data={stats.allTimeFreq2} color="#a78bfa" label="📊 ความถี่ตลอดกาล — เลขท้าย 2 ตัว (Top 20)" />
            <hr className="border-[#2A2D3E]" />
            <FreqBar data={stats.recent30Freq2} color="#f472b6" label="🕐 ความถี่ใน 30 งวดล่าสุด — เลขท้าย 2 ตัว" />
          </>
        )}

        {tab === "gap" && (
          <>
            <GapAnalysis digits={2} />
            <hr className="border-[#2A2D3E]" />
            <GapAnalysis digits={3} />
          </>
        )}

        {tab === "trend" && (
          <>
            <TrendLine />
            <hr className="border-[#2A2D3E]" />
            <FreqBar data={stats.trendScore3} color="#34d399" label="🚀 Trending Score — เลขท้าย 3 ตัว (ออกเพิ่มขึ้นเรื่อยๆ)" />
            <hr className="border-[#2A2D3E]" />
            <FreqBar data={stats.trendScore2} color="#C9A84C" label="🚀 Trending Score — เลขท้าย 2 ตัว" />
          </>
        )}

        {tab === "datesum" && (
          <>
            <DrawDateSplitChart digits={2} />
            <hr className="border-[#2A2D3E]" />
            <DrawDateSplitChart digits={3} />
            <hr className="border-[#2A2D3E]" />
            <DigitSumSection digits={2} />
            <hr className="border-[#2A2D3E]" />
            <DigitSumSection digits={3} />
          </>
        )}

        {tab === "never" && <NeverAppearedSection />}
      </div>

      {/* Disclaimer */}
      <div className="border border-yellow-600/20 bg-yellow-500/5 rounded-xl p-4 text-xs text-slate-400 leading-relaxed">
        ⚠️ <span className="text-yellow-400 font-semibold">คำเตือน:</span> สถิติทั้งหมดนี้คำนวณจากข้อมูลย้อนหลังเท่านั้น
        ผลลอตเตอรี่ไทยเป็นการสุ่ม ไม่มีระบบใดที่สามารถทำนายผลได้อย่างแม่นยำ
        <span className="text-red-400"> การลงทุนมีความเสี่ยง คุณอาจสูญเสียเงินลงทุนทั้งหมด</span>
      </div>
    </div>
  );
}
