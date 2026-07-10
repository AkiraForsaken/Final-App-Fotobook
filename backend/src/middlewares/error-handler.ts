import multer from 'multer';
import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/app-error.js';

/**
 * Turns any thrown error into a response, and never leaks stack
 * traces or raw Prisma/DB error details to the client.
 *
 * Registered LAST, after all routes, with 4 params
 */
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
	if (err instanceof AppError) {
		res.status(err.statusCode).json({ error: err.message });
		return;
	}

	// Multer Error types
	if (err instanceof multer.MulterError) {
		if (err.code === 'LIMIT_FILE_SIZE') {
			res.status(400).json({ error: 'The uploaded file exceeds the maximum allowed size.' });
			return;
		}
		if (err.code === 'LIMIT_UNEXPECTED_FILE') {
			res.status(400).json({ error: 'Unsupported image type. Please upload a JPEG, PNG, or GIF.' });
			return;
		}
		res.status(400).json({ error: 'File upload failed. Please try again.' });
		return;
	}

	// Prisma's own error types — translate the common ones, don't expose the rest.
	if (err instanceof Prisma.PrismaClientKnownRequestError) {
		if (err.code === 'P2002') {
			res.status(409).json({ error: 'A record with this value already exists.' });
			return;
		}
		if (err.code === 'P2025') {
			res.status(404).json({ error: 'Resource not found.' });
			return;
		}
	}

	console.error(`[${req.method} ${req.originalUrl}]`, err);
	res.status(500).json({ error: 'Something went wrong. Please try again.' });
}
