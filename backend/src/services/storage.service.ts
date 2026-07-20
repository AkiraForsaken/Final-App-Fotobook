import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'node:stream';
import { ExternalServiceError } from '../utils/app-error.js';
import { env } from '../schemas/env.js';

const UPLOAD_DIR = env.UPLOAD_DIR ?? path.join(process.cwd(), 'uploads');
const PUBLIC_BASE_URL = env.PUBLIC_BASE_URL ?? '';
const PUBLIC_UPLOAD_PATH = '/uploads'; // must match the express.static mount in index.ts

const STORAGE_PROVIDER = env.STORAGE_PROVIDER ?? 'local';
const CLOUDINARY_FOLDER = env.CLOUDINARY_FOLDER ?? 'fotobook';

cloudinary.config({
	cloud_name: env.CLOUDINARY_CLOUD_NAME,
	api_key: env.CLOUDINARY_API_KEY,
	api_secret: env.CLOUDINARY_API_SECRET,
	secure: true,
});

// Cloudinary public_ids can include a folder path (e.g. "fotobook/abc123") and never include the file extension
function extractPublicId(url: string): string | null {
	const match = url.match(/\/upload\/(?:[^/]+\/)*?(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/);
	return match ? match[1] : null;
}

export interface ResolvedUpload {
	url: string;
	sizeBytes: number;
}

export interface StorageAdapter {
	/**
	 * Called after Multer has already handled the file (written to disk, or
	 * held in memory, depending on the adapter). Returns the public URL and
	 * final size in bytes to persist on the Photo row.
	 */
	resolve(file: Express.Multer.File): Promise<ResolvedUpload>;

	/**
	 * Best-effort delete of a previously stored file, given its public URL.
	 * Failures are swallowed — a file that's already missing on disk should
	 * never block a DB delete/replace.
	 */
	remove(url: string): Promise<void>;
}

// ── Local disk adapter
// Paired with multer.diskStorage in middlewares/upload.ts, which already
// wrote the file to UPLOAD_DIR by the time `resolve` runs — this just maps
// the saved filename to its public URL.
const localDiskAdapter: StorageAdapter = {
	// Memory storage — Do the write before mapping
	async resolve(file) {
		const ext = path.extname(file.originalname).toLowerCase();
		const filename = `${crypto.randomUUID()}${ext}`;
		const filePath = path.join(UPLOAD_DIR, filename);
		await fs.writeFile(filePath, file.buffer);
		return { url: `${PUBLIC_BASE_URL}${PUBLIC_UPLOAD_PATH}/${filename}`, sizeBytes: file.size };
	},

	async remove(url) {
		const filename = path.basename(url);
		const filePath = path.join(UPLOAD_DIR, filename);
		try {
			await fs.unlink(filePath);
		} catch (err: unknown) {
			const code = (err as NodeJS.ErrnoException)?.code;
			if (code !== 'ENOENT') {
				console.error(`Failed to delete stored file "${filePath}":`, err);
			}
		}
	},
};

const cloudinaryAdapter: StorageAdapter = {
	async resolve(file) {
		return new Promise<ResolvedUpload>((resolve, reject) => {
			const uploadStream = cloudinary.uploader.upload_stream(
				{ folder: CLOUDINARY_FOLDER, resource_type: 'image' },
				(error, result) => {
					if (error || !result) {
						console.error('Cloudinary upload failed:', error);
						reject(new ExternalServiceError('Failed to upload image. Please try again.'));
						return;
					}
					resolve({ url: result.secure_url, sizeBytes: result.bytes });
				}
			);
			Readable.from(file.buffer).pipe(uploadStream);
		});
	},
	async remove(url) {
		const publicId = extractPublicId(url);
		if (!publicId) {
			console.error(`Could not extract Cloudinary public_id from URL: ${url}`);
			return;
		}
		try {
			await cloudinary.uploader.destroy(publicId);
		} catch (err) {
			console.error(`Failed to delete Cloudinary asset "${publicId}":`, err);
		}
	},
};
export const storage: StorageAdapter =
	STORAGE_PROVIDER === 'cloudinary' ? cloudinaryAdapter : localDiskAdapter;
