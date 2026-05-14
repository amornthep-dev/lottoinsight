"use client";
import { useState } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import lotteryData from "@/data/lottery.json";

const PER_PAGE = 10;

export default function HistoryPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = lotteryData.filter(d => {
    if (!search) return true;
    const s = search.replace(/\s/g, "");
    return (
      d.prize1.includes(s) ||
      d.prize2back.includes(s) ||
      d.prize3back.some(n => n.includes(s)) ||
      d.prize3front.some(n => n.includes(s)) ||
      d.dateDisplay.includes(search)
    );
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleSearch = (v: string) => {
    setSearch(v);
    setPage(1);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <section>
        <h1 className="text-2xl font-bold text-slate-200">📜 ประวัติผลรางวัล</h1>
        <p className="text-slate-500 mt-1 text-sm">{lotteryData.length} งวด · ค้นหาด้วยเลขหรืองวดที่ต้องการ</p>
      </section>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder="ค้นหา เช่น 89, 512, พฤษภาคม..."
          value={search}
          onChange={e => handleSearch(e.target.value)}
          className="w-full bg-[#1A1D2E] border border-[#2A2D3E] rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#C9A84C]/50 transition-colors"
        />
        {search && (
          <button onClick={() => handleSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs">
            ✕
          </button>
        )}
      </div>

      {/* Results count */}
      {search && (
        <p className="text-sm text-slate-500">
          พบ <span className="text-[#C9A84C] font-semibold">{filtered.length}</span> งวดที่ตรงกับ "{search}"
        </p>
      )}

      {/* Table */}
      <div className="bg-[#1A1D2E] border border-[#2A2D3E] rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-5 gap-2 px-4 py-3 bg-[#0F1117] text-xs text-slate-500 font-semibold border-b border-[#2A2D3E]">
          <div>งวดที่</div>
          <div className="text-center">รางวัลที่ 1</div>
          <div className="text-center">หน้า 3 ตัว</div>
          <div className="text-center">ท้าย 3 ตัว</div>
          <div className="text-center">ท้าย 2 ตัว</div>
        </div>

        {paged.length === 0 ? (
          <div className="py-16 text-center text-slate-600">
            <p className="text-4xl mb-3">🔍</p>
            <p>ไม่พบข้อมูลที่ตรงกัน</p>
          </div>
        ) : (
          paged.map((d, i) => {
            const isLatest = i === 0 && page === 1 && !search;
            return (
              <div key={d.date}
                className={`grid grid-cols-5 gap-2 px-4 py-4 border-b border-[#2A2D3E]/50 items-center transition-colors hover:bg-[#2A2D3E]/20 ${isLatest ? "bg-[#C9A84C]/5" : ""}`}>
                {/* Date */}
                <div>
                  <p className="text-xs text-slate-400 leading-tight">{d.dateDisplay}</p>
                  {isLatest && (
                    <span className="text-[9px] bg-[#C9A84C] text-[#0F1117] px-1.5 py-0.5 rounded-full font-bold mt-0.5 inline-block">
                      ล่าสุด
                    </span>
                  )}
                </div>

                {/* Prize 1 */}
                <div className="text-center">
                  <span className="font-mono font-bold text-[#C9A84C] text-lg tracking-widest">{d.prize1}</span>
                </div>

                {/* Prize 3 front */}
                <div className="text-center">
                  <div className="flex justify-center gap-2 flex-wrap">
                    {d.prize3front.map((n, j) => (
                      <span key={j} className="font-mono font-bold text-emerald-400">{n}</span>
                    ))}
                  </div>
                </div>

                {/* Prize 3 back */}
                <div className="text-center">
                  <div className="flex justify-center gap-2 flex-wrap">
                    {d.prize3back.map((n, j) => (
                      <span key={j} className="font-mono font-bold text-blue-400">{n}</span>
                    ))}
                  </div>
                </div>

                {/* Prize 2 back */}
                <div className="text-center">
                  <span className="font-mono font-bold text-purple-400 text-xl">{d.prize2back}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-xl bg-[#1A1D2E] border border-[#2A2D3E] text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
            <ChevronLeft size={16} />
          </button>

          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                  p === page
                    ? "bg-[#C9A84C] text-[#0F1117]"
                    : "bg-[#1A1D2E] border border-[#2A2D3E] text-slate-400 hover:text-slate-200"
                }`}>
                {p}
              </button>
            ))}
          </div>

          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-xl bg-[#1A1D2E] border border-[#2A2D3E] text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      <p className="text-center text-xs text-slate-700">
        แสดง {Math.min((page - 1) * PER_PAGE + 1, filtered.length)}–{Math.min(page * PER_PAGE, filtered.length)} จาก {filtered.length} งวด
      </p>
    </div>
  );
}
