// Auth flow tests. Require BOTH servers running:
//   Terminal 1: npm run server   (API on port 3000)
//   Terminal 2: npm run dev      (Vite on port 5173)
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { By, until } from "selenium-webdriver";
import { buildDriver, BASE_URL } from "./driver.js";
import {
  registerUser,
  loginUser,
  logout,
  newUser,
  waitForDashboard,
  attemptLogin,
  getStoredToken,
  WAIT,
} from "./helpers.js";

// Shared assertions for a rejected login: error shown, still on /login, no token.
async function assertLoginDeclined(driver) {
  const err = await driver.wait(until.elementLocated(By.css(".error-msg")), WAIT);
  assert.match(await err.getText(), /invalid credentials/i);
  assert.match(await driver.getCurrentUrl(), /\/login/);
  assert.equal(await getStoredToken(driver), null);
}

let driver;

before(() => {
  driver = buildDriver();
});

after(async () => {
  await driver?.quit();
});

test("register a new adult user lands on the dashboard", async () => {
  await registerUser(driver);
  // Dashboard content confirms we're authenticated.
  const income = await driver.wait(
    until.elementLocated(By.xpath("//*[contains(text(),'Total income')]")),
    WAIT,
  );
  assert.ok(await income.isDisplayed());
});

test("login with a non-existent email is declined", async () => {
  await attemptLogin(driver, `nobody.${Date.now()}@example.com`, "whatever123");
  await assertLoginDeclined(driver);
});

test("login with a real email but wrong password is declined", async () => {
  const user = newUser();
  await registerUser(driver, user); // create a real account
  await logout(driver);

  await attemptLogin(driver, user.email, "definitely-wrong");
  await assertLoginDeclined(driver);
});

test("register then log in again with the same credentials", async () => {
  const user = newUser();
  await registerUser(driver, user);

  await logout(driver);
  await loginUser(driver, user);
  assert.ok(await waitForDashboard(driver));
});

test("registering an already-used email shows a server error", async () => {
  const user = newUser();
  await registerUser(driver, user); // first registration succeeds
  await logout(driver);

  // Try again with the same email.
  await driver.get(`${BASE_URL}/register`);
  await driver.wait(until.elementLocated(By.css('input[name="full_name"]')), WAIT);
  await driver.findElement(By.css('input[name="full_name"]')).sendKeys(user.full_name);
  await driver.findElement(By.css('input[name="email"]')).sendKeys(user.email);
  await driver.findElement(By.css('input[name="password"]')).sendKeys(user.password);
  await driver.findElement(By.css('input[name="age"]')).sendKeys(user.age);
  await driver.findElement(By.css('button[type="submit"]')).click();

  const err = await driver.wait(until.elementLocated(By.css(".error-msg")), WAIT);
  assert.match(await err.getText(), /already in use/i);
});

test("registering with a short password is rejected client-side", async () => {
  await driver.get(`${BASE_URL}/register`);
  await driver.wait(until.elementLocated(By.css('input[name="full_name"]')), WAIT);
  await driver.findElement(By.css('input[name="full_name"]')).sendKeys("Shorty");
  await driver.findElement(By.css('input[name="email"]')).sendKeys(newUser().email);
  await driver.findElement(By.css('input[name="password"]')).sendKeys("123"); // < 6 chars
  await driver.findElement(By.css('input[name="age"]')).sendKeys("30");
  await driver.findElement(By.css('button[type="submit"]')).click();

  const err = await driver.wait(until.elementLocated(By.css(".error-msg")), WAIT);
  assert.match(await err.getText(), /at least 6 characters/i);
});

test("visiting a protected page while logged out redirects to login", async () => {
  // Ensure no auth state, then hit a protected route directly.
  await driver.get(BASE_URL);
  await driver.executeScript("window.localStorage.clear()");
  await driver.get(`${BASE_URL}/transactions`);

  await driver.wait(until.urlContains("/login"), WAIT);
  const emailField = await driver.findElement(By.css('input[type="email"]'));
  assert.ok(await emailField.isDisplayed());
});
