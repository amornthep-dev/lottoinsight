"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useFormStatus } from "react-dom";
import { register } from "@/app/actions/auth";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-3 bg-[#F9AAC0] hover:bg-[#f795b0] disabled:opacity-60 disabled:cursor-not-allowed text-[#1E2229] font-semibold rounded-xl transition-colors mt-2"
    >
      {pending ? "กำลังสมัคร..." : "สมัครสมาชิกฟรี"}
    </button>
  );
}

const ERROR_MESSAGES: Record<string, string> = {
  User_already_registered: "อีเมลนี้ถูกใช้งานแล้ว",
  Password_should_be_at_least_6_characters: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร",
};

export default function RegisterForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const errorMsg = error
    ? (ERROR_MESSAGES[error] ?? decodeURIComponent(error))
    : null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#FFD6E7] p-8">
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-5">
          ⚠️ {errorMsg}
        </div>
      )}

      <form action={register} className="space-y-4">
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-[#1E2229] mb-1.5">
            ชื่อที่แสดง
          </label>
          <input
            id="displayName"
            name="displayName"
            type="text"
            required
            autoComplete="name"
            placeholder="ชื่อของคุณ"
            className="w-full px-4 py-3 rounded-xl border border-[#E8ECF4] focus:outline-none focus:border-[#F9AAC0] focus:ring-2 focus:ring-[#F9AAC0]/20 transition-colors text-[#1E2229] placeholder:text-[#C4CAD4]"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-[#1E2229] mb-1.5">
            อีเมล
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="your@email.com"
            className="w-full px-4 py-3 rounded-xl border border-[#E8ECF4] focus:outline-none focus:border-[#F9AAC0] focus:ring-2 focus:ring-[#F9AAC0]/20 transition-colors text-[#1E2229] placeholder:text-[#C4CAD4]"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-[#1E2229] mb-1.5">
            รหัสผ่าน{" "}
            <span className="text-[#8A94A6] font-normal">(อย่างน้อย 6 ตัวอักษร)</span>
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            placeholder="••••••••"
            className="w-full px-4 py-3 rounded-xl border border-[#E8ECF4] focus:outline-none focus:border-[#F9AAC0] focus:ring-2 focus:ring-[#F9AAC0]/20 transition-colors text-[#1E2229] placeholder:text-[#C4CAD4]"
          />
        </div>

        <SubmitButton />
      </form>

      {/* What you get */}
      <div className="mt-6 bg-[#FFF5F8] rounded-xl p-4 space-y-2">
        <p className="text-xs font-medium text-[#1E2229]">สมาชิกฟรีได้รับ:</p>
        {[
          "ดูสถิติหวยทุกประเภท",
          "บันทึกเลขโปรดใน Watchlist",
          "รับแจ้งเตือนผลหวยทาง LINE",
        ].map((f) => (
          <div key={f} className="flex items-center gap-2 text-xs text-[#5A6478]">
            <span className="text-[#F9AAC0]">✓</span>
            {f}
          </div>
        ))}
      </div>

      <div className="mt-5 text-center">
        <p className="text-sm text-[#8A94A6]">
          มีบัญชีอยู่แล้ว?{" "}
          <Link
            href="/auth/login"
            className="text-[#F9AAC0] hover:text-[#f795b0] font-medium transition-colors"
          >
            เข้าสู่ระบบ
          </Link>
        </p>
      </div>
    </div>
  );
}
