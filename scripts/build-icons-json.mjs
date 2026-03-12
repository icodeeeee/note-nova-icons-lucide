import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const ICONS_DIR = path.join(ROOT, "icons");
const DIST_DIR = path.join(ROOT, "dist");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function normalizeSvg(svg) {
  return svg
    .replace(/\r\n/g, "\n")
    .replace(/\n+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function getFiles(dir, ext) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(ext))
    .map((entry) => path.join(dir, entry.name))
    .sort((a, b) => a.localeCompare(b));
}

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (err) {
    console.warn(`Invalid JSON: ${filePath}`);
    return null;
  }
}

function tokenize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[_/]+/g, "-")
    .replace(/[^a-z0-9- ]+/g, " ")
    .split(/[\s-]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function unique(arr) {
  return [...new Set(arr)];
}

function build() {
  if (!fs.existsSync(ICONS_DIR)) {
    throw new Error(`icons directory not found: ${ICONS_DIR}`);
  }

  ensureDir(DIST_DIR);

  const svgFiles = getFiles(ICONS_DIR, ".svg");

  const full = {};
  const meta = {};
  const search = [];

  for (const svgPath of svgFiles) {
    const name = path.basename(svgPath, ".svg");
    const svg = normalizeSvg(fs.readFileSync(svgPath, "utf8"));
    const metaPath = path.join(ICONS_DIR, `${name}.json`);
    const extra = readJsonIfExists(metaPath) || {};

    const tags = Array.isArray(extra.tags) ? extra.tags : [];
    const aliases = Array.isArray(extra.aliases) ? extra.aliases : [];
    const categories = Array.isArray(extra.categories)
      ? extra.categories
      : extra.category
        ? [extra.category]
        : [];

    const keywords = unique([
      name,
      ...tags,
      ...aliases,
      ...categories,
      ...tokenize(name),
      ...tags.flatMap(tokenize),
      ...aliases.flatMap(tokenize),
      ...categories.flatMap(tokenize),
    ]);

    full[name] = {
      name,
      path: `icons/${name}.svg`,
      svg,
      tags,
      aliases,
      categories,
    };

    meta[name] = {
      name,
      path: `icons/${name}.svg`,
      tags,
      aliases,
      categories,
    };

    search.push({
      name,
      keywords,
    });
  }

  const min = Object.fromEntries(
    Object.entries(full).map(([name, item]) => [
      name,
      {
        s: item.svg,
        t: item.tags,
        a: item.aliases,
        c: item.categories,
      },
    ]),
  );

  fs.writeFileSync(
    path.join(DIST_DIR, "icons.json"),
    JSON.stringify(full, null, 2) + "\n",
    "utf8",
  );

  fs.writeFileSync(
    path.join(DIST_DIR, "icons.min.json"),
    JSON.stringify(min),
    "utf8",
  );

  fs.writeFileSync(
    path.join(DIST_DIR, "icons-meta.json"),
    JSON.stringify(meta, null, 2) + "\n",
    "utf8",
  );

  fs.writeFileSync(
    path.join(DIST_DIR, "icons-search.json"),
    JSON.stringify(search, null, 2) + "\n",
    "utf8",
  );

  console.log(`Built ${svgFiles.length} icons into dist/`);
}

build();
