import fs from "node:fs";
import path from "node:path";
import { createSampleCatalog } from "../src/data/sample-catalog.js";
import {
  addAttribute,
  addCategory,
  addProduct,
  isUninitializedCatalogText,
  removeAttribute,
  removeCategory,
  removeProduct,
  replaceSiteSettings,
  updateAttribute,
  updateCategory,
  updateProduct,
  validateAndNormalizeCatalog,
  createEmptyCatalog,
} from "../src/data/catalog-validation.js";
import { toKebabSlug } from "../src/utils/slugify.js";

const MIME_EXTENSIONS = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
};

let writeQueue = Promise.resolve();

export function withCatalogLock(task) {
  const run = writeQueue.then(task, task);
  writeQueue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

export function atomicWriteCatalog(catalogPath, catalog) {
  fs.mkdirSync(path.dirname(catalogPath), { recursive: true });
  const temporaryPath = `${catalogPath}.tmp`;
  fs.writeFileSync(temporaryPath, `${JSON.stringify(catalog, null, 2)}\n`);
  fs.renameSync(temporaryPath, catalogPath);
}

export function readCatalog(catalogPath) {
  return JSON.parse(fs.readFileSync(catalogPath, "utf8"));
}

export function ensureCatalogFile(catalogPath) {
  fs.mkdirSync(path.dirname(catalogPath), { recursive: true });
  if (!fs.existsSync(catalogPath) || fs.statSync(catalogPath).size === 0) {
    atomicWriteCatalog(catalogPath, createSampleCatalog());
    return;
  }
  if (fs.statSync(catalogPath).size < 4096) {
    const raw = fs.readFileSync(catalogPath, "utf8");
    if (isUninitializedCatalogText(raw)) {
      atomicWriteCatalog(catalogPath, createSampleCatalog());
    }
  }
}

function httpError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

export function mutateCatalog(catalogPath, mutator) {
  return withCatalogLock(() => {
    ensureCatalogFile(catalogPath);
    const current = readCatalog(catalogPath);
    const result = mutator(current);
    if (!result?.ok) {
      throw httpError(result?.errors?.[0] || "Katalog kaydedilemedi", 400);
    }
    result.catalog.version = new Date().toISOString();
    atomicWriteCatalog(catalogPath, result.catalog);
    return result.catalog;
  });
}

export function saveCatalog(catalogPath, catalog) {
  return mutateCatalog(catalogPath, () => validateAndNormalizeCatalog(catalog));
}

export function resetCatalog(catalogPath, mode) {
  return withCatalogLock(() => {
    const next =
      mode === "sample" ? createSampleCatalog() : createEmptyCatalog();
    next.version = new Date().toISOString();
    atomicWriteCatalog(catalogPath, next);
    return next;
  });
}

export const catalogMutations = {
  addCategory,
  updateCategory,
  removeCategory,
  addAttribute,
  updateAttribute,
  removeAttribute,
  addProduct,
  updateProduct,
  removeProduct,
  replaceSiteSettings,
};

export function saveUploadedImage({
  assetsDir,
  productSlug,
  originalName,
  mime,
  buffer,
}) {
  const extension = MIME_EXTENSIONS[String(mime || "").toLowerCase()];
  if (!extension) {
    throw httpError("Desteklenmeyen dosya türü.");
  }
  if (!buffer || buffer.length === 0) {
    throw httpError("Dosya boş.");
  }
  if (buffer.length > 10 * 1024 * 1024) {
    throw httpError("Dosya 10 MB sınırını aşıyor.");
  }
  const slug = toKebabSlug(productSlug);
  if (!slug) {
    throw httpError("Geçersiz ürün klasörü.");
  }
  const directory = path.join(assetsDir, slug);
  fs.mkdirSync(directory, { recursive: true });
  const stem =
    toKebabSlug(path.parse(originalName || "gorsel").name) || "gorsel";
  let filename = `${stem}${extension}`;
  let suffix = 2;
  while (fs.existsSync(path.join(directory, filename))) {
    filename = `${stem}-${suffix}${extension}`;
    suffix += 1;
  }
  fs.writeFileSync(path.join(directory, filename), buffer);
  return `${slug}/${filename}`;
}

export function removeProductAssetDir(assetsDir, productSlug) {
  const slug = toKebabSlug(productSlug);
  if (!slug) return;
  const directory = path.join(assetsDir, slug);
  const root = path.resolve(assetsDir);
  const target = path.resolve(directory);
  if (target !== root && !target.startsWith(`${root}${path.sep}`)) return;
  fs.rmSync(target, { recursive: true, force: true });
}
