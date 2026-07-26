import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const themeScript = await readFile(new URL("../public/theme-init.js", import.meta.url), "utf8");

function initializeTheme({ storedTheme, prefersDark }) {
  const root = { dataset: {}, style: {} };
  const meta = { content: "", setAttribute: (_name, value) => { meta.content = value; } };
  const context = {
    document: {
      documentElement: root,
      getElementById: (id) => id === "theme-color" ? meta : null,
    },
    window: {
      localStorage: { getItem: () => storedTheme },
      matchMedia: () => ({ matches: prefersDark }),
    },
  };

  vm.runInNewContext(themeScript, context);
  return { root, meta };
}

test("stored theme overrides the operating system preference", () => {
  const { root, meta } = initializeTheme({ storedTheme: "dark", prefersDark: false });
  assert.equal(root.dataset.theme, "dark");
  assert.equal(root.style.colorScheme, "dark");
  assert.equal(meta.content, "#0c0f14");
});

test("system theme is used when no valid preference is stored", () => {
  assert.equal(initializeTheme({ storedTheme: null, prefersDark: true }).root.dataset.theme, "dark");
  assert.equal(initializeTheme({ storedTheme: "invalid", prefersDark: false }).root.dataset.theme, "light");
});

test("theme initialization loads before the React application", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.ok(html.indexOf("/theme-init.js") < html.indexOf("/src/main.tsx"));
  assert.match(html, /name="color-scheme" content="light dark"/);
});
