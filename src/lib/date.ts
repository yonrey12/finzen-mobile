const HONDURAS_TIME_ZONE = "America/Tegucigalpa";

export const MONTH_NAMES_ES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

function partsOf(date: Date, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: HONDURAS_TIME_ZONE,
    ...options,
  }).formatToParts(date);
}

/** Today's date (YYYY-MM-DD) in Honduras local time, regardless of the device's timezone. */
export function todayInHonduras(): string {
  const parts = partsOf(new Date(), {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const year = parts.find((p) => p.type === "year")!.value;
  const month = parts.find((p) => p.type === "month")!.value;
  const day = parts.find((p) => p.type === "day")!.value;

  return `${year}-${month}-${day}`;
}

/** Adds (or subtracts) whole days to a YYYY-MM-DD date string, calendar-only (no timezone conversion). */
export function addDaysToDateString(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/** Advances a YYYY-MM-DD date string by one cycle of the given frequency. */
export function advanceDateByFrequency(
  dateStr: string,
  frequency: "weekly" | "biweekly" | "monthly" | "yearly"
): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));

  switch (frequency) {
    case "weekly":
      date.setUTCDate(date.getUTCDate() + 7);
      break;
    case "biweekly":
      date.setUTCDate(date.getUTCDate() + 14);
      break;
    case "monthly":
      date.setUTCMonth(date.getUTCMonth() + 1);
      break;
    case "yearly":
      date.setUTCFullYear(date.getUTCFullYear() + 1);
      break;
  }

  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/** Formats a YYYY-MM-DD date string as "10 sep 2026". */
export function formatDateEs(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const monthAbbr = MONTH_NAMES_ES[month - 1].slice(0, 3);
  return `${day} ${monthAbbr} ${year}`;
}

/** Current year and month (1-12), in Honduras local time. */
export function currentYearMonthInHonduras(): { year: number; month: number } {
  const parts = partsOf(new Date(), { year: "numeric", month: "2-digit" });
  const year = Number(parts.find((p) => p.type === "year")!.value);
  const month = Number(parts.find((p) => p.type === "month")!.value); // 1-12
  return { year, month };
}

/** Start of the current month and start of the next month (YYYY-MM-DD), in Honduras local time. */
export function currentMonthRangeInHonduras(): {
  start: string;
  nextMonthStart: string;
} {
  const { year, month } = currentYearMonthInHonduras();

  const pad = (n: number) => String(n).padStart(2, "0");
  const start = `${year}-${pad(month)}-01`;

  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonthStart = `${nextYear}-${pad(nextMonth)}-01`;

  return { start, nextMonthStart };
}
