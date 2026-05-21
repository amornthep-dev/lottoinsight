// Google Apps Script: Populate Historical Lottery Data
// วิธีใช้: ไปที่ Google Sheet → Extensions → Apps Script
//          วาง code ทั้งหมดนี้ → กด Save → กด Run → populateAllData
//          ครั้งแรกอาจต้องกด "Review Permissions" แล้ว Allow

const POPULATE_SHEET_ID = "1NW1ov_JkMeyCOAQTIRNhqBhBDyc15r2N1Av0Q0R1bc4";

// ========== THAI LOTTERY DATA (2568 / ปี 2025) ==========
// 24 งวด ม.ค.-ธ.ค. 2568 (เรียงจากใหม่ไปเก่า)
// คอลัมน์: [date, prize1, prize3(ว่าง-คำนวณจาก code), prize2/bottom]
// หมายเหตุ: prize3 ของหวยไทยคำนวณจาก 3 ตัวท้ายของ prize1 ใน code
const THAI_2568 = [
  ["16/12/68", "763895", "", "52"],
  ["1/12/68",  "461252", "", "22"],
  ["16/11/68", "458145", "", "37"],
  ["1/11/68",  "345898", "", "87"],
  ["16/10/68", "059696", "", "61"],
  ["1/10/68",  "876978", "", "77"],
  ["16/9/68",  "074646", "", "58"],
  ["1/9/68",   "506356", "", "31"],
  ["16/8/68",  "994865", "", "63"],
  ["1/8/68",   "811852", "", "50"],
  ["16/7/68",  "245324", "", "26"],
  ["1/7/68",   "949246", "", "91"],
  ["16/6/68",  "507392", "", "06"],
  ["1/6/68",   "559352", "", "20"],
  ["16/5/68",  "251309", "", "87"],
  ["2/5/68",   "213388", "", "06"],
  ["16/4/68",  "266227", "", "85"],
  ["1/4/68",   "669687", "", "36"],
  ["16/3/68",  "757563", "", "32"],
  ["1/3/68",   "818894", "", "54"],
  ["16/2/68",  "847377", "", "50"],
  ["1/2/68",   "558700", "", "51"],
  ["17/1/68",  "807779", "", "23"],
  ["2/1/68",   "730209", "", "51"],
];

// ========== HANOI LOTTERY DATA (2 เม.ย. - 5 พ.ค. 2569) ==========
// 34 งวด เรียงจากใหม่ไปเก่า (ต่อจากงวด 6/5/69 ที่มีอยู่แล้ว)
// คอลัมน์: [date, prize1(4 ตัวท้าย ĐB), prize3(3 ตัวท้าย ĐB), prize2top(2 ตัวท้าย ĐB), prize2bottom(2 ตัวท้าย G1)]
// ที่มา: xoso.me (ผลหวยเวียดนาม XSMB / ฮานอย)
const HANOI_NEW = [
  ["5/5/69",  "2512", "512", "12", "66"],
  ["4/5/69",  "1251", "251", "51", "14"],
  ["3/5/69",  "2964", "964", "64", "78"],
  ["2/5/69",  "6132", "132", "32", "57"],
  ["1/5/69",  "6637", "637", "37", "96"],
  ["30/4/69", "2075", "075", "75", "57"],
  ["29/4/69", "6569", "569", "69", "20"],
  ["28/4/69", "5254", "254", "54", "38"],
  ["27/4/69", "0059", "059", "59", "64"],
  ["26/4/69", "8228", "228", "28", "08"],
  ["25/4/69", "8717", "717", "17", "50"],
  ["24/4/69", "9876", "876", "76", "79"],
  ["23/4/69", "6239", "239", "39", "91"],
  ["22/4/69", "6948", "948", "48", "41"],
  ["21/4/69", "8076", "076", "76", "42"],
  ["20/4/69", "4197", "197", "97", "97"],
  ["19/4/69", "3725", "725", "25", "16"],
  ["18/4/69", "7243", "243", "43", "13"],
  ["17/4/69", "8455", "455", "55", "14"],
  ["16/4/69", "5035", "035", "35", "27"],
  ["15/4/69", "3714", "714", "14", "68"],
  ["14/4/69", "2763", "763", "63", "33"],
  ["13/4/69", "2738", "738", "38", "09"],
  ["12/4/69", "2000", "000", "00", "62"],
  ["11/4/69", "4204", "204", "04", "03"],
  ["10/4/69", "6120", "120", "20", "18"],
  ["9/4/69",  "5625", "625", "25", "49"],
  ["8/4/69",  "7450", "450", "50", "35"],
  ["7/4/69",  "2382", "382", "82", "29"],
  ["6/4/69",  "6406", "406", "06", "32"],
  ["5/4/69",  "2855", "855", "55", "40"],
  ["4/4/69",  "9737", "737", "37", "82"],
  ["3/4/69",  "2944", "944", "44", "91"],
  ["2/4/69",  "1267", "267", "67", "50"],
];

function populateAllData() {
  const ss = SpreadsheetApp.openById(POPULATE_SHEET_ID);
  const allSheets = ss.getSheets();

  // Log all sheet names/IDs to help with debugging
  allSheets.forEach(function(s) {
    Logger.log("Sheet: " + s.getName() + " (GID: " + s.getSheetId() + ")");
  });

  // --- Populate Thai 2568 data (Sheet GID = 0, index 0) ---
  // ค้นหา Sheet ของหวยไทย
  let thaiSheet = null;
  allSheets.forEach(function(s) {
    if (s.getSheetId() === 0 || s.getName().toLowerCase() === "thai" || s.getIndex() === 1) {
      thaiSheet = s;
    }
  });
  if (!thaiSheet) thaiSheet = allSheets[0]; // fallback to first sheet

  if (thaiSheet) {
    const lastRow = thaiSheet.getLastRow();
    const data = THAI_2568.map(function(row) { return row; });
    thaiSheet.getRange(lastRow + 1, 1, data.length, 4).setValues(data);
    Logger.log("✓ Thai: เพิ่ม " + data.length + " งวด (หวยไทย 2568) หลัง row " + lastRow);
  } else {
    Logger.log("✗ Thai sheet not found!");
  }

  // --- Populate Hanoi data (Sheet GID = 727607944) ---
  let hanoiSheet = null;
  allSheets.forEach(function(s) {
    if (s.getSheetId() === 727607944 ||
        s.getName().toLowerCase().includes("hanoi")) {
      hanoiSheet = s;
    }
  });

  if (hanoiSheet) {
    const lastRow = hanoiSheet.getLastRow();
    const data = HANOI_NEW.map(function(row) { return row; });
    hanoiSheet.getRange(lastRow + 1, 1, data.length, 5).setValues(data);
    Logger.log("✓ Hanoi: เพิ่ม " + data.length + " งวด (2 เม.ย. - 5 พ.ค. 2569) หลัง row " + lastRow);
  } else {
    Logger.log("✗ Hanoi sheet not found! (GID 727607944)");
  }

  Logger.log("=== เสร็จสิ้น! ดู Execution Log สำหรับผลลัพธ์ ===");
  SpreadsheetApp.flush();
}

// ฟังก์ชันช่วย: แสดงชื่อและ GID ของทุก Sheet
function listSheets() {
  const ss = SpreadsheetApp.openById(POPULATE_SHEET_ID);
  ss.getSheets().forEach(function(s) {
    Logger.log(s.getName() + " → GID: " + s.getSheetId() + " (index " + s.getIndex() + ")");
  });
}
