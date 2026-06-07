// In-memory booking store for the serverless function. Per-instance only
// (serverless is stateless across cold starts) — acceptable for a demo.
import type { Booking } from "@aurelia/data";

const g = globalThis as unknown as { __aureliaBookings?: Booking[] };
if (!g.__aureliaBookings) g.__aureliaBookings = [];

export const bookings = g.__aureliaBookings;

export function makeCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "AUR-";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}
