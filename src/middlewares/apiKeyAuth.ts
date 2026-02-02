import type { Context, Next } from "hono";
import { createDatabaseService } from "@/database";
import { hashApiKey } from "@/utils/auth";
import { now } from "@/utils/helpers";
import { ERR } from "@/utils/http";

// Extended bindings with API key context variables
type ApiKeyVariables = {
	apiKeyId: string;
};

export type ApiKeyContext = Context<{
	Bindings: CloudflareBindings & { MASTER_KEY?: string };
	Variables: ApiKeyVariables;
}>;

/**
 * Middleware to authenticate requests using an API key.
 * The API key should be provided in the X-API-Key header.
 * API keys have full access to all emails.
 */
export async function apiKeyAuth(c: ApiKeyContext, next: Next) {
	const apiKey = c.req.header("X-API-Key");

	if (!apiKey) {
		return c.json(ERR("Unauthorized", "Missing X-API-Key header"), 401);
	}

	const dbService = createDatabaseService(c.env.D1);
	const keyHash = await hashApiKey(apiKey);
	const { result: apiKeyRecord, error } = await dbService.getApiKeyByHash(keyHash);

	if (error) {
		return c.json(ERR("ServerError", "Failed to validate API key"), 500);
	}

	if (!apiKeyRecord) {
		return c.json(ERR("Unauthorized", "Invalid API key"), 401);
	}

	// Check if the key has expired
	if (apiKeyRecord.expires_at && apiKeyRecord.expires_at < now()) {
		return c.json(ERR("Unauthorized", "API key has expired"), 401);
	}

	// Update last used timestamp (fire and forget)
	c.executionCtx.waitUntil(dbService.updateApiKeyLastUsed(apiKeyRecord.id, now()));

	// Store the API key ID in the context
	c.set("apiKeyId", apiKeyRecord.id);

	await next();
}
