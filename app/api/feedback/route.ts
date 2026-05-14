import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const FILE = path.join(process.cwd(), "data", "feedback.json");

export interface FeedbackItem {
  id: string;
  name: string;
  category: "suggest" | "like" | "dislike" | "other";
  message: string;
  createdAt: string;
  likes: number;
}

function readAll(): FeedbackItem[] {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf-8"));
  } catch {
    return [];
  }
}

function writeAll(data: FeedbackItem[]) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2), "utf-8");
}

// GET — return all feedback (newest first)
export async function GET() {
  const all = readAll().reverse();
  return NextResponse.json(all);
}

// POST — add new feedback
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
    category: ["suggest", "like", "dislike", "other"].includes(category) ? category : "other",
    message: message.trim(),
    createdAt: new Date().toISOString(),
    likes: 0,
  };

  const all = readAll();
  all.push(item);
  writeAll(all);

  return NextResponse.json(item, { status: 201 });
}

// PATCH — like a feedback item
export async function PATCH(req: NextRequest) {
  const { id } = await req.json();
  const all = readAll();
  const idx = all.findIndex(f => f.id === id);
  if (idx === -1) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });
  all[idx].likes += 1;
  writeAll(all);
  return NextResponse.json(all[idx]);
}
