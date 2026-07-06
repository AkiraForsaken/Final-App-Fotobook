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

// Avatar photos
export const AVATAR_ACCEPTED_MIME = ['image/jpeg', 'image/png'];
export const AVATAR_ACCEPTED_EXT = ['.jpg', '.jpeg', '.png'];
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

export function validateAvatarFile(file: File): string | null {
	if (!AVATAR_ACCEPTED_MIME.includes(file.type)) {
		return 'Only JPEG and PNG files are accepted.';
	}
	if (file.size > AVATAR_MAX_BYTES) {
		return `"${file.name}" exceeds the 2 MB limit.`;
	}
	return null;
}
