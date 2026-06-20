import multer from "multer";
import { env } from "../config/env";
import { ApiError } from "../utils/apiError";

const IMAGE_MIME_WHITELIST = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml", "image/webp"];

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: env.MAX_UPLOAD_SIZE_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!IMAGE_MIME_WHITELIST.includes(file.mimetype)) {
      cb(ApiError.badRequest("Only PNG, JPG, SVG and WEBP images are allowed"));
      return;
    }
    cb(null, true);
  },
});

/** Single image upload, exposed as req.file (in-memory buffer). */
export function uploadSingleImage(field: string) {
  return upload.single(field);
}
