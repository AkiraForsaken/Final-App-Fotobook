export function dateToISO(date: Date): string {
	return date.toISOString();
}

export function roleToIsAdmin(role: 'user' | 'admin'): boolean {
	return role === 'admin';
}

export function toAuthorDto(
	author: {
		id: number;
		firstName: string;
		lastName: string;
		avatarUrl: string | null;
	},
	isFollowedByMe: boolean
) {
	return {
		id: author.id,
		firstName: author.firstName,
		lastName: author.lastName,
		avatarUrl: author.avatarUrl,
		isFollowedByMe: isFollowedByMe,
	};
}
