/**
 * fetch-lottery.mjs
 * ดึงผลหวยล่าสุดจาก API แล้ว prepend เข้า data/lottery.json
 *
 * รัน: node scripts/fetch-lottery.mjs
 */

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, "../data/lottery.json");

// ── Thai month names (BE) ──────────────────────────────────────────
const THAI_MONTHS = [
  "มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน",
  "กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม",
];

function toThaiDateDisplay(dateStr) {
  // dateStr = "2025-05-16" (CE)
  const [y, m, d] = dateStr.split("-").map(Number);
  const be = y + 543;
  return `${d} ${THAI_MONTHS[m - 1]} ${be}`;
}

function toBEDateStr(dateStr) {
  // "2025-05-16" → "2568-05-16"
  const [y, m, d] = dateStr.split("-");
  return `${Number(y) + 543}-${m}-${d}`;
}

// ── Fetch from Rayriffy API ────────────────────────────────────────
async function fetchFromRayriffy() {
  const res = await fetch("https://lotto.api.rayriffy.com/latest", {
    headers: { "User-Agent": "lottoinsight-bot/1.0" },
  });
  if (!res.ok) throw new Error(`Rayriffy API: ${res.status}`);
  const json = await res.json();

  const r = json.response;
  // date from API is in Buddhist Era: "16/05/2568"
  const [day, month, be] = r.date.split("/").map(Number);
  const ce = be - 543;
  const dateStr    = `${String(ce).padStart(4,"0")}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
  const beDateStr  = `${be}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
  const dateDisplay = toThaiDateDisplay(dateStr);

  // Navigate prizes array
  const prizes = r.prizes;
  const find = (id) => prizes.find(p => p.id === id);

  return {
    date:        beDateStr,
    dateDisplay: dateDisplay,
    prize1:      find("firstPrize")?.number?.[0]  ?? "",
    prize3front: find("first3Digit")?.number ?? [],
    prize3back:  find("last3Digit")?.number  ?? [],
    prize2back:  find("last2Digit")?.number?.[0]  ?? "",
  };
}

// ── Main ──────────────────────────────────────────────────────────
async function main() {
  console.log("🎱 Fetching latest lottery result...");

  let newEntry;
  try {
    newEntry = await fetchFromRayriffy();
    console.log(`✅ Got: ${newEntry.dateDisplay} | prize1: ${newEntry.prize1} | ท้าย 2: ${newEntry.prize2back}`);
  } catch (err) {
    console.error("❌ Fetch failed:", err.message);
    process.exit(1);
  }

  // ── Load existing data ─────────────────────────────────────────
  const existing = JSON.parse(readFileSync(DATA_PATH, "utf-8"));
  const latestDate = existing[0]?.date;

  if (latestDate === newEntry.date) {
    console.log("⏭️  Already up-to-date. No changes made.");
    process.exit(0);
  }

  // ── Prepend new entry ──────────────────────────────────────────
  const updated = [newEntry, ...existing];
  writeFileSync(DATA_PATH, JSON.stringify(updated, null, 2), "utf-8");

  console.log(`✅ lottery.json updated — now ${updated.length} records`);
  console.log("   Latest:", JSON.stringify(newEntry, null, 2));
}

main();
