import { execFileSync } from "node:child_process";

import { createClerkClient } from "@clerk/backend";
import { clerk } from "@clerk/testing/playwright";
import { expect, test, type Browser, type Page } from "@playwright/test";

/**
 * Serial domain tests share one commercial transaction. A failure is reported against
 * auth, publishing, negotiation, logistics or trust instead of one monolithic test.
 *
 * Runs against a Clerk development instance (see README). Each run makes its own users,
 * which are deleted from Clerk at the end, and unique companies, so runs never collide.
 */

let run = "";
const clerkBackend = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});
const clerkUserIds: string[] = [];

// DIAN weights, right to left; mirrors apps/api/app/domain/organizations/nit.py.
const NIT_WEIGHTS = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];

function nit(base: string): string {
  const total = [...base]
    .reverse()
    .reduce((sum, digit, i) => sum + Number(digit) * NIT_WEIGHTS[i], 0);
  const remainder = total % 11;
  return `${base}-${remainder < 2 ? remainder : 11 - remainder}`;
}

function inDays(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
}

/** A new Clerk user, signed in on its own browser context. */
async function signedIn(browser: Browser, name: string) {
  const email = `e2e-${run}-${name}+clerk_test@example.com`;
  const user = await clerkBackend.users.createUser({
    emailAddress: [email],
    firstName: name,
    lastName: "E2E",
    skipPasswordRequirement: true,
  });
  clerkUserIds.push(user.id);
  const page = await (await browser.newContext()).newPage();
  await page.goto("/");
  await clerk.signIn({ page, emailAddress: email });
  return { page, email };
}

async function registerCompany(
  page: Page,
  { name, role, nitBase }: { name: string; role: string; nitBase: string },
) {
  await page.goto("/onboarding");
  await page.getByLabel("Razón social").fill(name);
  await page.getByLabel("NIT").fill(nit(nitBase));
  await page.getByLabel("Ciudad", { exact: true }).fill("Cali");
  await page.getByRole("checkbox", { name: new RegExp(`^${role}`) }).check();
  await page.getByRole("button", { name: "Registrar empresa" }).click();
  await expect(page).toHaveURL(/\/panel/);
}

test.describe.serial("journey comercial por dominio", () => {
  let seller: Page;
  let buyer: Page;
  let carrier: Page;
  let sellerName: string;
  let buyerName: string;
  let carrierName: string;
  let pickupAddress: string;
  let requirements: string;
  let listingPath = "";
  let threadPath = "";
  let orderPath = "";

  test.beforeAll(async ({ browser }, testInfo) => {
    run = `${Date.now().toString().slice(-7)}${testInfo.project.name.endsWith("mobile") ? "1" : "0"}`;
    sellerName = `Plásticos E2E ${run} SAS`;
    buyerName = `Transformadora E2E ${run} SAS`;
    carrierName = `Fletes E2E ${run} SAS`;
    pickupAddress = `Calle ${run} # 5-20`;
    requirements = `Viaje E2E ${run}`;
    seller = (await signedIn(browser, "generador")).page;
    buyer = (await signedIn(browser, "comprador")).page;
    carrier = (await signedIn(browser, "transportador")).page;
  });

  test.afterAll(async () => {
    await Promise.all(
      clerkUserIds.map((id) => clerkBackend.users.deleteUser(id)),
    );
  });

  test("auth y empresas: registra roles y verifica transportador", async ({
    browser,
  }) => {
    await test.step("cada empresa se registra con su rol", async () => {
    await registerCompany(seller, {
      name: sellerName,
      role: "Generador",
      nitBase: `${run}1`,
    });
    await registerCompany(buyer, {
      name: buyerName,
      role: "Comprador",
      nitBase: `${run}2`,
    });
    await registerCompany(carrier, {
      name: carrierName,
      role: "Transportista",
      nitBase: `${run}3`,
    });
    });

    await test.step("un transportador sin verificar no ve solicitudes", async () => {
      await carrier.goto("/transporte");
      await expect(carrier.getByText(/RexFy la revisará pronto/)).toBeVisible();
    });

    await test.step("RexFy verifica al transportador", async () => {
    const { page: admin, email } = await signedIn(browser, "admin");
    // The first signed-in page creates the user in RexFy; then it gets admin access.
    await admin.goto("/panel");
    await admin.waitForURL(/\/(panel|onboarding)/);
    execFileSync("uv", ["run", "python", "-m", "app.cli.admin", email], {
      cwd: "../api",
      stdio: "inherit",
    });
    await admin.goto("/admin");
    const company = admin
      .getByRole("listitem")
      .filter({ hasText: carrierName });
    await company.getByRole("button", { name: "Verificar" }).click();
    await expect(
      company.getByRole("button", { name: "Quitar verificación" }),
    ).toBeVisible();
    });
  });

  test("publicación: el generador publica material", async () => {
    await seller.goto("/publicar");
    const next = seller.getByRole("button", { name: "Siguiente →" });
    await seller
      .getByLabel("Título de la publicación")
      .fill(`PET post-industrial E2E ${run}`);
    await next.click();
    await seller.getByLabel("Cantidad disponible").fill("10");
    await next.click();
    await seller.getByLabel("Ciudad / municipio").fill("Cali");
    await next.click();
    await seller.getByLabel("Precio por unidad (COP)").fill("800");
    await next.click();
    await seller.getByRole("button", { name: "Publicar", exact: true }).click();
    await expect(seller).toHaveURL(/\/publicaciones\/[\w-]+\?nueva=1/);
    listingPath = new URL(seller.url()).pathname;
  });

  test("negociación: cotiza y crea una orden", async () => {
    await test.step("el comprador escribe y envía una cotización formal", async () => {
    await buyer.goto(listingPath);
    await buyer.getByRole("button", { name: "Contactar al generador" }).click();
    await expect(buyer).toHaveURL(/\/mensajes\/[\w-]+$/);
    threadPath = new URL(buyer.url()).pathname;
    await buyer
      .locator("summary", { hasText: "Enviar cotización formal" })
      .click();
    await buyer
      .locator("form", { has: buyer.locator('[name="valid_hours"]') })
      .getByRole("button", { name: "Enviar cotización formal" })
      .click();
    await expect(buyer.getByText(/Válida hasta el/)).toBeVisible();
    });

    await test.step("el generador acepta y se crea la orden", async () => {
      await seller.goto(threadPath);
      await seller.getByRole("button", { name: "Aceptar", exact: true }).click();
      await expect(seller).toHaveURL(/\/ordenes\/[\w-]+\?nueva=1/);
      orderPath = new URL(seller.url()).pathname;
    });
  });

  test("logística: solicita, cotiza y entrega transporte", async () => {
    await test.step("el comprador pide transporte", async () => {
    await buyer.goto(orderPath);
    await buyer.getByLabel("Dirección de recogida").fill(pickupAddress);
    await buyer.getByLabel("Ciudad de entrega").fill("Bogotá");
    await buyer.getByLabel("Dirección de entrega").fill("Carrera 7 # 30-10");
    await buyer.getByLabel("Fecha de recogida").fill(inDays(2));
    await buyer
      .getByLabel("Requisitos especiales (opcional)")
      .fill(requirements);
    const request = buyer.getByRole("button", {
      name: "Solicitar cotizaciones de transporte",
    });
    await request.click();
    await expect(request).toBeHidden();
    });

    await test.step("el transportador verificado cotiza el viaje", async () => {
    await carrier.goto("/transporte");
    const trip = carrier
      .getByRole("listitem")
      .filter({ hasText: requirements });
    await trip.locator("summary", { hasText: "Cotizar este viaje" }).click();
    await trip.getByLabel("Precio total (COP)").fill("1200000");
    await trip.getByRole("button", { name: "Enviar cotización" }).click();
    await expect(trip.getByText(/Ya cotizaste/)).toBeVisible();
    });

    await test.step("el comprador acepta la cotización de transporte", async () => {
    await buyer.goto(orderPath);
    const accept = buyer.getByRole("button", { name: /^Aceptar/ });
    await accept.click();
    await expect(accept).toBeHidden();
    });

    await test.step("el transportador recoge, lleva y entrega", async () => {
    await carrier.goto("/transporte");
    const trip = carrier
      .getByRole("listitem")
      .filter({ hasText: pickupAddress });
    for (const action of [
      "Confirmar recogida",
      "Marcar en ruta",
      "Confirmar entrega",
    ]) {
      await trip.getByRole("button", { name: action }).click();
      await expect(trip.getByRole("button", { name: action })).toBeHidden();
    }
    });
  });

  test("trust: confirma la recepción y califica", async () => {
    await buyer.goto(orderPath);
    await buyer
      .getByRole("button", { name: "Confirmar recepción del material" })
      .click();
    await buyer.locator('label:has(input[name="rating"][value="5"])').click();
    const send = buyer.getByRole("button", { name: "Enviar calificación" });
    await send.click();
    await expect(send).toBeHidden();
  });
});
