import multer, { type FileFilterCallback } from 'multer';
import path from 'node:path';
import crypto from 'node:crypto';
import fs from 'node:fs';
import type { Request } from 'express';

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'uploads');

// Ensure the upload directory exists at startup.
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/gif']);
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif']);

// Per requirements doc: 5MB for Photo/Album images, 2MB for avatar.
const PHOTO_MAX_SIZE_BYTES = 5 * 1024 * 1024;
const AVATAR_MAX_SIZE_BYTES = 2 * 1024 * 1024;

function imageFileFilter(_req: Request, file: Express.Multer.File, cb: FileFilterCallback) {
	const ext = path.extname(file.originalname).toLowerCase();
	if (!ALLOWED_MIME_TYPES.has(file.mimetype) || !ALLOWED_EXTENSIONS.has(ext)) {
		// Constructing a real MulterError (rather than a plain Error) here
		// means error-handler.ts's `err instanceof multer.MulterError` branch
		// catches this and returns a clean 400 instead of a generic 500.
		cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname));
		return;
	}
	cb(null, true);
}

const diskStorage = multer.diskStorage({
	destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
	filename: (_req, file, cb) => {
		const ext = path.extname(file.originalname).toLowerCase();
		cb(null, `${crypto.randomUUID()}${ext}`);
	},
});

// NOTE: field name assumptions — confirm these match the frontend's
// FormData field names once contentService.ts is wired up. A mismatch
// causes Multer to reject with LIMIT_UNEXPECTED_FILE rather than silently
// leaving req.file undefined.
export const uploadPhotoImage = multer({
	storage: diskStorage,
	fileFilter: imageFileFilter,
	limits: { fileSize: PHOTO_MAX_SIZE_BYTES },
}).single('image');

export const uploadAvatarImage = multer({
	storage: diskStorage,
	fileFilter: imageFileFilter,
	limits: { fileSize: AVATAR_MAX_SIZE_BYTES },
}).single('avatar');
