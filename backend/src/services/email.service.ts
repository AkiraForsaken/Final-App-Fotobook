import { env } from '../schemas/env.js';
import { EmailDeliveryError } from '../utils/app-error.js';
import { etherealProvider } from '../utils/providers/ethereal.provider.js';
import { resendProvider } from '../utils/providers/resend.provider.js';
import { buildVerificationEmail, buildPasswordResetEmail } from '../utils/templates.js';
import type { EmailMessage, EmailProvider } from '../types/email.types.js';

const providers: Record<typeof env.EMAIL_PROVIDER, EmailProvider> = {
	ethereal: etherealProvider,
	resend: resendProvider,
};

const provider = providers[env.EMAIL_PROVIDER];

async function sendOrThrow(message: EmailMessage): Promise<void> {
	try {
		await provider.send(message);
	} catch (err) {
		console.error(`[email] Failed to send "${message.subject}" to ${message.to}:`, err);
		// Callers (signup / forgotPassword / updateProfile) are expected to let
		// this propagate BEFORE any DB write for the affected flow — see the
		// send-then-persist pattern used in auth.service.ts / profile.service.ts.
		throw new EmailDeliveryError('Failed to send email. Please try again in a moment.');
	}
}

export async function sendVerificationEmail(
	user: { email: string; firstName: string },
	token: string
): Promise<void> {
	await sendOrThrow(buildVerificationEmail(user.email, user.firstName, token));
}

export async function sendPasswordResetEmail(
	user: { email: string; firstName: string },
	token: string
): Promise<void> {
	await sendOrThrow(buildPasswordResetEmail(user.email, user.firstName, token));
}
