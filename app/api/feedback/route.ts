import { NextRequest, NextResponse } from "next/server";

// ตั้งค่า APPS_SCRIPT_URL ใน Vercel Environment Variables
// ดูวิธีตั้งค่าได้ที่ /docs/apps-script-setup.md
const WEBHOOK = process.env.APPS_SCRIPT_URL ?? "";

export interface FeedbackItem {
  id: string;
  name: string;
  category: "suggest" | "like" | "dislike" | "other";
  message: string;
  createdAt: string;
  likes: number;
}

// GET — ดึง feedback จาก Apps Script
export async function GET() {
  if (!WEBHOOK) return NextResponse.json([]);
  try {
    const res = await fetch(`${WEBHOOK}?action=feedback`, {
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!res.ok) return NextResponse.json([]);
    const data = await res.json();
    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch {
    return NextResponse.json([]);
  }
}

// POST — บันทึก feedback ใหม่
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, category, message } = body;

  if (!message || message.trim().length < 5) {
    return NextResponse.json({ error: "ข้อความสั้นเกินไป" }, { status: 400 });
  }
  if (message.trim().length > 500) {
    return NextResponse.json({ error: "ข้อความยาวเกินไป (max 500 ตัวอักษร)" }, { status: 400 });
  }

  const item: FeedbackItem = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name: (name || "").trim().slice(0, 30) || "ไม่ระบุชื่อ",
    category: ["suggest", "like", "dislike", "other"].includes(category)
      ? category
      : "other",
    message: message.trim(),
    createdAt: new Date().toISOString(),
    likes: 0,
  };

  if (WEBHOOK) {
    try {
      await fetch(WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "feedback", ...item }),
        signal: AbortSignal.timeout(8000),
      });
    } catch {
      // บันทึกไม่สำเร็จ แต่ไม่ block user
    }
  }

  return NextResponse.json(item, { status: 201 });
}

// PATCH — กด like
export async function PATCH(req: NextRequest) {
  const { id } = await req.json();
  if (!WEBHOOK) return NextResponse.json({ ok: true });

  try {
    await fetch(WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "like", id }),
      signal: AbortSignal.timeout(8000),
    });
  } catch {}

  return NextResponse.json({ ok: true });
}
