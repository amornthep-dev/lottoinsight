# ตั้งค่า Google Apps Script สำหรับ Feedback & Waitlist

## ทำไมต้องทำ?
Vercel serverless ไม่ให้เขียนไฟล์ลง disk ดังนั้น feedback และ waitlist email ต้องเก็บใน Google Sheets แทน

## ขั้นตอน (ประมาณ 5 นาที)

### 1. เปิด Google Sheets ของโปรเจค
Sheet ID: `1NW1ov_JkMeyCOAQTIRNhqBhBDyc15r2N1Av0Q0R1bc4`

### 2. เปิด Apps Script Editor
ใน Google Sheets → Extensions → Apps Script

### 3. วาง code นี้ทับ code เดิมทั้งหมด

```javascript
const SHEET_ID = "1NW1ov_JkMeyCOAQTIRNhqBhBDyc15r2N1Av0Q0R1bc4";

function getOrCreateSheet(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
  }
  return sheet;
}

function doGet(e) {
  const action = e.parameter.action;
  const ss = SpreadsheetApp.openById(SHEET_ID);

  if (action === "feedback") {
    const sheet = ss.getSheetByName("Feedback");
    if (!sheet || sheet.getLastRow() < 2) return json([]);
    const rows = sheet.getDataRange().getValues();
    const headers = rows[0];
    const data = rows.slice(1).map(row => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = row[i]; });
      return obj;
    }).reverse();
    return json(data);
  }

  return json({ ok: true });
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const ss = SpreadsheetApp.openById(SHEET_ID);

  if (data.action === "feedback") {
    const sheet = getOrCreateSheet(ss, "Feedback",
      ["id", "name", "category", "message", "createdAt", "likes"]);
    sheet.appendRow([data.id, data.name, data.category, data.message, data.createdAt, 0]);
  }

  else if (data.action === "like") {
    const sheet = ss.getSheetByName("Feedback");
    if (sheet) {
      const rows = sheet.getDataRange().getValues();
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] === data.id) {
          sheet.getRange(i + 1, 6).setValue((rows[i][5] || 0) + 1);
          break;
        }
      }
    }
  }

  else if (data.action === "waitlist") {
    const sheet = getOrCreateSheet(ss, "Waitlist", ["email", "createdAt"]);
    // เช็ค duplicate email
    const existing = sheet.getDataRange().getValues().map(r => r[0]);
    if (!existing.includes(data.email)) {
      sheet.appendRow([data.email, data.createdAt]);
    }
  }

  return json({ ok: true });
}

function json(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
```

### 4. Deploy เป็น Web App
1. กด **Deploy** → **New deployment**
2. Type: **Web app**
3. Execute as: **Me**
4. Who has access: **Anyone** ← สำคัญ! ต้องเป็น Anyone
5. กด **Deploy**
6. **Copy URL** ที่ได้ (เช่น `https://script.google.com/macros/s/AKfycb.../exec`)

### 5. เพิ่ม Environment Variable ใน Vercel
1. ไป Vercel Dashboard → Project → Settings → Environment Variables
2. เพิ่ม:
   - Name: `APPS_SCRIPT_URL`
   - Value: (URL จากขั้นตอน 4)
   - Environment: Production + Preview + Development
3. กด Save
4. **Redeploy** โปรเจคใน Vercel

## ทดสอบว่าใช้งานได้
เปิด Browser แล้วไปที่:
```
https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?action=feedback
```
ถ้าได้ `[]` หรือ JSON array = ใช้งานได้แล้ว ✓

## Sheet ที่จะถูกสร้างอัตโนมัติ
- **Feedback** tab — เก็บ feedback จากผู้ใช้
- **Waitlist** tab — เก็บ email ที่สมัครรอ Premium
