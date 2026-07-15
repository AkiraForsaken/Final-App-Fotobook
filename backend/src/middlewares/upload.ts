import multer, { type FileFilterCallback } from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import type { Request } from 'express';
import { env } from '../schemas/env.js';

const UPLOAD_DIR = env.UPLOAD_DIR ?? path.join(process.cwd(), 'uploads');

// Ensure the upload directory exists at startup.
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/gif']);
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif']);

// 5MB for Photo/Album images, 2MB for avatar.
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

const memoryStorage = multer.memoryStorage();
export const uploadPhotoImage = multer({
	storage: memoryStorage,
	fileFilter: imageFileFilter,
	limits: { fileSize: PHOTO_MAX_SIZE_BYTES },
}).single('image');
export const uploadAvatarImage = multer({
	storage: memoryStorage,
	fileFilter: imageFileFilter,
	limits: { fileSize: AVATAR_MAX_SIZE_BYTES },
}).single('avatar');
