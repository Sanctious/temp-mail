import { z } from "@hono/zod-openapi";

// Attachment schemas
export const attachmentSchema = z
	.object({
		id: z.string().openapi({
			description: "The unique identifier for the attachment.",
		}),
		emailId: z.string().openapi({
			description: "The ID of the email this attachment belongs to.",
		}),
		filename: z.string().openapi({
			description: "The original filename of the attachment.",
		}),
		contentType: z.string().openapi({
			description: "The MIME type of the attachment.",
		}),
		size: z.number().openapi({
			description: "The size of the attachment in bytes.",
		}),
		r2Key: z.string().openapi({
			description: "The R2 storage key for the attachment.",
		}),
		createdAt: z.number().openapi({
			description: "The timestamp when the attachment was created (Unix epoch).",
		}),
	})
	.openapi("Attachment");

export const attachmentSummarySchema = z
	.object({
		id: z.string().openapi({
			description: "The unique identifier for the attachment.",
		}),
		filename: z.string().openapi({
			description: "The original filename of the attachment.",
		}),
		contentType: z.string().openapi({
			description: "The MIME type of the attachment.",
		}),
		size: z.number().openapi({
			description: "The size of the attachment in bytes.",
		}),
		createdAt: z.number().openapi({
			description: "The timestamp when the attachment was created (Unix epoch).",
		}),
	})
	.openapi("AttachmentSummary");

// Parameter schemas
export const attachmentIdParamSchema = z.object({
	attachmentId: z
		.string()
		.openapi({
			param: {
				name: "attachmentId",
				in: "path",
			},
			description: "The unique identifier for the attachment.",
		}),
});

// Response schemas
export const attachmentSuccessResponseSchema = z
	.object({
		success: z.literal(true).openapi({
			description: "Indicates that the request was successful.",
		}),
		result: attachmentSchema,
	})
	.openapi("AttachmentSuccessResponse");

export const attachmentsSuccessResponseSchema = z
	.object({
		success: z.literal(true).openapi({
			description: "Indicates that the request was successful.",
		}),
		result: z.array(attachmentSummarySchema),
	})
	.openapi("AttachmentsSuccessResponse");

export const attachmentDeleteSuccessResponseSchema = z
	.object({
		success: z.literal(true).openapi({
			description: "Indicates that the request was successful.",
		}),
		result: z.object({
			message: z.string().openapi({
				description: "A message indicating the attachment was deleted.",
			}),
		}),
	})
	.openapi("AttachmentDeleteSuccessResponse");

export const attachmentNotFoundErrorResponseSchema = z
	.object({
		success: z.literal(false).openapi({
			description: "Indicates that the request failed because the attachment was not found.",
		}),
		error: z.string().openapi({
			description: "The error message.",
		}),
	})
	.openapi("AttachmentNotFoundErrorResponse");

// Type exports
export type Attachment = z.infer<typeof attachmentSchema>;
export type AttachmentSummary = z.infer<typeof attachmentSummarySchema>;
