import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "wxt";

export default defineConfig({
  srcDir: "src",
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "Hide Google Upgrade Button",
    description:
      "Hides the 'Upgrade' Gemini upsell button on Gmail, Docs, Sheets, and other Google Workspace pages.",
    permissions: ["storage"],
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
});
