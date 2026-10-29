import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = join(fileURLToPath(import.meta.url), '..');
const PUBLIC = join(__dirname, '..', 'public');
const INDEX = join(PUBLIC, 'index.html');

const ASSET_PATTERNS = [
  /"([^"]+\.(?:png|jpg|jpeg|webp|ico|svg))"/,
  /'([^']+\.(?:png|jpg|jpeg|webp|ico|svg))'/,
];

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

const html = readFileSync(INDEX, 'utf8');
const paths = extractAssetPaths(html);
console.log('ASSET PATHS EXTRACTED FROM index.html:', paths.length);
for (const p of paths) console.log('  ', p);
