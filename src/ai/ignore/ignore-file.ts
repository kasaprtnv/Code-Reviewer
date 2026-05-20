const IGNORE_DIR_PREFIXES = [
  'node_modules/',
  'dist/',
  'build/',
  'coverage/',
  '.next/',
  '.turbo/',
  '.cache/',
];

const IGNORE_EXACT_FILES = [
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'bun.lockb',
];

const IGNORE_EXTENSIONS = [
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.pdf',
  '.zip',
  '.mp4',
  '.mov',
  '.map',
  '.min.js',
  '.min.css',
  '.snap',
];

function normalize(p: string) {
  return p.replaceAll('\\', '/').toLowerCase();
}

export function shouldReviewForAI(filePath: string): boolean {
  const p = normalize(filePath);

  if (IGNORE_DIR_PREFIXES.some((d) => p.startsWith(d))) return false;
  if (IGNORE_EXACT_FILES.some((f) => p === normalize(f))) return false;
  if (IGNORE_EXTENSIONS.some((ext) => p.endsWith(ext))) return false;

  return true;
}
