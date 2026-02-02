// External imports
import { OpenAPIHono } from "@hono/zod-openapi";

// Database imports
import { createDatabaseService } from "@/database";

// Middleware imports
import { masterKeyAuth } from "@/middlewares/masterKeyAuth";

// Schema imports
import {
	createApiKeyRoute,
	deleteApiKeyRoute,
	getApiKeyRoute,
	listApiKeysRoute,
	revokeApiKeyRoute,
} from "@/schemas/apiKeys/routeDefinitions";

// Utility imports
import { generateApiKey, generateApiKeyId, hashApiKey } from "@/utils/auth";
import { now } from "@/utils/helpers";
import { ERR, OK } from "@/utils/http";

const apiKeyRoutes = new OpenAPIHono<{ Bindings: CloudflareBindings }>();

// Apply master key auth to API key routes only
apiKeyRoutes.use("/api-keys/*", masterKeyAuth);
apiKeyRoutes.use("/api-keys", masterKeyAuth);

// @ts-ignore - OpenAPI route handler type mismatch with error response status codes
apiKeyRoutes.openapi(createApiKeyRoute, async (c) => {
	const body = await c.req.json().catch(() => ({}));
	const { name, expires_in_days } = body as { name?: string; expires_in_days?: number };

	// Generate the API key
	const apiKey = generateApiKey();
	const keyHash = await hashApiKey(apiKey);
	const keyId = generateApiKeyId();
	const createdAt = now();
	const expiresAt = expires_in_days ? createdAt + expires_in_days * 24 * 60 * 60 : null;

	const dbService = createDatabaseService(c.env.D1);
	const { success, error } = await dbService.insertApiKey({
		id: keyId,
		key_hash: keyHash,
		name: name || null,
		created_at: createdAt,
		expires_at: expiresAt,
		is_active: true,
	});

	if (error) return c.json(ERR(error.message, "D1Error"), 500);

	return c.json(
		OK({
			id: keyId,
			key: apiKey,
			name: name || null,
			created_at: createdAt,
			last_used_at: null,
			expires_at: expiresAt,
			is_active: true,
		}),
		201,
	);
});

// @ts-ignore - OpenAPI route handler type mismatch with error response status codes
apiKeyRoutes.openapi(listApiKeysRoute, async (c) => {
	const dbService = createDatabaseService(c.env.D1);
	const { results, error } = await dbService.listApiKeys();

	if (error) return c.json(ERR(error.message, "D1Error"), 500);
	return c.json(OK(results));
});

// @ts-ignore - OpenAPI route handler type mismatch with error response status codes
apiKeyRoutes.openapi(getApiKeyRoute, async (c) => {
	const { keyId } = c.req.valid("param");

	const dbService = createDatabaseService(c.env.D1);
	const { result, error } = await dbService.getApiKeyById(keyId);

	if (error) return c.json(ERR(error.message, "D1Error"), 500);
	if (!result) return c.json(ERR("API key not found", "NotFound"), 404);
	return c.json(OK(result));
});

// @ts-ignore - OpenAPI route handler type mismatch with error response status codes
apiKeyRoutes.openapi(deleteApiKeyRoute, async (c) => {
	const { keyId } = c.req.valid("param");

	const dbService = createDatabaseService(c.env.D1);

	// Check if the key exists
	const { result: existingKey, error: getError } = await dbService.getApiKeyById(keyId);
	if (getError) return c.json(ERR(getError.message, "D1Error"), 500);
	if (!existingKey) return c.json(ERR("API key not found", "NotFound"), 404);

	const { meta, error } = await dbService.deleteApiKey(keyId);

	if (error) return c.json(ERR(error.message, "D1Error"), 500);
	if (meta && meta.changes === 0) return c.json(ERR("API key not found", "NotFound"), 404);
	return c.json(OK({ message: "API key deleted successfully" }));
});

// @ts-ignore - OpenAPI route handler type mismatch with error response status codes
apiKeyRoutes.openapi(revokeApiKeyRoute, async (c) => {
	const { keyId } = c.req.valid("param");

	const dbService = createDatabaseService(c.env.D1);

	// Check if the key exists
	const { result: existingKey, error: getError } = await dbService.getApiKeyById(keyId);
	if (getError) return c.json(ERR(getError.message, "D1Error"), 500);
	if (!existingKey) return c.json(ERR("API key not found", "NotFound"), 404);

	const { error } = await dbService.revokeApiKey(keyId);

	if (error) return c.json(ERR(error.message, "D1Error"), 500);

	// Return the updated key
	const { result: updatedKey } = await dbService.getApiKeyById(keyId);
	return c.json(OK(updatedKey));
});

export default apiKeyRoutes;
