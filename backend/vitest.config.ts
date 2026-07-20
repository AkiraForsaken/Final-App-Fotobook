import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'node',
		globalSetup: './src/__tests__/helpers/global-setup.ts',
		setupFiles: ['./src/__tests__/helpers/setup.ts'],
		fileParallelism: false, // all files share one DB via truncate-between-tests; parallel files would corrupt each other's state
		testTimeout: 15000,
	},
});
