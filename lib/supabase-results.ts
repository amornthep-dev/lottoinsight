import type { SheetResult } from "./sheets";

// Map จาก config.id → supabase type (ใน lottery_results table)
export const CONFIG_TO_SUPABASE_TYPE: Record<string, string> = {
  thai:             "thai",
  hanoi:            "hanoi_normal",
  "hanoi-special":  "hanoi_special",
  "hanoi-vip":      "hanoi_vip",
  "hanoi-chakagit": "hanoi_chakagit",
  "lao-pattana":    "lao_pattana",
};

// แปลง "2026-05-26" → "26/5/2026" (รูปแบบที่ LotteryPageContent ใช้)
function drawDateToDisplay(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${parseInt(d)}/${parseInt(m)}/${y}`;
}

/**
 * ดึงผลหวยจาก Supabase (lottery_results)
 * คืนค่าในรูปแบบ SheetResult[] เหมือน fetchSheetResults
 * เรียงจากล่าสุดไปเก่าสุด
 */
export async function fetchSupabaseResults(
  supabaseType: string,
  limit = 60
): Promise<SheetResult[]> {

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];

  try {
    const endpoint = new URL(`${url}/rest/v1/lottery_results`);
    endpoint.searchParams.set("type",  `eq.${supabaseType}`);
    endpoint.searchParams.set("order", "draw_date.desc");
    endpoint.searchParams.set("limit", String(limit));
    endpoint.searchParams.set("select", "draw_date,prize1,prize2,prize3");

    const res = await fetch(endpoint.toString(), {
      headers: {
        apikey:        key,
        Authorization: `Bearer ${key}`,
        Accept:        "application/json",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) return [];

    const data = (await res.json()) as Array<{
      draw_date: string;
      prize1: string;
      prize2: string;
      prize3: string;
    }>;

    return data.map((row) => ({
      date:         drawDateToDisplay(row.draw_date),
      prize1:       row.prize1 ?? "",
      prize3:       row.prize3 ?? "",
      prize2:       row.prize2 ?? "",
      prize2top:    row.prize2 ?? "",   // hanoi: prize2 = บน (ท้าย 2 ตัว)
      prize2bottom: "",                  // ยังไม่ได้เก็บล่างแยก
    }));
  } catch {
    return [];
  }
}
