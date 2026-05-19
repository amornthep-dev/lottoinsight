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
  const [y, m, d] = dateStr.split("-").map(Number);
  const be = y + 543;
  return `${d} ${THAI_MONTHS[m - 1]} ${be}`;
}

function toBEDateStr(dateStr) {
  const [y, m, d] = dateStr.split("-");
  return `${Number(y) + 543}-${m}-${d}`;
}

// ── Fetch with timeout + retry ─────────────────────────────────────
async function fetchWithRetry(url, options = {}, retries = 3, delayMs = 5000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`📡 Attempt ${attempt}/${retries}: ${url}`);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (err) {
      console.warn(`⚠️  Attempt ${attempt} failed: ${err.message}`);
      if (attempt < retries) {
        console.log(`⏳ Waiting ${delayMs / 1000}s before retry...`);
        await new Promise(r => setTimeout(r, delayMs));
      } else {
        throw err;
      }
    }
  }
}

// ── Fetch from Rayriffy API ────────────────────────────────────────
async function fetchFromRayriffy() {
  const res = await fetchWithRetry(
    "https://lotto.api.rayriffy.com/latest",
    { headers: { "User-Agent": "lottoinsight-bot/1.0" } }
  );
  const json = await res.json();

  const r = json.response;
  // date from API is in Buddhist Era: "16/05/2568"
  const [day, month, be] = r.date.split("/").map(Number);
  const ce = be - 543;
  const dateStr   = `${String(ce).padStart(4,"0")}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
  const beDateStr = `${be}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`;

  const prizes = r.prizes;
  const find = (id) => prizes.find(p => p.id === id);

  return {
    date:        beDateStr,
    dateDisplay: toThaiDateDisplay(dateStr),
    prize1:      find("firstPrize")?.number?.[0]  ?? "",
    prize3front: find("first3Digit")?.number ?? [],
    prize3back:  find("last3Digit")?.number  ?? [],
    prize2back:  find("last2Digit")?.number?.[0]  ?? "",
  };
}

// ── Fetch from lotto432 API (fallback) ────────────────────────────
async function fetchFromLotto432() {
  const res = await fetchWithRetry(
    "https://www.lotto432.com/api/th",
    { headers: { "User-Agent": "lottoinsight-bot/1.0" } }
  );
  const json = await res.json();

  const r = json?.result ?? json?.data ?? json;
  if (!r?.date) throw new Error("lotto432: unexpected response format");

  // date may be DD/MM/YYYY or YYYY-MM-DD
  let ceDate;
  if (String(r.date).includes("/")) {
    const parts = String(r.date).split("/");
    if (parts[2].length === 4) {
      ceDate = `${parts[2]}-${parts[1].padStart(2,"0")}-${parts[0].padStart(2,"0")}`;
    } else {
      const be = Number(parts[2]);
      ceDate = `${be - 543}-${parts[1].padStart(2,"0")}-${parts[0].padStart(2,"0")}`;
    }
  } else {
    ceDate = r.date;
  }

  const beDateStr = toBEDateStr(ceDate);
  return {
    date:        beDateStr,
    dateDisplay: toThaiDateDisplay(ceDate),
    prize1:      String(r.prize1 ?? r.first ?? ""),
    prize3front: Array.isArray(r.prize3front) ? r.prize3front : (r.prize3front ? [r.prize3front] : []),
    prize3back:  Array.isArray(r.prize3back)  ? r.prize3back  : (r.prize3back  ? [r.prize3back]  : []),
    prize2back:  String(r.prize2back ?? r.last2 ?? ""),
  };
}

// ── Main ──────────────────────────────────────────────────────────
async function main() {
  console.log("🎱 Fetching latest lottery result...");

  let newEntry;

  // Try primary API
  try {
    newEntry = await fetchFromRayriffy();
    console.log(`✅ Rayriffy: ${newEntry.dateDisplay} | prize1: ${newEntry.prize1} | ท้าย 2: ${newEntry.prize2back}`);
  } catch (err) {
    console.warn(`⚠️  Rayriffy failed: ${err.message}`);

    // Try fallback API
    try {
      newEntry = await fetchFromLotto432();
      console.log(`✅ lotto432 fallback: ${newEntry.dateDisplay} | prize1: ${newEntry.prize1}`);
    } catch (err2) {
      console.error("❌ All APIs failed:", err2.message);
      process.exit(1);
    }
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
