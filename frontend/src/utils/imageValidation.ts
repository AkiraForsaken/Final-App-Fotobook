export const ACCEPTED_MIME = ['image/jpeg', 'image/png', 'image/gif'];
export const ACCEPTED_EXT = ['.jpg', '.jpeg', '.png', '.gif'];
export const MAX_BYTES = 5 * 1024 * 1024;

export function validateImageFile(file: File): string | null {
	if (!ACCEPTED_MIME.includes(file.type)) {
		return 'Only JPEG, PNG, and GIF files are accepted.';
	}
	if (file.size > MAX_BYTES) {
		return `"${file.name}" exceeds the 5 MB limit.`;
	}
	return null;
}
