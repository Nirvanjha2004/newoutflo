import { mountStoreDevtool } from "simple-zustand-devtools";
import { useStore } from "zustand";
import {create} from "zustand";

import { AnswerStatus } from "@features/inbox/constant";

export interface IInboxStoreState {
  selectedAccounts: Map<string, boolean>;
  selectedAnswerStatus: Map<AnswerStatus, boolean>;
  showNewMessageSidebar: boolean;
}

export interface IInboxStoreActions {
  setState: (data: Partial<IInboxStoreState>, cb?: () => void) => void;
}

export const inboxStore = create<IInboxStoreState & IInboxStoreActions>()((set, _get) => ({
  selectedAccounts: new Map<string, boolean>(),
  selectedAnswerStatus: new Map<AnswerStatus, boolean>(),
  showNewMessageSidebar: false,

  setState: (data: Partial<IInboxStoreState>, cb) => {
    set(() => data);
    cb?.();
  },
}));

if (process.env.NODE_ENV === "development") {
  mountStoreDevtool("InboxStore", inboxStore);
}

export const useInboxStore = () => useStore(inboxStore);
