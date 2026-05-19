/**
 * fetch-lottery.mjs
 * ดึงผลหวยล่าสุดจาก API แล้ว prepend เข้า data/lottery.json
 *
 * รัน: node scripts/fetch-lottery.mjs
 */

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import https from "https";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, "../data/lottery.json");

const THAI_MONTHS = [
  "มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน",
  "กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม",
];

function toThaiDateDisplay(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return `${d} ${THAI_MONTHS[m - 1]} ${y + 543}`;
}

function toBEDateStr(dateStr) {
  const [y, m, d] = dateStr.split("-");
  return `${Number(y) + 543}-${m}-${d}`;
}

// ── Low-level HTTPS GET (bypasses fetch/Cloudflare issues) ─────────
function httpsGet(url, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; LottoInsight/1.0)",
        "Accept": "application/json",
      },
    }, (res) => {
      // Follow redirect
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return httpsGet(res.headers.location, timeoutMs).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      let body = "";
      res.setEncoding("utf8");
      res.on("data", chunk => body += chunk);
      res.on("end", () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { reject(new Error("Invalid JSON: " + body.slice(0, 100))); }
      });
    });
    req.setTimeout(timeoutMs, () => { req.destroy(new Error("Timeout")); });
    req.on("error", reject);
  });
}

// ── Fetch from Rayriffy API ────────────────────────────────────────
async function fetchFromRayriffy() {
  const json = await httpsGet("https://lotto.api.rayriffy.com/latest");
  const r = json.response;
  const [day, month, be] = r.date.split("/").map(Number);
  const ce = be - 543;
  const dateStr = `${String(ce).padStart(4,"0")}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
  const prizes = r.prizes;
  const find = (id) => prizes.find(p => p.id === id);
  return {
    date:        `${be}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`,
    dateDisplay: toThaiDateDisplay(dateStr),
    prize1:      find("firstPrize")?.number?.[0]  ?? "",
    prize3front: find("first3Digit")?.number ?? [],
    prize3back:  find("last3Digit")?.number  ?? [],
    prize2back:  find("last2Digit")?.number?.[0]  ?? "",
  };
}

// ── Fetch from lotto432 API (fallback) ─────────────────────────────
async function fetchFromLotto432() {
  // Try multiple endpoints
  const endpoints = [
    "https://api.lotto432.com/huay/thai",
    "https://api.lotto432.com/lottery/thai",
    "https://api.lotto432.com/lotto/thai",
  ];
  for (const url of endpoints) {
    try {
      const json = await httpsGet(url);
      const r = json?.result ?? json?.data ?? json;
      if (!r?.date) continue;
      let ceDate;
      if (String(r.date).includes("/")) {
        const [dd, mm, yyyy] = String(r.date).split("/");
        const y = Number(yyyy) > 2500 ? Number(yyyy) - 543 : Number(yyyy);
        ceDate = `${y}-${mm.padStart(2,"0")}-${dd.padStart(2,"0")}`;
      } else {
        ceDate = r.date;
      }
      return {
        date:        toBEDateStr(ceDate),
        dateDisplay: toThaiDateDisplay(ceDate),
        prize1:      String(r.prize1 ?? r.first ?? ""),
        prize3front: Array.isArray(r.prize3front) ? r.prize3front : [],
        prize3back:  Array.isArray(r.prize3back)  ? r.prize3back  : [],
        prize2back:  String(r.prize2back ?? r.last2 ?? ""),
      };
    } catch (err) {
      console.warn(`  ⚠️  ${url}: ${err.message}`);
    }
  }
  throw new Error("All lotto432 endpoints failed");
}

// ── Main ──────────────────────────────────────────────────────────
async function main() {
  console.log("🎱 Fetching latest Thai lottery result...");

  let newEntry;

  // Try primary
  try {
    newEntry = await fetchFromRayriffy();
    console.log(`✅ Rayriffy: ${newEntry.dateDisplay} | prize1: ${newEntry.prize1}`);
  } catch (err) {
    console.warn(`⚠️  Rayriffy failed: ${err.message}`);

    // Try fallback
    try {
      newEntry = await fetchFromLotto432();
      console.log(`✅ lotto432: ${newEntry.dateDisplay} | prize1: ${newEntry.prize1}`);
    } catch (err2) {
      console.warn(`⚠️  lotto432 failed: ${err2.message}`);
      // ── Graceful exit: API down or no new data today ──────────
      console.log("ℹ️  All APIs unavailable — no changes made. Will retry next scheduled run.");
      process.exit(0);
    }
  }

  // Load existing
  const existing = JSON.parse(readFileSync(DATA_PATH, "utf-8"));
  if (existing[0]?.date === newEntry.date) {
    console.log("⏭️  Already up-to-date. No changes made.");
    process.exit(0);
  }

  // Prepend
  const updated = [newEntry, ...existing];
  writeFileSync(DATA_PATH, JSON.stringify(updated, null, 2), "utf-8");
  console.log(`✅ lottery.json updated — now ${updated.length} records`);
  console.log("   Latest:", JSON.stringify(newEntry, null, 2));
}

main();
