import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL(".", import.meta.url));

function jsAsJsx() {
  return {
    name: "js-as-jsx",
    enforce: "pre",
    async resolveId(source, importer, options) {
      if (source.includes("\0") || source.includes("node_modules")) {
        return null;
      }

      const resolved = await this.resolve(source, importer, {
        ...options,
        skipSelf: true,
      });

      if (!resolved || resolved.external) {
        return resolved;
      }

      const isAppJs =
        !resolved.id.includes("\0") &&
        resolved.id.startsWith(path.join(root, "src")) &&
        resolved.id.endsWith(".js");

      if (isAppJs && !resolved.id.includes("?lang.jsx")) {
        return `${resolved.id}?lang.jsx`;
      }

      return resolved;
    },
  };
}

export default defineConfig({
  plugins: [jsAsJsx(), tailwindcss(), react({ include: /\.(jsx|js)$/ })],
  esbuild: {
    loader: "jsx",
    include: /src\/.*\.jsx?$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        ".js": "jsx",
      },
    },
  },
  resolve: {
    alias: {
      "@": path.join(root, "src"),
    },
  },
  build: {
    assetsDir: "static",
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.js"],
    include: ["src/**/*.test.{js,jsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.{js,jsx}"],
      exclude: ["src/**/*.test.{js,jsx}", "src/main.js"],
    },
  },
});
