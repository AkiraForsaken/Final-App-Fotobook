import type { AlbumUploadSignature, CloudinaryPhotoInput } from './contentService.ts';

interface CloudinaryUploadResult {
	public_id: string;
	secure_url: string;
	format: string;
	bytes: number;
}

// Uploads one file straight to Cloudinary using a short-lived signature the
// backend generated for this album. The file never touches our server.
export async function uploadFileToCloudinary(
	file: File,
	signature: AlbumUploadSignature,
	onProgress?: (fraction: number) => void
): Promise<CloudinaryPhotoInput> {
	const form = new FormData();
	form.append('file', file);
	form.append('api_key', signature.apiKey);
	form.append('timestamp', String(signature.timestamp));
	form.append('signature', signature.signature);
	form.append('folder', signature.folder);
	form.append('allowed_formats', signature.allowedFormats);

	// XMLHttpRequest (not fetch) so we can report upload progress.
	const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.open('POST', `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`);
		xhr.upload.onprogress = (event) => {
			if (event.lengthComputable) onProgress?.(event.loaded / event.total);
		};
		xhr.onload = () => {
			if (xhr.status >= 200 && xhr.status < 300) {
				resolve(JSON.parse(xhr.responseText));
			} else {
				reject(new Error('Failed to upload image.'));
			}
		};
		xhr.onerror = () => reject(new Error('Network error while uploading image.'));
		xhr.send(form);
	});

	return {
		publicId: result.public_id,
		secureUrl: result.secure_url,
		format: result.format,
		bytes: result.bytes,
	};
}
