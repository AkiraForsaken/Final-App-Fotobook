import { env } from '../schemas/env.js';
import type { EmailMessage } from '../types/email.types.js';

function escapeHtml(value: string): string {
	return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function wrapHtml(title: string, bodyHtml: string, actionLabel: string, actionUrl: string): string {
	return `<!DOCTYPE html>
<html>
	<body style="font-family: Helvetica, Arial, sans-serif; background-color: #f4f5f7; padding: 32px 0; margin: 0;">
		<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
			<tr>
				<td align="center">
					<table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; padding: 32px;">
						<tr>
							<td>
								<h1 style="font-size: 20px; color: #111827; margin: 0 0 16px;">Fotobook</h1>
								<h2 style="font-size: 16px; color: #111827; margin: 0 0 12px;">${title}</h2>
								${bodyHtml}
								<table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
									<tr>
										<td style="background-color: #2563eb; border-radius: 8px;">
											<a href="${actionUrl}" style="display: inline-block; padding: 12px 20px; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600;">${actionLabel}</a>
										</td>
									</tr>
								</table>
								<p style="font-size: 12px; color: #6b7280; word-break: break-all; margin: 0;">
									If the button doesn't work, copy and paste this link into your browser:<br />
									<a href="${actionUrl}" style="color: #2563eb;">${actionUrl}</a>
								</p>
							</td>
						</tr>
					</table>
				</td>
			</tr>
		</table>
	</body>
</html>`;
}

/**
 * Verification-token TTL (24h) and reset-token TTL (1h) mentioned in the
 * copy below must stay in sync with EMAIL_VERIFICATION_TOKEN_TTL_HOURS /
 * PASSWORD_RESET_TOKEN_TTL_HOURS in auth.service.ts / token.service.ts.
 */

export function buildVerificationEmail(to: string, firstName: string, token: string): EmailMessage {
	const verifyUrl = `${env.FRONTEND_URL}/verify-email?token=${encodeURIComponent(token)}`;
	const safeName = escapeHtml(firstName);

	return {
		to,
		subject: 'Verify your Fotobook email address',
		html: wrapHtml(
			'Confirm your email address',
			`<p style="font-size: 14px; color: #374151; margin: 0 0 12px;">Hi ${safeName},</p>
			<p style="font-size: 14px; color: #374151; margin: 0;">Please confirm this is your email address to finish setting up your Fotobook account. This link expires in 24 hours.</p>`,
			'Verify email',
			verifyUrl
		),
		text: `Hi ${firstName},\n\nPlease confirm your Fotobook email address by visiting the link below. This link expires in 24 hours.\n\n${verifyUrl}\n\nIf you didn't create a Fotobook account, you can ignore this email.`,
	};
}

export function buildPasswordResetEmail(
	to: string,
	firstName: string,
	token: string
): EmailMessage {
	const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${encodeURIComponent(token)}`;
	const safeName = escapeHtml(firstName);

	return {
		to,
		subject: 'Reset your Fotobook password',
		html: wrapHtml(
			'Reset your password',
			`<p style="font-size: 14px; color: #374151; margin: 0 0 12px;">Hi ${safeName},</p>
			<p style="font-size: 14px; color: #374151; margin: 0;">We received a request to reset your Fotobook password. This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>`,
			'Reset password',
			resetUrl
		),
		text: `Hi ${firstName},\n\nWe received a request to reset your Fotobook password. This link expires in 1 hour.\n\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.`,
	};
}
