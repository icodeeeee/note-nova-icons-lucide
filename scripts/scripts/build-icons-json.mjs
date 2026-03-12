import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();
const ICONS_DIR = path.join(ROOT_DIR, 'icons');
const OUTPUT_FILE = path.join(ROOT_DIR, 'icons.json');

function normalizeSvg(svg) {
  return svg
    .replace(/\r\n/g, '\n')
    .replace(/\n+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function getSvgFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.svg'))
    .map((entry) => path.join(dir, entry.name))
    .sort((a, b) => a.localeCompare(b));
}

function main() {
  if (!fs.existsSync(ICONS_DIR)) {
    throw new Error(`icons directory not found: ${ICONS_DIR}`);
  }

  const svgFiles = getSvgFiles(ICONS_DIR);
  const result = {};

  for (const filePath of svgFiles) {
    const fileName = path.basename(filePath, '.svg');
    const svg = fs.readFileSync(filePath, 'utf8');

    result[fileName] = {
      name: fileName,
      path: `icons/${path.basename(filePath)}`,
      svg: normalizeSvg(svg),
    };
  }

  fs.writeFileSync(OUTPUT_FILE, `${JSON.stringify(result, null, 2)}\n`, 'utf8');

  console.log(`Generated ${OUTPUT_FILE} with ${svgFiles.length} icons.`);
}

main();
