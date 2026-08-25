import { mkdir, readdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";

export const MAX_LOGO_BYTES = 5 * 1024 * 1024;

export const LOGO_TYPES: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");

export function logoPublicPath(plotId: string) {
  return `/api/plots/${plotId}/logo`;
}

export function isAllowedLogoType(type: string) {
  return type in LOGO_TYPES;
}

async function ensureUploadDir() {
  await mkdir(UPLOAD_DIR, { recursive: true });
}

export async function savePlotLogo(plotId: string, bytes: Uint8Array, mimeType: string) {
  const ext = LOGO_TYPES[mimeType];
  if (!ext) throw new Error("Logo must be a PNG, JPG, WebP, or GIF.");
  await ensureUploadDir();

  const existing = await readdir(UPLOAD_DIR).catch(() => []);
  await Promise.all(
    existing
      .filter((name) => name.startsWith(`${plotId}.`))
      .map((name) => unlink(path.join(UPLOAD_DIR, name)).catch(() => undefined)),
  );

  const filename = `${plotId}${ext}`;
  await writeFile(path.join(UPLOAD_DIR, filename), bytes);
  return { filename, mimeType, url: logoPublicPath(plotId) };
}

export async function readPlotLogo(plotId: string) {
  const existing = await readdir(UPLOAD_DIR).catch(() => []);
  const filename = existing.find((name) => name.startsWith(`${plotId}.`));
  if (!filename) return null;
  const ext = path.extname(filename).toLowerCase();
  const mimeType =
    Object.entries(LOGO_TYPES).find(([, value]) => value === ext)?.[0] ?? "application/octet-stream";
  const bytes = await readFile(path.join(UPLOAD_DIR, filename));
  return { bytes, mimeType };
}
