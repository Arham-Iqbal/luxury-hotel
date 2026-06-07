// Express mock API for LOCAL dev (http://localhost:4000).
// Mirror of the Vercel serverless function in api/[...path].ts (playbook §10).
import express from "express";
import cors from "cors";
import {
  HOTELS,
  DESTINATIONS,
  EXPERIENCES,
  searchHotels,
  getHotelById,
  computeAdminStats,
  type Booking,
  type HotelQuery,
} from "@aurelia/data";

const app = express();
app.use(cors());
app.use(express.json());

// In-memory booking store (resets on restart — fine for a demo).
const bookings: Booking[] = [];

function makeCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "AUR-";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function parseQuery(q: Record<string, unknown>): HotelQuery {
  const num = (v: unknown) => (v !== undefined ? Number(v) : undefined);
  return {
    q: q.q as string | undefined,
    region: q.region as string | undefined,
    category: q.category as string | undefined,
    minPrice: num(q.minPrice),
    maxPrice: num(q.maxPrice),
    minRating: num(q.minRating),
    sort: q.sort as HotelQuery["sort"],
  };
}

app.get("/api/health", (_req, res) => res.json({ ok: true, hotels: HOTELS.length }));

app.get("/api/hotels", (req, res) => res.json(searchHotels(parseQuery(req.query))));

app.get("/api/hotels/:id", (req, res) => {
  const hotel = getHotelById(req.params.id);
  if (!hotel) return res.status(404).json({ error: "not_found" });
  res.json(hotel);
});

app.get("/api/destinations", (_req, res) => res.json(DESTINATIONS));
app.get("/api/experiences", (_req, res) => res.json(EXPERIENCES));

app.post("/api/bookings", (req, res) => {
  const b: Booking = {
    ...req.body,
    id: `bk-${Date.now()}`,
    status: "confirmed",
    createdAt: new Date().toISOString(),
    confirmationCode: makeCode(),
  };
  bookings.unshift(b);
  res.status(201).json(b);
});

// Admin (writes/reads go live; web-only console).
app.get("/api/admin/stats", (_req, res) => {
  const extraRevenue = bookings.reduce((s, b) => s + b.total, 0);
  res.json(computeAdminStats(bookings.length, extraRevenue));
});

app.get("/api/admin/bookings", (_req, res) => res.json(bookings));

const PORT = Number(process.env.PORT ?? 4000);
app.listen(PORT, () => {
  console.log(`[mock-api] Aurelia API on http://localhost:${PORT}`);
  console.log(`[mock-api] ${HOTELS.length} hotels, ${DESTINATIONS.length} destinations`);
});
