import { Suspense } from "react";
import type { Metadata } from "next";
import LotteryPageContent from "@/components/LotteryPageContent";
import { LOTTERY_CONFIGS } from "@/lib/lottery-config";

export const metadata: Metadata = {
  title: "หวยไทย",
  description: "วิเคราะห์สถิติหวยไทย ย้อนหลัง 30 งวด — เลข 3 ตัว เลข 2 ตัว ที่น่าสนใจ",
};

function Loading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="bg-[#1E1040] border border-[#3D2060] rounded-2xl h-24 animate-pulse"
        />
      ))}
    </div>
  );
}

export default function ThaiPage() {
  return (
    <Suspense fallback={<Loading />}>
      <LotteryPageContent config={LOTTERY_CONFIGS.thai} />
    </Suspense>
  );
}
