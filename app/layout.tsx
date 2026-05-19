import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// VERCEL_URL = deployment-specific URL, ใช้ VERCEL_PROJECT_PRODUCTION_URL สำหรับ stable alias
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL
    ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : "http://localhost:3000");

const OG_TITLE  = "LottoInsight — วิเคราะห์สถิติหวยไทย · ข้อมูลจริง 100 งวด";
const OG_DESC   = "สถิติหวยไทย 10 ปี · Phase System · Triple Score · Signal Convergence — วิเคราะห์จากข้อมูลจริง ไม่ใช่การทำนาย เหมาะสำหรับคนอยากรู้แนวโน้มเชิงสถิติ";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: OG_TITLE,
    template: "%s | LottoInsight",
  },
  description: OG_DESC,
  keywords: ["หวย", "สถิติหวย", "หวยไทย", "เลขเด็ด", "วิเคราะห์หวย", "หวยสถิติ", "lotto thailand", "thai lottery statistics"],
  authors: [{ name: "LottoInsight" }],
  openGraph: {
    type: "website",
    locale: "th_TH",
    url: SITE_URL,
    siteName: "LottoInsight",
    title: OG_TITLE,
    description: OG_DESC,
    // og:image auto-generated from app/opengraph-image.tsx
  },
  twitter: {
    card: "summary_large_image",
    title: OG_TITLE,
    description: OG_DESC,
    // twitter:image auto-generated from app/opengraph-image.tsx
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "LottoInsight",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#C9A84C",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="h-full">

      <body className="min-h-full flex flex-col bg-[#0F1117] text-slate-200">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
