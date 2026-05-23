import type { Metadata } from "next";
import { Suspense } from "react";
import RegisterForm from "./RegisterForm";

export const metadata: Metadata = {
  title: "สมัครสมาชิก",
};

export default function RegisterPage() {
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
          <h1 className="text-xl font-bold text-[#1E2229]">สมัครสมาชิกฟรี</h1>
          <p className="text-sm text-[#8A94A6] mt-1">
            เข้าถึงสถิติและบันทึกเลขโปรดของคุณ
          </p>
        </div>

        <Suspense
          fallback={
            <div className="bg-white rounded-2xl border border-[#FFD6E7] p-8 animate-pulse space-y-3">
              <div className="h-12 bg-[#FFF5F8] rounded-xl" />
              <div className="h-12 bg-[#FFF5F8] rounded-xl" />
              <div className="h-12 bg-[#FFF5F8] rounded-xl" />
              <div className="h-12 bg-[#F9AAC0]/40 rounded-xl" />
            </div>
          }
        >
          <RegisterForm />
        </Suspense>

        <p className="text-center text-xs text-[#8A94A6] mt-6 leading-relaxed">
          การสมัครสมาชิกถือว่าคุณยอมรับข้อกำหนดการใช้งาน
          <br />
          ข้อมูลเพื่อการศึกษาด้านสถิติเท่านั้น
        </p>
      </div>
    </div>
  );
}
