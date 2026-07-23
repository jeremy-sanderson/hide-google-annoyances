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
