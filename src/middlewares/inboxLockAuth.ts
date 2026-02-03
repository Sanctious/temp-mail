import type { Context, Next } from "hono";
import { createDatabaseService } from "@/database";
import { ERR } from "@/utils/http";

/**
 * Middleware to check if an inbox is locked and validate the password.
 * This middleware expects the email address or email ID to be in the params.
 */
export async function inboxLockAuth(c: Context, next: Next) {
	const emailAddress = c.req.param("emailAddress");
	const emailId = c.req.param("emailId");
	const password = c.req.header("x-inbox-password");

	const dbService = createDatabaseService(c.env.D1);
	let targetAddress = emailAddress;

	// If emailId is provided, resolve the address first
	if (!targetAddress && emailId) {
		const { result: email, error } = await dbService.getEmailById(emailId);
		if (error || !email) {
			return c.json(ERR("Email not found", "NotFound"), 404);
		}
		targetAddress = email.toAddress;
	}

	if (!targetAddress) {
		return await next();
	}

	const { result: status, error: statusError } = await dbService.getInboxStatus(targetAddress);
	if (statusError) {
		return c.json(ERR("Internal server error", "ServerError"), 500);
	}

	if (status.locked) {
		if (!password) {
			return c.json(ERR("This inbox is locked. Please provide x-inbox-password header.", "Unauthorized"), 401);
		}

		const { result: inbox } = await dbService.getInboxDetails(targetAddress);
		if (!inbox || inbox.password_hash !== password) {
			return c.json(ERR("Invalid inbox password", "Unauthorized"), 401);
		}
	}

	await next();
}
