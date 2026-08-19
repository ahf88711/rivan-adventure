import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("ينشئ صفحة عربية ثابتة بمسارات GitHub Pages الصحيحة", async () => {
  const html = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");
  assert.match(html, /<html[^>]*lang="ar"[^>]*dir="rtl"/i);
  assert.match(html, /<title>مغامرة ريفان \| لعبة سيارات للأطفال<\/title>/);
  assert.match(html, /\/rivan-adventure\/assets\//);
  const manifestHref = html.match(/<link rel="manifest" href="([^"]+)"/)?.[1];
  assert.equal(
    new URL(manifestHref, "https://ahf88711.github.io/rivan-adventure/").pathname,
    "/rivan-adventure/manifest.webmanifest",
  );
  assert.doesNotMatch(html, /rivan-adventure\/rivan-adventure/);
  assert.match(html, /https:\/\/ahf88711\.github\.io\/rivan-adventure\/og\.png/);
  assert.doesNotMatch(html, /chatgpt\.site|openai\.com|signin-with-chatgpt/i);
});

test("يحتوي البناء على ملفات اللعبة وPWA", async () => {
  const manifest = JSON.parse(await readFile(new URL("../dist/manifest.webmanifest", import.meta.url), "utf8"));
  assert.equal(manifest.name, "مغامرة ريفان");
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.start_url, "./");
  assert.equal(manifest.scope, "./");

  await Promise.all([
    access(new URL("../dist/.nojekyll", import.meta.url)),
    access(new URL("../dist/sw.js", import.meta.url)),
    access(new URL("../dist/icon-192.png", import.meta.url)),
    access(new URL("../dist/icon-512.png", import.meta.url)),
    access(new URL("../dist/og.png", import.meta.url)),
  ]);
});

test("لا يعتمد بناء GitHub Pages على خادم أو استضافة OpenAI", async () => {
  await assert.rejects(access(new URL("../.openai/hosting.json", import.meta.url)));
  await assert.rejects(access(new URL("../dist/server/index.js", import.meta.url)));
});
