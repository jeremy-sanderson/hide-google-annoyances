import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { hideUpgradeButtons, restoreUpgradeButtons } from "./hideUpgradeButton";

describe("hideUpgradeButtons", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("hides the gb_ promo container in Gmail-style markup, not the whole toolbar row", () => {
    document.body.innerHTML = `
      <div class="gb_v gb_ye" style="display: flex">
        <button>Search</button>
        <button>Settings</button>
        <div class="s1rbBe" data-pep-id="global-pep-gmail">
          <span class="iTvTg">
            <span data-is-tooltip-wrapper="true">
              <div data-is-touch-wrapper="true">
                <button role="link" class="FOBRw-I u0fKN">
                  <span class="FOBRw-anl">Upgrade</span>
                </button>
              </div>
            </span>
          </span>
        </div>
        <button>Account</button>
      </div>
    `;

    const hidden = hideUpgradeButtons();
    expect(hidden).toBe(1);

    const container = document.querySelector('[data-pep-id="global-pep-gmail"]') as HTMLElement;
    expect(container.style.display).toBe("none");
    expect(container.getAttribute("data-upgrade-hidden")).toBe("true");

    // siblings in the toolbar row must be untouched
    const toolbarButtons = document.querySelectorAll(".gb_v > button");
    toolbarButtons.forEach(btn => expect((btn as HTMLElement).style.display).toBe(""));
  });

  it("hides the actual flex-item ancestor in Docs/Sheets-style markup, past intermediate wrappers", () => {
    // Mirrors the real bug: appsElementsWorkspaceRecommendationCtaButtonContainer
    // is an inner wrapper — hiding it alone leaves docsRecommendationsPepPersistentEntryPointContainer
    // (which has a hard-coded min-width in Google's CSS) still reserving space.
    // The correct target is that outer container, since it's the direct flex item.
    document.body.innerHTML = `
      <div class="docs-titlebar-buttons" style="display: flex">
        <button>Comment</button>
        <button>Share</button>
        <div class="docsRecommendationsPepPersistentEntryPointContainer">
          <div class="appsElementsWorkspacePepGlobalRecommendationPepGlobalContainer">
            <div class="appsElementsWorkspaceRecommendationCtaButtonContainer">
              <button role="link" class="workspacepepbutton docsRecommendationsPepPersistentEntryPointEditorPepButton">
                <span class="javascriptMaterialdesignGm3WizButtonFilledTonal-button__label">Upgrade</span>
              </button>
            </div>
          </div>
        </div>
        <button>Avatar</button>
      </div>
    `;

    const hidden = hideUpgradeButtons();
    expect(hidden).toBe(1);

    const outerContainer = document.querySelector(
      ".docsRecommendationsPepPersistentEntryPointContainer"
    ) as HTMLElement;
    expect(outerContainer.style.display).toBe("none");

    // the inner wrapper must NOT be the one hidden — hiding it alone was the bug
    const innerContainer = document.querySelector(
      ".appsElementsWorkspaceRecommendationCtaButtonContainer"
    ) as HTMLElement;
    expect(innerContainer.style.display).toBe("");

    const toolbarButtons = document.querySelectorAll(".docs-titlebar-buttons > button");
    toolbarButtons.forEach(btn => expect((btn as HTMLElement).style.display).toBe(""));
  });

  it("hides only its own table-cell in Drive-style markup, not the whole row", () => {
    // Drive's top bar uses a legacy display:table-cell layout rather than
    // flex/grid — the row container itself computes as `display: block`,
    // so the flex/grid-only rule would keep walking up and return the
    // whole row (Help + Gemini + Upgrade together). The fix checks the
    // candidate node's own display for `table-cell` too.
    document.body.innerHTML = `
      <div class="gb_v" style="display: block">
        <div class="gb_Ae" style="display: table-cell">Help</div>
        <div class="gb_Ae" style="display: table-cell"></div>
        <div class="gb_Ae" style="display: table-cell">
          <button aria-label="Try Gemini"></button>
        </div>
        <div class="Iu19ad" style="display: table-cell">
          <button role="link">Upgrade</button>
        </div>
      </div>
    `;

    const hidden = hideUpgradeButtons();
    expect(hidden).toBe(1);

    const upgradeCell = document.querySelector(".Iu19ad") as HTMLElement;
    expect(upgradeCell.style.display).toBe("none");

    const row = document.querySelector(".gb_v") as HTMLElement;
    expect(row.style.display).toBe("block");

    const otherCells = document.querySelectorAll(".gb_v > .gb_Ae");
    otherCells.forEach(cell => expect((cell as HTMLElement).style.display).toBe("table-cell"));
  });

  it("falls back to the raw button instead of a shared ancestor that also contains other controls", () => {
    // Reproduces a real race found live on Drive: mid an in-app route
    // change, a per-item wrapper's `display: table-cell` can be
    // transiently unset for one scan while Google's JS is still
    // reattaching styles. If the walk then continues past the real
    // per-item slot, it can land on a much larger ancestor (here, the
    // whole `gb_v` row) that also contains the Gemini button — hiding it
    // would take that out too. The candidate must contain ONLY the
    // matched control to be trusted as the hide target.
    document.body.innerHTML = `
      <div class="outer-flex-wrapper" style="display: flex">
        <div class="gb_v" style="display: block">
          <div class="gb_Ae">Help</div>
          <div class="gb_Ae">
            <button aria-label="Try Gemini"></button>
          </div>
          <div class="Iu19ad">
            <button role="link">Upgrade</button>
          </div>
        </div>
        <div>Other sibling</div>
      </div>
    `;

    const hidden = hideUpgradeButtons();
    expect(hidden).toBe(1);

    const upgradeButton = document.querySelector('button[role="link"]') as HTMLElement;
    expect(upgradeButton.style.display).toBe("none");

    const row = document.querySelector(".gb_v") as HTMLElement;
    expect(row.style.display).toBe("block");
    const geminiButton = document.querySelector('[aria-label="Try Gemini"]') as HTMLElement;
    expect(geminiButton.style.display).toBe("");
  });

  it("hides the shared wrapper even when it also contains an already-hidden duplicate button", () => {
    // Reproduces a real Drive quirk: Google renders a second, narrower
    // "Upgrade" button (icon-only, for smaller viewports) inside the same
    // per-item wrapper as the visible one, already `display: none` at the
    // current width. That duplicate must not trip the "other controls"
    // guard and force an unnecessary fallback — the guard is about
    // visible controls the user would lose, not markup that Google itself
    // already hid.
    document.body.innerHTML = `
      <div class="gb_v" style="display: block">
        <div class="gb_Ae" style="display: table-cell">Help</div>
        <div class="Iu19ad" style="display: table-cell">
          <button role="link">Upgrade</button>
          <button aria-label="Upgrade" style="display: none"></button>
        </div>
      </div>
    `;

    const hidden = hideUpgradeButtons();
    expect(hidden).toBe(1);

    const wrapper = document.querySelector(".Iu19ad") as HTMLElement;
    expect(wrapper.style.display).toBe("none");

    const helpCell = document.querySelector(".gb_Ae") as HTMLElement;
    expect(helpCell.style.display).toBe("table-cell");
  });

  it("does not hide unrelated buttons or partial text matches", () => {
    document.body.innerHTML = `
      <button role="link">Upgrade your plan</button>
      <button>Share</button>
      <a role="link">Not Upgrade</a>
    `;

    const hidden = hideUpgradeButtons();
    expect(hidden).toBe(0);
  });

  it("is idempotent across repeated scans", () => {
    document.body.innerHTML = `
      <div style="display: flex">
        <button>Share</button>
        <div data-pep-id="global-pep-gmail">
          <button role="link">Upgrade</button>
        </div>
      </div>
    `;

    expect(hideUpgradeButtons()).toBe(1);
    expect(hideUpgradeButtons()).toBe(0);
  });

  it("restoreUpgradeButtons makes previously-hidden buttons visible again", () => {
    document.body.innerHTML = `
      <div style="display: flex">
        <button>Share</button>
        <div data-pep-id="global-pep-gmail">
          <button role="link">Upgrade</button>
        </div>
      </div>
    `;

    expect(hideUpgradeButtons()).toBe(1);
    const container = document.querySelector('[data-pep-id="global-pep-gmail"]') as HTMLElement;
    expect(container.style.display).toBe("none");

    const restored = restoreUpgradeButtons();
    expect(restored).toBe(1);
    expect(container.style.display).toBe("");
    expect(container.hasAttribute("data-upgrade-hidden")).toBe(false);
  });

  it("re-hides after a restore, so toggling stays reversible", () => {
    document.body.innerHTML = `
      <div style="display: flex">
        <button>Share</button>
        <div data-pep-id="global-pep-gmail">
          <button role="link">Upgrade</button>
        </div>
      </div>
    `;
    const container = document.querySelector('[data-pep-id="global-pep-gmail"]') as HTMLElement;

    hideUpgradeButtons();
    expect(container.style.display).toBe("none");

    restoreUpgradeButtons();
    expect(container.style.display).toBe("");

    hideUpgradeButtons();
    expect(container.style.display).toBe("none");
  });
});
