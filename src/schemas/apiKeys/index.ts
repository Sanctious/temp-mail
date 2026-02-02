import { z } from "@hono/zod-openapi";

// API Key object schema
export const apiKeySchema = z
	.object({
		id: z.string().openapi({
			description: "The unique identifier for the API key.",
			example: "ak_usm2sw0qfv9a5ku9z4xmh8og",
		}),
		name: z.string().nullable().openapi({
			description: "A friendly name for the API key.",
			example: "My App Key",
		}),
		created_at: z.number().openapi({
			description: "The timestamp when the API key was created (Unix epoch).",
			example: 1753317948,
		}),
		last_used_at: z.number().nullable().openapi({
			description: "The timestamp when the API key was last used (Unix epoch).",
			example: 1753317948,
		}),
		expires_at: z.number().nullable().openapi({
			description: "The timestamp when the API key expires (Unix epoch). Null means no expiration.",
			example: 1753317948,
		}),
		is_active: z.boolean().openapi({
			description: "Whether the API key is active.",
			example: true,
		}),
	})
	.openapi("ApiKey");

// API Key with the actual key (only returned on creation)
export const apiKeyWithSecretSchema = apiKeySchema
	.extend({
		key: z.string().openapi({
			description: "The API key secret. Only shown once upon creation.",
			example: "tm_abc123xyz789...",
		}),
	})
	.openapi("ApiKeyWithSecret");

// Request schemas
export const createApiKeyRequestSchema = z
	.object({
		name: z.string().max(100).optional().openapi({
			description: "A friendly name for the API key.",
			example: "My App Key",
		}),
		expires_in_days: z.number().min(1).max(365).optional().openapi({
			description: "Number of days until the API key expires. Omit for no expiration.",
			example: 30,
		}),
	})
	.openapi("CreateApiKeyRequest");

export const apiKeyIdParamSchema = z.object({
	keyId: z
		.string()
		.openapi({
			param: {
				name: "keyId",
				in: "path",
			},
			example: "ak_usm2sw0qfv9a5ku9z4xmh8og",
			description: "The unique identifier for the API key.",
		}),
});

// Response schemas
export const apiKeyCreatedResponseSchema = z
	.object({
		success: z.literal(true).openapi({
			description: "Indicates that the request was successful.",
			example: true,
		}),
		result: apiKeyWithSecretSchema,
	})
	.openapi("ApiKeyCreatedResponse");

export const apiKeyListResponseSchema = z
	.object({
		success: z.literal(true).openapi({
			description: "Indicates that the request was successful.",
			example: true,
		}),
		result: z.array(apiKeySchema),
	})
	.openapi("ApiKeyListResponse");

export const apiKeyDetailResponseSchema = z
	.object({
		success: z.literal(true).openapi({
			description: "Indicates that the request was successful.",
			example: true,
		}),
		result: apiKeySchema,
	})
	.openapi("ApiKeyDetailResponse");

export const apiKeyDeletedResponseSchema = z
	.object({
		success: z.literal(true).openapi({
			description: "Indicates that the request was successful.",
			example: true,
		}),
		result: z.object({
			message: z.literal("API key deleted successfully").openapi({
				description: "A message indicating that the API key was deleted.",
				example: "API key deleted successfully",
			}),
		}),
	})
	.openapi("ApiKeyDeletedResponse");

export const apiKeyNotFoundResponseSchema = z
	.object({
		success: z.literal(false).openapi({
			description: "Indicates that the request failed because the API key was not found.",
			example: false,
		}),
		error: z.object({
			name: z.literal("NotFound").openapi({
				description: "The name of the error.",
				example: "NotFound",
			}),
			message: z.literal("API key not found").openapi({
				description: "The error message.",
				example: "API key not found",
			}),
		}),
	})
	.openapi("ApiKeyNotFoundResponse");

export const unauthorizedResponseSchema = z
	.object({
		success: z.literal(false).openapi({
			description: "Indicates that the request failed due to missing or invalid authentication.",
			example: false,
		}),
		error: z.object({
			name: z.literal("Unauthorized").openapi({
				description: "The name of the error.",
				example: "Unauthorized",
			}),
			message: z.string().openapi({
				description: "The error message.",
				example: "Invalid or missing API key",
			}),
		}),
	})
	.openapi("UnauthorizedResponse");

// Type exports
export type ApiKey = z.infer<typeof apiKeySchema>;
export type ApiKeyWithSecret = z.infer<typeof apiKeyWithSecretSchema>;
