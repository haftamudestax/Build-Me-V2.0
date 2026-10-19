
import { test, expect } from "@playwright/test";

test.describe("HDY Logo", () => {
  test("logo is visible and accessible on page load", async ({ page }) => {
    await page.goto("/");

    const logo = page.getByRole("link", { name: "Home" });

    await expect(logo).toBeVisible();
    await expect(logo).toHaveAttribute("href", "/");
  });

  test("logo displays the brand name", async ({ page }) => {
    await page.goto("/");

    const logo = page.getByRole("link", { name: "Home" });

    await expect(logo).toBeVisible();
    await expect(logo).toContainText("Haftamu Desta");
  });

  test("logo is keyboard-focusable and activates with Enter", async ({
    page,
  }) => {
    await page.goto("/");

    const logo = page.getByRole("link", { name: "Home" });

    await expect(logo).toBeVisible();

    await logo.focus();
    await expect(logo).toBeFocused();

    await page.keyboard.press("Enter");

    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.getByRole("link", { name: "Home" }),
    ).toBeVisible();
  });

  test("logo remains visible and accessible on a mobile viewport", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/");

    const logo = page.getByRole("link", { name: "Home" });

    await expect(logo).toBeVisible();
    await expect(logo).toHaveAttribute("href", "/");
    await expect(logo).toContainText("Haftamu Desta");
  });

  test("logo remains visible and accessible on a desktop viewport", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");

    const logo = page.getByRole("link", { name: "Home" });

    await expect(logo).toBeVisible();
    await expect(logo).toHaveAttribute("href", "/");
    await expect(logo).toContainText("Haftamu Desta");
  });
});
