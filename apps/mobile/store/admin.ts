import { create } from "zustand";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "@/lib/config";

type AdminState = {
  authed: boolean;
  signIn: (email: string, password: string) => boolean;
  signOut: () => void;
};

// Admin auth is in-memory only (web-only console; not persisted to AsyncStorage).
export const useAdmin = create<AdminState>((set) => ({
  authed: false,
  // Validate BOTH email and password (playbook §20).
  signIn: (email, password) => {
    const ok =
      email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase() &&
      password === ADMIN_PASSWORD;
    if (ok) set({ authed: true });
    return ok;
  },
  signOut: () => set({ authed: false }),
}));
