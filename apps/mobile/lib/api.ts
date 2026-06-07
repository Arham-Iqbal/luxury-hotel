// API client. Tries the network, then falls back to the bundled @aurelia/data
// package so the standalone APK is a complete, offline-safe store (playbook §4).
import {
  HOTELS,
  DESTINATIONS,
  EXPERIENCES,
  computeAdminStats,
  type Hotel,
  type Destination,
  type Experience,
  type HotelQuery,
  type AdminStats,
  type Booking,
} from "@aurelia/data";
import { API_BASE, HAS_REMOTE_API } from "./config";
import { getEffectiveCatalog } from "@/store/catalog";

// Local search over the admin-managed effective catalog (base + overlay).
// This makes admin add/edit/remove/feature changes show up across the site
// instantly, with no server round-trip (demo is offline-first).
function localSearch(query: HotelQuery = {}): Hotel[] {
  let results = getEffectiveCatalog();
  const { q, region, category, minPrice, maxPrice, minRating, sort } = query;
  if (q && q.trim()) {
    const t = q.trim().toLowerCase();
    results = results.filter(
      (h) =>
        h.name.toLowerCase().includes(t) ||
        h.city.toLowerCase().includes(t) ||
        h.country.toLowerCase().includes(t) ||
        h.tagline.toLowerCase().includes(t) ||
        h.badges.some((b) => b.toLowerCase().includes(t)),
    );
  }
  if (region) results = results.filter((h) => h.region === region);
  if (category) results = results.filter((h) => h.category === category);
  if (typeof minPrice === "number") results = results.filter((h) => h.pricePerNight >= minPrice);
  if (typeof maxPrice === "number") results = results.filter((h) => h.pricePerNight <= maxPrice);
  if (typeof minRating === "number") results = results.filter((h) => h.rating >= minRating);
  switch (sort) {
    case "price-asc": results.sort((a, b) => a.pricePerNight - b.pricePerNight); break;
    case "price-desc": results.sort((a, b) => b.pricePerNight - a.pricePerNight); break;
    case "rating": results.sort((a, b) => b.rating - a.rating); break;
    default: results.sort((a, b) => Number(b.featured) - Number(a.featured) || b.rating - a.rating);
  }
  return results;
}

function localGet(id: string): Hotel | undefined {
  return getEffectiveCatalog().find((h) => h.id === id || h.slug === id);
}

async function tryFetch<T>(path: string, init?: RequestInit): Promise<T | null> {
  if (!HAS_REMOTE_API) return null;
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// ---- Reads (network first, offline fallback) ----

export async function fetchHotels(query: HotelQuery = {}): Promise<Hotel[]> {
  // Effective catalog (base + admin overlay) is the source of truth so admin
  // changes are reflected everywhere. Network is only used when there's no
  // local overlay difference — but local always wins for the demo.
  return localSearch(query);
}

export async function fetchHotel(id: string): Promise<Hotel | undefined> {
  return localGet(id);
}

export async function fetchDestinations(): Promise<Destination[]> {
  const remote = await tryFetch<Destination[]>("/destinations");
  return remote ?? DESTINATIONS;
}

export async function fetchExperiences(): Promise<Experience[]> {
  const remote = await tryFetch<Experience[]>("/experiences");
  return remote ?? EXPERIENCES;
}

// ---- Bookings ----
// Reads can fall back offline; writes go to the API when available, otherwise
// the booking is recorded client-side (Zustand) so the demo flow always works.

export async function createBooking(
  payload: Omit<Booking, "id" | "createdAt" | "confirmationCode" | "status">,
): Promise<Booking | null> {
  return tryFetch<Booking>("/bookings", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ---- Admin (writes go live; web-only — playbook §4/§20) ----

export async function fetchAdminStats(): Promise<AdminStats> {
  const base = computeAdminStats();
  const remote = await tryFetch<Partial<AdminStats>>("/admin/stats");
  // Merge over a complete local baseline so a partial/stale API response
  // (e.g. an old mock-api missing the chart arrays) never breaks the UI.
  if (!remote) return base;
  return {
    ...base,
    ...remote,
    revenueByMonth: remote.revenueByMonth ?? base.revenueByMonth,
    topDestinations: remote.topDestinations ?? base.topDestinations,
    bookingsByCategory: remote.bookingsByCategory ?? base.bookingsByCategory,
  };
}

export async function fetchAdminBookings(): Promise<Booking[]> {
  const remote = await tryFetch<Booking[]>("/admin/bookings");
  return remote ?? [];
}

export const catalogCounts = {
  hotels: HOTELS.length,
  destinations: DESTINATIONS.length,
  experiences: EXPERIENCES.length,
};
