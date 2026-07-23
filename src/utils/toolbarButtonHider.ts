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
// multi-item toolbar row (more than one child, laid out with flex/grid) —
// that's the actual flex/grid item slot, so hiding it removes it from flow
// entirely and its siblings reclaim the space, regardless of any min-width
// set on wrappers further in. See RESEARCH.md for how this was derived.

const ANCESTOR_SEARCH_DEPTH = 12;
const MULTI_ITEM_CONTAINER_DISPLAYS = new Set([
  "flex",
  "inline-flex",
  "grid",
  "inline-grid",
]);

export function findHideTarget(el: Element): Element {
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
