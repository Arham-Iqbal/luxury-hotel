import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

type FavState = {
  ids: string[];
  toggle: (id: string) => void;
  isFavorite: (id: string) => boolean;
};

export const useFavorites = create<FavState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (id) =>
        set((s) =>
          s.ids.includes(id)
            ? { ids: s.ids.filter((x) => x !== id) }
            : { ids: [...s.ids, id] },
        ),
      isFavorite: (id) => get().ids.includes(id),
    }),
    {
      name: "aurelia-favorites",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
