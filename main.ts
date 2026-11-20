// Leonida Platinum — the entry program for gta6-trophy-guide-01 (Node 22+,
// standard library only). The guide itself is plain static files in app/:
// index.html, its modules and styles, and data/trophies.json with the 55
// official trophies. This program hands the guide in: it copies app/ and
// screenshots/ from beside this file into the output directory and writes
// dossier.json, the summary the judge reads (the screenshots, the first
// load's files and bytes, and the source list), using the vendored make.fun
// library. Leave vendor/makefun-frontend.ts untouched: the scorer requires
// dossier.json to be byte for byte what its own copy of that library writes.
//
// Run it locally with MAKEFUN_OUTPUT_DIR set:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Inside the grader the output directory is /output.

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Start from a clean output directory so a stale file from an earlier run
// can never leak into the submission.
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

cpSync(join(repoRoot, 'app'), join(outDir, 'app'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

// The scorer's own caps for this competition: only text_max_bytes shapes the
// dossier's bytes; the others refuse an entry the scorer would refuse (more
// than 4 screenshots or one over 256 KiB; more than 993 files and
// directories in app/ or 48 MiB of app files). A failure here is a hard
// stop, not a partial hand-in: say plainly what is missing and exit
// non-zero instead of leaving a half-written output behind.
let dossier;
try {
  dossier = buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  });
} catch (err) {
  console.error(`dossier build failed: ${err.message}`);
  console.error('Fix app/ or screenshots/ first (see the error above), then run again.');
  process.exit(1);
}
writeFileSync(join(outDir, 'dossier.json'), dossier);

const shotCount = readdirSync(join(outDir, 'screenshots')).length;
console.log(`Leonida Platinum handed in to ${outDir} (${shotCount} screenshots, dossier ${dossier.length} bytes)`);
