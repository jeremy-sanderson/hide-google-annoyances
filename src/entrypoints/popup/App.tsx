import { Toggle } from "@/components/Toggle";
import { DEFAULTS, STORAGE_KEYS } from "@/utils/storage";

export default function App() {
  return (
    <main className="w-80 px-4 py-4">
      <h1 className="text-base font-semibold mb-3">Hide Google Upgrade</h1>
      <Toggle
        storageKey={STORAGE_KEYS.hideUpgradeEnabled}
        label="Hide Upgrade button"
        description="Removes the Gemini 'Upgrade' CTA from Gmail, Docs, Sheets, and other Google pages."
        defaultEnabled={DEFAULTS[STORAGE_KEYS.hideUpgradeEnabled]}
      />
    </main>
  );
}
