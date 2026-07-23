# Hide Google Annoyances

A browser extension (WXT + React + TypeScript) that hides the Gemini
"Upgrade" CTA button and the Gemini entry-point button Google injects into
Gmail, Docs, Sheets, Drive, and other Google Workspace pages.

See `RESEARCH.md` for the DOM research behind the approach and the
implementation plan.

## Quick start

```sh
nvm use            # picks up .nvmrc
npm install
npm run dev        # Chrome dev build with auto-reload
npm run dev:firefox
```

Other scripts:

| Command                           | Purpose                                     |
| --------------------------------- | ------------------------------------------- |
| `npm run build` / `build:firefox` | Production build into `.output/<browser>/`. |
| `npm run zip` / `zip:firefox`     | Build and zip a release artifact.           |
| `npm run typecheck`               | TypeScript typecheck (`tsc --noEmit`).      |
| `npm run lint` / `lint:fix`       | ESLint (flat config, type-aware).           |
| `npm test` / `test:watch`         | Run Vitest.                                 |
| `npm run format` / `format:check` | Prettier.                                   |
| `npm run checks`                  | Run format, lint, typecheck, and tests.     |

## Layout

```
.
├── wxt.config.ts                         # extension manifest (name, permissions, srcDir)
├── src/
│   ├── entrypoints/
│   │   ├── background.ts                 # service worker (placeholder)
│   │   ├── popup/                        # toolbar popup — single on/off toggle
│   │   └── hide-upgrade.content/         # content script that hides the button
│   ├── components/Toggle.tsx             # shared toggle control
│   └── utils/
│       ├── hideUpgradeButton.ts          # detection + hide logic (see RESEARCH.md)
│       ├── hideUpgradeButton.test.ts
│       ├── storage.ts                    # chrome.storage.sync helpers
│       └── useSyncStorage.ts             # React hook wrapping storage.ts
```

## Loading the unpacked extension in Chrome

1. `npm install && npm run build`
2. Visit `chrome://extensions`, enable Developer mode.
3. "Load unpacked" → select `.output/chrome-mv3`.
4. Open Gmail, Docs, or Sheets — the Upgrade button should be gone. Toggle it
   back on from the extension's popup if needed.
