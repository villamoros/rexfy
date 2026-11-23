import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const apiURL = process.env.API_URL ?? "http://localhost:8000";

test("portada pública responde y no tiene violaciones Axe", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/RexFy/);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: /lo que a tu empresa le sobra/i,
    }),
  ).toBeVisible();
  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);
});

test("marketplace público funciona con teclado y sin violaciones Axe", async ({
  page,
}) => {
  await page.goto("/marketplace");
  const search = page.getByRole("searchbox", { name: "Buscar" });
  await search.focus();
  await search.fill("PET");
  await search.press("Tab");
  await expect(page.locator(":focus")).toBeVisible();
  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);
});

test("health público confirma que la API está viva", async ({ request }) => {
  const response = await request.get(`${apiURL}/health`);
  expect(response.ok()).toBe(true);
  await expect(response.json()).resolves.toEqual({ status: "ok" });
});
