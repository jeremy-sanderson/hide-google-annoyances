export default defineBackground(() => {
  console.log("[hide-google-upgrade] background started", {
    id: browser.runtime.id,
  });
});
