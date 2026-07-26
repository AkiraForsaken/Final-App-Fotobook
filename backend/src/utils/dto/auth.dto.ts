import { roleToIsAdmin, dateToISO } from '../dto-helpers.js';

export function toAuthUserDto(user: {
	id: number;
	firstName: string;
	lastName: string;
	email: string;
	avatarUrl: string | null;
	isActive: boolean;
	role: 'user' | 'admin';
	createdAt: Date;
}) {
	return {
		id: user.id,
		firstName: user.firstName,
		lastName: user.lastName,
		email: user.email,
		avatarUrl: user.avatarUrl,
		isActive: user.isActive,
		isAdmin: roleToIsAdmin(user.role),
		createdAt: dateToISO(user.createdAt),
	};
}
