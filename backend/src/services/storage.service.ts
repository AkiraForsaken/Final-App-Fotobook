import fs from 'node:fs/promises';
import path from 'node:path';

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'uploads');
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL ?? '';
const PUBLIC_UPLOAD_PATH = '/uploads'; // must match the express.static mount in index.ts

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
	async resolve(file) {
		return {
			url: `${PUBLIC_BASE_URL}${PUBLIC_UPLOAD_PATH}/${file.filename}`,
			sizeBytes: file.size,
		};
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

// Swap this export for a Cloudinary/S3/etc. adapter later — nothing calling
// storage.resolve() / storage.remove() elsewhere in the codebase needs to
// change.
export const storage: StorageAdapter = localDiskAdapter;
