import pino from 'pino';
import { env } from '../schemas/env.js';

export const logger = pino({
	level: env.LOG_LEVEL || 'info',
	redact: {
		paths: ['password', 'passwordHash', 'token', 'authorization', 'cookie'],
		censor: ' [REDACTED] ',
	},
	...(env.NODE_ENV === 'production' ? {} : { transport: { target: 'pino-pretty' } }),
});
