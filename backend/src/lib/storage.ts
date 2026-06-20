import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { env } from "../config/env";

const uploadsRoot = path.resolve(process.cwd(), env.UPLOADS_DIR);

export function getUploadsRoot(): string {
  return uploadsRoot;
}

async function ensureDir(dir: string) {
  await mkdir(dir, { recursive: true });
}

function randomFileName(originalName: string): string {
  const ext = path.extname(originalName) || "";
  return `${Date.now()}-${randomBytes(8).toString("hex")}${ext}`;
}

/**
 * Persists a buffer under uploads/<subDir>/ and returns a public URL.
 * Abstracted so it can be swapped for S3 later — callers only see the URL.
 */
export async function saveBuffer(
  buffer: Buffer,
  subDir: string,
  originalName: string,
): Promise<{ url: string; absolutePath: string; fileName: string }> {
  const dir = path.join(uploadsRoot, subDir);
  await ensureDir(dir);
  const fileName = randomFileName(originalName);
  const absolutePath = path.join(dir, fileName);
  await writeFile(absolutePath, buffer);
  const url = `${env.APP_BASE_URL}/uploads/${subDir}/${fileName}`;
  return { url, absolutePath, fileName };
}
