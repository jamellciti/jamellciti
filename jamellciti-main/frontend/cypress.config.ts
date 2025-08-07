import { defineConfig } from "cypress";

export default defineConfig({
  video: true,
  videoCompression: 32,
  videoUploadOnPasses: false,
  e2e: {
    baseUrl: "http://localhost:3000",
    env: {
      API_BASE: "https://73613a20-b586-452b-8c47-65419969d01e.preview.emergentagent.com/api",
      WS_URL: "wss://64fd6267-0033-41b0-9cf5-16f4e283c680.preview.emergentagent.com/ws/live"
    },
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});