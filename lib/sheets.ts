const SHEET_ID = "1NW1ov_JkMeyCOAQTIRNhqBhBDyc15r2N1Av0Q0R1bc4";

export interface SheetResult {
  date: string;
  prize1: string;
  prize3: string;
  prize2: string;
  prize2top?: string;
  prize2bottom?: string;
}

function parseCSV(csv: string): Record<string, string>[] {
  const lines = csv.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0]
    .split(",")
    .map((h) => h.trim().replace(/^"|"$/g, "").toLowerCase());
  return lines
    .slice(1)
    .filter((line) => line.trim())
    .map((line) => {
      const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => {
        obj[h] = values[i] ?? "";
      });
      return obj;
    });
}

export async function fetchSheetResults(
  sheetGid: number
): Promise<SheetResult[]> {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${sheetGid}`;
    const res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(15000), // timeout 15 วิ
    });
    if (!res.ok) return [];

    const csv = await res.text();

    // ตรวจว่าเป็น HTML (Google redirect ไป login) ไม่ใช่ CSV จริง
    if (csv.trim().startsWith("<!")) return [];

    const rows = parseCSV(csv);

    // ถ้า header ไม่มี prize1 = ดึงผิด tab (Google คืน default sheet)
    const firstRow = rows[0];
    if (firstRow && !("prize1" in firstRow)) return [];

    return rows
      .filter((r) => r.date && r.prize1) // กรองแถวว่างออก
      .map((r) => ({
        date: r.date ?? "",
        prize1: r.prize1 ?? "",
        prize3: r.prize3 ?? "",
        // รองรับ "prize2", "prize2/bottom", "prize2top"
        prize2: r.prize2 ?? r["prize2/bottom"] ?? r.prize2top ?? "",
        prize2top: r.prize2top ?? r["prize2/bottom"] ?? "",
        prize2bottom: r.prize2bottom ?? "",
      }));
  } catch {
    return [];
  }
}

export async function fetchPredictions(): Promise<
  Record<string, string>[]
> {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=172077655`;
    const res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return [];
    const csv = await res.text();
    if (csv.trim().startsWith("<!")) return [];
    const rows = parseCSV(csv);
    // ถ้า header ไม่มี lottery = ดึงผิด tab
    if (rows[0] && !("lottery" in rows[0])) return [];
    return rows.filter((r) => r.date && r.lottery);
  } catch {
    return [];
  }
}
