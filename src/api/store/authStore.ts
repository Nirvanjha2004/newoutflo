import { useStore } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { create } from "zustand";

import { User } from "../../types/authentication";

export interface AuthStoreState {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
}

export interface AuthStoreActions {
  setState: (_data: Partial<AuthStoreState>, _cb?: () => void) => void;
  reset: () => void;
}

export const authStore = create<AuthStoreState & AuthStoreActions>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      setState: (data: Partial<AuthStoreState>, cb) => {
        set(() => data);
        cb?.();
      },

      reset: () => set({ isAuthenticated: false, user: null, accessToken: null }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export const useAuthStore = () => useStore(authStore);
