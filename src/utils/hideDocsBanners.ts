// Hides the promo banners Docs renders above the editor (e.g. the Gemini
// ad). Unlike the toolbar buttons, these containers carry stable IDs, so a
// stylesheet is enough: no structural walk, and no MutationObserver, since
// the rule applies to the banners whenever Docs (re)renders them.

const STYLE_ID = "hide-google-annoyances-docs-banners";
export const DOCS_BANNER_IDS = [
  "docs-account-level-banner",
  "docs-file-level-banner",
] as const;

export type DocsBannerHiderHandle = {
  dispose(): void;
};

export function startDocsBannerHider(): DocsBannerHiderHandle {
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `${DOCS_BANNER_IDS.map(id => `#${id}`).join(", ")} { display: none !important; }`;
  // At document_start <head> may not exist yet; <html> always does.
  (document.head ?? document.documentElement).appendChild(style);

  return {
    dispose() {
      style.remove();
    },
  };
}
