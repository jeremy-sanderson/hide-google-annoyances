import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "wxt";

export default defineConfig({
  srcDir: "src",
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "Hide Google Annoyances",
    description:
      "Hides the 'Upgrade' Gemini upsell button and the Gemini entry-point button on Gmail, Docs, Sheets, Drive, and other Google Workspace pages.",
    permissions: ["storage"],
    // Public key only (matches key.pem, kept outside version control) —
    // pins the extension's ID so it stays the same across unpacked
    // reloads and rebuilds instead of Chrome assigning a new one each time.
    // Safe to commit: Chrome ships this same value inside every installed
    // copy's manifest.json, so it carries no confidentiality on its own.
    key: "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA80cPq2bcOE3SsLOmlB3Wi9bqj+/JtjrTnFvd6Lx9Rwavgu8DIikSwAnZu9sBzGyrfNHY5tbNRFztjtxQXoPROBJuIb2sY3jTEKzrF+rvRVdli1SGGASZ9g4mYB1weHoSBWXagIISd0HVJmGHZP8Hmf9Sxr/bMyyeXst61gbV59jleVjn1Hb+biCuMxC8PqQygeZO3ZvP1mXGgyKSaVtEuOMQ2vOPwG/VtNpRMWMIkoiac9uyJXhLWU1obRNodf9NStEq9wJVvVJ/25YwovnUNBOnx9M+rMS0I+ocG8hhn2+C4Mh/Di4UOqaXzexz4YWR1KryLE03NiOtuqEnHy3JgwIDAQAB",
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
});
