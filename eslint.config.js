import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig(
  globalIgnores([
    ".wxt/**",
    ".output/**",
    "node_modules/**",
    "dist/**",
    "build/**",
    ".yarn/**",
    "stats.html",
  ]),
  {
    files: ["**/*.{ts,tsx,js,jsx,mjs,cjs}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.webextensions,
        // WXT auto-imports — exposed globally at runtime.
        defineContentScript: "readonly",
        defineBackground: "readonly",
        defineUnlistedScript: "readonly",
        createShadowRootUi: "readonly",
        createIframeUi: "readonly",
        createIntegratedUi: "readonly",
        browser: "readonly",
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    files: ["**/*.test.{ts,tsx}"],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    files: ["*.config.{js,ts,mjs}", "vitest.config.ts", "wxt.config.ts"],
    languageOptions: { globals: { ...globals.node } },
  }
);
