import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(await readFile(path.join(root, "src", "data", "gallery.json"), "utf8"));
const posterManifest = JSON.parse(await readFile(path.join(root, "src", "data", "posters.json"), "utf8"));
const exercises = JSON.parse(await readFile(path.join(root, "src", "data", "exercises.json"), "utf8"));

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

test("poster manifest uses optimized previews and preserved local originals", async () => {
  assert.equal(posterManifest.length, 12);
  assert.equal(posterManifest.filter((poster) => poster.featured).length, 0);
  const ids = new Set();

  for (const poster of posterManifest) {
    assert.ok(!ids.has(poster.id), `${poster.id} is duplicated`);
    ids.add(poster.id);
    assert.ok(poster.title.length >= 5);
    assert.ok(poster.description.length >= 35);
    assert.ok(poster.previewUrl.endsWith(".webp"));
    assert.ok(poster.downloadUrl.endsWith(".jpg"));
    assert.ok(poster.width > 0 && poster.height > 0);
    await assertWebp(poster.previewUrl, 120_000);
    const original = await stat(publicAssetPath(poster.downloadUrl));
    assert.ok(original.size <= 800_000, `${poster.downloadUrl} is unexpectedly large`);
  }

  const posterGallery = await readFile(path.join(root, "src", "components", "PosterGallery.tsx"), "utf8");
  assert.match(posterGallery, /loading="lazy"/);
  assert.match(posterGallery, /decoding="async"/);
});

test("2026/2027 exercise schedule has verified sources, valid times and optimized original posters", async () => {
  assert.equal(exercises.season, "2026/2027");
  assert.equal(exercises.courses.length, 15);
  assert.equal(new Set(exercises.courses.map((course) => course.id)).size, 15);
  assert.equal(exercises.courses.flatMap((course) => course.sessions).length, 17);
  for (const course of exercises.courses) {
    assert.match(course.sourceUrl, /^https:\/\/www\.facebook\.com\/photo\/\?fbid=\d+$/);
    assert.ok(course.coaches.length > 0);
    assert.ok(course.coaches.some((coach) => /^\d{3} \d{3} \d{3}$/.test(coach.phone)));
    for (const session of course.sessions) {
      assert.ok(session.day >= 1 && session.day <= 5);
      assert.match(session.start, /^([01]\d|2[0-3]):[0-5]\d$/);
      assert.match(session.end, /^([01]\d|2[0-3]):[0-5]\d$/);
      assert.ok(session.start < session.end);
    }
    await assertWebp(course.poster.previewUrl, 150_000);
    const original = await readFile(publicAssetPath(course.poster.downloadUrl));
    assert.equal(original.subarray(0, 3).toString("hex"), "ffd8ff");
    assert.ok(original.length < 800_000);
  }
  const florbal = exercises.courses.find((course) => course.id === "florbal");
  assert.deepEqual(florbal.sessions, [{ day: 1, start: "17:30", end: "18:30" }]);
  assert.equal(florbal.coaches[0].name, "Matěj Řehák");
  assert.equal(exercises.courses.find((course) => course.id === "atletika").place, null);
});

test("official display and body fonts are valid compact local WOFF2 assets", async () => {
  for (const name of ["SokolTyrs-Regular.woff2", "work-sans-latin.woff2", "work-sans-latin-ext.woff2"]) {
    const bytes = await readFile(publicAssetPath(`/fonts/${name}`));
    assert.equal(bytes.subarray(0, 4).toString("ascii"), "wOF2");
    assert.ok(bytes.length < 150_000);
  }
  const css = await readFile(path.join(root, "src/styles.css"), "utf8");
  assert.match(css, /--font-display: "Sokol Tyrs"/);
  assert.match(css, /--font-body: "Work Sans"/);
  assert.doesNotMatch(css, /https:\/\/fonts\./);
});
