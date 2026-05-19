/**
 * fetch-hanoi.mjs
 * ดึงผลหวยฮานอยล่าสุดแล้ว prepend เข้า data/hanoi-lottery.json
 *
 * รัน:
 *   node scripts/fetch-hanoi.mjs              ← ดึงงวดล่าสุด
 *   node scripts/fetch-hanoi.mjs --backfill   ← ดึงย้อนหลัง 90 วัน
 *   node scripts/fetch-hanoi.mjs --mock       ← สร้างข้อมูลจำลอง (ไม่เรียก API)
 *
 * ─── API endpoints ─────────────────────────────────────────────────────────
 * TODO: อัปเดต endpoint นี้ตามที่ API ของคุณให้มา
 *
 * Primary:   https://api.lotto432.com/huay/hanoi
 * Fallback:  https://huay.com/api/hanoi
 *
 * Expected response format (Primary):
 * {
 *   "status": "ok",
 *   "result": {
 *     "date": "19/05/2025",          ← DD/MM/YYYY (CE)
 *     "prize1": "56789",             ← 5 หลัก (รางวัลพิเศษ)
 *     "prize3": "789",               ← 3 หลักท้าย
 *     "prize2": "89"                 ← 2 หลักท้าย
 *   }
 * }
 *
 * Expected response format (Fallback):
 * {
 *   "date": "2025-05-19",
 *   "hanoi": { "special": "56789", "3d": "789", "2d": "89" }
 * }
 *
 * หมายเหตุ: หวยฮานอย prize1 = specialPrize 5 หลัก
 * ──────────────────────────────────────────────────────────────────────────
 */

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, "../data/hanoi-lottery.json");

// ── Config ──────────────────────────────────────────────────────────────────
const MOCK_MODE = process.argv.includes("--mock");
const BACKFILL  = process.argv.includes("--backfill");
const BACKFILL_DAYS = 90;

const API_PRIMARY  = "https://api.lotto432.com/huay/hanoi";
const API_FALLBACK = "https://huay.com/api/hanoi";

// ── Thai helpers ────────────────────────────────────────────────────────────
const THAI_MONTHS = [
  "มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน",
  "กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม",
];
const THAI_DAYS = ["อาทิตย์","จันทร์","อังคาร","พุธ","พฤหัสบดี","ศุกร์","เสาร์"];

function toThaiDateDisplay(ceDate) {
  const [y, m, d] = ceDate.split("-").map(Number);
  return `${d} ${THAI_MONTHS[m - 1]} ${y + 543}`;
}

function toBEDateStr(ceDate) {
  const [y, m, d] = ceDate.split("-");
  return `${Number(y) + 543}-${m}-${d}`;
}

function getDayOfWeek(ceDate) {
  const d = new Date(ceDate + "T12:00:00+07:00");
  return THAI_DAYS[d.getDay()];
}

// ── Mock data generator ─────────────────────────────────────────────────────
function generateMock(ceDate) {
  const rnd5 = () => String(Math.floor(Math.random() * 100000)).padStart(5, "0");
  const prize1 = rnd5(); // 5-digit specialPrize
  return {
    date: toBEDateStr(ceDate),
    dateDisplay: toThaiDateDisplay(ceDate),
    dayOfWeek: getDayOfWeek(ceDate),
    prize1,
    prize3back: prize1.slice(-3),
    prize2back: prize1.slice(-2),
  };
}

// ── Parse API response ── TODO: อัปเดตตามรูปแบบจริงของ API ─────────────────
function parseResponse(json, sourceUrl) {
  // Try Primary format
  if (json?.result?.date) {
    const r = json.result;
    const parts = String(r.date).split("/");
    let ceDate;
    if (parts.length === 3) {
      const [dd, mm, yyyy] = parts;
      ceDate = `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
    } else {
      ceDate = r.date;
    }
    const prize1 = String(r.prize1 || r.special || r.top || "").padStart(5, "0");
    return {
      date: toBEDateStr(ceDate),
      dateDisplay: toThaiDateDisplay(ceDate),
      dayOfWeek: getDayOfWeek(ceDate),
      prize1,
      prize3back: prize1.slice(-3),
      prize2back: prize1.slice(-2),
    };
  }

  // Try Fallback format
  if (json?.hanoi || json?.data || json?.date) {
    const r = json.hanoi ?? json.data ?? json;
    const ceDate = json.date ?? new Date().toISOString().slice(0, 10);
    const prize1 = String(r.special || r["5d"] || r.prize1 || r.top || "").padStart(5, "0");
    return {
      date: toBEDateStr(ceDate),
      dateDisplay: toThaiDateDisplay(ceDate),
      dayOfWeek: getDayOfWeek(ceDate),
      prize1,
      prize3back: prize1.slice(-3),
      prize2back: prize1.slice(-2),
    };
  }

  throw new Error(`ไม่รู้จักรูปแบบ response จาก ${sourceUrl} — กรุณาอัปเดต parseResponse()`);
}

// ── Fetch single draw ────────────────────────────────────────────────────────
async function fetchLatest() {
  if (MOCK_MODE) {
    const today = new Date().toISOString().slice(0, 10);
    console.log("🎭 MOCK_MODE — สร้างข้อมูลจำลอง");
    return generateMock(today);
  }

  // Try Primary
  try {
    console.log(`📡 เรียก Primary API: ${API_PRIMARY}`);
    const res = await fetch(API_PRIMARY, {
      headers: { "User-Agent": "lottoinsight-bot/1.0" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const entry = parseResponse(json, API_PRIMARY);
    console.log(`✅ Primary สำเร็จ: ${entry.dateDisplay}`);
    return entry;
  } catch (err) {
    console.warn(`⚠️  Primary ล้มเหลว: ${err.message}`);
  }

  // Try Fallback
  try {
    console.log(`📡 เรียก Fallback API: ${API_FALLBACK}`);
    const res = await fetch(API_FALLBACK, {
      headers: { "User-Agent": "lottoinsight-bot/1.0" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const entry = parseResponse(json, API_FALLBACK);
    console.log(`✅ Fallback สำเร็จ: ${entry.dateDisplay}`);
    return entry;
  } catch (err) {
    console.error(`❌ Fallback ล้มเหลว: ${err.message}`);
    throw new Error("ทุก API endpoint ล้มเหลว — กรุณาตรวจสอบ endpoint ใน fetch-hanoi.mjs");
  }
}

// ── Backfill ─────────────────────────────────────────────────────────────────
async function backfill() {
  console.log(`🔄 Backfill โหมด — สร้างข้อมูล ${BACKFILL_DAYS} วันย้อนหลัง (mock)`);
  const existing = JSON.parse(readFileSync(DATA_PATH, "utf-8"));
  const existingDates = new Set(existing.map((e) => e.date));

  const newEntries = [];
  for (let i = 0; i < BACKFILL_DAYS; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    // Hanoi draws every day (no day-off)
    const ceDate = d.toISOString().slice(0, 10);
    const beDate = toBEDateStr(ceDate);
    if (existingDates.has(beDate)) continue;
    newEntries.push(generateMock(ceDate));
  }

  if (newEntries.length === 0) {
    console.log("⏭️  ไม่มีข้อมูลใหม่จาก backfill");
    return;
  }

  newEntries.sort((a, b) => b.date.localeCompare(a.date));
  const updated = [...newEntries, ...existing];
  writeFileSync(DATA_PATH, JSON.stringify(updated, null, 2), "utf-8");
  console.log(`✅ Backfill เสร็จ — เพิ่ม ${newEntries.length} รายการ (รวม ${updated.length} รายการ)`);
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  if (BACKFILL) {
    await backfill();
    return;
  }

  console.log("🇻🇳 Fetching หวยฮานอย...");

  let entry;
  try {
    entry = await fetchLatest();
  } catch (err) {
    console.error("❌", err.message);
    process.exit(1);
  }

  if (!entry.prize2back || !entry.prize3back) {
    console.error("❌ ข้อมูลไม่ครบ:", entry);
    process.exit(1);
  }

  const existing = JSON.parse(readFileSync(DATA_PATH, "utf-8"));
  if (existing[0]?.date === entry.date) {
    console.log("⏭️  ข้อมูลวันนี้มีแล้ว — ไม่มีการเปลี่ยนแปลง");
    process.exit(0);
  }

  const updated = [entry, ...existing];
  writeFileSync(DATA_PATH, JSON.stringify(updated, null, 2), "utf-8");
  console.log(`✅ hanoi-lottery.json อัปเดตแล้ว — รวม ${updated.length} รายการ`);
  console.log("   ล่าสุด:", JSON.stringify(entry, null, 2));
}

main();
