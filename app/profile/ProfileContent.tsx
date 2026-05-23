import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/actions/auth";

export default async function ProfileContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const displayName =
    user.user_metadata?.display_name || user.email?.split("@")[0] || "ผู้ใช้";
  const memberSince = new Date(user.created_at).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-[#F9AAC0] to-[#FFD6E7] rounded-2xl p-6 mb-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-white/60 flex items-center justify-center text-3xl shrink-0">
          👤
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#1E2229]">{displayName}</h1>
          <p className="text-sm text-[#1E2229]/70">{user.email}</p>
          <p className="text-xs text-[#1E2229]/60 mt-0.5">
            สมาชิกตั้งแต่ {memberSince}
          </p>
        </div>
      </div>

      {/* Plan Status */}
      <div className="bg-white border border-[#FFD6E7] rounded-2xl p-5 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-[#8A94A6] mb-0.5">แผนปัจจุบัน</p>
            <p className="font-semibold text-[#1E2229]">🆓 สมาชิกฟรี</p>
          </div>
          <span className="text-xs bg-[#F9AAC0]/20 text-[#F9AAC0] px-3 py-1 rounded-full font-medium">
            Free
          </span>
        </div>
        <div className="mt-4 bg-[#FFF5F8] rounded-xl p-3">
          <p className="text-xs text-[#5A6478]">
            📌 ฟีเจอร์พรีเมียม (เร็ว ๆ นี้): Export CSV, แจ้งเตือน LINE,
            ประวัติย้อนหลังไม่จำกัด
          </p>
        </div>
      </div>

      {/* Features */}
      <div className="bg-white border border-[#FFD6E7] rounded-2xl p-5 mb-4">
        <h2 className="font-semibold text-[#1E2229] mb-3 text-sm">
          สิ่งที่คุณทำได้ตอนนี้
        </h2>
        <div className="space-y-2">
          {[
            ["✅", "ดูสถิติหวยทุก 6 ประเภท"],
            ["✅", "บทความสถิติและความรู้"],
            ["✅", "วิเคราะห์เลขร้อน/เย็น/คู่"],
            ["🔒", "Watchlist เลขโปรด (เร็ว ๆ นี้)"],
            ["🔒", "แจ้งเตือนผลหวย LINE (เร็ว ๆ นี้)"],
            ["🔒", "Export CSV/Excel (พรีเมียม)"],
          ].map(([icon, label]) => (
            <div
              key={label}
              className="flex items-center gap-2 text-sm text-[#5A6478]"
            >
              <span>{icon}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Logout */}
      <form action={logout}>
        <button
          type="submit"
          className="w-full py-3 border border-[#FFD6E7] text-[#8A94A6] hover:bg-[#FFF5F8] rounded-xl text-sm transition-colors"
        >
          ออกจากระบบ
        </button>
      </form>
    </>
  );
}
