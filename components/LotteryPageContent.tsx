import { fetchSheetResults, fetchPredictions } from "@/lib/sheets";
import { generateAnalysis } from "@/lib/analysis";
import type { LotteryConfig } from "@/lib/lottery-config";
import CountdownTimer from "./CountdownTimer";

function pad(n: string | undefined, d: number): string {
  return (n ?? "").padStart(d, "0");
}

function NumberCard({
  number,
  rank,
  digits,
}: {
  number: string;
  rank: number;
  digits: 2 | 3;
}) {
  return (
    <div className="bg-[#0F1117] border border-[#2A2D3E] hover:border-[#C9A84C]/40 rounded-xl py-3 px-1 text-center transition-colors">
      <p className="text-[10px] text-slate-700 mb-1">#{rank}</p>
      <p
        className={`font-bold text-[#C9A84C] font-mono tracking-widest leading-none ${
          digits === 3 ? "text-2xl" : "text-3xl"
        }`}
      >
        {number}
      </p>
    </div>
  );
}

export default async function LotteryPageContent({
  config,
}: {
  config: LotteryConfig;
}) {
  const [results, allPredictions] = await Promise.all([
    fetchSheetResults(config.sheetGid),
    fetchPredictions(),
  ]);

  /**
   * กรองเฉพาะงวดที่ตรงกับ analysisFilterDay (ถ้ามี config)
   * รูปแบบวันที่: "d/m/yy" → แยก split("/")[0] → parse เป็น int
   */
  const analysisResults = config.analysisFilterDay
    ? results.filter((r) => {
        const day = parseInt(r.date.split("/")[0], 10);
        return day === config.analysisFilterDay;
      })
    : results;

  // สำหรับหวยไทย: ใช้ 3 หลักท้ายของรางวัลที่ 1 แทน prize3
  function derive3Digit(r: (typeof results)[0]): string {
    if (config.id === "thai") return r.prize1?.slice(-3) ?? "";
    return r.prize3 ?? "";
  }

  const withPrize3 = (rs: typeof results) =>
    rs.map((r) => ({ ...r, prize3: derive3Digit(r) }));

  const analysis = generateAnalysis(withPrize3(analysisResults));

  /* ── Retroactive comparison ─────────────────────────── */
  const prevAnalysis =
    analysisResults.length > 1
      ? generateAnalysis(withPrize3(analysisResults.slice(1)))
      : null;

  const lastResult = analysisResults[0] ?? null;

  const predicted3 = prevAnalysis?.threeDigit.map((x) => x.number) ?? [];
  const predicted2 = prevAnalysis?.twoDigit.map((x) => x.number) ?? [];

  const actual3 = lastResult ? pad(derive3Digit(lastResult), 3) : "";
  const actual2a = lastResult ? pad(lastResult.prize2, 2) : "";
  const actual2b = lastResult?.prize2bottom
    ? pad(lastResult.prize2bottom, 2)
    : "";

  const hit3 = actual3 && predicted3.includes(actual3);
  const hit2 =
    (actual2a && predicted2.includes(actual2a)) ||
    (actual2b && predicted2.includes(actual2b));

  const noData = analysisResults.length === 0;

  /* ── Prediction history ────────────────────────────── */
  // กรองเฉพาะ lottery ที่ตรงกับหน้านี้ แล้ว join กับ actual results
  const predictions = allPredictions.filter((p) => p.lottery === config.id);

  // สร้าง map จาก date → actual result (ใช้ date เป็น key)
  const actualByDate = new Map<string, (typeof results)[0]>();
  for (const r of results) {
    actualByDate.set(r.date, r);
  }

  interface PredRow {
    date: string;
    nums3: string[];  // num3_1..5 (กรองค่าว่างออก)
    nums2: string[];  // num2_1..5 (กรองค่าว่างออก)
    actual3: string;
    actual2a: string;
    actual2b: string;
    hit3: boolean;
    hit2: boolean;
    hasActual: boolean;
  }

  const predRows: PredRow[] = predictions
    .slice()
    .reverse()  // เรียงล่าสุดก่อน
    .slice(0, 20)  // แสดงสูงสุด 20 งวด
    .map((p) => {
      const nums3 = [p.num3_1, p.num3_2, p.num3_3, p.num3_4, p.num3_5]
        .filter(Boolean)
        .map((n) => n.trim().padStart(3, "0"));
      const nums2 = [p.num2_1, p.num2_2, p.num2_3, p.num2_4, p.num2_5]
        .filter(Boolean)
        .map((n) => n.trim().padStart(2, "0"));

      const actual = actualByDate.get(p.date);
      const a3 = actual ? pad(actual.prize3, 3) : "";
      const a2a = actual ? pad(actual.prize2, 2) : "";
      const a2b = actual?.prize2bottom ? pad(actual.prize2bottom, 2) : "";

      const h3 = config.show3Digit && a3 !== "" && nums3.includes(a3);
      const h2 = a2a !== "" && nums2.includes(a2a) ||
                 a2b !== "" && nums2.includes(a2b);

      return {
        date: p.date,
        nums3,
        nums2,
        actual3: a3,
        actual2a: a2a,
        actual2b: a2b,
        hit3: h3,
        hit2: h2,
        hasActual: !!actual,
      };
    });

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {/* ── Page title ──────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <span className="text-3xl">{config.flag}</span>
          <span>{config.name}</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          วิเคราะห์จากสถิติย้อนหลัง 30 งวดล่าสุด
        </p>
      </div>

      {/* ── Disclaimer ──────────────────────────────────── */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
        <p className="text-xs text-amber-400/90 text-center leading-relaxed">
          ⚠️{" "}
          <strong className="text-amber-400">
            ผลวิเคราะห์สถิติเท่านั้น ไม่สามารถยืนยันผลจริงได้
          </strong>
          <br />
          ข้อมูลนี้มีวัตถุประสงค์เพื่อการศึกษาด้านสถิติเท่านั้น
          ไม่ใช่การชี้นำหรือแนะนำให้ซื้อ
        </p>
      </div>

      {/* ── Countdown ───────────────────────────────────── */}
      <CountdownTimer config={config} />

      {/* ── No data state ───────────────────────────────── */}
      {noData && (
        <div className="bg-[#1A1D2E] border border-[#2A2D3E] rounded-2xl p-8 text-center">
          <p className="text-slate-500 text-sm">ยังไม่มีข้อมูล</p>
          <p className="text-slate-600 text-xs mt-1">
            กรุณาเพิ่มข้อมูลใน Google Sheets
          </p>
        </div>
      )}

      {/* ── Analysis ────────────────────────────────────── */}
      {!noData && (
        <section className="space-y-3">
          <h2 className="text-base font-bold text-slate-200">
            📊 ผลวิเคราะห์งวดถัดไป
          </h2>

          {/* 3-digit — แสดงเฉพาะหวยที่มีรางวัล 3 ตัว */}
          {config.show3Digit && (
            <div className="bg-[#1A1D2E] border border-[#2A2D3E] rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[#2A2D3E]">
                <h3 className="font-semibold text-slate-200">เลข 3 ตัว</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {analysis.threeDigit.length} ชุดที่น่าสนใจจากสถิติ
                </p>
              </div>
              <div className="p-3 grid grid-cols-5 gap-2">
                {analysis.threeDigit.map((item, i) => (
                  <NumberCard
                    key={item.number}
                    number={item.number}
                    rank={i + 1}
                    digits={3}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 2-digit */}
          <div className="bg-[#1A1D2E] border border-[#2A2D3E] rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#2A2D3E]">
              <h3 className="font-semibold text-slate-200">เลข 2 ตัว</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {analysis.twoDigit.length} ชุดที่น่าสนใจจากสถิติ
              </p>
            </div>
            <div className="p-3 grid grid-cols-5 gap-2">
              {analysis.twoDigit.map((item, i) => (
                <NumberCard
                  key={item.number}
                  number={item.number}
                  rank={i + 1}
                  digits={2}
                />
              ))}
            </div>
          </div>

          {/* Methodology accordion */}
          <details className="bg-[#1A1D2E] border border-[#2A2D3E] rounded-xl overflow-hidden group">
            <summary className="px-4 py-3 cursor-pointer flex items-center justify-between text-sm text-slate-400 hover:text-slate-200 transition-colors select-none [list-style:none] [&::-webkit-details-marker]:hidden">
              <span>🔍 ดูวิธีคำนวณ</span>
              <span className="text-slate-600 group-open:rotate-180 transition-transform duration-200 inline-block">
                ▼
              </span>
            </summary>
            <div className="px-4 pb-4 pt-3 border-t border-[#2A2D3E] space-y-2">
              <p className="text-[11px] text-slate-600 mb-3">
                แต่ละชุดถูกคัดเลือกด้วยวิธีต่างกัน:
              </p>
              {[
                ...(config.show3Digit
                  ? analysis.threeDigit.map((x) => ({ ...x, label: "3 ตัว" }))
                  : []),
                ...analysis.twoDigit.map((x) => ({ ...x, label: "2 ตัว" })),
              ].map((item, i) => (
                <div
                  key={`${item.label}-${item.number}-${i}`}
                  className="flex items-center gap-3 text-xs"
                >
                  <span className="font-mono font-bold text-[#C9A84C] min-w-[2.5rem]">
                    {item.number}
                  </span>
                  <span className="text-slate-600 bg-[#0F1117] px-1.5 py-0.5 rounded text-[10px]">
                    {item.label}
                  </span>
                  <span className="text-slate-500">{item.method}</span>
                </div>
              ))}
            </div>
          </details>
        </section>
      )}

      {/* ── Comparison ──────────────────────────────────── */}
      {lastResult && prevAnalysis && !noData && (
        <section className="space-y-3">
          <h2 className="text-base font-bold text-slate-200">
            🔄 งวดที่แล้ว — เทียบผล
          </h2>
          <div className="bg-[#1A1D2E] border border-[#2A2D3E] rounded-2xl overflow-hidden">
            {/* header row */}
            <div className="px-4 py-2.5 border-b border-[#2A2D3E] flex items-center justify-between gap-2 flex-wrap">
              <p className="text-sm text-slate-300">
                ผลจริงงวด{" "}
                <span className="font-mono text-slate-200">
                  {lastResult.date}
                </span>
              </p>
              <div className="flex gap-2">
                {config.show3Digit && hit3 && (
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    3 ตัว ✓
                  </span>
                )}
                {hit2 && (
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    2 ตัว ✓
                  </span>
                )}
                {(!config.show3Digit || !hit3) && !hit2 && (
                  <span className="text-xs text-slate-600">ไม่ตรง</span>
                )}
              </div>
            </div>

            <div className={`p-4 grid gap-4 ${config.show3Digit ? "grid-cols-2" : "grid-cols-1"}`}>
              {/* 3-digit comparison — เฉพาะหวยที่มีรางวัล 3 ตัว */}
              {config.show3Digit && (
                <div>
                  <p className="text-[11px] text-slate-500 mb-2">
                    ที่วิเคราะห์ไว้ · เลข 3 ตัว
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {predicted3.map((n) => (
                      <span
                        key={n}
                        className={`font-mono font-bold text-sm px-2 py-1 rounded-lg ${
                          n === actual3
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-[#0F1117] text-slate-400"
                        }`}
                      >
                        {n}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-3 mb-1">
                    ผลจริง
                  </p>
                  <span className="font-mono font-bold text-2xl text-[#C9A84C]">
                    {actual3 || "—"}
                  </span>
                </div>
              )}

              {/* 2-digit comparison */}
              <div>
                <p className="text-[11px] text-slate-500 mb-2">
                  ที่วิเคราะห์ไว้ · เลข 2 ตัว
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {predicted2.map((n) => (
                    <span
                      key={n}
                      className={`font-mono font-bold text-sm px-2 py-1 rounded-lg ${
                        n === actual2a || n === actual2b
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-[#0F1117] text-slate-400"
                      }`}
                    >
                      {n}
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500 mt-3 mb-1">
                  ผลจริง
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  {actual2a && (
                    <span className="font-mono font-bold text-2xl text-[#C9A84C]">
                      {actual2a}
                    </span>
                  )}
                  {actual2b && actual2b !== actual2a && (
                    <>
                      <span className="text-slate-600 text-xs">·</span>
                      <span className="font-mono font-bold text-2xl text-purple-400">
                        {actual2b}
                      </span>
                    </>
                  )}
                  {!actual2a && !actual2b && (
                    <span className="text-slate-600">—</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Prediction history ──────────────────────────── */}
      {predRows.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-bold text-slate-200">
            🎯 ประวัติการทำนาย
          </h2>
          <div className="bg-[#1A1D2E] border border-[#2A2D3E] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#2A2D3E]">
                    <th className="px-3 py-2.5 text-left text-[11px] text-slate-500 font-medium whitespace-nowrap">
                      งวด
                    </th>
                    {config.show3Digit && (
                      <th className="px-3 py-2.5 text-center text-[11px] text-slate-500 font-medium whitespace-nowrap">
                        ทำนาย 3 ตัว
                      </th>
                    )}
                    <th className="px-3 py-2.5 text-center text-[11px] text-slate-500 font-medium whitespace-nowrap">
                      ทำนาย 2 ตัว
                    </th>
                    {config.show3Digit && (
                      <th className="px-3 py-2.5 text-center text-[11px] text-slate-500 font-medium whitespace-nowrap">
                        ออก 3 ตัว
                      </th>
                    )}
                    <th className="px-3 py-2.5 text-center text-[11px] text-slate-500 font-medium whitespace-nowrap">
                      ออก 2 ตัว
                    </th>
                    <th className="px-3 py-2.5 text-center text-[11px] text-slate-500 font-medium whitespace-nowrap">
                      ผล
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {predRows.map((row, i) => (
                    <tr
                      key={`${row.date}-${i}`}
                      className="border-b border-[#2A2D3E]/50 last:border-0 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-3 py-2.5 text-slate-400 whitespace-nowrap">
                        {row.date}
                      </td>

                      {/* ทำนาย 3 ตัว */}
                      {config.show3Digit && (
                        <td className="px-3 py-2.5">
                          <div className="flex flex-wrap gap-1 justify-center">
                            {row.nums3.length > 0 ? (
                              row.nums3.map((n) => (
                                <span
                                  key={n}
                                  className={`font-mono font-bold px-1.5 py-0.5 rounded ${
                                    row.hasActual && n === row.actual3
                                      ? "bg-emerald-500/20 text-emerald-400"
                                      : "text-slate-400"
                                  }`}
                                >
                                  {n}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-700">—</span>
                            )}
                          </div>
                        </td>
                      )}

                      {/* ทำนาย 2 ตัว */}
                      <td className="px-3 py-2.5">
                        <div className="flex flex-wrap gap-1 justify-center">
                          {row.nums2.length > 0 ? (
                            row.nums2.map((n) => (
                              <span
                                key={n}
                                className={`font-mono font-bold px-1.5 py-0.5 rounded ${
                                  row.hasActual &&
                                  (n === row.actual2a || n === row.actual2b)
                                    ? "bg-emerald-500/20 text-emerald-400"
                                    : "text-slate-400"
                                }`}
                              >
                                {n}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-700">—</span>
                          )}
                        </div>
                      </td>

                      {/* ออก 3 ตัว */}
                      {config.show3Digit && (
                        <td className="px-3 py-2.5 text-center font-mono font-bold">
                          {row.hasActual ? (
                            <span
                              className={
                                row.hit3 ? "text-emerald-400" : "text-slate-400"
                              }
                            >
                              {row.actual3 || "—"}
                            </span>
                          ) : (
                            <span className="text-slate-700 text-[10px]">รอผล</span>
                          )}
                        </td>
                      )}

                      {/* ออก 2 ตัว */}
                      <td className="px-3 py-2.5 text-center font-mono font-bold">
                        {row.hasActual ? (
                          <span className={row.hit2 ? "text-emerald-400" : "text-slate-400"}>
                            {row.actual2a || "—"}
                            {row.actual2b && row.actual2b !== row.actual2a && (
                              <> · <span className="text-purple-400">{row.actual2b}</span></>
                            )}
                          </span>
                        ) : (
                          <span className="text-slate-700 text-[10px]">รอผล</span>
                        )}
                      </td>

                      {/* ผล */}
                      <td className="px-3 py-2.5 text-center">
                        {!row.hasActual ? (
                          <span className="text-[10px] text-slate-700">⏳</span>
                        ) : row.hit3 || row.hit2 ? (
                          <span className="text-emerald-400 font-bold">✓</span>
                        ) : (
                          <span className="text-slate-700">✗</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* สรุปอัตราการทำนาย */}
            {predRows.filter((r) => r.hasActual).length > 0 && (() => {
              const done = predRows.filter((r) => r.hasActual);
              const hits = done.filter((r) => r.hit3 || r.hit2).length;
              const pct = Math.round((hits / done.length) * 100);
              return (
                <div className="border-t border-[#2A2D3E] px-4 py-3 flex items-center justify-between gap-2 flex-wrap">
                  <p className="text-[11px] text-slate-500">
                    ทำนายถูก{" "}
                    <span className="text-slate-300 font-bold">
                      {hits}/{done.length}
                    </span>{" "}
                    งวด
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-24 bg-[#0F1117] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {pct}%
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        </section>
      )}

      {/* ── Recent results table ────────────────────────── */}
      {results.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-bold text-slate-200">📋 ผลย้อนหลัง</h2>
          <div className="bg-[#1A1D2E] border border-[#2A2D3E] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2A2D3E]">
                    <th className="px-3 py-2.5 text-left text-[11px] text-slate-500 font-medium whitespace-nowrap">
                      วันที่
                    </th>
                    <th className="px-3 py-2.5 text-center text-[11px] text-slate-500 font-medium whitespace-nowrap">
                      รางวัลที่ 1
                    </th>
                    {config.show3Digit && (
                      <th className="px-3 py-2.5 text-center text-[11px] text-slate-500 font-medium whitespace-nowrap">
                        {config.id === "thai" ? "ท้าย 3 ตัว (รางวัลที่ 1)" : "เลข 3 ตัว"}
                      </th>
                    )}
                    {config.hasBottomPrize ? (
                      <>
                        <th className="px-3 py-2.5 text-center text-[11px] text-slate-500 font-medium whitespace-nowrap">
                          2 ตัวบน
                        </th>
                        <th className="px-3 py-2.5 text-center text-[11px] text-slate-500 font-medium whitespace-nowrap">
                          2 ตัวล่าง
                        </th>
                      </>
                    ) : (
                      <th className="px-3 py-2.5 text-center text-[11px] text-slate-500 font-medium whitespace-nowrap">
                        เลข 2 ตัว
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {results.slice(0, 10).map((r, i) => (
                    <tr
                      key={`${r.date}-${i}`}
                      className={`border-b border-[#2A2D3E]/50 last:border-0 ${
                        i === 0 ? "bg-[#C9A84C]/5" : ""
                      }`}
                    >
                      <td className="px-3 py-2.5 text-slate-400 whitespace-nowrap text-xs">
                        {r.date}
                      </td>
                      <td className="px-3 py-2.5 text-center font-mono text-slate-300 text-xs">
                        {r.prize1 || "—"}
                      </td>
                      {config.show3Digit && (
                        <td className="px-3 py-2.5 text-center font-mono font-bold text-blue-400">
                          {pad(derive3Digit(r), 3) || "—"}
                        </td>
                      )}
                      {config.hasBottomPrize ? (
                        <>
                          <td className="px-3 py-2.5 text-center font-mono font-bold text-purple-400">
                            {pad(r.prize2top ?? r.prize2, 2) || "—"}
                          </td>
                          <td className="px-3 py-2.5 text-center font-mono font-bold text-pink-400">
                            {pad(r.prize2bottom ?? "", 2) || "—"}
                          </td>
                        </>
                      ) : (
                        <td className="px-3 py-2.5 text-center font-mono font-bold text-purple-400">
                          {pad(r.prize2, 2) || "—"}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
