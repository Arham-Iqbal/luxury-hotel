// Shared domain types — single source of truth for app + API.

export type RoomType = {
  id: string;
  name: string;
  description: string;
  pricePerNight: number; // in USD
  maxGuests: number;
  beds: string;
  sizeSqm: number;
  amenities: string[];
  image: string;
};

export type Review = {
  id: string;
  author: string;
  country: string;
  rating: number; // 1–5
  date: string; // ISO
  title: string;
  body: string;
};

export type Hotel = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  city: string;
  country: string;
  region: string; // continent / area for filtering
  category: HotelCategory;
  starRating: number; // 3–5
  rating: number; // guest review average, e.g. 4.8
  reviewCount: number;
  pricePerNight: number; // "from" price, USD
  currency: string;
  heroImage: string;
  gallery: string[];
  description: string;
  highlights: string[];
  amenities: string[];
  rooms: RoomType[];
  reviews: Review[];
  lat: number;
  lng: number;
  address: string;
  featured: boolean;
  badges: string[]; // e.g. "Adults Only", "Beachfront"
};

export type HotelCategory =
  | "Beach Resort"
  | "City Hotel"
  | "Mountain Lodge"
  | "Boutique"
  | "Safari Lodge"
  | "Villa";

export type Destination = {
  id: string;
  name: string;
  country: string;
  region: string;
  image: string;
  hotelCount: number;
  tagline: string;
};

export type Experience = {
  id: string;
  title: string;
  category: string;
  location: string;
  image: string;
  durationHours: number;
  price: number;
  description: string;
};

// --- Booking + auth domain (client-side / API write models) ---

export type BookingStatus = "confirmed" | "completed" | "cancelled";

export type Booking = {
  id: string;
  hotelId: string;
  hotelName: string;
  hotelImage: string;
  city: string;
  country: string;
  roomTypeId: string;
  roomName: string;
  checkIn: string; // ISO date
  checkOut: string; // ISO date
  guests: number;
  nights: number;
  pricePerNight: number;
  total: number;
  currency: string;
  guestName: string;
  guestEmail: string;
  status: BookingStatus;
  createdAt: string; // ISO
  confirmationCode: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: "traveler" | "host";
  memberTier: "Explorer" | "Gold" | "Platinum";
};

// --- Admin / API response models ---

export type AdminStats = {
  totalBookings: number;
  totalRevenue: number;
  currency: string;
  occupancyRate: number; // 0–1
  avgNightlyRate: number;
  topDestinations: { name: string; bookings: number }[];
  revenueByMonth: { month: string; revenue: number }[];
  bookingsByCategory: { category: string; count: number }[];
};
