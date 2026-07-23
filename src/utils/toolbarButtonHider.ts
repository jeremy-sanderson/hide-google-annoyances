// Shared structural logic for hiding Google's toolbar promo buttons
// (Upgrade CTA, Gemini entry point, ...). Google renders these inside
// several nested wrapper divs before reaching the actual toolbar row, and
// those wrappers differ per product and use obfuscated or semantic class
// names that aren't safe to hardcode — worse, some of the outer ones carry
// a hard-coded `min-width` from Google's CSS, so hiding an inner wrapper
// alone leaves that outer box still reserving its minimum width.
//
// Rather than chase class names, callers match on their own control (e.g.
// visible label or aria-label) and this module walks up structurally: the
// correct element to hide is the one whose own PARENT is the shared
// multi-item toolbar row — that's the actual layout item slot, so hiding it
// removes it from flow entirely and its siblings reclaim the space,
// regardless of any min-width set on wrappers further in. See RESEARCH.md
// for how this was derived.
//
// Two different layout mechanisms qualify a "shared toolbar row": Gmail and
// Docs/Sheets lay their row out with flex/grid, detected by the PARENT's own
// `display`. Drive instead uses a legacy `display: table-cell` layout, where
// each item sets its own display rather than the row setting a `display:
// flex/grid` on itself — there, the parent's `display` reports `block`, so
// the flex/grid check alone would keep walking past the real row and return
// the whole multi-item row (e.g. Help + Gemini + Upgrade together) instead
// of the one item slot. Checking the NODE's own display for `table-cell`
// catches that case without disturbing the flex/grid one.
//
// Neither check is airtight on its own, though: on a heavily client-rendered
// page (confirmed live on Drive, mid an in-app route change) a candidate's
// `table-cell` display can be transiently unset for one MutationObserver
// tick while Google's JS is still reattaching styles/classes to a
// freshly-rendered node. If that happens, the walk keeps going past the
// real per-item slot and can match a much larger ancestor one level up
// (e.g. the whole toolbar row) — which then gets marked hidden and stays
// that way, since the hidden-attribute check makes future scans skip it.
// The guard against that: a correct per-item target contains exactly one
// interactive control (the button being hidden). If the best candidate
// contains any *other* button/link, it's too broad — fall back to hiding
// just the raw element instead of guessing further up.

const ANCESTOR_SEARCH_DEPTH = 12;
const MULTI_ITEM_CONTAINER_DISPLAYS = new Set([
  "flex",
  "inline-flex",
  "grid",
  "inline-grid",
]);

function hasOtherInteractiveControls(node: Element, matched: Element): boolean {
  for (const control of node.querySelectorAll(
    'button, [role="link"], [role="button"]'
  )) {
    if (control !== matched) return true;
  }
  return false;
}

export function findHideTarget(el: Element): Element {
  let node: Element = el;
  for (let i = 0; i < ANCESTOR_SEARCH_DEPTH; i++) {
    const parent = node.parentElement;
    if (!parent) break;
    if (parent.children.length > 1) {
      const parentDisplay = getComputedStyle(parent).display;
      const isLayoutItemSlot =
        MULTI_ITEM_CONTAINER_DISPLAYS.has(parentDisplay) ||
        getComputedStyle(node).display === "table-cell";
      if (isLayoutItemSlot) {
        return hasOtherInteractiveControls(node, el) ? el : node;
      }
    }
    node = parent;
  }
  return el;
}

export function hideMatchingButtons(
  root: ParentNode,
  hiddenAttr: string,
  isControl: (el: Element) => boolean
): number {
  let hidden = 0;
  root
    .querySelectorAll('button, [role="link"], [role="button"]')
    .forEach(el => {
      if (!isControl(el)) return;
      const target = findHideTarget(el) as HTMLElement;
      if (target.hasAttribute(hiddenAttr)) return;
      target.style.setProperty("display", "none", "important");
      target.setAttribute(hiddenAttr, "true");
      hidden++;
    });
  return hidden;
}

export function restoreMatchingButtons(
  root: ParentNode,
  hiddenAttr: string
): number {
  let restored = 0;
  root.querySelectorAll(`[${hiddenAttr}]`).forEach(el => {
    const target = el as HTMLElement;
    target.style.removeProperty("display");
    target.removeAttribute(hiddenAttr);
    restored++;
  });
  return restored;
}

export type ButtonHiderHandle = {
  dispose(): void;
};

export function startButtonHider(
  hide: () => void,
  restore: () => void
): ButtonHiderHandle {
  let scheduled = false;
  const scan = () => {
    scheduled = false;
    hide();
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
      restore();
    },
  };
}
