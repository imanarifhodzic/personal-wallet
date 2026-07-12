// Smoke test: confirms the app loads and the Login page renders.
// Requires the Vite dev server running: `npm run dev`.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { By, until } from "selenium-webdriver";
import { buildDriver, BASE_URL } from "./driver.js";

let driver;

before(async () => {
  driver = buildDriver();
});

after(async () => {
  await driver?.quit();
});

test("app loads and shows the login page", async () => {
  await driver.get(BASE_URL);

  // Tab title from index.html
  assert.equal(await driver.getTitle(), "personal-wallet");

  // Unauthenticated root redirects to /login, which shows this heading.
  const heading = await driver.wait(
    until.elementLocated(By.xpath("//*[contains(text(),'Sign in to your account')]")),
    10000,
  );
  assert.ok(await heading.isDisplayed());
});
