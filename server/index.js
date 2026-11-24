import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createCatalogMiddleware } from "./catalog-middleware.js";
import { loadEnvFile } from "./env.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
loadEnvFile(path.join(root, ".env"));

const catalogPath =
  process.env.CATALOG_DATA_PATH ||
  path.join(root, "public", "data", "catalog.json");
const assetsDir =
  process.env.CATALOG_ASSETS_DIR || path.join(root, "public", "assets");
const distDir = path.join(root, "dist");
const port = Number(process.env.PORT || 4173);

if (process.env.NODE_ENV === "production" && !process.env.ADMIN_PASSWORD) {
  console.error(
    "ADMIN_PASSWORD is required in production. Admin login is disabled."
  );
}

const middleware = createCatalogMiddleware({
  catalogPath,
  assetsDir,
  serveStatic: true,
  distDir,
});

const server = http.createServer((req, res) => {
  middleware(req, res, () => {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  });
});

server.listen(port, () => {
  console.log(`Catalog server listening on http://localhost:${port}`);
});
