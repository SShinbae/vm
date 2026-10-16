import { useQuery } from "@tanstack/react-query";

export type FuelPrice = { label: string; price: number };

export const FALLBACK_FUEL_PRICES: FuelPrice[] = [
  { label: "BUDI95", price: 1.99 },
  { label: "BUDI Diesel", price: 2.1 },
  { label: "RON95", price: 4.62 },
  { label: "RON97", price: 5.1 },
  { label: "Diesel", price: 5.17 },
];

const FIELDS: [string, string][] = [
  ["BUDI95", "ron95_budi95"],
  ["BUDI Diesel", "diesel_budi"],
  ["RON95", "ron95"],
  ["RON97", "ron97"],
  ["Diesel", "diesel"],
];

// data.gov.my returns "level" and "change_weekly" rows; only level rows hold prices
export const parseFuelPrices = (rows: any[]): FuelPrice[] => {
  const row = Array.isArray(rows)
    ? rows.find((r) => r?.series_type === "level")
    : undefined;
  if (!row) return FALLBACK_FUEL_PRICES;
  const prices = FIELDS.map(([label, key]) => ({
    label,
    price: Number(row[key]),
  })).filter((p) => Number.isFinite(p.price) && p.price > 0);
  return prices.length ? prices : FALLBACK_FUEL_PRICES;
};

export function useFuelPrices() {
  const { data } = useQuery({
    queryKey: ["fuelPrices"],
    queryFn: async () => {
      const res = await fetch(
        "https://api.data.gov.my/data-catalogue?id=fuelprice&limit=5&sort=-date",
      );
      if (!res.ok) throw new Error(`Fuel price request failed: ${res.status}`);
      return parseFuelPrices(await res.json());
    },
    staleTime: 12 * 60 * 60 * 1000,
  });
  return data ?? FALLBACK_FUEL_PRICES;
}
