import {
  buildFuelCostTrend,
  searchHomeVehicles,
} from "@/lib/dashboard/homeOverview";

describe("Home overview data", () => {
  it("fills each calendar month and sums only its fuel costs", () => {
    expect(
      buildFuelCostTrend(
        [
          { date: "2026-10-01", cost: 20 },
          { date: "2026-10-12", cost: 30.5 },
          { date: "2026-08-20", cost: 10 },
          { date: "2026-04-30", cost: 99 },
        ],
        6,
        new Date(2026, 9, 13),
      ).map(({ month, value }) => [month, value]),
    ).toEqual([
      ["2026-05", 0],
      ["2026-06", 0],
      ["2026-07", 0],
      ["2026-08", 10],
      ["2026-09", 0],
      ["2026-10", 50.5],
    ]);
  });

  it("matches accessible vehicles by year, make, model, or plate", () => {
    const vehicles = [
      {
        id: "1",
        year: 2022,
        make: "Honda",
        model: "Civic",
        license_plate: "WNA1234",
      },
      {
        id: "2",
        year: 2019,
        make: "Perodua",
        model: "Myvi",
        license_plate: "VCC9012",
      },
    ];
    expect(searchHomeVehicles(vehicles, "  civic ").map((v) => v.id)).toEqual([
      "1",
    ]);
    expect(searchHomeVehicles(vehicles, "2019").map((v) => v.id)).toEqual([
      "2",
    ]);
    expect(searchHomeVehicles(vehicles, "vcc").map((v) => v.id)).toEqual(["2"]);
    expect(searchHomeVehicles(vehicles, "")).toEqual([]);
  });
});
