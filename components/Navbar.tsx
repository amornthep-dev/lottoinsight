"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Menu, X } from "lucide-react";
import { LOTTERY_ORDER, LOTTERY_CONFIGS } from "@/lib/lottery-config";

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // ปิด menu เมื่อกดนอก
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // ปิด menu เมื่อเปลี่ยนหน้า
  useEffect(() => { setOpen(false); }, [pathname]);

  // หาหน้าปัจจุบัน
  const currentCfg = LOTTERY_ORDER.map((id) => LOTTERY_CONFIGS[id]).find(
    (cfg) => pathname === cfg.route || pathname.startsWith(cfg.route + "/")
  );

  return (
    <div ref={menuRef} className="sticky top-0 z-50">
      {/* ── Header bar ─────────────────────────────────────── */}
      <header className="bg-[#0F1117] border-b border-[#2A2D3E]">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 shrink-0"
            onClick={() => setOpen(false)}
          >
            <span className="text-xl">🎱</span>
            <span className="text-base font-bold text-[#C9A84C]">LottoInsight</span>
          </Link>

          {/* หน้าปัจจุบัน */}
          {currentCfg && (
            <span className="flex items-center gap-1.5 text-sm text-slate-400 truncate">
              <span className="text-base">{currentCfg.flag}</span>
              <span className="truncate">{currentCfg.name}</span>
            </span>
          )}

          {/* Hamburger button */}
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "ปิดเมนู" : "เปิดเมนู"}
            className={`shrink-0 flex items-center justify-center w-10 h-10 rounded-xl transition-colors ${
              open
                ? "bg-[#C9A84C] text-[#0F1117]"
                : "text-slate-400 hover:text-slate-200 hover:bg-[#1A1D2E]"
            }`}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* ── Dropdown menu ──────────────────────────────────── */}
      {open && (
        <>
          <div className="bg-[#0F1117] border-b border-[#2A2D3E] shadow-2xl">
            <div className="max-w-3xl mx-auto px-4 py-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {LOTTERY_ORDER.map((id) => {
                const cfg = LOTTERY_CONFIGS[id];
                const isActive =
                  pathname === cfg.route ||
                  pathname.startsWith(cfg.route + "/");
                return (
                  <Link
                    key={id}
                    href={cfg.route}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                      isActive
                        ? "bg-[#C9A84C] text-[#0F1117]"
                        : "bg-[#1A1D2E] text-slate-300 hover:bg-[#2A2D3E]"
                    }`}
                  >
                    <span className="text-2xl shrink-0">{cfg.flag}</span>
                    <span className="text-sm font-medium leading-tight">
                      {cfg.name}
                    </span>
                  </Link>
                );
              })}

              {/* Feedback link */}
              <Link
                href="/feedback"
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  pathname === "/feedback"
                    ? "bg-[#C9A84C] text-[#0F1117]"
                    : "bg-[#1A1D2E] text-slate-300 hover:bg-[#2A2D3E]"
                }`}
              >
                <span className="text-2xl shrink-0">💬</span>
                <span className="text-sm font-medium leading-tight">ความคิดเห็น</span>
              </Link>
            </div>
          </div>

          {/* Backdrop */}
          <div
            className="fixed inset-0 -z-10 bg-black/40"
            onClick={() => setOpen(false)}
          />
        </>
      )}
    </div>
  );
}
