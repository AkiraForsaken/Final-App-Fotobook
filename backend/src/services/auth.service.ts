import { prisma } from '../prisma/client.js';
import { Prisma } from '@prisma/client';
import { UnauthorizedError, ConflictError, NotFoundError } from '../utils/app-error.js';
import {
	signAccessToken,
	hashToken,
	generateOpaqueToken,
	EMAIL_VERIFICATION_TOKEN_TTL_HOURS,
} from '../utils/jwt.js';
import type {
	LoginRequest,
	SignupRequest,
	VerifyEmailRequest,
	ForgotPasswordRequest,
	ResetPasswordRequest,
} from '../schemas/auth.js';
import bcrypt from 'bcryptjs';
import { env } from '../schemas/env.js';
import { toAuthUserDto } from '../utils/dto/user.dto.js';
import { sendPasswordResetEmail, sendVerificationEmail } from './email.service.js';
import { BCRYPT_ROUNDS } from '../utils/jwt.js';

const REFRESH_TOKEN_MAX_AGE_DAYS = 7;
const PASSWORD_RESET_TOKEN_TTL_HOURS = 1;
const REQUIRE_EMAIL_VERIFICATION = env.REQUIRE_EMAIL_VERIFICATION === 'true';

async function createAuthTokens(user: { id: number; role: 'user' | 'admin' }) {
	const { token: refreshToken, dbRecord } = await createRefreshToken(user.id);

	// Create access token
	const accessToken = signAccessToken({
		sub: user.id,
		role: user.role,
	});
	return { accessToken, refreshToken, refreshTokenExpiresAt: dbRecord.expiresAt };
}

/**
 * Sign up a new user, create initial profile, and return user + tokens.
 */
export async function signup(input: SignupRequest) {
	// Check if email already exists
	const normalizedEmail = input.email.toLowerCase();
	const existingUser = await prisma.user.findUnique({
		where: { email: normalizedEmail },
	});
	if (existingUser) {
		throw new ConflictError('An account with this email already exists.');
	}

	// Hash password
	const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

	// Generate token and send email first
	const verificationToken = createEmailVerificationToken();
	await sendVerificationEmail(
		{ email: normalizedEmail, firstName: input.firstName },
		verificationToken.token
	);

	// Create user
	const user = await prisma.$transaction(async (tx) => {
		const created = await tx.user.create({
			data: {
				firstName: input.firstName,
				lastName: input.lastName,
				email: normalizedEmail,
				passwordHash,
				isEmailVerified: false,
				role: 'user',
			},
		});
		await tx.emailVerificationToken.create({
			data: {
				userId: created.id,
				tokenHash: verificationToken.tokenHash,
				expiresAt: verificationToken.expiresAt,
			},
		});
		return created;
	});

	const tokens = await createAuthTokens(user);

	return {
		user: toAuthUserDto(user),
		...tokens,
	};
}

/**
 * Log in user by email/password and return user + tokens.
 */
export async function login(input: LoginRequest) {
	const user = await prisma.user.findUnique({
		where: { email: input.email.toLowerCase() },
	});

	if (!user) {
		throw new UnauthorizedError('Incorrect email or password.');
	}

	// Verify password
	const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
	if (!passwordMatches) {
		throw new UnauthorizedError('Incorrect email or password.');
	}

	// Check if user is active
	if (!user.isActive) {
		throw new UnauthorizedError('Your account has been deactivated.');
	}
	if (REQUIRE_EMAIL_VERIFICATION && !user.isEmailVerified) {
		throw new UnauthorizedError('Please verify your email before signing in.');
	}

	const tokens = await createAuthTokens(user);

	await prisma.user.update({
		where: { id: user.id },
		data: { lastLoginAt: new Date() },
	});

	return {
		user: toAuthUserDto(user),
		...tokens,
	};
}

export async function verifyEmail(input: VerifyEmailRequest) {
	const tokenHash = hashToken(input.token.trim());
	const verificationToken = await prisma.emailVerificationToken.findFirst({
		where: { tokenHash },
		include: { user: true },
	});

	if (!verificationToken) {
		throw new NotFoundError('Verification token is invalid.');
	}
	if (verificationToken.usedAt) {
		throw new ConflictError('This verification link has already been used.');
	}
	if (verificationToken.expiresAt < new Date()) {
		throw new UnauthorizedError('Verification token has expired.');
	}

	await prisma.$transaction(async (tx) => {
		await tx.user.update({
			where: { id: verificationToken.userId },
			data: { isEmailVerified: true },
		});
		await tx.emailVerificationToken.update({
			where: { id: verificationToken.id },
			data: { usedAt: new Date() },
		});
	});

	return { message: 'Email verified successfully.' };
}

export async function forgotPassword(input: ForgotPasswordRequest) {
	const user = await prisma.user.findUnique({
		where: { email: input.email.toLowerCase() },
	});

	if (user) {
		const resetToken = createPasswordResetToken();
		await sendPasswordResetEmail(
			{ email: user.email, firstName: user.firstName },
			resetToken.token
		);
		await prisma.passwordResetToken.create({
			data: {
				userId: user.id,
				tokenHash: resetToken.tokenHash,
				expiresAt: resetToken.expiresAt,
			},
		});
	}

	return {
		message: 'If an account exists for that email, a password reset link has been generated.',
	};
}

export async function resetPassword(input: ResetPasswordRequest) {
	const tokenHash = hashToken(input.token.trim());
	const now = new Date();

	return prisma.$transaction(async (tx) => {
		const resetToken = await tx.passwordResetToken.findUnique({ where: { tokenHash } });
		if (!resetToken) throw new NotFoundError('Password reset token is invalid.');
		if (resetToken.usedAt)
			throw new ConflictError('This password reset link has already been used.');
		if (resetToken.expiresAt < now)
			throw new UnauthorizedError('Password reset token has expired.');

		// protect against a double-submit race.
		const consumed = await tx.passwordResetToken.updateMany({
			where: { id: resetToken.id, usedAt: null },
			data: { usedAt: now },
		});
		if (consumed.count !== 1) {
			throw new ConflictError('This password reset link has already been used.');
		}

		const passwordHash = await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS);
		await tx.user.update({ where: { id: resetToken.userId }, data: { passwordHash } });
		await tx.refreshToken.updateMany({
			where: { userId: resetToken.userId, revokedAt: null },
			data: { revokedAt: now },
		});

		return { message: 'Password reset successful.' };
	});
}

export async function resendVerificationEmail(userId: number) {
	const user = await prisma.user.findUnique({ where: { id: userId } });
	if (!user) throw new NotFoundError('User not found.');
	if (user.isEmailVerified) throw new ConflictError('Your email is already verified.');

	const verificationToken = createEmailVerificationToken();
	await sendVerificationEmail(
		{ email: user.email, firstName: user.firstName },
		verificationToken.token
	);

	await prisma.$transaction(async (tx) => {
		// invalidate any previously-issued, still-unused tokens
		await tx.emailVerificationToken.updateMany({
			where: { userId, usedAt: null },
			data: { usedAt: new Date() },
		});
		await tx.emailVerificationToken.create({
			data: {
				userId,
				tokenHash: verificationToken.tokenHash,
				expiresAt: verificationToken.expiresAt,
			},
		});
	});

	return { message: 'Verification email sent.' };
}

/**
 * Refresh an access token using a valid refresh token.
 */
async function rotateRefreshToken(tokenHash: string) {
	return prisma.$transaction(
		async (tx) => {
			const dbToken = await tx.refreshToken.findUnique({
				where: { tokenHash },
				include: { user: true },
			});

			if (!dbToken) throw new UnauthorizedError('Refresh token not found or has been revoked.');
			if (dbToken.expiresAt < new Date()) throw new UnauthorizedError('Refresh token has expired.');

			if (dbToken.revokedAt || dbToken.replacedById) {
				// Treat as reuse of a possibly stolen token and kill every active session for this user.
				await prisma.refreshToken.updateMany({
					// use prisma, not tx to survive the transaction
					where: { userId: dbToken.userId, revokedAt: null },
					data: { revokedAt: new Date() },
				});
				throw new UnauthorizedError('Refresh token has already been used. Please log in again.');
			}
			if (!dbToken.user.isActive) throw new UnauthorizedError('Your account has been deactivated.');

			const newToken = generateOpaqueToken();
			const newHash = hashToken(newToken);
			const expiresAt = new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_DAYS * 24 * 60 * 60 * 1000);
			const newRecord = await tx.refreshToken.create({
				data: { userId: dbToken.userId, tokenHash: newHash, expiresAt },
			});

			const rotated = await tx.refreshToken.updateMany({
				where: { id: dbToken.id, revokedAt: null, replacedById: null },
				data: { revokedAt: new Date(), replacedById: newRecord.id },
			});
			if (rotated.count === 0) {
				// Lost a race to a concurrent refresh using the same token — deny
				// this request, but don't nuke all sessions;
				throw new UnauthorizedError('Refresh token has already been used. Please log in again.');
			}

			return {
				accessToken: signAccessToken({ sub: dbToken.user.id, role: dbToken.user.role }),
				user: dbToken.user,
				refreshToken: newToken,
				refreshTokenExpiresAt: expiresAt,
			};
		},
		{ isolationLevel: 'Serializable' }
	);
}

export async function refreshAccessToken(refreshToken: string) {
	const tokenHash = hashToken(refreshToken);

	try {
		const result = await rotateRefreshToken(tokenHash);
		return { ...result, user: toAuthUserDto(result.user) };
	} catch (err) {
		// A write conflict (P2034) means another concurrent request won the race to claim this token.
		if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2034') {
			throw new UnauthorizedError('Refresh token was concurrently consumed');
		}
		throw err;
	}
}

/**
 * Logout by revoking the refresh token.
 */
export async function logout(refreshToken: string) {
	try {
		// const payload = verifyRefreshToken(refreshToken);
		const tokenHash = hashToken(refreshToken);
		await prisma.refreshToken.update({
			where: { tokenHash, revokedAt: null },
			data: { revokedAt: new Date() },
		});
	} catch {
		// Token might be already expired or invalid — no-op
	}
}

/**
 * Create a new refresh token in the database and return the JWT + DB record.
 */
async function createRefreshToken(userId: number) {
	const token = generateOpaqueToken();
	const tokenHash = hashToken(token);
	const expiresAt = new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_DAYS * 24 * 60 * 60 * 1000);
	const dbRecord = await prisma.refreshToken.create({ data: { userId, tokenHash, expiresAt } });
	return { token, dbRecord };
}

export function createEmailVerificationToken() {
	const token = crypto.randomUUID();
	const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TOKEN_TTL_HOURS * 60 * 60 * 1000);
	const tokenHash = hashToken(token);

	return { token, tokenHash, expiresAt };
}

function createPasswordResetToken() {
	const token = crypto.randomUUID();
	const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_HOURS * 60 * 60 * 1000);
	const tokenHash = hashToken(token);

	return { token, tokenHash, expiresAt };
}
