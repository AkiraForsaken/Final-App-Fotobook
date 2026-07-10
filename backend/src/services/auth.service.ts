import { prisma } from '../prisma/client.js';
import { UnauthorizedError, ConflictError, NotFoundError } from '../utils/app-error.js';
import { signAccessToken, signRefreshToken, hashToken, verifyRefreshToken } from '../utils/jwt.js';
import type {
	LoginRequest,
	SignupRequest,
	VerifyEmailRequest,
	ForgotPasswordRequest,
	ResetPasswordRequest,
} from '../schemas/auth.js';
import bcrypt from 'bcryptjs';

const BCRYPT_ROUNDS = 10;
const REFRESH_TOKEN_MAX_AGE_DAYS = 7;
const EMAIL_VERIFICATION_TOKEN_TTL_HOURS = 24;
const PASSWORD_RESET_TOKEN_TTL_HOURS = 1;
const REQUIRE_EMAIL_VERIFICATION = process.env.REQUIRE_EMAIL_VERIFICATION === 'true';

function toAuthUserDto(user: {
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
		isAdmin: user.role === 'admin',
		createdAt: user.createdAt.toISOString(),
	};
}

/**
 * Sign up a new user, create initial profile, and return user + tokens.
 */
export async function signup(input: SignupRequest) {
	// Check if email already exists
	const existingUser = await prisma.user.findUnique({
		where: { email: input.email.toLowerCase() },
	});
	if (existingUser) {
		throw new ConflictError('An account with this email already exists.');
	}

	// Hash password
	const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

	// Create user
	const user = await prisma.user.create({
		data: {
			firstName: input.firstName,
			lastName: input.lastName,
			email: input.email.toLowerCase(),
			passwordHash,
			isEmailVerified: false,
			role: 'user',
		},
	});

	// Create refresh token
	await createEmailVerificationToken(user.id);
	const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
	console.log(`[auth] Verification link for ${user.email}: ${baseUrl}/verify-email`);

	const { token: refreshToken, dbRecord } = await createRefreshToken(user.id);

	// Create access token
	const accessToken = signAccessToken({
		sub: user.id,
		role: user.role,
	});

	return {
		user: toAuthUserDto(user),
		accessToken,
		refreshToken,
		refreshTokenExpiresAt: dbRecord.expiresAt,
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

	const { token: refreshToken, dbRecord } = await createRefreshToken(user.id);

	// Create access token
	const accessToken = signAccessToken({
		sub: user.id,
		role: user.role,
	});

	return {
		user: toAuthUserDto(user),
		accessToken,
		refreshToken,
		refreshTokenExpiresAt: dbRecord.expiresAt,
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
		const resetToken = await createPasswordResetToken(user.id);
		const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
		console.log(
			`[auth] Password reset link for ${user.email}: ${baseUrl}/reset-password?token=${resetToken}`
		);
	}

	return {
		message: 'If an account exists for that email, a password reset link has been generated.',
	};
}

export async function resetPassword(input: ResetPasswordRequest) {
	const tokenHash = hashToken(input.token.trim());
	const resetToken = await prisma.passwordResetToken.findFirst({
		where: { tokenHash },
		include: { user: true },
	});

	if (!resetToken) {
		throw new NotFoundError('Password reset token is invalid.');
	}
	if (resetToken.usedAt) {
		throw new ConflictError('This password reset link has already been used.');
	}
	if (resetToken.expiresAt < new Date()) {
		throw new UnauthorizedError('Password reset token has expired.');
	}

	const passwordHash = await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS);

	await prisma.$transaction(async (tx) => {
		await tx.user.update({
			where: { id: resetToken.userId },
			data: { passwordHash },
		});
		await tx.refreshToken.updateMany({
			where: { userId: resetToken.userId, revokedAt: null },
			data: { revokedAt: new Date() },
		});
		await tx.passwordResetToken.update({
			where: { id: resetToken.id },
			data: { usedAt: new Date() },
		});
	});

	return { message: 'Password reset successful.' };
}

/**
 * Refresh an access token using a valid refresh token.
 */
export async function refreshAccessToken(refreshToken: string) {
	// Verify refresh token signature
	const payload = verifyRefreshToken(refreshToken);

	// Find the refresh token in DB
	const dbToken = await prisma.refreshToken.findUnique({
		where: { id: payload.tokenId },
		include: { user: true },
	});

	if (!dbToken) {
		throw new UnauthorizedError('Refresh token not found or has been revoked.');
	}
	// Check if token is expired or revoked
	if (dbToken.expiresAt < new Date()) {
		throw new UnauthorizedError('Refresh token has expired.');
	}
	if (dbToken.revokedAt) {
		throw new UnauthorizedError('Refresh token has been revoked.');
	}
	if (dbToken.replacedById) {
		await prisma.refreshToken.updateMany({
			where: { userId: dbToken.userId, revokedAt: null },
			data: { revokedAt: new Date() },
		});
		throw new UnauthorizedError('Refresh token has already been used. Please log in again.');
	}

	const tokenHash = hashToken(refreshToken);
	if (dbToken.tokenHash !== tokenHash) {
		throw new UnauthorizedError('Refresh token is invalid.');
	}

	const user = dbToken.user;

	// Check if user is active
	if (!user.isActive) {
		throw new UnauthorizedError('Your account has been deactivated.');
	}

	// Create new access token
	const newAccessToken = signAccessToken({
		sub: user.id,
		role: user.role,
	});
	const { token: newRefreshToken, dbRecord: newRefreshTokenRecord } = await createRefreshToken(
		user.id
	);

	await prisma.refreshToken.update({
		where: { id: dbToken.id },
		data: {
			revokedAt: new Date(),
			replacedById: newRefreshTokenRecord.id,
		},
	});

	return {
		accessToken: newAccessToken,
		user: toAuthUserDto(user),
		refreshToken: newRefreshToken,
		refreshTokenExpiresAt: newRefreshTokenRecord.expiresAt,
	};
}

/**
 * Logout by revoking the refresh token.
 */
export async function logout(refreshToken: string) {
	try {
		const payload = verifyRefreshToken(refreshToken);
		await prisma.refreshToken.update({
			where: { id: payload.tokenId },
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
	const expiresAt = new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_DAYS * 24 * 60 * 60 * 1000);

	// Generate token (will be signed as JWT before returning)
	const tokenPayload = { sub: userId };

	// Create a temporary record first to get the ID, then hash and store
	const dbRecord = await prisma.refreshToken.create({
		data: {
			userId,
			tokenHash: '', // Placeholder, will update below
			expiresAt,
		},
	});

	// Now sign the token with the DB record ID
	const token = signRefreshToken({
		sub: userId,
		tokenId: dbRecord.id,
	});

	// Hash and store the token
	const tokenHash = hashToken(token);
	await prisma.refreshToken.update({
		where: { id: dbRecord.id },
		data: { tokenHash },
	});

	return { token, dbRecord: { ...dbRecord, expiresAt } };
}

async function createEmailVerificationToken(userId: number) {
	const token = crypto.randomUUID();
	const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TOKEN_TTL_HOURS * 60 * 60 * 1000);
	const tokenHash = hashToken(token);

	await prisma.emailVerificationToken.create({
		data: {
			userId,
			tokenHash,
			expiresAt,
		},
	});

	return token;
}

async function createPasswordResetToken(userId: number) {
	const token = crypto.randomUUID();
	const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_HOURS * 60 * 60 * 1000);
	const tokenHash = hashToken(token);

	await prisma.passwordResetToken.create({
		data: {
			userId,
			tokenHash,
			expiresAt,
		},
	});

	return token;
}
