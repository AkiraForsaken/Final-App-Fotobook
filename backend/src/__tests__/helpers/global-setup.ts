import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export default function setup() {
	execSync('npx prisma migrate deploy', { stdio: 'inherit', env: process.env });
	const uploadDir = process.env.UPLOAD_DIR ?? './uploads-test';
	fs.rmSync(uploadDir, { recursive: true, force: true });
	fs.mkdirSync(uploadDir, { recursive: true });
}
