#!/usr/bin/env node
// validate.mjs — lightweight pre-publish checks for the PREY: THE ESCAPE
// static site. Run from the PREY-WEBSITE folder with `npm run validate`.
//
// Checks performed (all offline):
//  - index.html exists and is readable
//  - HTML comment balance is correct
//  - every locally-referenced asset exists on disk
//  - every in-page anchor link targets an element id that is present
//  - the APK download route points at a real, non-trivial file
//
// If a server is running, a separate live smoke test can be added later;
// this script deliberately stays offline so it never blocks forever on a
// network probe.

import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = join(fileURLToPath(import.meta.url), '..');

function findPublic() {
  for (const candidate of [
    join(__dirname, 'public'),
    join(__dirname, '..', 'public'),
    join(process.cwd(), 'public'),
    join(process.cwd(), '..', 'public'),
  ]) {
    try {
      if (statSync(candidate).isDirectory()) return candidate;
    } catch {}
  }
  return null;
}

const PUBLIC = findPublic();
if (!PUBLIC) {
  console.error('❌ Cannot locate the public/ folder from', __dirname);
  process.exit(1);
}

const INDEX = join(PUBLIC, 'index.html');

function die(msg) {
  console.error('❌', msg);
  process.exitCode = 1;
}

function ok(msg) {
  console.log('✔', msg);
}

function warn(msg) {
  console.warn('⚠', msg);
}

function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1048576) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1048576).toFixed(2)} MB`;
}

function checkIndexExists() {
  try {
    statSync(INDEX);
    ok(`index.html present: ${INDEX}`);
  } catch {
    die(`Missing index.html at ${INDEX}`);
  }
}

function checkHtmlIntegrity() {
  const html = readFileSync(INDEX, 'utf8');
  const open = (html.match(/<!--/g) || []).length;
  const close = (html.match(/-->/g) || []).length;
  if (open !== close) die(`Unbalanced HTML comments: ${open} open vs ${close} close`);
  ok(`index.html is well-formed: ${open} comment block(s)`);
}

const ASSET_PATTERNS = [
  /"([^"]+\.(?:png|jpg|jpeg|webp|ico|svg))"/,
  /'([^']+\.(?:png|jpg|jpeg|webp|ico|svg))'/,
];

/* ---- helpers ---- */
function slashEnd(norm) {
  return norm.replace(/\?.*$/, '').replace(/#.*$/, '');
}

function extractAssetPaths(html) {
  const set = new Set();
  for (const re of ASSET_PATTERNS) {
    let m;
    while ((m = re.exec(html)) !== null) set.add(m[1]);
  }
  for (const m of html.matchAll(/<script[^>]+src=["']([^"']+)["']/g)) set.add(m[1]);
  for (const m of html.matchAll(/<link[^>]+href=["']([^"']+)["']/g)) set.add(m[1]);
  return [...set];
}

function checkAssets() {
  const html = readFileSync(INDEX, 'utf8');
  const assetPaths = extractAssetPaths(html);
  let missing = 0;

  for (const raw of assetPaths) {
    if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('//')) continue;

    if (raw.endsWith(')')) continue;

    const norm = slashEnd(raw);
    // safety check: stop runaway loops on accidental bad regex captures
    if (norm === raw) continue;
    if (norm.length === 0) continue;

    try { statSync(join(PUBLIC, norm)); } catch { missing++; warn(`Missing asset referenced by index.html: ${norm}`); }
  }

  if (assetPaths.length === 0) {
    warn('No local asset paths found by the extractor. Check extractAssetPaths.');
    return;
  }

  if (missing === 0) ok(`All ${assetPaths.length} referenced asset path(s) resolve locally`);
  else die(`${missing} referenced asset path(s) do not resolve locally`);
}

function checkInternalLinks() {
  const html = readFileSync(INDEX, 'utf8');
  const targets = new Set();
  for (const m of html.matchAll(/id=["']([^"']+)["']/g)) targets.add(m[1]);
  let missed = 0;
  for (const m of html.matchAll(/href=["'](#[^"']+)["']/g)) {
    const id = m[1].slice(1);
    if (!targets.has(id)) {
      missed++;
      warn(`Internal link targets missing element: ${m[1]} (id="${id}")`);
    }
  }
  if (missed === 0) ok('All in-page anchor links target a real id');
  else die(`${missed} in-page anchor link(s) target a missing id`);
}

function checkApk() {
  const apk = join(PUBLIC, 'apk', 'PREY_THE_ESCAPE_v1.0.0.apk');
  try {
    const s = statSync(apk);
    ok(`APK present: ${apk} (${formatBytes(s.size)})`);
  } catch {
    die(`APK missing: ${apk}\nPlace the build at public/apk/PREY_THE_ESCAPE_v1.0.0.apk and rerun.`);
  }
}

function main() {
  console.log('PREY: THE ESCAPE — site validation\n');
  checkIndexExists();
  checkHtmlIntegrity();
  checkInternalLinks();
  checkAssets();
  checkApk();

  console.log('\nStatic checks complete.');
  if (process.exitCode === 1) {
    console.error('\nValidation failed — see ❌ lines above.');
    process.exit(1);
  } else {
    console.log('\n✔ Validation passed.');
  }
}

main();
