/**
 * Production build.
 *
 * Replaced the inline esbuild one-liner in package.json, which did two things
 * wrong and nothing else:
 *
 *   1. It never copied `index.html` into `dist/`, so the built output could
 *      not be served, could not be previewed, and produced an APK that opened
 *      to a blank WebView. Capacitor's `webDir` pointed at a directory with
 *      no entry point.
 *   2. It never copied `public/`, so `logo.png` (referenced by index.html and
 *      the app's splash) was missing.
 *
 * It also hardcoded the output filename in two places, which is how the app.js
 * / app.css pairing drifted out of sync in the past.
 *
 * Output shape (deliberate and stable — see README):
 *   dist/index.html
 *   dist/assets/app.js
 *   dist/assets/app.css
 *   dist/<files from public/>
 */

import { build } from 'esbuild';
import { cp, rm, mkdir, readFile, writeFile, stat, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dist = path.join(root, 'dist');

// Where the app will be served from. Default '/' keeps the APK, `vite preview`
// and Firebase Hosting exactly as they were; GitHub Pages serves this repo at
// /chakkibook/, so CI passes BASE_PATH=/chakkibook/ and every absolute asset
// reference is prefixed. Without this the Pages build loads index.html and then
// 404s on /assets/app-*.js — a white screen that looks like an app bug.
const basePath = (() => {
  const raw = process.env.BASE_PATH || '/';
  if (!raw.startsWith('/')) throw new Error(`BASE_PATH must start with '/', got ${raw}`);
  return raw.endsWith('/') ? raw : `${raw}/`;
})();

const t0 = Date.now();

await rm(dist, { recursive: true, force: true });
await mkdir(path.join(dist, 'assets'), { recursive: true });

// 1. Bundle the app. The env stubs keep the bundle browser-safe and match the
//    original build's intent: real env reads would embed build-time values.
await build({
  entryPoints: [path.join(root, 'src/main.jsx')],
  bundle: true,
  format: 'esm',
  // Content-hashed filename. Without it, a new release ships an app.js the
  // client already has cached under a 1-year max-age, and every web user keeps
  // running the previous release until the cache expires. The Capacitor APK is
  // unaffected (assets are bundled at build time), but the hosted build and any
  // OTA update path were silently serving stale code.
  entryNames: 'assets/app-[hash]',
  outbase: path.join(root, 'src'),
  outdir: dist,
  loader: { '.jsx': 'jsx', '.js': 'jsx' },
  define: {
    'process.env.NODE_ENV': '"production"',
    'import.meta.env': '{}'
  },
  minify: true,
  sourcemap: false,
  target: ['es2020'],
  logLevel: 'silent'
});

// The entry imports its own stylesheet (src/main.jsx does `import './index.css'`),
// so esbuild emits a hashed CSS file next to the JS. Copying it separately would
// produce a second, divergent stylesheet — which is exactly how the old build's
// app.js / app.css pairing drifted.
const jsName = (await readdir(path.join(dist, 'assets')))
  .find((f) => /^app-[A-Za-z0-9]+\.js$/.test(f));
if (!jsName) throw new Error('esbuild did not produce a hashed app.js');

const cssName = (await readdir(path.join(dist, 'assets')))
  .find((f) => /^app-[A-Za-z0-9]+\.css$/.test(f));
if (!cssName) throw new Error(`esbuild did not emit a CSS bundle for ${jsName}`);

// 3. Entry point. Rewritten to the built assets — the source index.html points
//    at /src/main.jsx, which is only meaningful to `vite dev`. Make the failure
//    loud rather than emitting an HTML that references a file we never built.
const html = await readFile(path.join(root, 'index.html'), 'utf8');
const replaced = html.replace('/src/main.jsx', `${basePath}assets/${jsName}`);
if (replaced === html) {
  throw new Error('index.html does not reference /src/main.jsx — the asset rewrite is a no-op');
}
// index.html also links /logo.png absolutely (favicon + apple-touch-icon).
const withIcons = replaced.replaceAll('"/logo.png"', `"${basePath}logo.png"`);
const fixed = withIcons.concat(
  `<link rel="stylesheet" href="${basePath}assets/${cssName}" />\n`,
);
await writeFile(path.join(dist, 'index.html'), fixed, 'utf8');

// 3b. The bundle carries one absolute asset path of its own — AppBar renders
//     <img src="/logo.png">. A subpath deploy needs it prefixed too, and the
//     rewrite is asserted so a refactor that changes the string fails the build
//     instead of shipping a broken image.
if (basePath !== '/') {
  const jsPath = path.join(dist, 'assets', jsName);
  const js = await readFile(jsPath, 'utf8');
  const patched = js.replaceAll('"/logo.png"', `"${basePath}logo.png"`);
  if (patched === js) {
    throw new Error('bundle has no "/logo.png" reference — BASE_PATH rewrite is a no-op');
  }
  await writeFile(jsPath, patched, 'utf8');
}

// 4. Static assets (logo, icons).
const pub = path.join(root, 'public');
try {
  const s = await stat(pub);
  if (s.isDirectory()) await cp(pub, dist, { recursive: true });
} catch (_) { /* no public dir is fine */ }

// 5. Report.
const jsSize = (await stat(path.join(dist, 'assets', jsName))).size;
const cssSize = (await stat(path.join(dist, 'assets', cssName))).size;
const htmlSize = (await stat(path.join(dist, 'index.html'))).size;
const kb = (n) => `${(n / 1024).toFixed(1)} kb`;

console.log(`build ok in ${Date.now() - t0}ms  (base ${basePath})`);
console.log(`  dist/index.html         ${kb(htmlSize)}`);
console.log(`  dist/assets/${jsName.padEnd(16)} ${kb(jsSize)}`);
console.log(`  dist/assets/${cssName.padEnd(16)} ${kb(cssSize)}`);
console.log(`  gzip (approx)           ${kb(jsSize * 0.32 + cssSize * 0.22)}`);
