/**
 * Services throw these; the centralized error-handler middleware
 * catches them and shapes the HTTP response.
 */
export class AppError extends Error {
	constructor(
		public readonly statusCode: number,
		message: string
	) {
		super(message);
		this.name = this.constructor.name;
	}
}

export class NotFoundError extends AppError {
	constructor(message = 'Resource not found.') {
		super(404, message);
	}
}

export class ForbiddenError extends AppError {
	constructor(message = 'You do not have permission to do that.') {
		super(403, message);
	}
}

export class UnauthorizedError extends AppError {
	constructor(message = 'Authentication required.') {
		super(401, message);
	}
}

export class ConflictError extends AppError {
	constructor(message = 'This conflicts with existing data.') {
		super(409, message);
	}
}

export class ValidationError extends AppError {
	constructor(message = 'Invalid request.') {
		super(400, message);
	}
}
