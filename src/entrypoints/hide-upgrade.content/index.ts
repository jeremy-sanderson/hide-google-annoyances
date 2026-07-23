import {
  startUpgradeButtonHider,
  type UpgradeHiderHandle,
} from "@/utils/hideUpgradeButton";
import {
  DEFAULTS,
  STORAGE_KEYS,
  getBoolean,
  onBooleanChanged,
} from "@/utils/storage";

export default defineContentScript({
  // Scoped to Google's own domains rather than <all_urls>: the button is
  // rendered by Google's shared "gb_" top bar and Workspace editor code, both
  // of which only ever load on *.google.com.
  matches: ["*://*.google.com/*"],
  runAt: "document_start",
  async main() {
    let handle: UpgradeHiderHandle | null = null;
    let enabled = await getBoolean(
      STORAGE_KEYS.hideUpgradeEnabled,
      DEFAULTS[STORAGE_KEYS.hideUpgradeEnabled]
    );

    const sync = () => {
      if (enabled && !handle) {
        handle = startUpgradeButtonHider();
      } else if (!enabled && handle) {
        handle.dispose();
        handle = null;
      }
    };

    sync();
    onBooleanChanged(
      STORAGE_KEYS.hideUpgradeEnabled,
      DEFAULTS[STORAGE_KEYS.hideUpgradeEnabled],
      next => {
        enabled = next;
        sync();
      }
    );
  },
});
