import { z } from 'zod';

const envSchema = z
	.object({
		NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
		DATABASE_URL: z.string().min(1),
		ACCESS_TOKEN_SECRET: z.string().min(32),
		REFRESH_TOKEN_SECRET: z.string().min(32),
		FRONTEND_URL: z.url().default('http://localhost:5173'),
		PUBLIC_BASE_URL: z.string().default(''),
		UPLOAD_DIR: z.string().default('./uploads'),
		PORT: z.coerce.number().default(4000),
		STORAGE_PROVIDER: z.enum(['local', 'cloudinary']).default('local'),
		CLOUDINARY_CLOUD_NAME: z.string().optional(),
		CLOUDINARY_API_KEY: z.string().optional(),
		CLOUDINARY_API_SECRET: z.string().optional(),
		CLOUDINARY_FOLDER: z.string().default('fotobook'),
		REQUIRE_EMAIL_VERIFICATION: z.string().optional(),
	})
	.superRefine((env, ctx) => {
		if (env.NODE_ENV === 'production') {
			const insecureDefaults = ['changeme', 'secret', 'dev-secret'];
			if (
				insecureDefaults.includes(env.ACCESS_TOKEN_SECRET) ||
				insecureDefaults.includes(env.REFRESH_TOKEN_SECRET)
			) {
				ctx.addIssue({
					code: 'custom',
					message: 'Refusing to start in production with a default/placeholder secret.',
				});
			}
		}
		if (env.STORAGE_PROVIDER === 'cloudinary') {
			if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
				ctx.addIssue({
					code: 'custom',
					message:
						'CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are required when STORAGE_PROVIDER=cloudinary.',
				});
			}
		}
	});

export const env = envSchema.parse(process.env); // throws + crashes startup on any violation
