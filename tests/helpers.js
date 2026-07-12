// Shared helpers for the Selenium tests.
import { By, until, Key } from "selenium-webdriver";
import { BASE_URL } from "./driver.js";

const WAIT = 10000;

// A fresh, unique adult account each run (age > 15 => no email verification).
export function newUser() {
  const stamp = Date.now();
  return {
    full_name: "Test User",
    email: `test.${stamp}@example.com`,
    password: "password123",
    age: "30",
  };
}

// Register a new adult user through the UI. Ends on the authenticated dashboard.
export async function registerUser(driver, user = newUser()) {
  await driver.get(`${BASE_URL}/register`);
  await driver.wait(until.elementLocated(By.css('input[name="full_name"]')), WAIT);
  await driver.findElement(By.css('input[name="full_name"]')).sendKeys(user.full_name);
  await driver.findElement(By.css('input[name="email"]')).sendKeys(user.email);
  await driver.findElement(By.css('input[name="password"]')).sendKeys(user.password);
  await driver.findElement(By.css('input[name="age"]')).sendKeys(user.age);
  await driver.findElement(By.css('button[type="submit"]')).click();
  await waitForDashboard(driver);
  return user;
}

// Log in an existing user through the UI. Ends on the authenticated dashboard.
export async function loginUser(driver, user) {
  await driver.get(`${BASE_URL}/login`);
  await driver.wait(until.elementLocated(By.css('input[type="email"]')), WAIT);
  await driver.findElement(By.css('input[type="email"]')).sendKeys(user.email);
  await driver.findElement(By.css('input[type="password"]')).sendKeys(user.password);
  await driver.findElement(By.css('button[type="submit"]')).click();
  await waitForDashboard(driver);
}

// Wait until the authenticated app is visible (the nav renders only when logged in).
export function waitForDashboard(driver) {
  return driver.wait(
    until.elementLocated(By.xpath("//a[contains(text(),'Transactions')]")),
    WAIT,
  );
}

// Log out by clearing auth state and returning to the login page.
export async function logout(driver) {
  await driver.executeScript("window.localStorage.clear()");
  await driver.get(`${BASE_URL}/login`);
  await driver.wait(until.elementLocated(By.css('input[type="email"]')), WAIT);
}

// Add a transaction via the UI on the /transactions page. Assumes logged in.
// `date` is "YYYY-MM-DD"; it's typed into the native date input as US-locale digits.
export async function addTransaction(driver, { amount, description, date }) {
  await driver.get(`${BASE_URL}/transactions`);
  // Open the form.
  await driver.wait(
    until.elementLocated(By.xpath("//button[contains(text(),'Add transaction')]")),
    WAIT,
  );
  await driver.findElement(By.xpath("//button[contains(text(),'Add transaction')]")).click();

  await driver.wait(until.elementLocated(By.css('input[name="amount"]')), WAIT);
  await driver.findElement(By.css('input[name="amount"]')).sendKeys(String(amount));
  await driver.findElement(By.css('input[name="description"]')).sendKeys(description);

  // Native date input: type MM DD YYYY as digits.
  const [y, m, d] = date.split("-");
  await driver.findElement(By.css('input[name="transaction_date"]')).sendKeys(`${m}${d}${y}`);

  // Submit (the form's submit button also reads "Add transaction").
  await driver.findElement(By.css('button[type="submit"]')).click();
}

// Click the Edit/Delete button that lives in the same list row as `description`.
export async function clickRowAction(driver, description, action) {
  const xpath =
    `//*[contains(text(),${JSON.stringify(description)})]` +
    `/ancestor::div[contains(@style,'space-between')][1]` +
    `//button[text()=${JSON.stringify(action)}]`;
  const btn = await driver.wait(until.elementLocated(By.xpath(xpath)), WAIT);
  await btn.click();
}

// Replace the contents of a text input (reliable for React controlled inputs on macOS).
export async function replaceInput(driver, selector, value) {
  const el = await driver.findElement(By.css(selector));
  await el.sendKeys(Key.chord(Key.COMMAND, "a"), value);
}

// Fill and submit the login form WITHOUT waiting for success (for negative cases).
// Clears any existing auth state first so a leftover token can't mask the result.
export async function attemptLogin(driver, email, password) {
  await driver.get(`${BASE_URL}/login`);
  await driver.wait(until.elementLocated(By.css('input[type="email"]')), WAIT);
  await driver.executeScript("window.localStorage.clear()");
  await driver.findElement(By.css('input[type="email"]')).sendKeys(email);
  await driver.findElement(By.css('input[type="password"]')).sendKeys(password);
  await driver.findElement(By.css('button[type="submit"]')).click();
}

// Read the auth token from the browser's localStorage (null if not logged in).
export function getStoredToken(driver) {
  return driver.executeScript("return window.localStorage.getItem('token')");
}

// True if no element on the page currently contains `text`.
export async function isAbsent(driver, text) {
  const els = await driver.findElements(
    By.xpath(`//*[contains(text(),${JSON.stringify(text)})]`),
  );
  return els.length === 0;
}

export { WAIT };
