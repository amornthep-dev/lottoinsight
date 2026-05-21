import { redirect } from "next/navigation";

// เพจนี้ถูกแทนที่ด้วย /lao-pattana
export default function OldLaoPage() {
  redirect("/lao-pattana");
}
