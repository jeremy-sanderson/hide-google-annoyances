import { useEffect, useState } from "react";

export function useSyncStorage<T>(
  key: string,
  initialValue: T
): [T, (next: T) => void] {
  const [value, setValue] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    chrome.storage.sync.get([key]).then(items => {
      if (key in items) setValue(items[key] as T);
      setHydrated(true);
    });

    const onChanged = (
      changes: { [k: string]: chrome.storage.StorageChange },
      area: chrome.storage.AreaName
    ) => {
      if (area === "sync" && key in changes) {
        setValue(changes[key].newValue as T);
      }
    };
    chrome.storage.onChanged.addListener(onChanged);
    return () => chrome.storage.onChanged.removeListener(onChanged);
  }, [key]);

  const update = (next: T) => {
    setValue(next);
    if (hydrated) chrome.storage.sync.set({ [key]: next });
  };

  return [value, update];
}
