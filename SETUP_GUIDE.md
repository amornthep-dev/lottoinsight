# LottoInsight — Beta Setup Guide

## ขั้นตอนทั้งหมดก่อน Share ให้ Beta User

### ✅ สิ่งที่ทำเสร็จแล้ว (code)
- หวยไทย: วิเคราะห์ 3 ตัวท้ายจาก prize1 ✓
- Feedback API: ย้ายไป Google Apps Script (ไม่ใช้ fs) ✓
- Email form บน Membership: บันทึกลง /api/waitlist ✓
- Analysis page: แสดง badge หวยไทย ✓
- ลบ analysisFilterDay: 16 ✓

---

## ขั้นตอนที่ต้องทำด้วยตัวเอง

### Step 1: ตั้งค่า Google Apps Script (Feedback + Waitlist)

1. เปิด [Google Sheet](https://docs.google.com/spreadsheets/d/1NW1ov_JkMeyCOAQTIRNhqBhBDyc15r2N1Av0Q0R1bc4)
2. กด **Extensions → Apps Script**
3. วาง code จากไฟล์ `APPS_SCRIPT_SETUP.md` ส่วนที่เป็น JavaScript ทับ code เดิม
4. กด **Save** แล้วกด **Deploy → New deployment**
   - Type: Web app
   - Execute as: Me
   - Who has access: **Anyone**
5. Copy URL ที่ได้ (format: `https://script.google.com/macros/s/xxx/exec`)

### Step 2: เพิ่มข้อมูลประวัติย้อนหลัง

1. เปิด Apps Script Editor (เดิม หรือสร้าง script ใหม่)
2. เปิดไฟล์ **`POPULATE_SHEETS.gs`** จาก project นี้
3. Copy code ทั้งหมดไปวางใน Apps Script Editor
4. กด **Save**
5. เลือก function `populateAllData` แล้วกด **Run**
6. ครั้งแรกจะขอ permissions → กด **Allow**
7. ดู Execution Log ว่าสำเร็จ

**ผลที่จะได้:**
- หวยไทย: +24 งวด (ปี 2568 ทั้งหมด, ม.ค.-ธ.ค. 2025)
- หวยฮานอย: +34 งวด (2 เม.ย. - 5 พ.ค. 2569)
- รวมข้อมูลใน Sheet:
  - หวยไทย: 34 งวด (10 งวด 2569 + 24 งวด 2568)
  - หวยฮานอย: 49 งวด (15 งวด เดิม + 34 งวดใหม่)
  - หวยลาว: 11 งวด (เดิม — ยังไม่ได้เพิ่ม)

### Step 3: เพิ่ม Environment Variable ใน Vercel

1. ไป [Vercel Dashboard](https://vercel.com) → Project → Settings → Environment Variables
2. เพิ่ม:
   - Name: `APPS_SCRIPT_URL`
   - Value: URL จาก Step 1
   - Environment: Production + Preview + Development
3. กด Save แล้ว **Redeploy**

### Step 4: Deploy ขึ้น Vercel

```bash
cd lottoinsight
git add -A
git commit -m "fix: thai 3-digit analysis, feedback api, membership form"
git push
```

หรือ deploy ผ่าน Vercel CLI:
```bash
npx vercel --prod
```

---

## หมายเหตุเรื่องข้อมูล

### หวยไทย 2569 (2026)
มีอยู่แล้วใน Sheet 10 งวด (2/1/69 - 16/5/69)

### หวยฮานอย
ข้อมูลมาจาก xoso.me (ผลรางวัลเวียดนาม XSMB / ฮานอย)
- prize1 = 4 ตัวท้ายของรางวัลพิเศษ (ĐB)
- prize3 = 3 ตัวท้าย ĐB
- prize2top = 2 ตัวท้าย ĐB
- prize2bottom = 2 ตัวท้ายของรางวัลที่ 1 (G1)

### หวยลาว
ยังไม่ได้เพิ่มข้อมูลย้อนหลัง (ออกจันทร์-ศุกร์)
ถ้าต้องการ ต้องเพิ่มด้วยตนเองใน Google Sheet

---

## ทดสอบก่อน Share

1. เปิดหน้า Thai lottery → ดูว่า 3 ตัวท้ายแสดงถูกต้อง
2. Submit feedback → ดูใน Google Sheet (Feedback tab)
3. สมัคร waitlist ใน Membership → ดูใน Sheet (Waitlist tab)
4. ดูหน้า Analysis → ข้อมูลครบถ้วน
