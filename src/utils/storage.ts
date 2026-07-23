export const STORAGE_KEYS = {
  hideUpgradeEnabled: "hideUpgradeEnabled",
} as const;

export const DEFAULTS: Record<
  (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS],
  boolean
> = {
  [STORAGE_KEYS.hideUpgradeEnabled]: true,
};

export async function getBoolean(
  key: string,
  defaultValue: boolean
): Promise<boolean> {
  const result = await chrome.storage.sync.get([key]);
  const value = result[key];
  return typeof value === "boolean" ? value : defaultValue;
}

export function onBooleanChanged(
  key: string,
  defaultValue: boolean,
  cb: (enabled: boolean) => void
): () => void {
  const listener = (
    changes: { [k: string]: chrome.storage.StorageChange },
    area: chrome.storage.AreaName
  ) => {
    if (area !== "sync" || !(key in changes)) return;
    const next = changes[key].newValue;
    cb(typeof next === "boolean" ? next : defaultValue);
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
