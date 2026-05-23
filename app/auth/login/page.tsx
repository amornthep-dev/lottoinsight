import type { Metadata } from "next";
import { Suspense } from "react";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "เข้าสู่ระบบ",
};

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Static header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="text-3xl">🎱</span>
            <span className="font-brand text-2xl text-[#1E2229]">
              LottoInsight
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#1E2229]">เข้าสู่ระบบ</h1>
          <p className="text-sm text-[#8A94A6] mt-1">
            เข้าถึงสถิติหวยครบทุกประเภท
          </p>
        </div>

        {/* Dynamic form (reads searchParams via client) */}
        <Suspense
          fallback={
            <div className="bg-white rounded-2xl border border-[#FFD6E7] p-8 animate-pulse">
              <div className="h-4 bg-[#FFD6E7] rounded mb-4 w-3/4" />
              <div className="h-12 bg-[#FFF5F8] rounded-xl mb-3" />
              <div className="h-12 bg-[#FFF5F8] rounded-xl mb-4" />
              <div className="h-12 bg-[#F9AAC0]/40 rounded-xl" />
            </div>
          }
        >
          <LoginForm />
        </Suspense>

        <p className="text-center text-xs text-[#8A94A6] mt-6 leading-relaxed">
          การเข้าสู่ระบบถือว่าคุณยอมรับข้อกำหนดการใช้งาน
          <br />
          ข้อมูลเพื่อการศึกษาด้านสถิติเท่านั้น
        </p>
      </div>
    </div>
  );
}
