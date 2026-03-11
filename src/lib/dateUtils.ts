import type { FictionalDate } from '@/types/magi';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function formatFictionalDate(date: FictionalDate): string {
  return `Year ${date.year}, ${date.month} ${date.day}`;
}

export function advanceDate(date: FictionalDate, days: number): FictionalDate {
  const monthIndex = MONTHS.indexOf(date.month);
  let day = date.day + days;
  let month = monthIndex;
  let year = date.year;

  while (day > 30) {
    day -= 30;
    month++;
    if (month >= 12) {
      month = 0;
      year++;
    }
  }

  return { year, month: MONTHS[month], day };
}

export function advanceMonths(date: FictionalDate, months: number): FictionalDate {
  const monthIndex = MONTHS.indexOf(date.month);
  const totalMonths = monthIndex + months;
  const year = date.year + Math.floor(totalMonths / 12);
  const month = ((totalMonths % 12) + 12) % 12;

  return { year, month: MONTHS[month], day: date.day };
}

export function ficionalYearToRealYear(fictionalYear: number): number {
  // Week-to-year mapping: 1 real week = 1 fictional year
  // Real time starts 2050 at fictional Year 0
  return 2050 + fictionalYear;
}

export function compareDates(a: FictionalDate, b: FictionalDate): number {
  if (a.year !== b.year) return a.year - b.year;
  const aMonth = MONTHS.indexOf(a.month);
  const bMonth = MONTHS.indexOf(b.month);
  if (aMonth !== bMonth) return aMonth - bMonth;
  return a.day - b.day;
}

export function yearsBetween(from: FictionalDate, to: FictionalDate): number {
  return to.year - from.year;
}
