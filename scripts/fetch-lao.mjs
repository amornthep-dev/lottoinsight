/**
 * fetch-lao.mjs — ดึงผลหวยลาวพัฒนา
 * รัน: node scripts/fetch-lao.mjs
 */

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import https from "https";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, "../data/lao-lottery.json");

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

// ── Low-level HTTPS GET ────────────────────────────────────────────
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

// ── Parse result ───────────────────────────────────────────────────
function parseEntry(json) {
  const r = json?.result ?? json?.data ?? json;
  if (!r?.date && !r?.prize1 && !r?.top) throw new Error("Unexpected format");

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

  const prize1 = String(r.prize1 ?? r.top ?? "");
  return {
    date:        toBEDateStr(ceDate),
    dateDisplay: toThaiDateDisplay(ceDate),
    dayOfWeek:   getDayOfWeek(ceDate),
    prize1,
    prize3back:  String(r.prize3 ?? r["3d"] ?? prize1.slice(-3)).padStart(3, "0"),
    prize2back:  String(r.prize2 ?? r["2d"] ?? prize1.slice(-2)).padStart(2, "0"),
  };
}

// ── Fetch from multiple endpoints ─────────────────────────────────
async function fetchLatest() {
  const endpoints = [
    "https://api.lotto432.com/huay/lao-develop",
    "https://api.lotto432.com/lotto/lao",
    "https://api.lotto432.com/huay/lao",
    "https://www.huay.com/api/lao",
  ];

  for (const url of endpoints) {
    try {
      console.log(`📡 Trying: ${url}`);
      const json = await httpsGet(url);
      const entry = parseEntry(json);
      console.log(`✅ Success: ${entry.dateDisplay}`);
      return entry;
    } catch (err) {
      console.warn(`  ⚠️  Failed: ${err.message}`);
    }
  }
  throw new Error("All endpoints failed");
}

// ── Main ──────────────────────────────────────────────────────────
async function main() {
  console.log("🇱🇦 Fetching หวยลาวพัฒนา...");

  let entry;
  try {
    entry = await fetchLatest();
  } catch (err) {
    console.log("ℹ️  All APIs unavailable — no changes made.");
    process.exit(0);
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
  console.log(`✅ lao-lottery.json updated — ${updated.length} records`);
}

main();
