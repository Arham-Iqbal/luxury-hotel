// Vercel serverless mirror of the Express mock API (playbook §7/§10).
// Reads runtime values from the pre-bundled ./_data.js; types come from
// @aurelia/data (erased at compile, no runtime cost).
import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { HotelQuery, Booking } from "@aurelia/data";
import {
  HOTELS,
  DESTINATIONS,
  EXPERIENCES,
  searchHotels,
  getHotelById,
  computeAdminStats,
} from "./_data.js";
import { bookings, makeCode } from "./_store";

function resolvePath(req: VercelRequest): string {
  // Robust path parsing under framework:null (playbook §7C).
  const qp = req.query.path;
  let segments: string[];
  if (typeof qp === "string") segments = qp.split("/").filter(Boolean);
  else if (Array.isArray(qp) && qp.length) segments = qp;
  else segments = (req.url ?? "").split("?")[0].replace(/^\/api/, "").split("/").filter(Boolean);
  return "/" + segments.join("/");
}

function parseQuery(q: VercelRequest["query"]): HotelQuery {
  const str = (v: unknown) => (Array.isArray(v) ? v[0] : (v as string | undefined));
  const num = (v: unknown) => {
    const s = str(v);
    return s !== undefined ? Number(s) : undefined;
  };
  return {
    q: str(q.q),
    region: str(q.region),
    category: str(q.category),
    minPrice: num(q.minPrice),
    maxPrice: num(q.maxPrice),
    minRating: num(q.minRating),
    sort: str(q.sort) as HotelQuery["sort"],
  };
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  const path = resolvePath(req);
  res.setHeader("Content-Type", "application/json");

  try {
    if (path === "/health") {
      return res.status(200).json({ ok: true, hotels: HOTELS.length });
    }
    if (path === "/hotels" && req.method === "GET") {
      return res.status(200).json(searchHotels(parseQuery(req.query)));
    }
    if (path.startsWith("/hotels/") && req.method === "GET") {
      const id = path.replace("/hotels/", "");
      const hotel = getHotelById(id);
      if (!hotel) return res.status(404).json({ error: "not_found" });
      return res.status(200).json(hotel);
    }
    if (path === "/destinations") return res.status(200).json(DESTINATIONS);
    if (path === "/experiences") return res.status(200).json(EXPERIENCES);

    if (path === "/bookings" && req.method === "POST") {
      const body = (req.body ?? {}) as Partial<Booking>;
      const booking: Booking = {
        ...(body as Booking),
        id: `bk-${Date.now()}`,
        status: "confirmed",
        createdAt: new Date().toISOString(),
        confirmationCode: makeCode(),
      };
      bookings.unshift(booking);
      return res.status(201).json(booking);
    }

    if (path === "/admin/stats") {
      const extraRevenue = bookings.reduce((s, b) => s + (b.total ?? 0), 0);
      return res.status(200).json(computeAdminStats(bookings.length, extraRevenue));
    }
    if (path === "/admin/bookings") {
      return res.status(200).json(bookings);
    }

    return res.status(404).json({ error: "not_found", path });
  } catch (err) {
    return res.status(500).json({ error: "server_error", message: String(err) });
  }
}
