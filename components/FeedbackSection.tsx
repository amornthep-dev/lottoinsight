"use client";
import { useState, useEffect, useCallback } from "react";
import { MessageSquare, ThumbsUp, Send, Loader2, CheckCircle } from "lucide-react";
import type { FeedbackItem } from "@/app/api/feedback/route";

const CATEGORIES = [
  { value: "suggest", label: "💡 เสนอแนะ", color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/30" },
  { value: "like",    label: "❤️ ชอบ",     color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/30" },
  { value: "dislike", label: "👎 ไม่ชอบ",  color: "text-red-400",     bg: "bg-red-400/10 border-red-400/30" },
  { value: "other",   label: "💬 อื่นๆ",    color: "text-slate-400",   bg: "bg-slate-400/10 border-slate-400/30" },
] as const;

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "เมื่อกี้";
  if (diff < 3600) return `${Math.floor(diff / 60)} นาทีที่แล้ว`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ชั่วโมงที่แล้ว`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} วันที่แล้ว`;
  return new Date(iso).toLocaleDateString("th-TH");
}

function CategoryBadge({ cat }: { cat: FeedbackItem["category"] }) {
  const c = CATEGORIES.find(x => x.value === cat) ?? CATEGORIES[3];
  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${c.bg} ${c.color}`}>
      {c.label}
    </span>
  );
}

export default function FeedbackSection() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<FeedbackItem["category"]>("suggest");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch("/api/feedback");
      if (res.ok) setItems(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
    // restore liked IDs from localStorage
    try {
      const saved = JSON.parse(localStorage.getItem("li_liked") || "[]");
      setLikedIds(new Set(saved));
    } catch {}
  }, [fetchItems]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (message.trim().length < 5) { setError("กรุณากรอกอย่างน้อย 5 ตัวอักษร"); return; }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, category, message }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "เกิดข้อผิดพลาด");
        return;
      }
      setSubmitted(true);
      setMessage("");
      setName("");
      await fetchItems();
      setTimeout(() => setSubmitted(false), 4000);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLike(id: string) {
    if (likedIds.has(id)) return;
    const newLiked = new Set(likedIds).add(id);
    setLikedIds(newLiked);
    localStorage.setItem("li_liked", JSON.stringify([...newLiked]));
    await fetch("/api/feedback", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await fetchItems();
  }

  const displayed = showAll ? items : items.slice(0, 5);

  return (
    <section className="bg-[#1E1040] border border-[#3D2060] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#3D2060] flex items-center gap-2">
        <MessageSquare size={16} className="text-[#A855F7]" />
        <div>
          <h2 className="text-base font-semibold text-slate-300">แสดงความคิดเห็น</h2>
          <p className="text-xs text-slate-500">ช่วยเราพัฒนาเว็บให้ดีขึ้น — ทุกความเห็นมีคุณค่า</p>
        </div>
        <span className="ml-auto text-xs text-slate-600 bg-[#120820] px-2.5 py-1 rounded-full">
          {items.length} ความเห็น
        </span>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3 border-b border-[#3D2060]">
        {/* Category tabs */}
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCategory(c.value as FeedbackItem["category"])}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                category === c.value ? `${c.bg} ${c.color}` : "bg-[#120820] text-slate-500 border-[#3D2060]"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Name (optional) */}
        <input
          type="text"
          maxLength={30}
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="ชื่อเล่น (ไม่บังคับ)"
          className="w-full bg-[#120820] border border-[#3D2060] rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-700 focus:outline-none focus:border-[#A855F7]/50"
        />

        {/* Message */}
        <div className="relative">
          <textarea
            rows={3}
            maxLength={500}
            value={message}
            onChange={e => { setMessage(e.target.value); setError(""); }}
            placeholder="แชร์ความคิดเห็น ข้อเสนอแนะ หรือปัญหาที่พบ..."
            className="w-full bg-[#120820] border border-[#3D2060] rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-700 focus:outline-none focus:border-[#A855F7]/50 resize-none"
          />
          <span className="absolute bottom-2 right-3 text-[10px] text-slate-700">{message.length}/500</span>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="flex items-center justify-between">
          <p className="text-[11px] text-slate-700">ความเห็นทุกอันจะแสดงต่อสาธารณะ · อย่าระบุข้อมูลส่วนตัว</p>
          <button
            type="submit"
            disabled={submitting || submitted}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all ${
              submitted
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-[#A855F7] text-[#120820] hover:bg-[#C084FC] disabled:opacity-60"
            }`}
          >
            {submitting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : submitted ? (
              <><CheckCircle size={14} /> ส่งแล้ว!</>
            ) : (
              <><Send size={14} /> ส่ง</>
            )}
          </button>
        </div>
      </form>

      {/* Comments list */}
      <div className="divide-y divide-[#3D2060]/50">
        {loading ? (
          <div className="py-8 text-center">
            <Loader2 size={20} className="animate-spin text-slate-600 mx-auto" />
          </div>
        ) : items.length === 0 ? (
          <div className="py-8 text-center text-slate-600 text-sm">
            ยังไม่มีความเห็น — เป็นคนแรกที่แสดงความเห็น!
          </div>
        ) : (
          <>
            {displayed.map(item => (
              <div key={item.id} className="px-5 py-4 flex gap-3">
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-[#120820] border border-[#3D2060] flex items-center justify-center shrink-0 text-sm font-bold text-[#A855F7]">
                  {item.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-semibold text-slate-300">{item.name}</span>
                    <CategoryBadge cat={item.category} />
                    <span className="text-[11px] text-slate-600 ml-auto">{timeAgo(item.createdAt)}</span>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap break-words">{item.message}</p>
                  {/* Like */}
                  <button
                    onClick={() => handleLike(item.id)}
                    className={`mt-2 flex items-center gap-1.5 text-xs transition-colors ${
                      likedIds.has(item.id) ? "text-[#A855F7]" : "text-slate-600 hover:text-slate-400"
                    }`}
                  >
                    <ThumbsUp size={12} />
                    <span>{item.likes > 0 ? item.likes : ""} เห็นด้วย</span>
                  </button>
                </div>
              </div>
            ))}

            {/* Show more */}
            {items.length > 5 && (
              <div className="px-5 py-3 text-center">
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showAll ? "▲ แสดงน้อยลง" : `▼ ดูทั้งหมด ${items.length} ความเห็น`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
