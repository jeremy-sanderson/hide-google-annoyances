import {
  startDocsBannerHider,
  type DocsBannerHiderHandle,
} from "@/utils/hideDocsBanners";
import {
  DEFAULTS,
  STORAGE_KEYS,
  getBoolean,
  onBooleanChanged,
} from "@/utils/storage";

export default defineContentScript({
  // The banners are part of the Workspace editor chrome, which Docs serves
  // only from docs.google.com.
  matches: ["*://docs.google.com/*"],
  runAt: "document_start",
  async main() {
    let handle: DocsBannerHiderHandle | null = null;
    let enabled = await getBoolean(
      STORAGE_KEYS.hideDocsBannersEnabled,
      DEFAULTS[STORAGE_KEYS.hideDocsBannersEnabled]
    );

    const sync = () => {
      if (enabled && !handle) {
        handle = startDocsBannerHider();
      } else if (!enabled && handle) {
        handle.dispose();
        handle = null;
      }
    };

    sync();
    onBooleanChanged(
      STORAGE_KEYS.hideDocsBannersEnabled,
      DEFAULTS[STORAGE_KEYS.hideDocsBannersEnabled],
      next => {
        enabled = next;
        sync();
      }
    );
  },
});
