import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { User } from "@aurelia/data";

type AuthState = {
  user: User | null;
  login: (email: string, name?: string, role?: User["role"]) => void;
  signup: (name: string, email: string, role: User["role"]) => void;
  logout: () => void;
};

const tierForEmail = (email: string): User["memberTier"] => {
  const n = email.length % 3;
  return n === 0 ? "Platinum" : n === 1 ? "Gold" : "Explorer";
};

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      login: (email, name, role = "traveler") =>
        set({
          user: {
            id: `u-${Date.now()}`,
            name: name ?? email.split("@")[0].replace(/[.\-_]/g, " "),
            email,
            role,
            memberTier: tierForEmail(email),
          },
        }),
      signup: (name, email, role) =>
        set({
          user: {
            id: `u-${Date.now()}`,
            name,
            email,
            role,
            memberTier: tierForEmail(email),
          },
        }),
      logout: () => set({ user: null }),
    }),
    {
      name: "aurelia-auth",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
