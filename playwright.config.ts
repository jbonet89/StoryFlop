import { defineConfig, devices } from "@playwright/test";
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
export default defineConfig({ testDir:"./e2e", fullyParallel:false, retries:1, use:{ baseURL, locale:"es-ES", trace:"on-first-retry" }, webServer:{ command:"pnpm dev", url:baseURL, reuseExistingServer:true }, projects:[{ name:"chromium", use:{...devices["Desktop Chrome"]} },{ name:"mobile", use:{...devices["iPhone 13"],browserName:"chromium"} }] });
