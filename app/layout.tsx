import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "LottoInsight — วิเคราะห์สถิติหวยไทย",
  description: "วิเคราะห์สถิติหวยไทยย้อนหลัง 10 ปี ด้วยข้อมูลจริง ไม่ใช่การทำนาย",
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
