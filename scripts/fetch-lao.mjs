/**
 * fetch-lao.mjs
 * ดึงผลหวยลาวพัฒนาล่าสุดแล้ว prepend เข้า data/lao-lottery.json
 *
 * รัน:
 *   node scripts/fetch-lao.mjs              ← ดึงงวดล่าสุด
 *   node scripts/fetch-lao.mjs --backfill   ← ดึงย้อนหลัง 90 วัน
 *   node scripts/fetch-lao.mjs --mock       ← สร้างข้อมูลจำลอง (ไม่เรียก API)
 *
 * ─── API endpoints ─────────────────────────────────────────────────────────
 * TODO: อัปเดต endpoint นี้ตามที่ API ของคุณให้มา
 *
 * Primary:   https://api.lotto432.com/huay/lao-develop
 * Fallback:  https://huay.com/api/laos
 *
 * Expected response format (Primary):
 * {
 *   "status": "ok",
 *   "result": {
 *     "date": "19/05/2025",          ← DD/MM/YYYY (CE)
 *     "prize1": "8523",              ← 4 หลัก (รางวัลที่ 1)
 *     "prize3": "523",               ← 3 หลักท้าย
 *     "prize2": "23"                 ← 2 หลักท้าย
 *   }
 * }
 *
 * Expected response format (Fallback):
 * {
 *   "date": "2025-05-19",
 *   "lao": { "top": "8523", "3d": "523", "2d": "23" }
 * }
 *
 * หากรูปแบบ API ต่างออกไป ให้แก้ไขฟังก์ชัน parseResponse() ด้านล่าง
 * ──────────────────────────────────────────────────────────────────────────
 */

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, "../data/lao-lottery.json");

// ── Config ──────────────────────────────────────────────────────────────────
const MOCK_MODE = process.argv.includes("--mock");
const BACKFILL  = process.argv.includes("--backfill");
const BACKFILL_DAYS = 90;

const API_PRIMARY  = "https://api.lotto432.com/huay/lao-develop";
const API_FALLBACK = "https://huay.com/api/laos";

// ── Thai helpers ────────────────────────────────────────────────────────────
const THAI_MONTHS = [
  "มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน",
  "กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม",
];
const THAI_DAYS = ["อาทิตย์","จันทร์","อังคาร","พุธ","พฤหัสบดี","ศุกร์","เสาร์"];

function toThaiDateDisplay(ceDate) {
  // ceDate = "2025-05-19"
  const [y, m, d] = ceDate.split("-").map(Number);
  return `${d} ${THAI_MONTHS[m - 1]} ${y + 543}`;
}

function toBEDateStr(ceDate) {
  // "2025-05-19" → "2568-05-19"
  const [y, m, d] = ceDate.split("-");
  return `${Number(y) + 543}-${m}-${d}`;
}

function getDayOfWeek(ceDate) {
  const d = new Date(ceDate + "T12:00:00+07:00");
  return THAI_DAYS[d.getDay()];
}

// ── Mock data generator ─────────────────────────────────────────────────────
function generateMock(ceDate) {
  const rnd = (n) => String(Math.floor(Math.random() * n)).padStart(n === 10000 ? 4 : n === 1000 ? 3 : 2, "0");
  const prize1 = rnd(10000); // 4-digit
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
    // date format: "19/05/2025" (DD/MM/YYYY CE)
    const parts = r.date.split("/");
    let ceDate;
    if (parts.length === 3) {
      const [dd, mm, yyyy] = parts;
      ceDate = `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
    } else {
      ceDate = r.date; // fallback: assume YYYY-MM-DD
    }
    return {
      date: toBEDateStr(ceDate),
      dateDisplay: toThaiDateDisplay(ceDate),
      dayOfWeek: getDayOfWeek(ceDate),
      prize1: String(r.prize1 || r.top || ""),
      prize3back: String(r.prize3 || r["3d"] || "").slice(-3).padStart(3, "0"),
      prize2back: String(r.prize2 || r["2d"] || "").slice(-2).padStart(2, "0"),
    };
  }

  // Try Fallback format
  if (json?.lao || json?.data) {
    const r = json.lao ?? json.data ?? json;
    const ceDate = json.date ?? new Date().toISOString().slice(0, 10);
    return {
      date: toBEDateStr(ceDate),
      dateDisplay: toThaiDateDisplay(ceDate),
      dayOfWeek: getDayOfWeek(ceDate),
      prize1: String(r.top || r.prize1 || ""),
      prize3back: String(r["3d"] || r.prize3 || "").slice(-3).padStart(3, "0"),
      prize2back: String(r["2d"] || r.prize2 || "").slice(-2).padStart(2, "0"),
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
    throw new Error("ทุก API endpoint ล้มเหลว — กรุณาตรวจสอบ endpoint ใน fetch-lao.mjs");
  }
}

// ── Backfill (mock only — real API may not support historical) ───────────────
async function backfill() {
  console.log(`🔄 Backfill โหมด — สร้างข้อมูล ${BACKFILL_DAYS} วันย้อนหลัง (mock)`);
  const existing = JSON.parse(readFileSync(DATA_PATH, "utf-8"));
  const existingDates = new Set(existing.map((e) => e.date));

  const newEntries = [];
  for (let i = 0; i < BACKFILL_DAYS; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const day = d.getDay(); // 0=Sun
    if (day === 0) continue; // Skip Sunday (Lao doesn't draw on Sunday)

    const ceDate = d.toISOString().slice(0, 10);
    const beDate = toBEDateStr(ceDate);
    if (existingDates.has(beDate)) continue;

    newEntries.push(generateMock(ceDate));
  }

  if (newEntries.length === 0) {
    console.log("⏭️  ไม่มีข้อมูลใหม่จาก backfill");
    return;
  }

  // Sort newest first
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

  console.log("🇱🇦 Fetching หวยลาวพัฒนา...");

  let entry;
  try {
    entry = await fetchLatest();
  } catch (err) {
    console.error("❌", err.message);
    process.exit(1);
  }

  // Validate
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
  console.log(`✅ lao-lottery.json อัปเดตแล้ว — รวม ${updated.length} รายการ`);
  console.log("   ล่าสุด:", JSON.stringify(entry, null, 2));
}

main();
