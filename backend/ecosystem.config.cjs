// ecosystem.config.cjs
// PM2 process definition for the Fotobook API (cluster mode).
// Deliberately CommonJS (.cjs): package.json has "type": "module", but PM2
// loads config files via require(), so this file needs its own extension
// to be interpreted correctly regardless of that setting.

module.exports = {
	apps: [
		{
			name: 'fotobook-api',
			script: './dist/index.js',
			cwd: __dirname,

			// Cluster mode: PM2 spawns one worker per CPU core (via Node's
			// cluster module) and load-balances incoming connections across
			// them round-robin. Override with PM2_INSTANCES if you want to
			// reserve cores for other processes on the same box.
			exec_mode: 'cluster',
			instances: process.env.PM2_INSTANCES || 'max',

			autorestart: true,
			max_restarts: 10,
			min_uptime: '15s', // a restart before this counts as a crash-loop, not a clean deploy
			max_memory_restart: '300M',
			watch: false, // never watch/reload on file change in production

			// index.ts already listens for SIGTERM/SIGINT, calls server.close(),
			// disconnects Prisma, and force-exits after 1s if close() hangs.
			// Give PM2 a bit more headroom than that before it SIGKILLs.
			kill_timeout: 5000,

			env: {
				NODE_ENV: 'production',
			},

			output: './logs/out.log',
			error: './logs/error.log',
			merge_logs: true,
			time: true,
		},
	],
};
