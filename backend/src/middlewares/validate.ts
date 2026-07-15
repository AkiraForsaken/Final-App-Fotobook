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
			Object.assign(req.query, result.data);
		} else {
			req[target] = result.data;
		}
		next();
	};
}
