/**
 * fetch-hanoi.mjs — ดึงผลหวยฮานอยพิเศษ (ทุกวัน)
 * Primary : api.lotto432.com
 * Fallback : thelotterytoday.com (HTML scraping — Hanoi Special)
 *
 * รัน: node scripts/fetch-hanoi.mjs
 */

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import https from "https";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, "../data/hanoi-lottery.json");

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

// ── Low-level HTTPS GET → JSON ────────────────────────────────────────
function httpsGet(url, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; LottoInsight/1.0)",
        "Accept": "application/json",
      },
    }, (res) => {
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
        catch (e) { reject(new Error("Invalid JSON")); }
      });
    });
    req.setTimeout(timeoutMs, () => req.destroy(new Error("Timeout")));
    req.on("error", reject);
  });
}

// ── Low-level HTTPS GET → raw HTML ───────────────────────────────────
function httpsGetHtml(url, timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return httpsGetHtml(res.headers.location, timeoutMs).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      let body = "";
      res.setEncoding("utf8");
      res.on("data", chunk => body += chunk);
      res.on("end", () => resolve(body));
    });
    req.setTimeout(timeoutMs, () => req.destroy(new Error("Timeout")));
    req.on("error", reject);
  });
}

// ── Parse result from JSON API ────────────────────────────────────────
function parseEntry(json) {
  const r = json?.result ?? json?.data ?? json;
  if (!r?.date && !r?.prize1 && !r?.special) throw new Error("Unexpected format");

  let ceDate;
  const dateStr = String(r.date ?? "");
  if (dateStr.includes("/")) {
    const parts = dateStr.split("/");
    const y = Number(parts[2]) > 2500 ? Number(parts[2]) - 543 : Number(parts[2]);
    ceDate = `${y}-${parts[1].padStart(2,"0")}-${parts[0].padStart(2,"0")}`;
  } else if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    ceDate = dateStr;
  } else {
    ceDate = new Date().toISOString().slice(0, 10);
  }

  const prize1 = String(r.prize1 ?? r.special ?? r.top ?? "").padStart(5, "0");
  return {
    date:        toBEDateStr(ceDate),
    dateDisplay: toThaiDateDisplay(ceDate),
    dayOfWeek:   getDayOfWeek(ceDate),
    prize1,
    prize3back:  prize1.slice(-3),
    prize2back:  prize1.slice(-2),
  };
}

// ── Get recent dates (daily, last n days) ────────────────────────────
function getRecentDates(n = 3) {
  const dates = [];
  const nowUtc = Date.now();
  // ICT midnight
  const ictMidnight = new Date(nowUtc + 7 * 3600000);
  ictMidnight.setUTCHours(0, 0, 0, 0);

  for (let i = 1; dates.length < n && i <= n + 2; i++) {
    const d = new Date(ictMidnight.getTime() - i * 86400000);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    dates.push(`${y}-${m}-${day}`);
  }
  return dates;
}

// ── Scrape Hanoi Special from thelotterytoday.com ────────────────────
async function scrapeFromTheLotteryToday() {
  const drawDates = getRecentDates(4);

  for (const ceDate of drawDates) {
    try {
      const url = `https://thelotterytoday.com/en/lottery/hanoi-lottery/${ceDate}`;
      console.log(`📄 Scraping: ${url}`);
      const html = await httpsGetHtml(url);

      if (html.includes("No draw is recorded") || html.includes("no draw")) continue;

      // Strip HTML tags and normalise
      const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

      // Extract Hanoi Special section — look for 4-digit number after "Hanoi Special"
      // Pattern: "Hanoi Special ... 4 Digit ... XXXX"
      const specialIdx = text.search(/[Hh]anoi\s+[Ss]pecial/);
      if (specialIdx === -1) {
        console.warn(`  ⚠️  Hanoi Special section not found for ${ceDate}`);
        continue;
      }

      const section = text.slice(specialIdx, specialIdx + 500);

      // Extract 4-digit prize from the Hanoi Special section
      const m4 = section.match(/4\s*[Dd]igit[^0-9]{0,30}(\d{4})\b/) ||
                 section.match(/\b(\d{4})\b/);

      if (!m4) {
        console.warn(`  ⚠️  Could not parse 4D number for ${ceDate}`);
        continue;
      }

      const prize1 = m4[1].padStart(5, "0");
      const prize3back = prize1.slice(-3);
      const prize2back = prize1.slice(-2);

      console.log(`✅ Scraped ${ceDate}: prize1=${prize1} 3D=${prize3back} 2D=${prize2back}`);

      return {
        date:        toBEDateStr(ceDate),
        dateDisplay: toThaiDateDisplay(ceDate),
        dayOfWeek:   getDayOfWeek(ceDate),
        prize1,
        prize3back,
        prize2back,
      };
    } catch (err) {
      console.warn(`  ⚠️  ${ceDate}: ${err.message}`);
    }
  }
  throw new Error("thelotterytoday.com scraping failed for all recent dates");
}

// ── Fetch from primary JSON endpoints ────────────────────────────────
async function fetchFromAPIs() {
  const endpoints = [
    "https://api.lotto432.com/huay/hanoi",
    "https://api.lotto432.com/lotto/hanoi",
    "https://api.lotto432.com/huay/hanoi-special",
    "https://www.huay.com/api/hanoi",
  ];

  for (const url of endpoints) {
    try {
      console.log(`📡 Trying: ${url}`);
      const json = await httpsGet(url);
      const entry = parseEntry(json);
      console.log(`✅ API success: ${entry.dateDisplay}`);
      return entry;
    } catch (err) {
      console.warn(`  ⚠️  Failed: ${err.message}`);
    }
  }
  throw new Error("All JSON APIs failed");
}

// ── Main ──────────────────────────────────────────────────────────────
async function main() {
  console.log("🇻🇳 Fetching หวยฮานอยพิเศษ...");

  let entry;

  // 1. Try JSON APIs
  try {
    entry = await fetchFromAPIs();
  } catch {
    // 2. Fall back to HTML scraping
    console.log("📄 Falling back to HTML scraping...");
    try {
      entry = await scrapeFromTheLotteryToday();
    } catch (err) {
      console.log("ℹ️  All sources unavailable — no changes made.");
      process.exit(0);
    }
  }

  if (!entry.prize2back || !entry.prize3back) {
    console.log("ℹ️  Incomplete data — skipping.");
    process.exit(0);
  }

  const existing = JSON.parse(readFileSync(DATA_PATH, "utf-8"));
  if (existing[0]?.date === entry.date) {
    console.log("⏭️  Already up-to-date.");
    process.exit(0);
  }

  const updated = [entry, ...existing];
  writeFileSync(DATA_PATH, JSON.stringify(updated, null, 2), "utf-8");
  console.log(`✅ hanoi-lottery.json updated — ${updated.length} records`);
}

main();
