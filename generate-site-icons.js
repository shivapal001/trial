import { readFileSync, writeFileSync, unlinkSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";

// Keep this path in sync with where the game icon lives in this project
// once the PREY-WEBSITE folder is moved into the project tree.
const ASSET_ROOT = resolve(__dirname, "..", "..", "Assets", "Icons");
const SRC = path.join(ASSET_ROOT, "PreyIcon.png");
const OUT_DIR = path.resolve(__dirname, "..", "public");

const SPECS = [
  [64,  "favicon-64.png"],
  [192, "icon-192.png"],
  [512, "favicon-512.png"],
  [180, "apple-touch-icon.png"],
  [512, "apk-icon.png"],
];

const PY = String.raw`
import sys, pathlib
from PIL import Image

src = pathlib.Path(sys.argv[1])
out = pathlib.Path(sys.argv[2])
im = Image.open(src).convert("RGBA")

specs = [
    (64,  "favicon-64.png"),
    (192, "icon-192.png"),
    (512, "favicon-512.png"),
    (180, "apple-touch-icon.png"),
    (512, "apk-icon.png"),
]

for size, name in specs:
    out_path = out / name
    resized = im.resize((size, size), Image.LANCZOS)
    resized.convert("RGB").save(out_path, "PNG", optimize=True)
    print(out_path, size)
`;

function sha256File(p) {
  return createHash("sha256").update(readFileSync(p)).digest("hex");
}

function run() {
  if (!existsSync(SRC)) {
    console.error("Source icon not found:", SRC);
    console.error("Expected layout:");
    console.error("  Assets/Icons/PreyIcon.png");
    process.exit(1);
  }

  mkdirSync(OUT_DIR, { recursive: true });

  const tmpPy = join(OUT_DIR, "_generate_icons_tmp.py");
  writeFileSync(tmpPy, PY, "utf8");

  try {
    execSync(`python "${tmpPy}" "${SRC}" "${OUT_DIR}"`, { stdio: "inherit" });
  } finally {
    try { unlinkSync(tmpPy); } catch {}
  }

  console.log("Generated from:", SRC);
  for (const [, name] of SPECS) {
    const p = join(OUT_DIR, name);
    console.log(name, "sha256:", sha256File(p));
  }
}

run();
