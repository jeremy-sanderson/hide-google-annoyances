import { Toggle } from "@/components/Toggle";
import { DEFAULTS, STORAGE_KEYS } from "@/utils/storage";

export default function App() {
  return (
    <main className="w-80 px-4 py-4 flex flex-col gap-2">
      <h1 className="text-base font-semibold mb-1">Hide Google Annoyances</h1>
      <Toggle
        storageKey={STORAGE_KEYS.hideUpgradeEnabled}
        label="Hide Upgrade button"
        description="Removes the Gemini 'Upgrade' CTA from Gmail, Docs, Sheets, Drive, and other Google pages."
        defaultEnabled={DEFAULTS[STORAGE_KEYS.hideUpgradeEnabled]}
      />
      <Toggle
        storageKey={STORAGE_KEYS.hideGeminiEnabled}
        label="Hide Gemini button"
        description="Removes the Gemini (star) button from the top-right corner on Gmail, Docs, Sheets, and Drive."
        defaultEnabled={DEFAULTS[STORAGE_KEYS.hideGeminiEnabled]}
      />
      <Toggle
        storageKey={STORAGE_KEYS.hideDocsBannersEnabled}
        label="Hide Docs banners"
        description="Removes the promo banners (e.g. Gemini ads) shown above the document in Google Docs."
        defaultEnabled={DEFAULTS[STORAGE_KEYS.hideDocsBannersEnabled]}
      />
    </main>
  );
}
