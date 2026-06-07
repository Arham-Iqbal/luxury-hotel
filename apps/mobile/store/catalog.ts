// Admin-managed catalog overlay (persisted, client-side).
// Lets the admin console add / edit / remove / feature hotels and have the
// changes show up across the live site immediately — no server required.
// The bundled @aurelia/data catalog is the base; this overlay sits on top.
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { HOTELS as BASE_HOTELS, type Hotel } from "@aurelia/data";

type PriceField = "pricePerNight";

// Partial edits keyed by hotel id (only changed fields stored).
type HotelPatch = Partial<
  Pick<
    Hotel,
    | "name"
    | "tagline"
    | "city"
    | "country"
    | "region"
    | "category"
    | "starRating"
    | "rating"
    | "pricePerNight"
    | "heroImage"
    | "featured"
    | "description"
  >
>;

type CatalogState = {
  patches: Record<string, HotelPatch>;
  added: Hotel[];
  removedIds: string[];
  // actions
  updateHotel: (id: string, patch: HotelPatch) => void;
  toggleFeatured: (id: string) => void;
  addHotel: (input: NewHotelInput) => Hotel;
  removeHotel: (id: string) => void;
  restoreHotel: (id: string) => void;
  resetAll: () => void;
};

export type NewHotelInput = {
  name: string;
  city: string;
  country: string;
  region: Hotel["region"];
  category: Hotel["category"];
  starRating: number;
  pricePerNight: number;
  heroImage: string;
  tagline: string;
  description: string;
  featured: boolean;
};

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const DEFAULT_IMG = "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80";

export const useCatalog = create<CatalogState>()(
  persist(
    (set, get) => ({
      patches: {},
      added: [],
      removedIds: [],

      updateHotel: (id, patch) =>
        set((s) => ({ patches: { ...s.patches, [id]: { ...s.patches[id], ...patch } } })),

      toggleFeatured: (id) => {
        const merged = mergeOne(id, get());
        if (!merged) return;
        // If it's an added hotel, edit in place; otherwise patch the base.
        const isAdded = get().added.some((h) => h.id === id);
        if (isAdded) {
          set((s) => ({ added: s.added.map((h) => (h.id === id ? { ...h, featured: !merged.featured } : h)) }));
        } else {
          set((s) => ({ patches: { ...s.patches, [id]: { ...s.patches[id], featured: !merged.featured } } }));
        }
      },

      addHotel: (input) => {
        const id = `cust-${Date.now()}`;
        const slug = `${slugify(input.name)}-${id.slice(-4)}`;
        const hotel: Hotel = {
          id,
          slug,
          name: input.name,
          tagline: input.tagline || "An exceptional new addition to the collection.",
          city: input.city,
          country: input.country,
          region: input.region,
          category: input.category,
          starRating: input.starRating,
          rating: 4.8,
          reviewCount: 0,
          pricePerNight: input.pricePerNight,
          currency: "INR",
          heroImage: input.heroImage || DEFAULT_IMG,
          gallery: [input.heroImage || DEFAULT_IMG],
          description: input.description || input.tagline || "A newly added Aurelia estate.",
          highlights: ["Newly added to the collection", "Concierge service included"],
          amenities: ["Free Wi-Fi", "Concierge", "Fine dining", "Spa & wellness"],
          rooms: [
            {
              id: `${id}-r1`,
              name: "Signature Suite",
              description: "A signature suite at this newly added estate.",
              pricePerNight: input.pricePerNight,
              maxGuests: 2,
              beds: "1 King",
              sizeSqm: 48,
              amenities: ["King bed", "Rain shower", "Concierge"],
              image: input.heroImage || DEFAULT_IMG,
            },
          ],
          reviews: [],
          lat: 0,
          lng: 0,
          address: `${input.city}, ${input.country}`,
          featured: input.featured,
          badges: [input.category],
        };
        set((s) => ({ added: [hotel, ...s.added] }));
        return hotel;
      },

      removeHotel: (id) =>
        set((s) => {
          const isAdded = s.added.some((h) => h.id === id);
          if (isAdded) return { added: s.added.filter((h) => h.id !== id) };
          return { removedIds: s.removedIds.includes(id) ? s.removedIds : [...s.removedIds, id] };
        }),

      restoreHotel: (id) => set((s) => ({ removedIds: s.removedIds.filter((x) => x !== id) })),

      resetAll: () => set({ patches: {}, added: [], removedIds: [] }),
    }),
    {
      name: "aurelia-catalog",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

// --- Selectors / derivation (pure, used by the API client + admin) ---

function applyPatch(h: Hotel, patch?: HotelPatch): Hotel {
  if (!patch) return h;
  const merged = { ...h, ...patch };
  // keep "from" price and first room price in sync if pricePerNight changed
  if (patch.pricePerNight !== undefined && merged.rooms[0]) {
    merged.rooms = merged.rooms.map((r, i) => (i === 0 ? { ...r, pricePerNight: patch.pricePerNight! } : r));
  }
  return merged;
}

function mergeOne(id: string, state: CatalogState): Hotel | undefined {
  const added = state.added.find((h) => h.id === id);
  if (added) return added;
  const base = BASE_HOTELS.find((h) => h.id === id || h.slug === id);
  if (!base) return undefined;
  return applyPatch(base, state.patches[base.id]);
}

// Build the full effective catalog from base + overlay.
// Accepts just the data slices so callers can pass memoized selections (§10).
type CatalogSlices = Pick<CatalogState, "patches" | "added" | "removedIds">;
export function buildCatalog(state: CatalogSlices): Hotel[] {
  const base = BASE_HOTELS.filter((h) => !state.removedIds.includes(h.id)).map((h) =>
    applyPatch(h, state.patches[h.id]),
  );
  return [...state.added, ...base];
}

// Snapshot helper for non-React callers (API client offline path).
export function getEffectiveCatalog(): Hotel[] {
  return buildCatalog(useCatalog.getState());
}

export const isCustomId = (id: string) => id.startsWith("cust-");
export { type PriceField };
