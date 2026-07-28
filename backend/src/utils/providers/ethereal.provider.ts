import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../../schemas/env.js';
import type { EmailMessage, EmailProvider } from '../../types/email.types.js';

/**
 * Dev-only provider backed by Ethereal (https://ethereal.email/).
 *
 * If ETHEREAL_USER/ETHEREAL_PASS are set, every send goes through that one
 * persistent test account — log into https://ethereal.email/login with the
 * same credentials to browse every message ever sent, instead of hunting
 * down individual preview links. Generate those credentials once with
 * `npx tsx scripts/create-ethereal-account.ts`.
 *
 * If they're not set, falls back to creating a disposable test account on
 * first send (credentials change every restart; the console-logged preview
 * URL is then the only way to view a given message).
 */
let transporterPromise: Promise<Transporter> | null = null;

async function getTransporter(): Promise<Transporter> {
	if (!transporterPromise) {
		if (env.ETHEREAL_USER && env.ETHEREAL_PASS) {
			console.log(`[email:ethereal] Using persistent test account — ${env.ETHEREAL_USER}`);
			transporterPromise = Promise.resolve(
				nodemailer.createTransport({
					host: 'smtp.ethereal.email',
					port: 587,
					secure: false,
					auth: { user: env.ETHEREAL_USER, pass: env.ETHEREAL_PASS },
				})
			);
		} else {
			transporterPromise = nodemailer.createTestAccount().then((account) => {
				console.log(
					`[email:ethereal] No ETHEREAL_USER/ETHEREAL_PASS set — created a one-off test account: ${account.user}`
				);
				console.log(
					'[email:ethereal] Tip: run `npx tsx scripts/create-ethereal-account.ts` once and set ETHEREAL_USER/ETHEREAL_PASS in .env to reuse a single inbox.'
				);
				return nodemailer.createTransport({
					host: account.smtp.host,
					port: account.smtp.port,
					secure: account.smtp.secure,
					auth: { user: account.user, pass: account.pass },
				});
			});
		}
	}
	return transporterPromise;
}

export const etherealProvider: EmailProvider = {
	async send(message: EmailMessage): Promise<void> {
		const transporter = await getTransporter();
		const info = await transporter.sendMail({
			from: env.EMAIL_FROM,
			to: message.to,
			subject: message.subject,
			html: message.html,
			text: message.text,
		});

		console.log(`[email:ethereal] Sent "${message.subject}" to ${message.to}`);
		const previewUrl = nodemailer.getTestMessageUrl(info);
		if (previewUrl) {
			console.log(`[email:ethereal] Preview: ${previewUrl}`);
		}
	},
};
