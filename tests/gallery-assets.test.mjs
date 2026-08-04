import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(await readFile(path.join(root, "src", "data", "gallery.json"), "utf8"));

function publicAssetPath(url) {
  return path.join(root, "public", ...url.replace(/^\//, "").split("/"));
}

async function assertWebp(url, maximumBytes) {
  const filePath = publicAssetPath(url);
  const fileStat = await stat(filePath);
  const header = await readFile(filePath);
  assert.equal(header.subarray(0, 4).toString("ascii"), "RIFF", `${url} must start with RIFF`);
  assert.equal(header.subarray(8, 12).toString("ascii"), "WEBP", `${url} must be a WebP image`);
  assert.ok(fileStat.size <= maximumBytes, `${url} is unexpectedly large (${fileStat.size} bytes)`);
}

test("gallery manifest contains valid albums, accessible labels and optimized assets", async () => {
  assert.ok(manifest.albums.length >= 5);
  assert.ok(manifest.photos.length >= 12);

  const albumIds = new Set(manifest.albums.map((album) => album.id));
  const photoIds = new Set();

  for (const photo of manifest.photos) {
    assert.ok(albumIds.has(photo.albumId), `${photo.id} references an unknown album`);
    assert.ok(!photoIds.has(photo.id), `${photo.id} is duplicated`);
    photoIds.add(photo.id);
    assert.ok(photo.title.length >= 5);
    assert.ok(photo.alt.length >= 25, `${photo.id} needs a descriptive alt text`);
    assert.ok(photo.thumbWidth > 0 && photo.thumbHeight > 0);
    assert.ok(photo.width > 0 && photo.height > 0);
    await assertWebp(photo.thumbSrc, 120_000);
    await assertWebp(photo.largeSrc, 550_000);
  }
});

test("poster previews and PDFs remain compact and the preview markup is lazy-loaded", async () => {
  const posterNames = ["sokolsky-vylet-2026", "sokolsky-beh-republiky-2026", "letni-tabor-2027"];

  for (const name of posterNames) {
    const preview = await stat(path.join(root, "public", "posters", `${name}.png`));
    const pdf = await stat(path.join(root, "public", "posters", `${name}.pdf`));
    assert.ok(preview.size <= 100_000, `${name}.png should stay below 100 kB`);
    assert.ok(pdf.size <= 200_000, `${name}.pdf should stay below 200 kB`);
  }

  const homePage = await readFile(path.join(root, "src", "pages", "HomePage.tsx"), "utf8");
  assert.match(homePage, /loading="lazy"/);
  assert.match(homePage, /decoding="async"/);
  assert.match(homePage, /width=\{926\}/);
  assert.match(homePage, /height=\{1310\}/);
});
