import { getPreviousReportingPeriod } from "../../../netlify/functions/_shared/reportingPeriod";

describe("getPreviousReportingPeriod", () => {
  it("returns the previous completed Monday-to-Sunday week", () => {
    expect(
      getPreviousReportingPeriod(new Date("2026-09-09T12:00:00Z"), "weekly"),
    ).toMatchObject({
      startDate: "2026-08-31",
      endDate: "2026-09-07",
      periodKey: "2026-08-31",
    });
  });

  it("returns the previous completed calendar month", () => {
    expect(
      getPreviousReportingPeriod(new Date("2026-09-07T12:00:00Z"), "monthly"),
    ).toMatchObject({
      startDate: "2026-08-01",
      endDate: "2026-09-01",
      periodKey: "2026-08",
    });
  });

  it("uses the user's timezone and falls back to UTC", () => {
    const now = new Date("2026-09-06T16:30:00Z");
    expect(
      getPreviousReportingPeriod(now, "weekly", "Asia/Kuala_Lumpur"),
    ).toMatchObject({ startDate: "2026-08-31", endDate: "2026-09-07" });
    expect(
      getPreviousReportingPeriod(now, "weekly", "Invalid/Timezone"),
    ).toMatchObject({ startDate: "2026-08-24", endDate: "2026-08-31" });
  });
});
