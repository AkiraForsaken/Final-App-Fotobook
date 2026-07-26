import { PrismaClient } from '@prisma/client';
import { prisma } from './client.js';

export interface DataContext {
	db: PrismaClient;
}

export const defaultContext: DataContext = { db: prisma };
