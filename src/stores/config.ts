import { create } from "zustand";
import { ICallistoConfig } from "@/types/config";

interface IConfigState {
  config: ICallistoConfig | null;
  setConfig: (data: ICallistoConfig) => void;
}

export const useConfigStore = create<IConfigState>((set) => ({
  config: null,
  setConfig: (data) => set({ config: data }),
}));