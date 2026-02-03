import { createRoute } from "@hono/zod-openapi";
import { errorResponseSchema } from "@/schemas/emails";
import {
	apiKeyCreatedResponseSchema,
	apiKeyDeletedResponseSchema,
	apiKeyDetailResponseSchema,
	apiKeyIdParamSchema,
	apiKeyListResponseSchema,
	apiKeyNotFoundResponseSchema,
	createApiKeyRequestSchema,
	unauthorizedResponseSchema,
} from "./index";

// Create API key route (requires master key)
export const createApiKeyRoute = createRoute({
	method: "post",
	path: "/api-keys",
	request: {
		body: {
			content: {
				"application/json": {
					schema: createApiKeyRequestSchema,
				},
			},
			required: false,
		},
	},
	responses: {
		201: {
			content: {
				"application/json": {
					schema: apiKeyCreatedResponseSchema,
				},
			},
			description: "API key created successfully. The key is only shown once.",
		},
		400: {
			content: {
				"application/json": {
					schema: errorResponseSchema,
				},
			},
			description: "Validation error - invalid request body",
		},
		401: {
			content: {
				"application/json": {
					schema: unauthorizedResponseSchema,
				},
			},
			description: "Unauthorized - missing or invalid master key",
		},
	},
	tags: ["API Keys"],
	summary: "Create API key",
	description:
		"Create a new API key with full access to all emails. Requires master key authentication via X-Master-Key header.",
	security: [{ masterKey: [] }],
});

// List API keys route (requires master key)
export const listApiKeysRoute = createRoute({
	method: "get",
	path: "/api-keys",
	responses: {
		200: {
			content: {
				"application/json": {
					schema: apiKeyListResponseSchema,
				},
			},
			description: "List of API keys",
		},
		401: {
			content: {
				"application/json": {
					schema: unauthorizedResponseSchema,
				},
			},
			description: "Unauthorized - missing or invalid master key",
		},
	},
	tags: ["API Keys"],
	summary: "List API keys",
	description:
		"List all API keys. Requires master key authentication via X-Master-Key header.",
	security: [{ masterKey: [] }],
});

// Get API key route (requires master key)
export const getApiKeyRoute = createRoute({
	method: "get",
	path: "/api-keys/{keyId}",
	request: {
		params: apiKeyIdParamSchema,
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: apiKeyDetailResponseSchema,
				},
			},
			description: "API key details",
		},
		401: {
			content: {
				"application/json": {
					schema: unauthorizedResponseSchema,
				},
			},
			description: "Unauthorized - missing or invalid master key",
		},
		404: {
			content: {
				"application/json": {
					schema: apiKeyNotFoundResponseSchema,
				},
			},
			description: "API key not found",
		},
	},
	tags: ["API Keys"],
	summary: "Get API key",
	description:
		"Get details of a specific API key. Requires master key authentication via X-Master-Key header.",
	security: [{ masterKey: [] }],
});

// Delete API key route (requires master key)
export const deleteApiKeyRoute = createRoute({
	method: "delete",
	path: "/api-keys/{keyId}",
	request: {
		params: apiKeyIdParamSchema,
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: apiKeyDeletedResponseSchema,
				},
			},
			description: "API key deleted successfully",
		},
		401: {
			content: {
				"application/json": {
					schema: unauthorizedResponseSchema,
				},
			},
			description: "Unauthorized - missing or invalid master key",
		},
		404: {
			content: {
				"application/json": {
					schema: apiKeyNotFoundResponseSchema,
				},
			},
			description: "API key not found",
		},
	},
	tags: ["API Keys"],
	summary: "Delete API key",
	description:
		"Delete a specific API key. Requires master key authentication via X-Master-Key header.",
	security: [{ masterKey: [] }],
});

// Revoke API key route (requires master key) - soft delete
export const revokeApiKeyRoute = createRoute({
	method: "post",
	path: "/api-keys/{keyId}/revoke",
	request: {
		params: apiKeyIdParamSchema,
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: apiKeyDetailResponseSchema,
				},
			},
			description: "API key revoked successfully",
		},
		401: {
			content: {
				"application/json": {
					schema: unauthorizedResponseSchema,
				},
			},
			description: "Unauthorized - missing or invalid master key",
		},
		404: {
			content: {
				"application/json": {
					schema: apiKeyNotFoundResponseSchema,
				},
			},
			description: "API key not found",
		},
	},
	tags: ["API Keys"],
	summary: "Revoke API key",
	description:
		"Revoke a specific API key (soft delete - sets is_active to false). Requires master key authentication via X-Master-Key header.",
	security: [{ masterKey: [] }],
});
