// Hands the frontend in: copies app/ and screenshots/ from beside this file to the output directory and writes
// dossier.json with buildDossier from vendor/makefun-frontend.ts. Run from the repository root with Node 22:
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node --experimental-strip-types main.ts
//
// MAKEFUN_OUTPUT_DIR defaults to /output, where the grader reads. Leave vendor/makefun-frontend.ts as it is: the
// grader rebuilds the dossier with its own copy and compares the bytes.

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

if (!existsSync(join(here, 'app', 'index.html'))) {
  console.error('app/index.html is missing: there is no page to hand in.');
  process.exit(1);
}

function tally(dir: string) {
  let files = 0;
  let bytes = 0;
  for (const rel of readdirSync(dir, { recursive: true }) as string[]) {
    const stats = statSync(join(dir, rel));
    if (stats.isFile()) {
      files++;
      bytes += stats.size;
    }
  }
  return { files, bytes };
}

mkdirSync(out, { recursive: true });
rmSync(join(out, 'app'), { recursive: true, force: true });
rmSync(join(out, 'screenshots'), { recursive: true, force: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

const app = tally(join(out, 'app'));
const shots = tally(join(out, 'screenshots'));
console.log(`app: ${app.files} files, ${app.bytes} bytes`);
console.log(`screenshots: ${shots.files} files, ${shots.bytes} bytes`);

// text_max_bytes shapes the judge's text. The other caps are the grader's gate limits (3 screenshots of at most 256 KiB,
// at most 993 entries and 16 MiB in app/): buildDossier refuses past them here as the grader would.
let dossier: string;
try {
  dossier = buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 3, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 16777216,
  });
} catch (err) {
  console.error(`dossier not written: ${(err as Error).message}`);
  process.exit(1);
}
writeFileSync(join(out, 'dossier.json'), dossier);
console.log(`dossier.json: ${dossier.length} bytes`);
