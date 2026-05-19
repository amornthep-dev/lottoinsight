"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart2, Clock, Home, FlaskConical, Search, GitCompareArrows } from "lucide-react";

const navItems = [
  { href: "/",           label: "หน้าหลัก",    icon: Home },
  { href: "/statistics", label: "สถิติ",        icon: BarChart2 },
  { href: "/history",    label: "ประวัติ",      icon: Clock },
  { href: "/checker",    label: "เช็คเลข",      icon: Search },
  { href: "/analysis",   label: "Triple Score", icon: FlaskConical },
  { href: "/leaderboard",label: "Backtest",     icon: GitCompareArrows },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-[#0F1117] border-b border-[#2A2D3E]">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="text-2xl">🎱</span>
          <span className="hidden sm:inline text-xl font-bold text-[#C9A84C]">LottoInsight</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === href
                  ? "bg-[#C9A84C] text-[#0F1117]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-[#1A1D2E]"
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>

        {/* Mobile Nav — icon only */}
        <nav className="flex md:hidden items-center">
          {navItems.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              title={label}
              className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
                pathname === href
                  ? "bg-[#C9A84C]/15 text-[#C9A84C]"
                  : "text-slate-600 hover:text-slate-300 hover:bg-[#1A1D2E]"
              }`}
            >
              <Icon size={18} />
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
