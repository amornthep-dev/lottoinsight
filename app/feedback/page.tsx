"use client";
import { useState, useEffect } from "react";
import { MessageSquare, ThumbsUp, Send, Loader2, CheckCircle } from "lucide-react";
import type { FeedbackItem } from "@/app/api/feedback/route";

const CATEGORIES = [
  { value: "suggest", label: "ข้อเสนอแนะ", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { value: "like", label: "ชอบ", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  { value: "dislike", label: "ไม่ชอบ", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  { value: "other", label: "อื่นๆ", color: "bg-slate-500/20 text-slate-400 border-slate-500/30" },
] as const;

function categoryStyle(cat: string) {
  return CATEGORIES.find((c) => c.value === cat)?.color ?? CATEGORIES[3].color;
}
function categoryLabel(cat: string) {
  return CATEGORIES.find((c) => c.value === cat)?.label ?? "อื่นๆ";
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "เมื่อกี้";
  if (m < 60) return `${m} นาทีที่แล้ว`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ชั่วโมงที่แล้ว`;
  return `${Math.floor(h / 24)} วันที่แล้ว`;
}

export default function FeedbackPage() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("suggest");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/feedback")
      .then((r) => r.json())
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (message.trim().length < 5) {
      setError("กรุณาเขียนอย่างน้อย 5 ตัวอักษร");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, category, message }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "เกิดข้อผิดพลาด");
        return;
      }
      const newItem = await res.json();
      setItems((prev) => [newItem, ...prev]);
      setSubmitted(true);
      setMessage("");
      setName("");
    } catch {
      setError("ส่งไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLike(id: string) {
    if (likedIds.has(id)) return;
    setLikedIds((prev) => new Set([...prev, id]));
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, likes: item.likes + 1 } : item))
    );
    await fetch("/api/feedback", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => {});
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <MessageSquare className="w-6 h-6 text-blue-400" />
        <h1 className="text-2xl font-bold text-white">ความคิดเห็น</h1>
      </div>

      {/* Form */}
      <div className="bg-[#1A1D2E] border border-[#2A2D3E] rounded-xl p-5 mb-8">
        {submitted ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle className="w-10 h-10 text-green-400" />
            <p className="text-white font-semibold">ขอบคุณสำหรับความคิดเห็น!</p>
            <button
              onClick={() => setSubmitted(false)}
              className="text-sm text-blue-400 hover:underline"
            >
              เขียนเพิ่มอีก
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400">ชื่อ (ไม่บังคับ)</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ไม่ระบุชื่อ"
                maxLength={30}
                className="bg-[#0F1117] border border-[#2A2D3E] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400">ประเภท</label>
              <div className="flex gap-2 flex-wrap">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCategory(c.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${
                      category === c.value
                        ? c.color + " opacity-100"
                        : "bg-transparent border-[#2A2D3E] text-slate-500 hover:border-slate-500"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400">ความคิดเห็น</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="เขียนความคิดเห็น ข้อเสนอแนะ หรือรายงานปัญหา..."
                maxLength={500}
                rows={4}
                className="bg-[#0F1117] border border-[#2A2D3E] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
              />
              <span className="text-xs text-slate-500 text-right">{message.length}/500</span>
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              ส่งความคิดเห็น
            </button>
          </form>
        )}
      </div>

      {/* List */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-slate-400">
          ความคิดเห็นทั้งหมด {items.length > 0 && `(${items.length})`}
        </h2>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-sm">
            ยังไม่มีความคิดเห็น — เป็นคนแรกที่แสดงความคิดเห็น!
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="bg-[#1A1D2E] border border-[#2A2D3E] rounded-xl p-4 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{item.name}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border ${categoryStyle(item.category)}`}
                  >
                    {categoryLabel(item.category)}
                  </span>
                </div>
                <span className="text-xs text-slate-500">{timeAgo(item.createdAt)}</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{item.message}</p>
              <button
                onClick={() => handleLike(item.id)}
                disabled={likedIds.has(item.id)}
                className={`flex items-center gap-1.5 text-xs self-start px-2.5 py-1 rounded-lg border transition-all ${
                  likedIds.has(item.id)
                    ? "border-blue-500/40 text-blue-400 bg-blue-500/10"
                    : "border-[#2A2D3E] text-slate-500 hover:border-blue-500/40 hover:text-blue-400"
                }`}
              >
                <ThumbsUp className="w-3 h-3" />
                {item.likes > 0 ? item.likes : ""}
              </button>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
