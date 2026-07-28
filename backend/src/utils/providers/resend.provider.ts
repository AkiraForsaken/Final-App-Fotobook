import { Resend } from 'resend';
import { env } from '../../schemas/env.js';
import type { EmailMessage, EmailProvider } from '../../types/email.types.js';

let client: Resend | null = null;

function getClient(): Resend {
	if (!client) {
		if (!env.RESEND_API_KEY) {
			// schemas/env.ts already enforces this at startup when
			// EMAIL_PROVIDER=resend, so this branch should be unreachable.
			throw new Error('RESEND_API_KEY is not configured.');
		}
		client = new Resend(env.RESEND_API_KEY);
	}
	return client;
}

export const resendProvider: EmailProvider = {
	async send(message: EmailMessage): Promise<void> {
		const target = 'dasdsa347@gmail.com';
		const { error } = await getClient().emails.send({
			from: env.EMAIL_FROM, // Resend's shared onboarding@resend.dev domain for now
			to: target,
			subject: message.subject,
			html: message.html,
			text: message.text,
		});

		if (error) {
			throw new Error(`Resend failed to send email: ${error.message}`);
		}
	},
};
