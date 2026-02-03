import { createRoute, z } from "@hono/zod-openapi";
import {
	emailAddressParamSchema,
	emailDeleteSuccessResponseSchema,
	emailDetailSuccessResponseSchema,
	emailIdParamSchema,
	emailListSuccessResponseSchema,
	emailQuerySchema,
	emailsDeleteSuccessResponseSchema,
	errorResponseSchema,
	domainsSuccessResponseSchema,
	lockingRequestSchema,
	lockingSuccessResponseSchema,
	inboxStatusSuccessResponseSchema,
} from "./index";

const apiKeyHeader = z.object({
	"X-API-Key": z.string().openapi({
		description: "API Key for authentication",
		example: "your-api-key",
	}),
});

const inboxPasswordHeader = z.object({
	"x-inbox-password": z.string().optional().openapi({
		description: "Password for locked inboxes",
		example: "your-inbox-password",
	}),
});

// Get emails route
export const getEmailsRoute = createRoute({
	method: "get",
	path: "/emails/{emailAddress}",
	request: {
		params: emailAddressParamSchema,
		query: emailQuerySchema,
		headers: inboxPasswordHeader,
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: emailListSuccessResponseSchema,
				},
			},
			description: "Successfully retrieved emails",
		},
		401: {
			content: {
				"application/json": {
					schema: errorResponseSchema,
				},
			},
			description: "Unauthorized",
		},
	},
	tags: ["Emails"],
	summary: "Get emails",
	security: [{ apiKey: [] }],
});

// Delete emails route
export const deleteEmailsRoute = createRoute({
	method: "delete",
	path: "/emails/{emailAddress}",
	request: {
		params: emailAddressParamSchema,
		headers: inboxPasswordHeader,
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: emailsDeleteSuccessResponseSchema,
				},
			},
			description: "Successfully deleted emails",
		},
		401: {
			content: {
				"application/json": {
					schema: errorResponseSchema,
				},
			},
			description: "Unauthorized",
		},
	},
	tags: ["Emails"],
	summary: "Delete all emails",
	security: [{ apiKey: [] }],
});

// Get single email route
export const getEmailRoute = createRoute({
	method: "get",
	path: "/inbox/{emailId}",
	request: {
		params: emailIdParamSchema,
		headers: inboxPasswordHeader,
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: emailDetailSuccessResponseSchema,
				},
			},
			description: "Successfully retrieved email details",
		},
		401: {
			content: {
				"application/json": {
					schema: errorResponseSchema,
				},
			},
			description: "Unauthorized",
		},
		404: {
			content: {
				"application/json": {
					schema: errorResponseSchema,
				},
			},
			description: "Email not found",
		},
	},
	tags: ["Inbox"],
	summary: "Get email",
	security: [{ apiKey: [] }],
});

// Delete single email route
export const deleteEmailRoute = createRoute({
	method: "delete",
	path: "/inbox/{emailId}",
	request: {
		params: emailIdParamSchema,
		headers: inboxPasswordHeader,
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: emailDeleteSuccessResponseSchema,
				},
			},
			description: "Successfully deleted email",
		},
		401: {
			content: {
				"application/json": {
					schema: errorResponseSchema,
				},
			},
			description: "Unauthorized",
		},
	},
	tags: ["Inbox"],
	summary: "Delete email",
	security: [{ apiKey: [] }],
});

// Get domains route
export const getDomainsRoute = createRoute({
	method: "get",
	path: "/domains",
	responses: {
		200: {
			content: {
				"application/json": {
					schema: domainsSuccessResponseSchema,
				},
			},
			description: "List of supported domains",
		},
	},
	tags: ["System"],
	summary: "Get supported domains",
});

// Locking route
export const lockInboxRoute = createRoute({
	method: "post",
	path: "/inbox/{emailAddress}/lock",
	request: {
		params: emailAddressParamSchema,
		body: {
			content: {
				"application/json": {
					schema: z.object({ password: z.string().min(8) }),
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: lockingSuccessResponseSchema,
				},
			},
			description: "Successfully locked inbox",
		},
		401: {
			content: {
				"application/json": {
					schema: errorResponseSchema,
				},
			},
			description: "Unauthorized",
		},
	},
	tags: ["Inbox"],
	summary: "Lock inbox with password",
	security: [{ apiKey: [] }],
});

// Unlocking route
export const unlockInboxRoute = createRoute({
	method: "post",
	path: "/inbox/{emailAddress}/unlock",
	request: {
		params: emailAddressParamSchema,
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: lockingSuccessResponseSchema,
				},
			},
			description: "Successfully unlocked inbox",
		},
		401: {
			content: {
				"application/json": {
					schema: errorResponseSchema,
				},
			},
			description: "Unauthorized - wrong API key",
		},
	},
	tags: ["Inbox"],
	summary: "Unlock inbox",
	security: [{ apiKey: [] }],
});

// Status route
export const getInboxStatusRoute = createRoute({
	method: "get",
	path: "/inbox/{emailAddress}/status",
	request: {
		params: emailAddressParamSchema,
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: inboxStatusSuccessResponseSchema,
				},
			},
			description: "Successfully retrieved inbox status",
		},
		401: {
			content: {
				"application/json": {
					schema: errorResponseSchema,
				},
			},
			description: "Unauthorized",
		},
	},
	tags: ["Inbox"],
	summary: "Check if inbox is locked",
	security: [{ apiKey: [] }],
});

