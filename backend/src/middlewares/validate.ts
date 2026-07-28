import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

type ValidationTarget = 'body' | 'query' | 'params';

/**
 * Zod validation middleware
 */
export function validate(schema: z.ZodType, target: ValidationTarget = 'body') {
	return (req: Request, res: Response, next: NextFunction) => {
		const result = schema.safeParse(req[target]);
		if (!result.success) {
			res.status(400).json({ error: result.error.issues[0]?.message ?? 'Invalid request.' });
			return;
		}
		if (target === 'query') {
			// Overrides the read-only getter safely
			Object.defineProperty(req, 'query', {
				value: result.data,
				writable: true,
				configurable: true,
				enumerable: true,
			});
		} else {
			req[target] = result.data;
		}
		next();
	};
}
