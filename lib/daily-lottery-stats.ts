// ─── Types ──────────────────────────────────────────────────────────────────

export type DailyEntry = {
  date: string;        // "2568-05-19" (BE year)
  dateDisplay: string; // "19 พฤษภาคม 2568"
  dayOfWeek: string;   // "จันทร์"
  prize2back: string;  // "23"
  prize3back: string;  // "523"
  prize1?: string;     // "8523" (Lao: 4-digit) or "56789" (Hanoi: 5-digit)
};

export type HotColdEntry = {
  num: string;
  freq: number;
  recent: number;
  gap: number;
};

export type DayPattern = {
  day: string;
  top2: string[];
  top3: string[];
  count: number;
};

export type SignalResult = {
  num: string;
  signals: string[];
  score: number;
};

export type NumberAnalysis = {
  num: string;
  digit: 2 | 3;
  freq: number;
  total: number;
  gap: number;
  recency: number;
  lastSeen: string | null;
  appearedDates: string[];
  recent30: number;
  r12: number;
  trend: "up" | "down" | "flat";
  dayBreakdown: Record<string, number>;
  score: number;
  neverAppeared: boolean;
};

// ─── Thai day labels ─────────────────────────────────────────────────────────

export const THAI_DAYS = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];

export function getTodayDayThai(): string {
  return THAI_DAYS[new Date().getDay()];
}

// ─── Utility ─────────────────────────────────────────────────────────────────

function countFreq(nums: string[]): Record<string, number> {
  return nums.reduce(
    (acc, n) => ({ ...acc, [n]: (acc[n] || 0) + 1 }),
    {} as Record<string, number>
  );
}

function getNums(data: DailyEntry[], digit: 2 | 3): string[] {
  return digit === 2 ? data.map((d) => d.prize2back) : data.map((d) => d.prize3back);
}

function topN(scores: Record<string, number>, n: number): string[] {
  return Object.entries(scores)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k]) => k);
}

// ─── Hot / Cold ──────────────────────────────────────────────────────────────

export function getDailyHotCold(
  data: DailyEntry[],
  digit: 2 | 3
): { hot: HotColdEntry[]; cold: HotColdEntry[] } {
  if (data.length === 0) return { hot: [], cold: [] };

  const all = getNums(data, digit);
  const recent30 = all.slice(0, Math.min(30, all.length));
  const unique = [...new Set(all)];

  const stats: HotColdEntry[] = unique.map((n) => ({
    n,
    num: n,
    freq: all.filter((x) => x === n).length,
    recent: recent30.filter((x) => x === n).length,
    gap: all.indexOf(n) === -1 ? all.length : all.indexOf(n),
  }));

  const hot = [...stats].sort((a, b) => b.recent - a.recent || b.freq - a.freq).slice(0, 10);
  const cold = [...stats].filter((s) => s.gap > 0).sort((a, b) => b.gap - a.gap).slice(0, 10);

  return { hot, cold };
}

// ─── Day of Week Pattern ─────────────────────────────────────────────────────

export function getDayOfWeekPattern(data: DailyEntry[], digit: 2 | 3): DayPattern[] {
  if (data.length === 0) return [];

  const byDay: Record<string, string[]> = {};
  for (const day of THAI_DAYS) byDay[day] = [];

  for (const entry of data) {
    const day = entry.dayOfWeek;
    if (!byDay[day]) byDay[day] = [];
    byDay[day].push(digit === 2 ? entry.prize2back : entry.prize3back);
  }

  return THAI_DAYS.map((day) => {
    const nums = byDay[day] ?? [];
    const freq = countFreq(nums);
    const sorted = topN(freq, 5);
    return {
      day,
      top2: sorted.slice(0, 3),
      top3: sorted.slice(0, 3),
      count: nums.length,
    };
  }).filter((p) => p.count > 0);
}

// ─── Recency Weighted Frequency ──────────────────────────────────────────────

const WEIGHTS = [
  1.0, 0.9, 0.8, 0.7, 0.6, 0.5, 0.45, 0.4, 0.35, 0.3,
  0.25, 0.22, 0.2, 0.18, 0.16, 0.14, 0.12, 0.11, 0.1, 0.09,
];

export function getDailyRecencyWeighted(
  data: DailyEntry[],
  digit: 2 | 3
): Record<string, number> {
  const score: Record<string, number> = {};
  const nums = getNums(data, digit);
  nums.forEach((n, i) => {
    const w = i < WEIGHTS.length ? WEIGHTS[i] : 0.08;
    score[n] = (score[n] || 0) + w;
  });
  return score;
}

// ─── Signal Convergence (2-digit focused) ────────────────────────────────────

export function getDailySignalConvergence(data: DailyEntry[]): SignalResult[] {
  if (data.length < 5) return [];

  const all2 = data.map((d) => d.prize2back);
  const recent30 = all2.slice(0, Math.min(30, all2.length));
  const todayDay = getTodayDayThai();

  // Signal 1: Hot in recent 30
  const recentFreq = countFreq(recent30);
  const hotNums = topN(recentFreq, 10);

  // Signal 2: Monthly frequency (last 90 draws ≈ 3 months for daily lottery)
  const monthly = all2.slice(0, Math.min(90, all2.length));
  const monthlyFreq = countFreq(monthly);
  const monthlyTop = topN(monthlyFreq, 10);

  // Signal 3: Day-of-week pattern
  const byDayToday = data
    .filter((d) => d.dayOfWeek === todayDay)
    .map((d) => d.prize2back);
  const dayFreq = countFreq(byDayToday);
  const dayTop = topN(dayFreq, 10);

  // Signal 4: Gap (overdue numbers)
  const unique = [...new Set(all2)];
  const gapMap: Record<string, number> = {};
  unique.forEach((n) => {
    gapMap[n] = all2.indexOf(n);
  });
  const overdueTop = unique
    .filter((n) => gapMap[n] > 5)
    .sort((a, b) => gapMap[b] - gapMap[a])
    .slice(0, 10);

  // Signal 5: Recency weighted
  const recency = getDailyRecencyWeighted(data, 2);
  const recencyTop = topN(recency, 10);

  // Combine
  const allCandidates = new Set([
    ...hotNums, ...monthlyTop, ...dayTop, ...overdueTop, ...recencyTop,
  ]);

  const results: SignalResult[] = [];
  for (const num of allCandidates) {
    const signals: string[] = [];
    if (hotNums.includes(num)) signals.push("ร้อน30");
    if (monthlyTop.includes(num)) signals.push("ราย3เดือน");
    if (dayTop.includes(num)) signals.push(todayDay);
    if (overdueTop.includes(num)) signals.push("ค้างนาน");
    if (recencyTop.includes(num)) signals.push("recency");
    if (signals.length >= 2) {
      results.push({ num, signals, score: signals.length });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 15);
}

// ─── Analyze single number ────────────────────────────────────────────────────

export function analyzeDailyNumber(
  data: DailyEntry[],
  num: string,
  digit: 2 | 3
): NumberAnalysis {
  const all = getNums(data, digit);
  const total = all.length;
  const freq = all.filter((n) => n === num).length;
  const gap = all.indexOf(num) === -1 ? total : all.indexOf(num);

  const weights = WEIGHTS;
  let recency = 0;
  all.forEach((n, i) => {
    if (n === num) recency += i < weights.length ? weights[i] : 0.08;
  });

  const appearedDates = digit === 2
    ? data.filter((d) => d.prize2back === num).map((d) => d.dateDisplay)
    : data.filter((d) => d.prize3back === num).map((d) => d.dateDisplay);

  const lastSeen = appearedDates[0] ?? null;

  const recent30Slice = all.slice(0, Math.min(30, total));
  const recent30 = recent30Slice.filter((n) => n === num).length;

  const r12 = all.slice(0, Math.min(12, total)).filter((n) => n === num).length;
  const r12to24 = all.slice(12, Math.min(24, total)).filter((n) => n === num).length;
  const trend: "up" | "down" | "flat" =
    r12 > r12to24 ? "up" : r12 < r12to24 ? "down" : "flat";

  // Day-of-week breakdown
  const dayBreakdown: Record<string, number> = {};
  for (const day of THAI_DAYS) dayBreakdown[day] = 0;
  for (const entry of data) {
    const val = digit === 2 ? entry.prize2back : entry.prize3back;
    if (val === num) {
      dayBreakdown[entry.dayOfWeek] = (dayBreakdown[entry.dayOfWeek] || 0) + 1;
    }
  }

  const maxFreq = Math.max(
    ...([...new Set(all)].map((n) => all.filter((x) => x === n).length))
  );

  const score = Math.min(
    100,
    Math.round(
      (freq / Math.max(maxFreq, 1)) * 30 +
        (recency / 5) * 25 +
        (gap > 15 ? 20 : gap > 7 ? 12 : gap > 3 ? 6 : 2) +
        r12 * 4 +
        (trend === "up" ? 8 : 0)
    )
  );

  return {
    num,
    digit,
    freq,
    total,
    gap,
    recency: Math.round(recency * 100) / 100,
    lastSeen,
    appearedDates,
    recent30,
    r12,
    trend,
    dayBreakdown,
    score,
    neverAppeared: freq === 0,
  };
}
