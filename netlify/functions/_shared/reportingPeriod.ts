export type ReportingFrequency = "weekly" | "monthly";

function localDate(now: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);

  return new Date(Date.UTC(value("year"), value("month") - 1, value("day")));
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function getPreviousReportingPeriod(
  now: Date,
  frequency: ReportingFrequency,
  timezone = "UTC",
) {
  let today: Date;
  try {
    today = localDate(now, timezone);
  } catch {
    today = localDate(now, "UTC");
  }

  if (frequency === "monthly") {
    const end = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1),
    );
    const start = new Date(
      Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - 1, 1),
    );
    return {
      startDate: isoDate(start),
      endDate: isoDate(end),
      periodKey: isoDate(start).slice(0, 7),
      localDayOfMonth: today.getUTCDate(),
    };
  }

  const end = new Date(today);
  end.setUTCDate(today.getUTCDate() - ((today.getUTCDay() + 6) % 7));
  const start = new Date(end);
  start.setUTCDate(end.getUTCDate() - 7);

  return {
    startDate: isoDate(start),
    endDate: isoDate(end),
    periodKey: isoDate(start),
    localDayOfMonth: today.getUTCDate(),
  };
}
