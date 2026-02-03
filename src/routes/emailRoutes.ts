// External imports
import { OpenAPIHono } from "@hono/zod-openapi";

// Configuration imports
import { CACHE } from "@/config/constants";
import { DOMAINS_SET } from "@/config/domains";

// Database imports
import { createDatabaseService } from "@/database";

// Schema imports
import {
	deleteEmailRoute,
	deleteEmailsRoute,
	getDomainsRoute,
	getEmailRoute,
	getEmailsRoute,
	lockInboxRoute,
	unlockInboxRoute,
	getInboxStatusRoute,
} from "@/schemas/emails/routeDefinitions";

// Middleware imports
import { apiKeyAuth } from "@/middlewares/apiKeyAuth";
import { inboxLockAuth } from "@/middlewares/inboxLockAuth";

// Utility imports
import { ERR, OK } from "@/utils/http";
import { validateEmailDomain } from "@/utils/validation";

const emailRoutes = new OpenAPIHono<{ Bindings: CloudflareBindings; Variables: { apiKeyId: string } }>();

// Apply API key auth to email and inbox routes
emailRoutes.use("/emails/*", apiKeyAuth);
emailRoutes.use("/inbox/*", apiKeyAuth);

// Apply inbox lock auth to specific routes
emailRoutes.use("/emails/:emailAddress", inboxLockAuth);
emailRoutes.use("/inbox/:emailId", inboxLockAuth);

// --- Route Handlers ---

// @ts-ignore
emailRoutes.openapi(getEmailsRoute, async (c) => {
	const { emailAddress } = c.req.valid("param");
	const { limit, cursor } = c.req.valid("query");

	const domainValidation = validateEmailDomain(emailAddress);
	if (!domainValidation.valid) return c.json(ERR("Domain not supported"), 404);

	const dbService = createDatabaseService(c.env.D1);
	const { results, nextCursor, error } = await dbService.getEmailsByRecipient(emailAddress, limit, cursor);
	const { result: status } = await dbService.getInboxStatus(emailAddress);

	if (error) return c.json(ERR("Database error"), 500);

	return c.json(OK({
		items: results,
		nextCursor,
		locked: status.locked,
		isPrivate: status.isPrivate,
	}));
});

// @ts-ignore
emailRoutes.openapi(deleteEmailsRoute, async (c) => {
	const { emailAddress } = c.req.valid("param");

	const domainValidation = validateEmailDomain(emailAddress);
	if (!domainValidation.valid) return c.json(ERR("Domain not supported"), 404);

	const dbService = createDatabaseService(c.env.D1);
	const { meta, error } = await dbService.deleteEmailsByRecipient(emailAddress);

	if (error) return c.json(ERR("Database error"), 500);
	return c.json(OK({ deletedCount: meta?.changes || 0 }));
});

// @ts-ignore
emailRoutes.openapi(getEmailRoute, async (c) => {
	const { emailId } = c.req.valid("param");
	const dbService = createDatabaseService(c.env.D1);
	const { result, error } = await dbService.getEmailById(emailId);

	if (error) return c.json(ERR("Database error"), 500);
	if (!result) return c.json(ERR("Email not found"), 404);
	return c.json(OK(result));
});

// @ts-ignore
emailRoutes.openapi(deleteEmailRoute, async (c) => {
	const { emailId } = c.req.valid("param");
	const dbService = createDatabaseService(c.env.D1);
	const { meta, error } = await dbService.deleteEmailById(emailId);

	if (error) return c.json(ERR("Database error"), 500);
	if (meta && meta.changes === 0) return c.json(ERR("Email not found"), 404);
	return c.json(OK({ message: "Email deleted successfully" }));
});

// @ts-ignore
emailRoutes.openapi(getDomainsRoute, async (c) => {
	const domains = Array.from(DOMAINS_SET);
	return c.json(OK({
		public: domains,
		temp: [],
		stats: {
			public: domains.length,
			temp: 0,
			private: 0, // Could be calculated if needed
		},
	}));
});

// @ts-ignore
emailRoutes.openapi(lockInboxRoute, async (c) => {
	const { emailAddress } = c.req.valid("param");
	const { password } = c.req.valid("json");
	const apiKeyId = c.get("apiKeyId");

	const dbService = createDatabaseService(c.env.D1);
	const { success, error } = await dbService.lockInbox(emailAddress, password, apiKeyId);

	if (error) return c.json(ERR("Failed to lock inbox"), 500);
	return c.json(OK({ message: "Inbox locked successfully" }));
});

// @ts-ignore
emailRoutes.openapi(unlockInboxRoute, async (c) => {
	const { emailAddress } = c.req.valid("param");
	const apiKeyId = c.get("apiKeyId");

	const dbService = createDatabaseService(c.env.D1);
	const { result: inbox } = await dbService.getInboxDetails(emailAddress);

	if (!inbox) return c.json(ERR("Inbox not found"), 404);
	if (inbox.owner_api_key_id !== apiKeyId) {
		return c.json(ERR("Only the API key that locked this inbox can unlock it"), 401);
	}

	const { success, error } = await dbService.unlockInbox(emailAddress);
	if (error) return c.json(ERR("Failed to unlock inbox"), 500);
	return c.json(OK({ message: "Inbox unlocked successfully" }));
});

// @ts-ignore
emailRoutes.openapi(getInboxStatusRoute, async (c) => {
	const { emailAddress } = c.req.valid("param");
	const dbService = createDatabaseService(c.env.D1);
	const { result, error } = await dbService.getInboxStatus(emailAddress);

	if (error) return c.json(ERR("Database error"), 500);
	return c.json(OK(result));
});

export default emailRoutes;
