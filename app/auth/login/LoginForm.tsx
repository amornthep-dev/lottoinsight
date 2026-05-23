"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useFormStatus } from "react-dom";
import { login } from "@/app/actions/auth";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-3 bg-[#F9AAC0] hover:bg-[#f795b0] disabled:opacity-60 disabled:cursor-not-allowed text-[#1E2229] font-semibold rounded-xl transition-colors mt-2"
    >
      {pending ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
    </button>
  );
}

const ERROR_MESSAGES: Record<string, string> = {
  Invalid_login_credentials: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
  Email_not_confirmed: "กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ",
  auth_failed: "เกิดข้อผิดพลาด กรุณาลองใหม่",
};

export default function LoginForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const redirectTo = searchParams.get("redirectTo") ?? "/";

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

      <form action={login} className="space-y-4">
        <input type="hidden" name="redirectTo" value={redirectTo} />

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-[#1E2229] mb-1.5"
          >
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
          <label
            htmlFor="password"
            className="block text-sm font-medium text-[#1E2229] mb-1.5"
          >
            รหัสผ่าน
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="w-full px-4 py-3 rounded-xl border border-[#E8ECF4] focus:outline-none focus:border-[#F9AAC0] focus:ring-2 focus:ring-[#F9AAC0]/20 transition-colors text-[#1E2229] placeholder:text-[#C4CAD4]"
          />
        </div>

        <SubmitButton />
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-[#8A94A6]">
          ยังไม่มีบัญชี?{" "}
          <Link
            href="/auth/register"
            className="text-[#F9AAC0] hover:text-[#f795b0] font-medium transition-colors"
          >
            สมัครสมาชิกฟรี
          </Link>
        </p>
      </div>
    </div>
  );
}
