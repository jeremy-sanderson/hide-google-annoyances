import { useSyncStorage } from "@/utils/useSyncStorage";

export function Toggle({
  storageKey,
  label,
  description,
  defaultEnabled = true,
}: {
  storageKey: string;
  label: string;
  description?: string;
  defaultEnabled?: boolean;
}) {
  const [enabled, setEnabled] = useSyncStorage<boolean>(
    storageKey,
    defaultEnabled
  );

  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-md border border-slate-200 bg-white px-4 py-3">
      <span className="flex flex-col">
        <span className="text-sm font-medium text-slate-800">{label}</span>
        {description && (
          <span className="text-xs text-slate-500">{description}</span>
        )}
      </span>
      <input
        type="checkbox"
        checked={enabled}
        onChange={e => setEnabled(e.target.checked)}
        className="h-5 w-5 accent-emerald-500"
      />
    </label>
  );
}
