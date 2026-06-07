export * from "./types";
export { HOTELS } from "./hotels";
export { DESTINATIONS, EXPERIENCES } from "./destinations";

import { HOTELS } from "./hotels";
import type { Hotel, AdminStats } from "./types";

export const CATEGORIES = [
  "Beach Resort",
  "City Hotel",
  "Mountain Lodge",
  "Boutique",
  "Safari Lodge",
  "Villa",
] as const;

export const REGIONS = [
  "Europe",
  "Asia",
  "Africa",
  "Americas",
  "Middle East",
] as const;

export function getHotelById(id: string): Hotel | undefined {
  return HOTELS.find((h) => h.id === id || h.slug === id);
}

export function getFeaturedHotels(): Hotel[] {
  return HOTELS.filter((h) => h.featured);
}

export type HotelQuery = {
  q?: string;
  region?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sort?: "recommended" | "price-asc" | "price-desc" | "rating";
};

export function searchHotels(query: HotelQuery = {}): Hotel[] {
  let results = HOTELS.slice();
  const { q, region, category, minPrice, maxPrice, minRating, sort } = query;

  if (q && q.trim()) {
    const term = q.trim().toLowerCase();
    results = results.filter(
      (h) =>
        h.name.toLowerCase().includes(term) ||
        h.city.toLowerCase().includes(term) ||
        h.country.toLowerCase().includes(term) ||
        h.tagline.toLowerCase().includes(term) ||
        h.badges.some((b) => b.toLowerCase().includes(term)),
    );
  }
  if (region) results = results.filter((h) => h.region === region);
  if (category) results = results.filter((h) => h.category === category);
  if (typeof minPrice === "number") results = results.filter((h) => h.pricePerNight >= minPrice);
  if (typeof maxPrice === "number") results = results.filter((h) => h.pricePerNight <= maxPrice);
  if (typeof minRating === "number") results = results.filter((h) => h.rating >= minRating);

  switch (sort) {
    case "price-asc":
      results.sort((a, b) => a.pricePerNight - b.pricePerNight);
      break;
    case "price-desc":
      results.sort((a, b) => b.pricePerNight - a.pricePerNight);
      break;
    case "rating":
      results.sort((a, b) => b.rating - a.rating);
      break;
    default:
      results.sort((a, b) => Number(b.featured) - Number(a.featured) || b.rating - a.rating);
  }
  return results;
}

// Seed admin stats derived from the catalog (deterministic, demo-friendly).
export function computeAdminStats(extraBookings = 0, extraRevenue = 0): AdminStats {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  // Revenue in INR (₹ crores-worthy monthly figures).
  const baseRevenue = [152720000, 175130000, 205840000, 245680000, 283860000, 322040000];
  const revenueByMonth = months.map((month, i) => ({
    month,
    revenue: baseRevenue[i] + (i === months.length - 1 ? extraRevenue : 0),
  }));

  const topDestinations = [
    { name: "Maldives", bookings: 312 },
    { name: "Santorini", bookings: 248 },
    { name: "Dubai", bookings: 221 },
    { name: "Bali", bookings: 198 },
    { name: "Paris", bookings: 176 },
  ];

  const categoryCounts: Record<string, number> = {};
  for (const h of HOTELS) {
    categoryCounts[h.category] = (categoryCounts[h.category] ?? 0) + Math.round(h.reviewCount / 12);
  }
  const bookingsByCategory = Object.entries(categoryCounts).map(([category, count]) => ({
    category,
    count,
  }));

  const totalBookings = 1184 + extraBookings;
  const totalRevenue = revenueByMonth.reduce((s, m) => s + m.revenue, 0);

  return {
    totalBookings,
    totalRevenue,
    currency: "INR",
    occupancyRate: 0.87,
    avgNightlyRate: 75700,
    topDestinations,
    revenueByMonth,
    bookingsByCategory,
  };
}
