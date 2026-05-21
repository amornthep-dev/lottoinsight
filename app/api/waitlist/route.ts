import { NextRequest, NextResponse } from "next/server";

const WEBHOOK = process.env.APPS_SCRIPT_URL ?? "";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const email = (body.email ?? "").trim().toLowerCase();

  if (!email || !email.includes("@") || email.length > 254) {
    return NextResponse.json({ error: "อีเมลไม่ถูกต้อง" }, { status: 400 });
  }

  if (WEBHOOK) {
    try {
      await fetch(WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "waitlist",
          email,
          createdAt: new Date().toISOString(),
        }),
        signal: AbortSignal.timeout(8000),
      });
    } catch {
      // silent fail — อีเมลบันทึกไม่สำเร็จแต่ไม่แจ้ง error กับ user
    }
  }

  return NextResponse.json({ ok: true });
}
