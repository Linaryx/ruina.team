export default defineEventHandler((event) => {
  // Some tooling/dev flows may ping `/_nuxt/` (directory URL). Nuxt/Vite serve files
  // under `/_nuxt/*`, but the directory itself can return 404 and be treated as an error.
  // Respond 200 to avoid noisy/unhandled request errors while keeping real assets intact.
  if (event.path === "/_nuxt/") {
    return "";
  }
});
