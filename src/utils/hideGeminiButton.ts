// Detection rule for Google's Gemini entry-point button — the sparkle/star
// icon in the top-right toolbar on Gmail ("Ask Gemini") and Docs/Sheets
// ("Try Gemini"). Unlike the "Upgrade" CTA, this button is icon-only (no
// visible text), so it's matched on its accessible name instead. See
// toolbarButtonHider.ts for the shared structural hide-target logic, and
// RESEARCH.md for how the analogous Upgrade-button rule was derived — the
// same DOM shape applies here (verified live on Gmail, Docs, and Sheets).

import {
  type ButtonHiderHandle,
  hideMatchingButtons,
  restoreMatchingButtons,
  startButtonHider,
} from "./toolbarButtonHider";

const HIDDEN_ATTR = "data-gemini-hidden";
// Known accessible names for the entry point across surfaces. Exact match,
// same rationale as the Upgrade button: English-locale specific today.
const EXACT_LABELS = new Set(["Ask Gemini", "Try Gemini"]);

function isGeminiControl(el: Element): boolean {
  const role = el.getAttribute("role");
  if (el.tagName !== "BUTTON" && role !== "link" && role !== "button") {
    return false;
  }
  const label = (el.getAttribute("aria-label") ?? "").trim();
  return EXACT_LABELS.has(label);
}

export function hideGeminiButtons(root: ParentNode = document): number {
  return hideMatchingButtons(root, HIDDEN_ATTR, isGeminiControl);
}

export function restoreGeminiButtons(root: ParentNode = document): number {
  return restoreMatchingButtons(root, HIDDEN_ATTR);
}

export type GeminiHiderHandle = ButtonHiderHandle;

export function startGeminiButtonHider(): GeminiHiderHandle {
  return startButtonHider(
    () => hideGeminiButtons(),
    () => restoreGeminiButtons()
  );
}
