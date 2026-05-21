"use client";
import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { ChevronDown, ChevronUp, FlaskConical, Lock } from "lucide-react";
import { getDetailedStats } from "@/lib/lottery-stats";

type Props = { phaseId: number; selected3: string[]; selected2: string[]; phaseColor: string };
type Stats = ReturnType<typeof getDetailedStats>;

// ─── Chart Components ─────────────────────────────────────

function BarChartViz({ title, desc, data, selected, color, maxShow = 12 }: {
  title: string; desc: string; data: Record<string, number>;
  selected: string[]; color: string; maxShow?: number;
}) {
  const chartData = useMemo(() =>
    Object.entries(data).filter(([,v]) => v > 0)
      .sort((a, b) => b[1] - a[1]).slice(0, maxShow)
      .map(([num, score]) => ({ num, score: Math.round(score*10)/10, selected: selected.includes(num) })),
    [data, selected, maxShow]);
  if (!chartData.length) return null;
  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-semibold text-slate-200">{title}</p>
        <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
      </div>
      <div style={{ height: Math.max(160, chartData.length * 26) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top:0, right:44, left:34, bottom:0 }}>
            <XAxis type="number" tick={{ fontSize:10, fill:"#475569" }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="num" tick={{ fontSize:11, fill:"#94a3b8", fontFamily:"monospace", fontWeight:"bold" }} width={32} axisLine={false} tickLine={false} />
            <Tooltip cursor={{ fill:"rgba(255,255,255,0.02)" }}
              contentStyle={{ background:"#1E1040", border:"1px solid #3D2060", borderRadius:"8px", fontSize:12, color:"#e2e8f0" }}
              formatter={(v) => [`${v}`, "คะแนน"]} labelFormatter={(l) => `เลข ${l}`} />
            <Bar dataKey="score" radius={[0,4,4,0]} maxBarSize={16}>
              {chartData.map((e, i) => <Cell key={i} fill={e.selected ? color : "#3D2060"} opacity={e.selected ? 1 : 0.45} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-4 text-xs text-slate-600">
        <span className="flex items-center gap-1.5"><span className="w-3 h-2.5 rounded-sm inline-block" style={{ backgroundColor:color }} />คัดเลือก</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-2.5 rounded-sm inline-block bg-[#3D2060]" />ไม่ผ่าน</span>
      </div>
    </div>
  );
}

// Position Frequency — ตารางรายตำแหน่ง
function PositionChart({ posFreq, selected3 }: { posFreq: Stats["posFreq"]; selected3: string[] }) {
  const positions = ["หลักร้อย", "หลักสิบ", "หลักหน่วย"];
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-slate-200">วิเคราะห์ความถี่รายตำแหน่ง (3 ตัว)</p>
      <p className="text-xs text-slate-500">แต่ละตำแหน่งของเลข 3 ตัว — digit ไหนออกบ่อยที่สุด?</p>
      <div className="grid grid-cols-3 gap-3">
        {posFreq.map((pos, pi) => {
          const sorted = Object.entries(pos).sort((a,b) => b[1]-a[1]);
          const maxVal = sorted[0]?.[1] || 1;
          return (
            <div key={pi} className="bg-[#120820] rounded-xl p-3 border border-[#3D2060]">
              <p className="text-xs text-slate-500 mb-2 font-medium">{positions[pi]}</p>
              <div className="space-y-1">
                {sorted.map(([digit, count], di) => (
                  <div key={digit} className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs w-4 text-center" style={{ color: di===0?"#A855F7":"#64748b" }}>{digit}</span>
                    <div className="flex-1 bg-[#3D2060] rounded-full h-1.5">
                      <div className="h-1.5 rounded-full transition-all" style={{ width:`${(count/maxVal)*100}%`, backgroundColor: di===0?"#A855F7":"#334155" }} />
                    </div>
                    <span className="text-xs text-slate-600 w-4">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-slate-600 bg-[#120820] rounded-lg px-3 py-2 border border-[#3D2060]">
        💡 เลขสีทอง = digit ที่ออกบ่อยสุดในตำแหน่งนั้น นำมาประกอบกันได้เลข 3 ตัวที่ "น่าจะเป็นไปได้"
      </p>
    </div>
  );
}

// Digit Sum Chart
function DigitSumChart({ data, hotSums, tab }: { data: Record<number,number>; hotSums: number[]; tab: "2"|"3" }) {
  const chartData = Object.entries(data).map(([s, c]) => ({
    sum: `ผลรวม ${s}`, score: c, hot: hotSums.includes(+s),
  })).sort((a,b) => {
    const aNum = parseInt(a.sum.replace("ผลรวม ",""));
    const bNum = parseInt(b.sum.replace("ผลรวม ",""));
    return aNum - bNum;
  });
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-slate-200">ผลรวมหลัก (Digit Sum) — เลขท้าย {tab} ตัว</p>
      <p className="text-xs text-slate-500">นับว่าผลรวมของ digit เท่าไหร่ออกบ่อยที่สุด แล้วกรองเฉพาะเลขที่มีผลรวมนั้น</p>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top:0, right:10, left:0, bottom:20 }}>
            <XAxis dataKey="sum" tick={{ fontSize:9, fill:"#475569" }} angle={-30} textAnchor="end" interval={0} />
            <YAxis tick={{ fontSize:10, fill:"#475569" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background:"#1E1040", border:"1px solid #3D2060", borderRadius:"8px", fontSize:12 }}
              formatter={(v) => [v, "งวด"]} />
            <Bar dataKey="score" radius={[4,4,0,0]} maxBarSize={28}>
              {chartData.map((e,i) => <Cell key={i} fill={e.hot?"#A855F7":"#3D2060"} opacity={e.hot?1:0.5} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-slate-600">🏆 แถบสีทอง = ผลรวมที่ออกบ่อยที่สุด — เลขแนะนำจะถูกกรองให้มีผลรวมเหล่านี้</p>
    </div>
  );
}

// Draw Date Split
function DrawDateChart({ split, tab }: { split: Stats["drawSplit"]; tab: "2"|"3" }) {
  const d1 = tab==="2" ? split.draw1_2 : split.draw1_3;
  const d16 = tab==="2" ? split.draw16_2 : split.draw16_3;
  const allNums = [...new Set([...Object.keys(d1), ...Object.keys(d16)])];
  const chartData = allNums.map(n => ({ num: n, งวด1: d1[n]||0, งวด16: d16[n]||0 }))
    .filter(d => d.งวด1 > 0 || d.งวด16 > 0)
    .sort((a,b) => (b.งวด1+b.งวด16) - (a.งวด1+a.งวด16)).slice(0, 10);
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-slate-200">งวดที่ 1 vs งวดที่ 16 — แยกวิเคราะห์</p>
      <p className="text-xs text-slate-500">เลขบางตัวออกเฉพาะงวด 1 หรือ 16 — เราใช้ข้อมูลงวดที่ตรงกับงวดที่กำลังจะมาถึง</p>
      <div style={{ height: Math.max(160, chartData.length*26) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top:0, right:44, left:34, bottom:0 }}>
            <XAxis type="number" tick={{ fontSize:10, fill:"#475569" }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="num" tick={{ fontSize:11, fill:"#94a3b8", fontFamily:"monospace" }} width={32} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background:"#1E1040", border:"1px solid #3D2060", borderRadius:"8px", fontSize:12 }} />
            <Bar dataKey="งวด1" fill="#60a5fa" radius={[0,2,2,0]} maxBarSize={10} />
            <Bar dataKey="งวด16" fill="#f97316" radius={[0,2,2,0]} maxBarSize={10} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><span className="w-3 h-2.5 rounded-sm inline-block bg-blue-400" />งวดที่ 1</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-2.5 rounded-sm inline-block bg-orange-400" />งวดที่ 16</span>
      </div>
    </div>
  );
}

// Recency Weight
function RecencyChart({ data, selected, color }: { data: Record<string,number>; selected: string[]; color: string }) {
  const chartData = Object.entries(data).sort((a,b)=>b[1]-a[1]).slice(0,12)
    .map(([num,score]) => ({ num, score: Math.round(score*100)/100, selected: selected.includes(num) }));
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-slate-200">Recency Weighted Score — น้ำหนักตามความใหม่</p>
      <p className="text-xs text-slate-500">งวดล่าสุด weight 1.0 → งวดเก่า weight 0.1 — เลขที่ออกใหม่ๆ ได้คะแนนสูงกว่า</p>
      <div style={{ height: Math.max(160, chartData.length*26) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top:0, right:44, left:34, bottom:0 }}>
            <XAxis type="number" tick={{ fontSize:10, fill:"#475569" }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="num" tick={{ fontSize:11, fill:"#94a3b8", fontFamily:"monospace", fontWeight:"bold" }} width={32} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background:"#1E1040", border:"1px solid #3D2060", borderRadius:"8px", fontSize:12 }}
              formatter={(v) => [v, "คะแนน weighted"]} />
            <Bar dataKey="score" radius={[0,4,4,0]} maxBarSize={16}>
              {chartData.map((e,i) => <Cell key={i} fill={e.selected?color:"#3D2060"} opacity={e.selected?1:0.45} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Gap Std Dev
function GapStdDevChart({ gapData, freqData, selected, color }: {
  gapData: Record<string,number>; freqData: Record<string,number>; selected: string[]; color: string;
}) {
  const chartData = Object.entries(gapData).filter(([,v]) => v < 999 && v >= 0)
    .sort((a,b) => a[1]-b[1]).slice(0, 12)
    .map(([num, sd]) => ({ num, sd: Math.round(sd*10)/10, freq: freqData[num]||0, selected: selected.includes(num) }));
  if (!chartData.length) return null;
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-slate-200">Gap Std. Deviation — ความสม่ำเสมอในการออก</p>
      <p className="text-xs text-slate-500">ค่า SD ต่ำ = ออกสม่ำเสมอทุกกี่งวดเหมือนกัน (ทำนายได้ง่ายกว่า), SD สูง = ออกไม่แน่นอน</p>
      <div style={{ height: Math.max(160, chartData.length*26) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top:0, right:44, left:34, bottom:0 }}>
            <XAxis type="number" tick={{ fontSize:10, fill:"#475569" }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="num" tick={{ fontSize:11, fill:"#94a3b8", fontFamily:"monospace", fontWeight:"bold" }} width={32} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background:"#1E1040", border:"1px solid #3D2060", borderRadius:"8px", fontSize:12 }}
              formatter={(v) => [v, "SD (ยิ่งน้อยยิ่งสม่ำเสมอ)"]} />
            <Bar dataKey="sd" radius={[0,4,4,0]} maxBarSize={16}>
              {chartData.map((e,i) => <Cell key={i} fill={e.selected?color:e.sd<2?"#059669":"#3D2060"} opacity={e.selected?1:0.5} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-slate-600">🟢 สีเขียว = SD ต่ำมาก (สม่ำเสมอสูง)</p>
    </div>
  );
}

// Never Appeared
function NeverAppearedBox({ neverApp, tab }: { neverApp: string[]; tab: "2"|"3" }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-slate-200">เลขที่ยังไม่เคยออกเลย</p>
      <p className="text-xs text-slate-500">
        เลขท้าย {tab} ตัวที่ไม่เคยปรากฏในประวัติทั้งหมด ({neverApp.length} ตัว)
      </p>
      <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
        {neverApp.slice(0, 30).map((n,i) => (
          <span key={i} className="font-mono text-xs px-2 py-1 bg-[#120820] border border-[#3D2060] rounded-lg text-slate-500">{n}</span>
        ))}
        {neverApp.length > 30 && <span className="text-xs text-slate-600 self-center">+{neverApp.length-30} ตัว</span>}
      </div>
      <div className="bg-[#120820] border border-[#3D2060] rounded-xl p-3 space-y-1">
        <p className="text-xs text-yellow-400 font-semibold">⚠️ มุมมองที่ 1 (เชิงสถิติ):</p>
        <p className="text-xs text-slate-400">เลขที่ "ค้าง" นาน — บางทฤษฎีมองว่า "ถึงเวลาออกแล้ว"</p>
        <p className="text-xs text-blue-400 font-semibold mt-1">💡 มุมมองที่ 2 (ความเป็นจริง):</p>
        <p className="text-xs text-slate-400">แต่ละงวดเป็น random อิสระ 100% — ประวัติไม่ได้การันตีอนาคต</p>
      </div>
    </div>
  );
}

// Pair Correlation
function PairCorrChart({ pairCorr, tab }: { pairCorr: Stats["pairCorr"]; tab: "2"|"3" }) {
  const raw = tab==="2" ? pairCorr.raw2 : pairCorr.raw3;
  const chartData = Object.entries(raw).sort((a,b)=>b[1]-a[1]).slice(0,8)
    .map(([pair, score]) => ({ pair: pair.length>6?pair.slice(0,6)+"…":pair, score: Math.round(score*10)/10 }));
  if (!chartData.length) return null;
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-slate-200">Pair Correlation — คู่เลขที่ออกพร้อมกันบ่อย</p>
      <p className="text-xs text-slate-500">วิเคราะห์ว่าเลขไหนมักออกคู่กัน หรือมี digit ร่วมกันในรางวัลต่างๆ</p>
      <div style={{ height: Math.max(140, chartData.length*26) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top:0, right:44, left:50, bottom:0 }}>
            <XAxis type="number" tick={{ fontSize:10, fill:"#475569" }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="pair" tick={{ fontSize:10, fill:"#94a3b8", fontFamily:"monospace" }} width={48} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background:"#1E1040", border:"1px solid #3D2060", borderRadius:"8px", fontSize:12 }}
              formatter={(v) => [v, "ครั้ง"]} />
            <Bar dataKey="score" fill="#8b5cf6" radius={[0,4,4,0]} maxBarSize={16} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Summary Box
function SummaryBox({ nums, color, label }: { nums: string[]; color: string; label: string }) {
  return (
    <div className="bg-[#120820] rounded-xl p-4 border border-[#3D2060]">
      <p className="text-xs font-semibold text-slate-400 mb-3">✅ {label}</p>
      <div className="flex flex-wrap gap-2">
        {nums.map((n,i) => (
          <span key={i} className="font-mono font-bold text-base px-3 py-1 rounded-lg border"
            style={{ borderColor:color+"50", color }}>
            {n}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Criteria Definition per Phase ───────────────────────
type CriterionDef = {
  key: string;
  render: (s: Stats, tab: "2"|"3", sel3: string[], sel2: string[], color: string) => React.ReactNode;
};

const CRITERIA: Record<number, CriterionDef[]> = {
  1: [
    { key:"alltime", render:(s,tab,sel3,sel2,color) =>
      <BarChartViz title="เกณฑ์ที่ 1–2: ความถี่ตลอด 10 ปี" desc="นับว่าเลขแต่ละตัวออกกี่ครั้งในประวัติทั้งหมด — เลขที่ออกบ่อยที่สุดตลอดกาล"
        data={tab==="2"?s.allTimeFreq2:s.allTimeFreq3} selected={tab==="2"?sel2:sel3} color={color} /> },
    { key:"position", render:(s,_tab,sel3) =>
      <PositionChart posFreq={s.posFreq} selected3={sel3} /> },
    { key:"never", render:(s,tab) =>
      <NeverAppearedBox neverApp={tab==="2"?s.neverApp2:s.neverApp3} tab={tab} /> },
  ],
  2: [
    { key:"alltime", render:(s,tab,sel3,sel2,color) =>
      <BarChartViz title="เกณฑ์ที่ 1–2: ความถี่ตลอด 10 ปี" desc="นับจำนวนครั้งที่เลขแต่ละตัวออกในประวัติทั้งหมด"
        data={tab==="2"?s.allTimeFreq2:s.allTimeFreq3} selected={tab==="2"?sel2:sel3} color={color} /> },
    { key:"recent30", render:(s,tab,sel3,sel2,color) =>
      <BarChartViz title="เกณฑ์ที่ 3: ความถี่ 30 งวดล่าสุด" desc="ดูความถี่เฉพาะ 30 งวดล่าสุด เพื่อจับเลขที่กำลัง 'ร้อน' ขึ้นมา"
        data={tab==="2"?s.recent30Freq2:s.recent30Freq3} selected={tab==="2"?sel2:sel3} color={color} /> },
    { key:"never", render:(s,tab) => <NeverAppearedBox neverApp={tab==="2"?s.neverApp2:s.neverApp3} tab={tab} /> },
    { key:"digitsum", render:(s,tab) =>
      <DigitSumChart data={tab==="2"?s.digitSum2:s.digitSum3} hotSums={tab==="2"?[4,5,6,7,8]:[9,10,11,12,13]} tab={tab} /> },
    { key:"drawsplit", render:(s,tab) => <DrawDateChart split={s.drawSplit} tab={tab} /> },
    { key:"combined2", render:(s,tab,sel3,sel2,color) =>
      <BarChartViz title="คะแนนรวม Phase 2" desc="รวมทุกเกณฑ์ด้วยน้ำหนัก — เลข 10 อันดับแรกคือเลขแนะนำ Phase 2"
        data={tab==="2"?s.combinedP2_2:s.combinedP2_3} selected={tab==="2"?sel2:sel3} color={color} /> },
  ],
  3: [
    { key:"alltime", render:(s,tab,sel3,sel2,color) =>
      <BarChartViz title="เกณฑ์ที่ 1–2: ความถี่ตลอด 10 ปี" desc="ความถี่ตลอดกาล — เส้นฐานของทุก Phase"
        data={tab==="2"?s.allTimeFreq2:s.allTimeFreq3} selected={tab==="2"?sel2:sel3} color={color} /> },
    { key:"recent30", render:(s,tab,sel3,sel2,color) =>
      <BarChartViz title="เกณฑ์ที่ 3: ความถี่ 30 งวดล่าสุด" desc="ความถี่ในช่วง 30 งวดล่าสุด"
        data={tab==="2"?s.recent30Freq2:s.recent30Freq3} selected={tab==="2"?sel2:sel3} color={color} /> },
    { key:"never", render:(s,tab) => <NeverAppearedBox neverApp={tab==="2"?s.neverApp2:s.neverApp3} tab={tab} /> },
    { key:"recency", render:(s,tab,sel3,sel2,color) =>
      <RecencyChart data={tab==="2"?s.recency2:s.recency3} selected={tab==="2"?sel2:sel3} color={color} /> },
    { key:"gap", render:(s,tab,sel3,sel2,color) =>
      <BarChartViz title="เกณฑ์ที่ 4: Gap Analysis — หายไปกี่งวดแล้ว" desc="เลขที่หายไปนานผิดปกติได้ bonus คะแนน"
        data={tab==="2"?s.gapScore2:s.gapScore3} selected={tab==="2"?sel2:sel3} color={color} /> },
    { key:"stddev", render:(s,tab,sel3,sel2,color) =>
      <GapStdDevChart gapData={tab==="2"?s.gapStdDev2:s.gapStdDev3} freqData={tab==="2"?s.allTimeFreq2:s.allTimeFreq3}
        selected={tab==="2"?sel2:sel3} color={color} /> },
    { key:"trend", render:(s,tab,sel3,sel2,color) =>
      <BarChartViz title="เกณฑ์ที่ 5: Trending Score — เลขที่กำลังมา" desc="เปรียบความถี่ 12 งวดล่าสุด vs ก่อนหน้า — เลขที่ออกบ่อยขึ้นเรื่อยๆ ได้คะแนนสูง"
        data={tab==="2"?s.trendScore2:s.trendScore3} selected={tab==="2"?sel2:sel3} color={color} /> },
    { key:"combined3", render:(s,tab,sel3,sel2,color) =>
      <BarChartViz title="คะแนนรวม Phase 3 (ทุกเกณฑ์)" desc="รวมทุกเกณฑ์ด้วยน้ำหนักที่คำนวณไว้ — เลข 5 อันดับแรกคือเลขแนะนำ Phase 3"
        data={tab==="2"?s.combinedP3_2:s.combinedP3_3} selected={tab==="2"?sel2:sel3} color={color} /> },
  ],
};

// ─── Main Component ───────────────────────────────────────
export default function PhaseMethodology({ phaseId, selected3, selected2, phaseColor }: Props) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"2"|"3">("2");
  const stats = useMemo(() => getDetailedStats(), []);
  const criteria = CRITERIA[phaseId] || [];
  const isPhase4 = phaseId === 4;
  const selNums = tab==="2" ? selected2 : selected3;

  return (
    <div className="border-t border-[#3D2060] pt-3">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors">
        <FlaskConical size={14} />
        {open ? "ซ่อนวิธีคำนวณ" : "🔬 ดูวิธีคำนวณ"}
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {open && (
        <div className="mt-5 space-y-8">
          {/* Tab */}
          <div className="flex gap-2">
            {(["2","3"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  tab===t ? "border-slate-500 bg-slate-700 text-slate-200" : "border-[#3D2060] text-slate-600 hover:text-slate-400"}`}>
                เลขท้าย {t} ตัว
              </button>
            ))}
          </div>

          {/* Phase 4: แสดงทุกอย่างแต่ blur เลขสุดท้าย */}
          {isPhase4 && (
            <>
              <p className="text-xs text-slate-500 bg-[#1E1040] rounded-xl p-3 border border-[#3D2060]">
                Phase 4 ใช้เกณฑ์ทั้งหมด 8+ ข้อจาก Phase 1–3 รวม Hot Streak, Pair Correlation และ Weighted Final Score
                จากนั้นคัดเลขที่ผ่านทุกเกณฑ์มาเหลือเพียง <strong className="text-[#A855F7]">2 ชุดสุดท้าย</strong>
              </p>
              {CRITERIA[3].map(c => (
                <div key={c.key}>{c.render(stats, tab, selected3, selected2, phaseColor)}</div>
              ))}
              <BarChartViz title="เกณฑ์ที่ 6–7: Hot Streak 6 งวด + Overdue"
                desc="เลขที่ออกซ้ำใน 6 งวดล่าสุด (Hot) และเลขที่ค้างนานผิดปกติ (Overdue)"
                data={tab==="2"?stats.hotStreak.hot2:stats.hotStreak.hot3}
                selected={selNums} color={phaseColor} />
              <PairCorrChart pairCorr={stats.pairCorr} tab={tab} />
              {/* Blur final */}
              <div className="relative rounded-2xl overflow-hidden border border-[#A855F7]/20">
                <div className="blur-sm pointer-events-none select-none p-5 space-y-3">
                  <p className="text-sm font-semibold text-slate-300">เกณฑ์ที่ 8: Weighted Final Score (30/40/30)</p>
                  <div className="h-20 bg-[#1E1040] rounded-xl" />
                  <div className="flex gap-2">
                    {["??","??"].map((n,i) => (
                      <span key={i} className="font-mono font-bold text-2xl px-4 py-2 bg-[#120820] rounded-xl border border-[#3D2060] text-[#A855F7]">{n}</span>
                    ))}
                  </div>
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#120820]/70 backdrop-blur-sm">
                  <Lock size={22} className="text-[#A855F7]" />
                  <p className="text-sm font-bold text-[#A855F7]">เลข 2 ชุดสุดท้าย — เฉพาะสมาชิก</p>
                  <a href="/membership" className="bg-[#A855F7] text-[#120820] px-5 py-2 rounded-full text-sm font-bold hover:bg-[#C084FC] transition-colors">
                    สมัคร 49 บาท/เดือน
                  </a>
                </div>
              </div>
            </>
          )}

          {/* Phase 1-3 */}
          {!isPhase4 && criteria.map((c, idx) => {
            const isLast = idx === criteria.length - 1;
            return (
              <div key={c.key} className="space-y-4">
                {c.render(stats, tab, selected3, selected2, phaseColor)}
                {isLast && (
                  <SummaryBox nums={selNums} color={phaseColor}
                    label={tab==="2"
                      ? `เลขท้าย 2 ตัวที่คัดเลือก (${selected2.length} ชุด)`
                      : `เลขท้าย 3 ตัวที่คัดเลือก (${selected3.length} ชุด)`} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
