import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createCatalogMiddleware } from "../../server/catalog-middleware.js";
import { ensureCatalogFile, readCatalog } from "../../server/catalog-store.js";
import { createEmptyCatalog } from "@/data/catalog-validation";

function listen(middleware) {
  const server = http.createServer((req, res) => {
    middleware(req, res, () => {
      res.statusCode = 404;
      res.end("missing");
    });
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

async function request(
  baseUrl,
  pathname,
  { method = "GET", body, cookie, headers = {} } = {}
) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(cookie ? { cookie } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  return { response, json };
}

describe("catalog server", () => {
  let directory;
  let catalogPath;
  let assetsDir;
  let server;
  let baseUrl;
  const originalPassword = process.env.ADMIN_PASSWORD;
  const originalSecret = process.env.ADMIN_SESSION_SECRET;

  beforeEach(async () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "lavabo-catalog-"));
    catalogPath = path.join(directory, "catalog.json");
    assetsDir = path.join(directory, "assets");
    fs.mkdirSync(assetsDir);
    process.env.ADMIN_PASSWORD = "test-pass";
    process.env.ADMIN_SESSION_SECRET = "test-secret";
    server = await listen(
      createCatalogMiddleware({
        catalogPath,
        assetsDir,
        serveStatic: true,
        distDir: directory,
      })
    );
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });

  afterEach(async () => {
    process.env.ADMIN_PASSWORD = originalPassword;
    process.env.ADMIN_SESSION_SECRET = originalSecret;
    await new Promise((resolve) => server.close(resolve));
    fs.rmSync(directory, { recursive: true, force: true });
  });

  it("creates the sample catalog when the file is missing and preserves an empty catalog", async () => {
    ensureCatalogFile(catalogPath);
    const sample = readCatalog(catalogPath);
    expect(sample.products).toHaveLength(3);
    expect(sample.products[0].images[0]).toMatch(
      /^https:\/\/picsum\.photos\/seed\/catalog-sample-1a\//
    );

    const emptyPath = path.join(directory, "empty.json");
    fs.writeFileSync(emptyPath, JSON.stringify(createEmptyCatalog()));
    ensureCatalogFile(emptyPath);
    expect(readCatalog(emptyPath).products).toEqual([]);

    fs.writeFileSync(path.join(directory, "blank.json"), " {} ");
    ensureCatalogFile(path.join(directory, "blank.json"));
    expect(
      readCatalog(path.join(directory, "blank.json")).products
    ).toHaveLength(3);
  });

  it("requires the admin password and then updates the catalog", async () => {
    const denied = await request(baseUrl, "/api/admin/categories", {
      method: "POST",
      body: { name: "Masa" },
    });
    expect(denied.response.status).toBe(401);

    const wrong = await request(baseUrl, "/api/admin/login", {
      method: "POST",
      body: { password: "nope" },
    });
    expect(wrong.response.status).toBe(401);

    const login = await request(baseUrl, "/api/admin/login", {
      method: "POST",
      body: { password: "test-pass" },
    });
    expect(login.response.status).toBe(200);
    const cookie = login.response.headers.get("set-cookie");
    expect(cookie).toMatch(/lavabo_admin_session=/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Strict/i);

    const created = await request(baseUrl, "/api/admin/categories", {
      method: "POST",
      cookie,
      body: { name: "Oturma", slug: "oturma" },
    });
    expect(created.response.status).toBe(200);
    const parent = created.json.categories.find(
      (category) => category.slug === "oturma"
    );
    const child = await request(baseUrl, "/api/admin/categories", {
      method: "POST",
      cookie,
      body: { name: "Sandalye", slug: "sandalye", parentId: parent.id },
    });
    const childId = child.json.categories.find(
      (category) => category.slug === "sandalye"
    ).id;
    const removed = await request(
      baseUrl,
      `/api/admin/categories/${parent.id}`,
      {
        method: "DELETE",
        cookie,
      }
    );
    expect(
      removed.json.categories.find((category) => category.id === childId)
        .parentId
    ).toBeNull();

    const reset = await request(baseUrl, "/api/admin/reset", {
      method: "POST",
      cookie,
      body: { mode: "empty" },
    });
    expect(reset.json.products).toEqual([]);
    expect(reset.json.categories).toEqual([]);
    const reloaded = await request(baseUrl, "/data/catalog.json");
    expect(reloaded.json.products).toEqual([]);
  });

  it("stores an uploaded image under the product slug", async () => {
    const login = await request(baseUrl, "/api/admin/login", {
      method: "POST",
      body: { password: "test-pass" },
    });
    const cookie = login.response.headers.get("set-cookie");
    const boundary = "----lavaboBoundary";
    const payload = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="productSlug"',
      "",
      "ornek urun",
      `--${boundary}`,
      'Content-Disposition: form-data; name="file"; filename="Ana Görsel.png"',
      "Content-Type: image/png",
      "",
      "png-bytes",
      `--${boundary}--`,
      "",
    ].join("\r\n");
    const response = await fetch(`${baseUrl}/api/admin/upload`, {
      method: "POST",
      headers: {
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        cookie,
      },
      body: payload,
    });
    const json = await response.json();
    expect(response.status).toBe(200);
    expect(json.path).toBe("ornek-urun/ana-gorsel.png");
    expect(fs.readFileSync(path.join(assetsDir, json.path), "utf8")).toBe(
      "png-bytes"
    );
  });
});
