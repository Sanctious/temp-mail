import { createRoute, z } from "@hono/zod-openapi";
import {
	attachmentIdParamSchema,
	attachmentSuccessResponseSchema,
	attachmentsSuccessResponseSchema,
	attachmentDeleteSuccessResponseSchema,
	attachmentNotFoundErrorResponseSchema,
} from "./index";
import { emailIdParamSchema } from "@/schemas/emails";

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

// Get attachments for an email
export const getAttachmentsByEmailIdRoute = createRoute({
	method: "get",
	path: "/attachments/email/{emailId}",
	request: {
		params: emailIdParamSchema,
		headers: inboxPasswordHeader,
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: attachmentsSuccessResponseSchema,
				},
			},
			description: "Successfully retrieved attachments",
		},
	},
	tags: ["Attachments"],
	summary: "List attachments for an email",
	security: [{ apiKey: [] }],
});

// Download attachment
export const downloadAttachmentRoute = createRoute({
	method: "get",
	path: "/attachments/{attachmentId}",
	request: {
		params: attachmentIdParamSchema,
		headers: inboxPasswordHeader,
	},
	responses: {
		200: {
			description: "Attachment file content",
		},
		404: {
			content: {
				"application/json": {
					schema: attachmentNotFoundErrorResponseSchema,
				},
			},
			description: "Attachment not found",
		},
	},
	tags: ["Attachments"],
	summary: "Download an attachment",
	security: [{ apiKey: [] }],
});

// Delete attachment
export const deleteAttachmentRoute = createRoute({
	method: "delete",
	path: "/attachments/{attachmentId}",
	request: {
		params: attachmentIdParamSchema,
		headers: inboxPasswordHeader,
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: attachmentDeleteSuccessResponseSchema,
				},
			},
			description: "Successfully deleted attachment",
		},
	},
	tags: ["Attachments"],
	summary: "Delete an attachment",
	security: [{ apiKey: [] }],
});


