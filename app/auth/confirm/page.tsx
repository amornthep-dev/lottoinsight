import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ยืนยันอีเมล",
};

export default function ConfirmPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        <div className="text-6xl mb-6">📬</div>
        <h1 className="text-xl font-bold text-[#1E2229] mb-3">
          ตรวจสอบอีเมลของคุณ
        </h1>
        <p className="text-[#5A6478] text-sm leading-relaxed mb-6">
          เราส่งลิงก์ยืนยันไปที่อีเมลของคุณแล้ว
          <br />
          กรุณาคลิกลิงก์ในอีเมลเพื่อเปิดใช้งานบัญชี
          <br />
          <span className="text-xs text-[#8A94A6] mt-1 block">
            (ตรวจสอบในกล่อง Spam ด้วยถ้าไม่เจอ)
          </span>
        </p>
        <Link
          href="/auth/login"
          className="inline-block px-6 py-3 bg-[#F9AAC0] hover:bg-[#f795b0] text-[#1E2229] font-semibold rounded-xl transition-colors"
        >
          กลับไปเข้าสู่ระบบ
        </Link>
      </div>
    </div>
  );
}
