import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import 'dotenv/config';
import path from 'node:path';
import { apiRouter } from './routes/index.js';
import { errorHandler } from './middlewares/error-handler.js';

const PORT = process.env.PORT || 4000;
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'uploads');
export const app = express();

app.use(
	cors({
		origin: process.env.FRONTEND_URL || 'http://localhost:5173',
		credentials: true, // Allow cookies in CORS requests
	})
);
app.use(express.json());
app.use(cookieParser());

app.use('/uploads', express.static(UPLOAD_DIR));
app.use('/api', apiRouter);

// Must be registered after all routes.
app.use(errorHandler);

app.listen(PORT, () => {
	console.log(`API server running on http://localhost:${PORT}`);
});
