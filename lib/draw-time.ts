import type { LotteryConfig } from "./lottery-config";

/** แปลง ICT offset เป็น ms */
const ICT_OFFSET = 7 * 60 * 60 * 1000;

/** หาเวลาออกรางวัลรอบถัดไปเป็น timestamp (ms) */
export function getNextDrawTime(config: LotteryConfig, now: Date): Date {
  const [hStr, mStr] = config.drawTimeICT.split(":");
  const drawHour = parseInt(hStr);
  const drawMin = parseInt(mStr);

  // แปลง now เป็นเวลา ICT
  const nowICT = new Date(now.getTime() + ICT_OFFSET);

  if (config.drawSchedule === "monthly_1_16") {
    return nextMonthly1_16(nowICT, drawHour, drawMin);
  }
  if (config.drawSchedule === "daily") {
    return nextDaily(nowICT, drawHour, drawMin);
  }
  // weekdays
  return nextWeekday(nowICT, drawHour, drawMin);
}

function makeICTDate(
  year: number,
  month: number,
  day: number,
  hour: number,
  min: number
): Date {
  // สร้าง Date object โดยลบ ICT offset คืน (UTC)
  return new Date(
    Date.UTC(year, month, day, hour, min, 0) - ICT_OFFSET
  );
}

function nextMonthly1_16(nowICT: Date, h: number, m: number): Date {
  const y = nowICT.getUTCFullYear();
  const mo = nowICT.getUTCMonth();
  const d = nowICT.getUTCDate();
  const curH = nowICT.getUTCHours();
  const curM = nowICT.getUTCMinutes();

  const isAfterTime = curH > h || (curH === h && curM >= m);

  if (d < 1 || (d === 1 && !isAfterTime)) return makeICTDate(y, mo, 1, h, m);
  if (d < 16 || (d === 16 && !isAfterTime)) return makeICTDate(y, mo, 16, h, m);
  // next month 1st
  const nextMo = mo === 11 ? 0 : mo + 1;
  const nextY = mo === 11 ? y + 1 : y;
  return makeICTDate(nextY, nextMo, 1, h, m);
}

function nextDaily(nowICT: Date, h: number, m: number): Date {
  const y = nowICT.getUTCFullYear();
  const mo = nowICT.getUTCMonth();
  const d = nowICT.getUTCDate();
  const curH = nowICT.getUTCHours();
  const curM = nowICT.getUTCMinutes();

  const isAfterTime = curH > h || (curH === h && curM >= m);
  if (!isAfterTime) return makeICTDate(y, mo, d, h, m);

  // พรุ่งนี้
  const tomorrow = new Date(
    Date.UTC(y, mo, d + 1) - ICT_OFFSET + ICT_OFFSET
  );
  return makeICTDate(
    tomorrow.getUTCFullYear(),
    tomorrow.getUTCMonth(),
    tomorrow.getUTCDate(),
    h,
    m
  );
}

function nextWeekday(nowICT: Date, h: number, m: number): Date {
  const y = nowICT.getUTCFullYear();
  const mo = nowICT.getUTCMonth();
  const d = nowICT.getUTCDate();
  const curH = nowICT.getUTCHours();
  const curM = nowICT.getUTCMinutes();
  const dow = nowICT.getUTCDay(); // 0=Sun, 6=Sat

  const isAfterTime = curH > h || (curH === h && curM >= m);
  const isWeekday = dow >= 1 && dow <= 5;

  if (isWeekday && !isAfterTime) return makeICTDate(y, mo, d, h, m);

  // หาวันทำการถัดไป
  let daysAhead = 1;
  if (isWeekday && isAfterTime) daysAhead = 1;
  if (dow === 5 && isAfterTime) daysAhead = 3; // ศุกร์ → จันทร์
  if (dow === 6) daysAhead = 2; // เสาร์ → จันทร์
  if (dow === 0) daysAhead = 1; // อาทิตย์ → จันทร์

  // ตรวจว่าวันถัดไปเป็นวันหยุดหรือไม่
  const nextDate = new Date(Date.UTC(y, mo, d + daysAhead));
  const nextDow = nextDate.getUTCDay();
  if (nextDow === 6) {
    return makeICTDate(
      nextDate.getUTCFullYear(),
      nextDate.getUTCMonth(),
      nextDate.getUTCDate() + 2,
      h,
      m
    );
  }
  if (nextDow === 0) {
    return makeICTDate(
      nextDate.getUTCFullYear(),
      nextDate.getUTCMonth(),
      nextDate.getUTCDate() + 1,
      h,
      m
    );
  }

  return makeICTDate(
    nextDate.getUTCFullYear(),
    nextDate.getUTCMonth(),
    nextDate.getUTCDate(),
    h,
    m
  );
}
