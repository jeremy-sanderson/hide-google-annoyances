// Detection rule for Google's "Upgrade" Gemini upsell CTA (verified live on
// Gmail and Docs/Sheets). See toolbarButtonHider.ts for the shared
// structural hide-target logic, and RESEARCH.md for how this was derived.

import {
  type ButtonHiderHandle,
  hideMatchingButtons,
  restoreMatchingButtons,
  startButtonHider,
} from "./toolbarButtonHider";

const HIDDEN_ATTR = "data-upgrade-hidden";
const EXACT_LABEL = "Upgrade";

function isUpgradeControl(el: Element): boolean {
  const role = el.getAttribute("role");
  if (el.tagName !== "BUTTON" && role !== "link" && role !== "button") {
    return false;
  }
  return (el.textContent ?? "").trim() === EXACT_LABEL;
}

export function hideUpgradeButtons(root: ParentNode = document): number {
  return hideMatchingButtons(root, HIDDEN_ATTR, isUpgradeControl);
}

export function restoreUpgradeButtons(root: ParentNode = document): number {
  return restoreMatchingButtons(root, HIDDEN_ATTR);
}

export type UpgradeHiderHandle = ButtonHiderHandle;

export function startUpgradeButtonHider(): UpgradeHiderHandle {
  return startButtonHider(
    () => hideUpgradeButtons(),
    () => restoreUpgradeButtons()
  );
}
