// Minimal Selenium WebDriver setup: headless Chrome using the local chromedriver.
import { Builder } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";
import chromedriver from "chromedriver";

// Base URL of the running Vite dev server (start it with `npm run dev`).
export const BASE_URL = "http://localhost:5173";

export function buildDriver() {
  const options = new chrome.Options().addArguments(
    "--headless=new",
    "--no-sandbox",
    "--window-size=1280,800",
  );
  const service = new chrome.ServiceBuilder(chromedriver.path);

  return new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .setChromeService(service)
    .build();
}
