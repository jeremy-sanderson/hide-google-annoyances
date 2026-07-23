import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { hideGeminiButtons, restoreGeminiButtons } from "./hideGeminiButton";

describe("hideGeminiButtons", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("hides the Gemini entry-point wrapper in Gmail-style markup, not the whole toolbar row", () => {
    document.body.innerHTML = `
      <div class="gb_v gb_ye bGJ" style="display: flex">
        <button>Search</button>
        <button>Settings</button>
        <div class="Zmxtcf  ADOx3c">
          <span data-is-tooltip-wrapper="true">
            <button aria-label="Ask Gemini" class="VYBDae-JX-I yoPn6d"></button>
          </span>
        </div>
        <div class="s1rbBe" data-pep-id="global-pep-gmail">
          <button role="link">Upgrade</button>
        </div>
      </div>
    `;

    const hidden = hideGeminiButtons();
    expect(hidden).toBe(1);

    const container = document.querySelector(".Zmxtcf") as HTMLElement;
    expect(container.style.display).toBe("none");
    expect(container.getAttribute("data-gemini-hidden")).toBe("true");

    const toolbarButtons = document.querySelectorAll(".gb_v > button");
    toolbarButtons.forEach(btn => expect((btn as HTMLElement).style.display).toBe(""));
    const upgrade = document.querySelector('[data-pep-id="global-pep-gmail"]') as HTMLElement;
    expect(upgrade.style.display).toBe("");
  });

  it("hides the actual flex-item ancestor in Docs/Sheets-style markup, past intermediate wrappers", () => {
    document.body.innerHTML = `
      <div class="docs-titlebar-buttons" style="display: flex">
        <button>Comment</button>
        <button>Share</button>
        <div class="docs-gemini-outer-wrapper">
          <div>
            <div class="appsElementsSidekickAuroraEntryPointRoot">
              <span>
                <button aria-label="Try Gemini" class="appsElementsSidekickAuroraEntryPointButton"></button>
              </span>
            </div>
          </div>
        </div>
        <button>Avatar</button>
      </div>
    `;

    const hidden = hideGeminiButtons();
    expect(hidden).toBe(1);

    const outerWrapper = document.querySelector(".docs-gemini-outer-wrapper") as HTMLElement;
    expect(outerWrapper.style.display).toBe("none");

    const innerRoot = document.querySelector(".appsElementsSidekickAuroraEntryPointRoot") as HTMLElement;
    expect(innerRoot.style.display).toBe("");

    const toolbarButtons = document.querySelectorAll(".docs-titlebar-buttons > button");
    toolbarButtons.forEach(btn => expect((btn as HTMLElement).style.display).toBe(""));
  });

  it("hides only its own table-cell in Drive-style markup, not the whole row", () => {
    // Drive's top bar uses a legacy display:table-cell layout rather than
    // flex/grid — the row itself computes as `display: block`, so the
    // flex/grid-only rule would return the whole row (Help + Gemini +
    // Upgrade together) instead of the one cell.
    document.body.innerHTML = `
      <div class="gb_v" style="display: block">
        <div class="gb_Ae" style="display: table-cell">Help</div>
        <div class="gb_Ae" style="display: table-cell">
          <button aria-label="Try Gemini"></button>
        </div>
        <div class="Iu19ad" style="display: table-cell">
          <button role="link">Upgrade</button>
        </div>
      </div>
    `;

    const hidden = hideGeminiButtons();
    expect(hidden).toBe(1);

    const geminiCell = document.querySelectorAll(".gb_Ae")[1] as HTMLElement;
    expect(geminiCell.style.display).toBe("none");

    const row = document.querySelector(".gb_v") as HTMLElement;
    expect(row.style.display).toBe("block");

    const helpCell = document.querySelectorAll(".gb_Ae")[0] as HTMLElement;
    expect(helpCell.style.display).toBe("table-cell");
    const upgradeCell = document.querySelector(".Iu19ad") as HTMLElement;
    expect(upgradeCell.style.display).toBe("table-cell");
  });

  it("falls back to the raw button instead of a shared ancestor that also contains other controls", () => {
    // Mirrors the same race documented in hideUpgradeButton.test.ts: if a
    // per-item wrapper's table-cell display is transiently unset, the walk
    // must not land on a broader ancestor (here, the whole `gb_v` row) that
    // also contains the Upgrade button.
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

    const hidden = hideGeminiButtons();
    expect(hidden).toBe(1);

    const geminiButton = document.querySelector('[aria-label="Try Gemini"]') as HTMLElement;
    expect(geminiButton.style.display).toBe("none");

    const row = document.querySelector(".gb_v") as HTMLElement;
    expect(row.style.display).toBe("block");
    const upgradeButton = document.querySelector('button[role="link"]') as HTMLElement;
    expect(upgradeButton.style.display).toBe("");
  });

  it("does not hide unrelated buttons or partial aria-label matches", () => {
    document.body.innerHTML = `
      <button aria-label="Ask Gemini about this page">icon</button>
      <button aria-label="Settings">icon</button>
      <button>Try Gemini</button>
    `;

    const hidden = hideGeminiButtons();
    expect(hidden).toBe(0);
  });

  it("is idempotent across repeated scans", () => {
    document.body.innerHTML = `
      <div style="display: flex">
        <button>Share</button>
        <div class="Zmxtcf">
          <button aria-label="Ask Gemini"></button>
        </div>
      </div>
    `;

    expect(hideGeminiButtons()).toBe(1);
    expect(hideGeminiButtons()).toBe(0);
  });

  it("restoreGeminiButtons makes previously-hidden buttons visible again", () => {
    document.body.innerHTML = `
      <div style="display: flex">
        <button>Share</button>
        <div class="Zmxtcf">
          <button aria-label="Ask Gemini"></button>
        </div>
      </div>
    `;

    expect(hideGeminiButtons()).toBe(1);
    const container = document.querySelector(".Zmxtcf") as HTMLElement;
    expect(container.style.display).toBe("none");

    const restored = restoreGeminiButtons();
    expect(restored).toBe(1);
    expect(container.style.display).toBe("");
    expect(container.hasAttribute("data-gemini-hidden")).toBe(false);
  });

  it("does not interfere with the Upgrade button hider's own hidden attribute", () => {
    document.body.innerHTML = `
      <div style="display: flex">
        <button>Share</button>
        <div class="Zmxtcf">
          <button aria-label="Try Gemini"></button>
        </div>
        <div data-pep-id="global-pep-gmail" data-upgrade-hidden="true" style="display: none">
          <button role="link">Upgrade</button>
        </div>
      </div>
    `;

    expect(hideGeminiButtons()).toBe(1);
    const upgradeContainer = document.querySelector('[data-pep-id="global-pep-gmail"]') as HTMLElement;
    // untouched by the Gemini hider/restorer
    expect(upgradeContainer.getAttribute("data-upgrade-hidden")).toBe("true");
    expect(restoreGeminiButtons()).toBe(1);
    expect(upgradeContainer.getAttribute("data-upgrade-hidden")).toBe("true");
  });
});
