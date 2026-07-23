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
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
});
