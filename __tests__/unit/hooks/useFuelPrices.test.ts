/**
 * parseFuelPrices Tests
 *
 * Pure parser for data.gov.my fuel price rows.
 */

import {
  parseFuelPrices,
  FALLBACK_FUEL_PRICES,
} from "@/hooks/useFuelPrices";

const levelRow = {
  date: "2026-10-15",
  ron95: 4.62,
  ron97: 5.1,
  diesel: 5.17,
  diesel_budi: 2.1,
  ron95_budi95: 1.99,
  series_type: "level",
};

const deltaRow = {
  date: "2026-10-15",
  ron95: -0.05,
  series_type: "change_weekly",
};

describe("parseFuelPrices", () => {
  it("picks the level row even when a change_weekly row comes first", () => {
    const prices = parseFuelPrices([deltaRow, levelRow]);
    expect(prices.find((p) => p.label === "RON95")?.price).toBe(4.62);
  });

  it("returns labels and prices in display order", () => {
    expect(parseFuelPrices([levelRow])).toEqual([
      { label: "BUDI95", price: 1.99 },
      { label: "BUDI Diesel", price: 2.1 },
      { label: "RON95", price: 4.62 },
      { label: "RON97", price: 5.1 },
      { label: "Diesel", price: 5.17 },
    ]);
  });

  it("returns fallback prices when there is no level row", () => {
    expect(parseFuelPrices([deltaRow])).toBe(FALLBACK_FUEL_PRICES);
  });

  it("returns fallback prices for an empty array", () => {
    expect(parseFuelPrices([])).toBe(FALLBACK_FUEL_PRICES);
  });

  it("skips fields that are missing, zero, or negative", () => {
    // ron97 and diesel are absent; ron95 is 0; diesel_budi is negative
    const { ron97: _ron97, diesel: _diesel, ...rest } = levelRow;
    const prices = parseFuelPrices([
      { ...rest, ron95: 0, diesel_budi: -1 },
    ]);
    expect(prices).toEqual([{ label: "BUDI95", price: 1.99 }]);
  });
});
