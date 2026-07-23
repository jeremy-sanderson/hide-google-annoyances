// Google renders the Gemini "Upgrade" CTA button inside several nested
// wrapper divs before it reaches the actual toolbar row (verified live on
// Gmail and Docs/Sheets). Those wrappers differ per product and use
// obfuscated or semantic class names that aren't safe to hardcode — worse,
// some of the outer ones carry a hard-coded `min-width` from Google's CSS,
// so hiding an inner wrapper alone leaves that outer box still reserving its
// minimum width (this is what caused the button to disappear but leave a
// gap on Docs/Sheets).
//
// Rather than chase class names, we match on the visible "Upgrade" label
// plus role, then walk up structurally: the correct element to hide is the
// one whose own PARENT is the shared multi-item toolbar row (more than one
// child, laid out with flex/grid) — that's the actual flex/grid item slot,
// so hiding it removes it from flow entirely and its siblings reclaim the
// space, regardless of any min-width set on wrappers further in.

const HIDDEN_ATTR = "data-upgrade-hidden";
const EXACT_LABEL = "Upgrade";
const ANCESTOR_SEARCH_DEPTH = 12;
const MULTI_ITEM_CONTAINER_DISPLAYS = new Set([
  "flex",
  "inline-flex",
  "grid",
  "inline-grid",
]);

function isUpgradeControl(el: Element): boolean {
  const role = el.getAttribute("role");
  if (el.tagName !== "BUTTON" && role !== "link" && role !== "button") {
    return false;
  }
  return (el.textContent ?? "").trim() === EXACT_LABEL;
}

function findHideTarget(el: Element): Element {
  let node: Element = el;
  for (let i = 0; i < ANCESTOR_SEARCH_DEPTH; i++) {
    const parent = node.parentElement;
    if (!parent) break;
    const parentDisplay = getComputedStyle(parent).display;
    if (
      parent.children.length > 1 &&
      MULTI_ITEM_CONTAINER_DISPLAYS.has(parentDisplay)
    ) {
      return node;
    }
    node = parent;
  }
  return el;
}

export function hideUpgradeButtons(root: ParentNode = document): number {
  let hidden = 0;
  root
    .querySelectorAll('button, [role="link"], [role="button"]')
    .forEach(el => {
      if (!isUpgradeControl(el)) return;
      const target = findHideTarget(el) as HTMLElement;
      if (target.hasAttribute(HIDDEN_ATTR)) return;
      target.style.setProperty("display", "none", "important");
      target.setAttribute(HIDDEN_ATTR, "true");
      hidden++;
    });
  return hidden;
}

export function restoreUpgradeButtons(root: ParentNode = document): number {
  let restored = 0;
  root.querySelectorAll(`[${HIDDEN_ATTR}]`).forEach(el => {
    const target = el as HTMLElement;
    target.style.removeProperty("display");
    target.removeAttribute(HIDDEN_ATTR);
    restored++;
  });
  return restored;
}

export type UpgradeHiderHandle = {
  dispose(): void;
};

export function startUpgradeButtonHider(): UpgradeHiderHandle {
  let scheduled = false;
  const scan = () => {
    scheduled = false;
    hideUpgradeButtons();
  };

  scan();
  const observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(scan);
  });
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  return {
    dispose() {
      observer.disconnect();
      restoreUpgradeButtons();
    },
  };
}
