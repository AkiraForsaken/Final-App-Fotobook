import rateLimit from 'express-rate-limit';

// Strict limit
export const authRateLimit = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 20,
	standardHeaders: true,
	legacyHeaders: false,
	message: { error: 'Too many attempts. Please try again later.' },
});

// Extra strict limit
export const strictRateLimit = rateLimit({
	windowMs: 60 * 60 * 1000, // 1 hour
	limit: 5,
	standardHeaders: true,
	legacyHeaders: false,
	message: { error: 'Too many attempts. Please try again in an hour.' },
});

// Moderate limit
export const apiRateLimit = rateLimit({
	windowMs: 1 * 60 * 1000, // 1 minute
	limit: 100,
	standardHeaders: true,
	legacyHeaders: false,
});
