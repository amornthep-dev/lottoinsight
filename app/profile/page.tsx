import type { Metadata } from "next";
import { Suspense } from "react";
import ProfileContent from "./ProfileContent";

export const metadata: Metadata = {
  title: "โปรไฟล์",
};

export default function ProfilePage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Suspense
        fallback={
          <div className="space-y-4 animate-pulse">
            <div className="h-28 bg-[#FFD6E7]/50 rounded-2xl" />
            <div className="h-24 bg-[#FFF5F8] rounded-2xl" />
            <div className="h-48 bg-[#FFF5F8] rounded-2xl" />
          </div>
        }
      >
        <ProfileContent />
      </Suspense>
    </div>
  );
}
