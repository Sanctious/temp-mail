import { createId } from "@paralleldrive/cuid2";
import PostalMime from "postal-mime";
import * as db from "@/database/d1";
import { emailSchema } from "@/schemas/emails";
import { now } from "@/utils/helpers";
import { processEmailContent } from "@/utils/mail";
import { PerformanceTimer } from "@/utils/performance";

/**
 * Cloudflare email router handler
 */
export async function handleEmail(
	message: ForwardableEmailMessage,
	env: CloudflareBindings,
	ctx: ExecutionContext,
) {
	try {
		const timer = new PerformanceTimer("email-processing");
		const emailId = createId();
		const email = await PostalMime.parse(message.raw);

		// Process email content
		const { htmlContent, textContent } = processEmailContent(
			email.html ?? null,
			email.text ?? null,
		);

		// Set expiration to 7 days from now (permanent emails still have an expiry for cleanup)
		const retentionPeriod = 7 * 24 * 60 * 60; // 7 days
		const expiresAt = now() + retentionPeriod;

		const emailData = emailSchema.parse({
			id: emailId,
			fromAddress: message.from,
			toAddress: message.to,
			subject: email.subject || null,
			receivedAt: now(),
			expiresAt: expiresAt,
			htmlContent: htmlContent,
			textContent: textContent,
			hasAttachments: false,
			attachmentCount: 0,
		});

		// Insert email
		const { success, error } = await db.insertEmail(env.D1, emailData);

		if (!success) {
			throw new Error(`Failed to insert email: ${error}`);
		}

		timer.end();
	} catch (error) {
		console.error("Failed to process email:", error);
		throw error;
	}
}
