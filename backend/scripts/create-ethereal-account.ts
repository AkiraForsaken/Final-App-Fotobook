import nodemailer from 'nodemailer';

/**
 * Run once: `npx tsx scripts/create-ethereal-account.ts`
 * Creates a single Ethereal test account and prints the credentials to add
 * to your .env, so every dev send reuses the same inbox instead of a fresh
 * disposable one on every server restart.
 */
async function main() {
	const account = await nodemailer.createTestAccount();

	console.log('Ethereal test account created — add these to your .env:\n');
	console.log(`ETHEREAL_USER=${account.user}`);
	console.log(`ETHEREAL_PASS=${account.pass}`);
	console.log(
		'\nLog in at https://ethereal.email/login with the same credentials to browse every sent message.'
	);
}

main().catch((err) => {
	console.error('Failed to create Ethereal test account:', err);
	process.exit(1);
});
