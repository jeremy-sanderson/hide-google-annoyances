import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "wxt";

export default defineConfig({
  srcDir: "src",
  modules: ["@wxt-dev/module-react"],
  // The Web Store build (WEB_STORE=1) strips the `key` below, so give it a
  // distinct artifact name — otherwise it overwrites the identically-named
  // keyed zip from a plain `wxt zip`, and it's easy to upload the wrong one
  // and hit "key field is not allowed in manifest".
  ...(process.env.WEB_STORE === "1"
    ? {
        zip: {
          artifactTemplate:
            "{{name}}-{{packageVersion}}-{{browser}}-webstore.zip",
        },
      }
    : {}),
  manifest: {
    name: "Hide Google Annoyances",
    // Kept at/under the Chrome Web Store's 132-char manifest limit.
    description:
      "Hides the 'Upgrade' upsell and Gemini buttons on Gmail, Docs, Sheets, Drive, and other Google Workspace pages.",
    permissions: ["storage"],
    // Public key only (matches key.pem, kept outside version control) —
    // pins the extension's ID so it stays the same across unpacked
    // reloads and rebuilds instead of Chrome assigning a new one each time.
    // Safe to commit: Chrome ships this same value inside every installed
    // copy's manifest.json, so it carries no confidentiality on its own.
    //
    // The Chrome Web Store REJECTS a manifest containing `key` (it assigns
    // its own permanent ID on publish), so the store build strips it via
    // WEB_STORE=1 (see the zip:chrome-webstore script). Unpacked and
    // GitHub-release builds keep it so their ID stays pinned.
    ...(process.env.WEB_STORE === "1"
      ? {}
      : {
          key: "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA80cPq2bcOE3SsLOmlB3Wi9bqj+/JtjrTnFvd6Lx9Rwavgu8DIikSwAnZu9sBzGyrfNHY5tbNRFztjtxQXoPROBJuIb2sY3jTEKzrF+rvRVdli1SGGASZ9g4mYB1weHoSBWXagIISd0HVJmGHZP8Hmf9Sxr/bMyyeXst61gbV59jleVjn1Hb+biCuMxC8PqQygeZO3ZvP1mXGgyKSaVtEuOMQ2vOPwG/VtNpRMWMIkoiac9uyJXhLWU1obRNodf9NStEq9wJVvVJ/25YwovnUNBOnx9M+rMS0I+ocG8hhn2+C4Mh/Di4UOqaXzexz4YWR1KryLE03NiOtuqEnHy3JgwIDAQAB",
        }),
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
});
