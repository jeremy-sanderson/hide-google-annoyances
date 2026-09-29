import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { startDocsBannerHider } from "./hideDocsBanners";

describe("startDocsBannerHider", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="docs-account-level-banner">Try Gemini in Docs</div>
      <div id="docs-file-level-banner">Gemini can help you write</div>
      <div id="docs-editor">Editor</div>
    `;
  });

  afterEach(() => {
    document.head.innerHTML = "";
    document.body.innerHTML = "";
  });

  const display = (id: string) => getComputedStyle(document.getElementById(id)!).display;

  it("hides both banners without touching the rest of the page", () => {
    startDocsBannerHider();

    expect(display("docs-account-level-banner")).toBe("none");
    expect(display("docs-file-level-banner")).toBe("none");
    expect(display("docs-editor")).toBe("block");
  });

  it("hides banners rendered after it starts", () => {
    document.body.innerHTML = "";
    startDocsBannerHider();

    document.body.innerHTML = `<div id="docs-file-level-banner">Late banner</div>`;
    expect(display("docs-file-level-banner")).toBe("none");
  });

  it("dispose makes the banners visible again", () => {
    const handle = startDocsBannerHider();
    handle.dispose();

    expect(display("docs-account-level-banner")).toBe("block");
    expect(display("docs-file-level-banner")).toBe("block");
  });
});
