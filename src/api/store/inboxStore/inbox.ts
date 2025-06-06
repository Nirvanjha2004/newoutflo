// Ensure the store initializes selectedAccounts as an empty Map instead of null

import { create } from "zustand";

import { AnswerStatus } from "../constant";

type InboxStore = {
  selectedAccounts: Map<string, boolean>;
  selectedAnswerStatus: AnswerStatus;
  setState: (newState: Partial<InboxStore>) => void;
};

export const useInboxStore = create<InboxStore>((set) => ({
  // Initialize with empty Map instead of null to prevent filter errors
  selectedAccounts: new Map<string, boolean>(),
  selectedAnswerStatus: AnswerStatus.ALL,
  setState: (newState: Partial<InboxStore>) => set((state) => ({ ...state, ...newState })),
}));
