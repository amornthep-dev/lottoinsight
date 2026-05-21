export type LotteryType =
  | "thai"
  | "hanoi"
  | "hanoi-special"
  | "hanoi-vip"
  | "hanoi-chakagit"
  | "lao-pattana";

export interface LotteryConfig {
  id: LotteryType;
  name: string;
  flag: string;
  route: string;
  sheetGid: number;   // Google Sheets gid (ใช้ gid แทนชื่อ tab เพื่อความแน่นอน)
  localFile: string;
  /** 'monthly_1_16' | 'daily' | 'weekdays' (Mon–Fri) */
  drawSchedule: "monthly_1_16" | "daily" | "weekdays";
  /** เวลาออกรางวัล (ICT / UTC+7) รูปแบบ "HH:MM" */
  drawTimeICT: string;
  /** ฮานอยมี prize2top + prize2bottom แยกกัน */
  hasBottomPrize: boolean;
  /** แสดงวิเคราะห์เลข 3 ตัว (หวยไทยปิดเพราะไม่มีรางวัล 3 ตัวชัดเจน) */
  show3Digit: boolean;
  /**
   * กรองเฉพาะงวดที่ออกวันที่ X ของเดือนก่อนวิเคราะห์
   * เช่น หวยไทยออก 1 และ 16 → ใช้ 16 เท่านั้น
   */
  analysisFilterDay?: number;
}

export const LOTTERY_CONFIGS: Record<LotteryType, LotteryConfig> = {
  thai: {
    id: "thai",
    name: "หวยไทย",
    flag: "🇹🇭",
    route: "/thai",
    sheetGid: 0,
    localFile: "lottery",
    drawSchedule: "monthly_1_16",
    drawTimeICT: "15:00",
    hasBottomPrize: false,
    show3Digit: true,
  },
  hanoi: {
    id: "hanoi",
    name: "หวยฮานอย",
    flag: "🇻🇳",
    route: "/hanoi",
    sheetGid: 727607944,
    localFile: "hanoi-normal",
    drawSchedule: "daily",
    drawTimeICT: "18:15",
    hasBottomPrize: true,
    show3Digit: true,
  },
  "hanoi-special": {
    id: "hanoi-special",
    name: "หวยฮานอย พิเศษ",
    flag: "🇻🇳",
    route: "/hanoi-special",
    sheetGid: 1782431877,
    localFile: "hanoi-special",
    drawSchedule: "daily",
    drawTimeICT: "17:15",
    hasBottomPrize: true,
    show3Digit: true,
  },
  "hanoi-vip": {
    id: "hanoi-vip",
    name: "หวยฮานอย VIP",
    flag: "🇻🇳",
    route: "/hanoi-vip",
    sheetGid: 1237554418,
    localFile: "hanoi-vip",
    drawSchedule: "daily",
    drawTimeICT: "19:00",
    hasBottomPrize: true,
    show3Digit: true,
  },
  "hanoi-chakagit": {
    id: "hanoi-chakagit",
    name: "หวยฮานอย เฉพาะกิจ",
    flag: "🇻🇳",
    route: "/hanoi-chakagit",
    sheetGid: 525999546,
    localFile: "hanoi-chakagit",
    drawSchedule: "daily",
    drawTimeICT: "16:30",
    hasBottomPrize: true,
    show3Digit: true,
  },
  "lao-pattana": {
    id: "lao-pattana",
    name: "หวยลาวพัฒนา",
    flag: "🇱🇦",
    route: "/lao-pattana",
    sheetGid: 1014839028,
    localFile: "lao-pattana",
    drawSchedule: "weekdays",
    drawTimeICT: "20:15",
    hasBottomPrize: false,
    show3Digit: true,
  },
};

export const LOTTERY_ORDER: LotteryType[] = [
  "thai",
  "hanoi",
  "hanoi-special",
  "hanoi-vip",
  "hanoi-chakagit",
  "lao-pattana",
];
