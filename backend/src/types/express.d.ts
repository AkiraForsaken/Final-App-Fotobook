import 'express';

declare global {
	namespace Express {
		interface User {
			id: number;
			role: 'user' | 'admin';
			file?: Express.Multer.File;
		}
	}
}
