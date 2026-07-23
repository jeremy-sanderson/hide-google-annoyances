export default defineBackground(() => {
  console.log("[hide-google-annoyances] background started", {
    id: browser.runtime.id,
  });
});
