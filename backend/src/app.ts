import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { apiRouter } from './routes/api.routes.js';
import { errorHandler } from './middlewares/error-handler.js';
import { env } from './schemas/env.js';
import { prisma } from './prisma/client.js';

const UPLOAD_DIR = env.UPLOAD_DIR ?? path.join(process.cwd(), 'uploads');
export const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(cors({ origin: env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use('/uploads', express.static(UPLOAD_DIR));

app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));
app.get('/ready', async (_req, res) => {
	try {
		await prisma.$queryRaw`SELECT 1`;
		res.status(200).json({ status: 'ready' });
	} catch (err) {
		console.error('[ready] DB check failed:', err);
		res.status(503).json({ status: 'not ready' });
	}
});

app.use('/api', apiRouter);
app.use(errorHandler);
