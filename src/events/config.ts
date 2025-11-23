import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { useConfigStore } from "@/stores/config";
import { ICallistoConfig } from "@/types/config";

let unlistenFn: UnlistenFn | null = null;

export async function listenForConfig() {
  // Prevent duplicate listeners
  if (unlistenFn) {
    console.log("⚠️ Config listener already active");
    return;
  }

  // Listen for config updates
  unlistenFn = await listen<ICallistoConfig>("callisto-config", (event) => {
    const cfg = event.payload;
    console.log("📦 Received config event:", cfg);
    useConfigStore.getState().setConfig(cfg);
  });

  // Fetch initial config (in case the event was sent before listener was ready)
  try {
    const config = await invoke<ICallistoConfig>("get_config");
    console.log("📦 Fetched initial config:", config);
    useConfigStore.getState().setConfig(config);
  } catch (error) {
    console.error("❌ Failed to fetch initial config:", error);
  }
}
