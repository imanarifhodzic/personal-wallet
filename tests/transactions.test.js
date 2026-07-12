// Transaction CRUD flow. Requires BOTH servers running:
//   Terminal 1: npm run server   (API on port 3000)
//   Terminal 2: npm run dev      (Vite on port 5173)
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { By, until } from "selenium-webdriver";
import { buildDriver } from "./driver.js";
import { registerUser, addTransaction, clickRowAction, replaceInput, isAbsent, WAIT } from "./helpers.js";

let driver;

before(async () => {
  driver = buildDriver();
  // Fresh user so the transaction list starts empty.
  await registerUser(driver);
});

after(async () => {
  await driver?.quit();
});

test("adding a transaction shows it in the list", async () => {
  const description = `Groceries ${Date.now()}`;
  await addTransaction(driver, {
    amount: "42.50",
    description,
    date: "2026-07-10",
  });

  // The new transaction appears in the list, identified by its unique description.
  const row = await driver.wait(
    until.elementLocated(By.xpath(`//*[contains(text(),${JSON.stringify(description)})]`)),
    WAIT,
  );
  assert.ok(await row.isDisplayed());
});

test("editing a transaction updates its description", async () => {
  const original = `Coffee ${Date.now()}`;
  const updated = `${original} EDITED`;
  await addTransaction(driver, { amount: "5.00", description: original, date: "2026-07-10" });
  await driver.wait(
    until.elementLocated(By.xpath(`//*[contains(text(),${JSON.stringify(original)})]`)),
    WAIT,
  );

  // Open the row's edit form and replace the description.
  await clickRowAction(driver, original, "Edit");
  await driver.wait(until.elementLocated(By.css('input[name="description"]')), WAIT);
  await replaceInput(driver, 'input[name="description"]', updated);
  await driver.findElement(By.xpath("//button[text()='Save changes']")).click();

  // The updated text appears.
  const row = await driver.wait(
    until.elementLocated(By.xpath(`//*[contains(text(),${JSON.stringify(updated)})]`)),
    WAIT,
  );
  assert.ok(await row.isDisplayed());
});

test("deleting a transaction removes it from the list", async () => {
  const description = `ToDelete ${Date.now()}`;
  await addTransaction(driver, { amount: "9.99", description, date: "2026-07-10" });
  await driver.wait(
    until.elementLocated(By.xpath(`//*[contains(text(),${JSON.stringify(description)})]`)),
    WAIT,
  );

  await clickRowAction(driver, description, "Delete");
  // Confirm the native window.confirm() dialog.
  await driver.wait(until.alertIsPresent(), WAIT);
  await driver.switchTo().alert().accept();

  // The row is gone.
  await driver.wait(async () => isAbsent(driver, description), WAIT);
  assert.ok(await isAbsent(driver, description));
});
