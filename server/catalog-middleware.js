import fs from "node:fs";
import path from "node:path";
import {
  ADMIN_COOKIE_NAME,
  clearSessionCookie,
  createSessionToken,
  getAdminPassword,
  parseCookies,
  passwordsMatch,
  sessionCookie,
  verifySessionToken,
} from "./auth.js";
import {
  catalogMutations,
  ensureCatalogFile,
  mutateCatalog,
  readCatalog,
  removeProductAssetDir,
  resetCatalog,
  saveCatalog,
  saveUploadedImage,
} from "./catalog-store.js";

const FILE_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

function sendJson(res, status, payload, extraHeaders = {}) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(body),
    ...extraHeaders,
  });
  res.end(body);
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > limit) {
        const error = new Error("İstek çok büyük.");
        error.status = 413;
        reject(error);
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

async function readJson(req) {
  const buffer = await readBody(req, 32 * 1024 * 1024);
  if (buffer.length === 0) return {};
  try {
    return JSON.parse(buffer.toString("utf8"));
  } catch {
    const error = new Error("Geçersiz JSON.");
    error.status = 400;
    throw error;
  }
}

export function parseMultipart(buffer, contentType) {
  const match = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType || "");
  if (!match) {
    const error = new Error("Geçersiz form verisi.");
    error.status = 400;
    throw error;
  }
  const boundary = Buffer.from(`--${match[1] || match[2]}`);
  const fields = {};
  const files = [];
  const parts = [];
  let cursor = 0;
  let found = buffer.indexOf(boundary, cursor);
  while (found !== -1) {
    if (found > cursor) parts.push(buffer.subarray(cursor, found));
    cursor = found + boundary.length;
    found = buffer.indexOf(boundary, cursor);
  }
  if (cursor < buffer.length) parts.push(buffer.subarray(cursor));

  for (const part of parts) {
    let chunk = part;
    if (chunk.length >= 2 && chunk[0] === 13 && chunk[1] === 10) {
      chunk = chunk.subarray(2);
    }
    if (chunk.length === 0 || chunk[0] === 45) continue;
    const separator = Buffer.from("\r\n\r\n");
    const headerEnd = chunk.indexOf(separator);
    if (headerEnd === -1) continue;
    const headerText = chunk.subarray(0, headerEnd).toString("utf8");
    let body = chunk.subarray(headerEnd + separator.length);
    if (
      body.length >= 2 &&
      body[body.length - 2] === 13 &&
      body[body.length - 1] === 10
    ) {
      body = body.subarray(0, body.length - 2);
    }
    const nameMatch = /name="([^"]+)"/i.exec(headerText);
    if (!nameMatch) continue;
    const filenameMatch = /filename="([^"]*)"/i.exec(headerText);
    const typeMatch = /content-type:\s*([^\r\n]+)/i.exec(headerText);
    if (filenameMatch) {
      files.push({
        field: nameMatch[1],
        filename: filenameMatch[1],
        mime: (typeMatch?.[1] || "").trim().toLowerCase(),
        buffer: Buffer.from(body),
      });
    } else {
      fields[nameMatch[1]] = body.toString("utf8");
    }
  }
  return { fields, files };
}

function isAuthenticated(req) {
  const cookies = parseCookies(req.headers.cookie);
  return verifySessionToken(cookies[ADMIN_COOKIE_NAME]);
}

function requireAuth(req) {
  if (!isAuthenticated(req)) {
    const error = new Error("Oturum açmanız gerekiyor.");
    error.status = 401;
    throw error;
  }
}

function contentTypeFor(filePath) {
  return (
    FILE_TYPES[path.extname(filePath).toLowerCase()] ||
    "application/octet-stream"
  );
}

function safeResolve(rootDir, requestPath) {
  const root = path.resolve(rootDir);
  const target = path.resolve(root, requestPath);
  if (target !== root && !target.startsWith(`${root}${path.sep}`)) return null;
  return target;
}

function sendFile(res, filePath, headers = {}) {
  const stat = fs.statSync(filePath);
  res.writeHead(200, {
    "Content-Type": contentTypeFor(filePath),
    "Content-Length": stat.size,
    ...headers,
  });
  fs.createReadStream(filePath).pipe(res);
}

async function handleAdminRequest(
  req,
  res,
  { catalogPath, assetsDir, pathname }
) {
  if (req.method === "GET" && pathname === "/api/admin/session") {
    sendJson(res, 200, { authenticated: isAuthenticated(req) });
    return;
  }

  if (req.method === "POST" && pathname === "/api/admin/login") {
    const body = await readJson(req);
    const password = getAdminPassword();
    if (!password) {
      sendJson(res, 503, { error: "Yönetici parolası yapılandırılmamış." });
      return;
    }
    if (!passwordsMatch(body.password, password)) {
      sendJson(res, 401, { error: "Parola hatalı." });
      return;
    }
    sendJson(
      res,
      200,
      { ok: true },
      { "Set-Cookie": sessionCookie(createSessionToken()) }
    );
    return;
  }

  if (req.method === "POST" && pathname === "/api/admin/logout") {
    sendJson(res, 200, { ok: true }, { "Set-Cookie": clearSessionCookie() });
    return;
  }

  requireAuth(req);

  if (req.method === "GET" && pathname === "/api/admin/catalog") {
    ensureCatalogFile(catalogPath);
    sendJson(res, 200, readCatalog(catalogPath));
    return;
  }

  if (req.method === "PUT" && pathname === "/api/admin/catalog") {
    const body = await readJson(req);
    sendJson(res, 200, await saveCatalog(catalogPath, body));
    return;
  }

  if (req.method === "PUT" && pathname === "/api/admin/site-settings") {
    const body = await readJson(req);
    const catalog = await mutateCatalog(catalogPath, (current) =>
      catalogMutations.replaceSiteSettings(current, body)
    );
    sendJson(res, 200, catalog);
    return;
  }

  if (req.method === "POST" && pathname === "/api/admin/reset") {
    const body = await readJson(req);
    const mode = body.mode === "sample" ? "sample" : "empty";
    sendJson(res, 200, await resetCatalog(catalogPath, mode));
    return;
  }

  if (req.method === "POST" && pathname === "/api/admin/categories") {
    const body = await readJson(req);
    sendJson(
      res,
      200,
      await mutateCatalog(catalogPath, (current) =>
        catalogMutations.addCategory(current, body)
      )
    );
    return;
  }

  let match = pathname.match(/^\/api\/admin\/categories\/(\d+)$/);
  if (match && (req.method === "PUT" || req.method === "DELETE")) {
    const id = Number(match[1]);
    if (req.method === "DELETE") {
      sendJson(
        res,
        200,
        await mutateCatalog(catalogPath, (current) =>
          catalogMutations.removeCategory(current, id)
        )
      );
      return;
    }
    const body = await readJson(req);
    sendJson(
      res,
      200,
      await mutateCatalog(catalogPath, (current) =>
        catalogMutations.updateCategory(current, id, body)
      )
    );
    return;
  }

  if (req.method === "POST" && pathname === "/api/admin/attributes") {
    const body = await readJson(req);
    sendJson(
      res,
      200,
      await mutateCatalog(catalogPath, (current) =>
        catalogMutations.addAttribute(current, body)
      )
    );
    return;
  }

  match = pathname.match(/^\/api\/admin\/attributes\/([^/]+)$/);
  if (match && (req.method === "PUT" || req.method === "DELETE")) {
    const slug = decodeURIComponent(match[1]);
    if (req.method === "DELETE") {
      sendJson(
        res,
        200,
        await mutateCatalog(catalogPath, (current) =>
          catalogMutations.removeAttribute(current, slug)
        )
      );
      return;
    }
    const body = await readJson(req);
    sendJson(
      res,
      200,
      await mutateCatalog(catalogPath, (current) =>
        catalogMutations.updateAttribute(current, slug, body)
      )
    );
    return;
  }

  if (req.method === "POST" && pathname === "/api/admin/products") {
    const body = await readJson(req);
    sendJson(
      res,
      200,
      await mutateCatalog(catalogPath, (current) =>
        catalogMutations.addProduct(current, body)
      )
    );
    return;
  }

  match = pathname.match(/^\/api\/admin\/products\/(\d+)$/);
  if (match && (req.method === "PUT" || req.method === "DELETE")) {
    const id = Number(match[1]);
    if (req.method === "DELETE") {
      ensureCatalogFile(catalogPath);
      const existing = readCatalog(catalogPath).products?.find(
        (product) => product.id === id
      );
      const catalog = await mutateCatalog(catalogPath, (current) =>
        catalogMutations.removeProduct(current, id)
      );
      if (existing?.slug) removeProductAssetDir(assetsDir, existing.slug);
      sendJson(res, 200, catalog);
      return;
    }
    const body = await readJson(req);
    sendJson(
      res,
      200,
      await mutateCatalog(catalogPath, (current) =>
        catalogMutations.updateProduct(current, id, body)
      )
    );
    return;
  }

  if (req.method === "POST" && pathname === "/api/admin/upload") {
    const buffer = await readBody(req, 12 * 1024 * 1024);
    const parsed = parseMultipart(buffer, req.headers["content-type"]);
    const file =
      parsed.files.find((item) => item.field === "file") || parsed.files[0];
    if (!file) {
      sendJson(res, 400, { error: "Dosya gerekli." });
      return;
    }
    const storedPath = saveUploadedImage({
      assetsDir,
      productSlug: parsed.fields.productSlug,
      originalName: file.filename,
      mime: file.mime,
      buffer: file.buffer,
    });
    sendJson(res, 200, { path: storedPath });
    return;
  }

  sendJson(res, 404, { error: "Bulunamadı." });
}

export function createCatalogMiddleware(options) {
  const {
    catalogPath,
    assetsDir,
    serveStatic = false,
    distDir = null,
  } = options;

  return function catalogMiddleware(req, res, next) {
    const requestUrl = new URL(req.url || "/", "http://localhost");
    const pathname = decodeURIComponent(requestUrl.pathname);

    if (pathname === "/data/catalog.json" && req.method === "GET") {
      try {
        ensureCatalogFile(catalogPath);
      } catch (error) {
        sendJson(res, 500, {
          error: error.message || "Katalog oluşturulamadı.",
        });
        return;
      }
      if (!serveStatic) {
        next();
        return;
      }
      sendFile(res, catalogPath, { "Cache-Control": "no-cache" });
      return;
    }

    if (pathname.startsWith("/api/admin")) {
      handleAdminRequest(req, res, { catalogPath, assetsDir, pathname }).catch(
        (error) => {
          if (res.headersSent) return;
          sendJson(res, error.status || 500, {
            error: error.message || "Sunucu hatası.",
          });
        }
      );
      return;
    }

    if (serveStatic && pathname.startsWith("/assets/")) {
      const relative = pathname.slice("/assets/".length);
      const publicFile = safeResolve(assetsDir, relative);
      if (
        publicFile &&
        fs.existsSync(publicFile) &&
        fs.statSync(publicFile).isFile()
      ) {
        sendFile(res, publicFile);
        return;
      }
      if (distDir) {
        const distFile = safeResolve(distDir, pathname.slice(1));
        if (
          distFile &&
          fs.existsSync(distFile) &&
          fs.statSync(distFile).isFile()
        ) {
          sendFile(res, distFile);
          return;
        }
      }
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }

    if (serveStatic && distDir && req.method === "GET") {
      const relative = pathname.replace(/^\/+/, "");
      if (relative) {
        const file = safeResolve(distDir, relative);
        if (file && fs.existsSync(file) && fs.statSync(file).isFile()) {
          sendFile(res, file);
          return;
        }
      }
      const indexFile = path.join(distDir, "index.html");
      if (fs.existsSync(indexFile)) {
        sendFile(res, indexFile);
        return;
      }
    }

    next();
  };
}
