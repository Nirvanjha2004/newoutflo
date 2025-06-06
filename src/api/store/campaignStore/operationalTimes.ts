import { mountStoreDevtool } from "simple-zustand-devtools";
import { useStore } from "zustand";
import {create} from "zustand";

interface LocalOperationalTimes {
  startTime: number;
  endTime: number;
  timezone: string;
}

interface OperationalTimesState {
  localOperationalTimes: LocalOperationalTimes | null;
  isLoaded: boolean;
}

interface OperationalTimesActions {
  setLocalOperationalTimes: (times: LocalOperationalTimes) => void;
  reset: () => void;
}

const initialState: OperationalTimesState = {
  localOperationalTimes: null,
  isLoaded: false,
};

export const operationalTimesStore = create<OperationalTimesState & OperationalTimesActions>()((set) => ({
  ...initialState,

  setLocalOperationalTimes: (times: LocalOperationalTimes) => {
    console.log("Setting local operational times:", times);
    set({ localOperationalTimes: times, isLoaded: true });
  },

  reset: () => {
    set(initialState);
  },
}));

if (process.env.NODE_ENV === "development") {
  mountStoreDevtool("OperationalTimesStore", operationalTimesStore);
}

export const useOperationalTimesStore = () => useStore(operationalTimesStore);
