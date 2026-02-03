import { z } from "@hono/zod-openapi";
import { DOMAINS_SET } from "@/config/domains";

// Parameter schemas
export const emailAddressParamSchema = z.object({
	emailAddress: z
		.string()
		.email()
		.openapi({
			param: {
				name: "emailAddress",
				in: "path",
			},
			description: "The email address to query for.",
		}),
});

export const emailIdParamSchema = z.object({
	emailId: z
		.string()
		.openapi({
			param: {
				name: "emailId",
				in: "path",
			},
			description: "The unique identifier for the email.",
		}),
});

// Query schemas
export const emailQuerySchema = z.object({
	limit: z.coerce.number().min(1).max(100).optional().default(10).openapi({
		description: "The maximum number of emails to return.",
	}),
	cursor: z.string().optional().openapi({
		description: "Pagination cursor for the next page.",
	}),
});

// Email object schemas
export const emailSchema = z
	.object({
		id: z.string().openapi({
			description: "The unique identifier for the email.",
		}),
		fromAddress: z.string().email().openapi({
			description: "The sender's email address.",
		}),
		toAddress: z.string().email().openapi({
			description: "The recipient's email address.",
		}),
		subject: z.string().nullable().openapi({
			description: "The subject of the email.",
		}),
		receivedAt: z.number().openapi({
			description: "The timestamp when the email was received (Unix epoch).",
		}),
		expiresAt: z.number().nullable().openapi({
			description: "The timestamp when the email will be auto-deleted (Unix epoch).",
		}),
		htmlContent: z.string().nullable().openapi({
			description: "The HTML content of the email.",
		}),
		textContent: z.string().nullable().openapi({
			description: "The plain text content of the email.",
		}),
		hasAttachments: z.boolean().default(false).openapi({
			description: "Whether the email has attachments.",
		}),
		attachmentCount: z.number().default(0).openapi({
			description: "The number of attachments in the email.",
		}),
	})
	.openapi("Email");

export const emailSummarySchema = z
	.object({
		id: z.string().openapi({
			description: "The unique identifier for the email.",
		}),
		fromAddress: z.string().email().openapi({
			description: "The sender's email address.",
		}),
		toAddress: z.string().email().openapi({
			description: "The recipient's email address.",
		}),
		subject: z.string().nullable().openapi({
			description: "The subject of the email.",
		}),
		receivedAt: z.number().openapi({
			description: "The timestamp when the email was received (Unix epoch).",
		}),
		expiresAt: z.number().nullable().openapi({
			description: "The timestamp when the email will be auto-deleted (Unix epoch).",
		}),
		hasAttachments: z.boolean().default(false).openapi({
			description: "Whether the email has attachments.",
		}),
		attachmentCount: z.number().default(0).openapi({
			description: "The number of attachments in the email.",
		}),
	})
	.openapi("EmailSummary");

// Response schemas
export const successResponseSchema = z
	.object({
		success: z.literal(true).openapi({
			description: "Indicates if the request was successful.",
		}),
		result: z.any().openapi({
			description: "The result of the request.",
		}),
	})
	.openapi("SuccessResponse");

export const emailListSuccessResponseSchema = z
	.object({
		success: z.literal(true).openapi({
			description: "Indicates that the request was successful.",
		}),
		result: z.object({
			items: z.array(emailSummarySchema),
			nextCursor: z.string().nullable().openapi({
				description: "Pagination cursor for the next page.",
			}),
			locked: z.boolean().openapi({
				description: "Whether this inbox is locked with a password.",
			}),
			isPrivate: z.boolean().openapi({
				description: "Whether this inbox is claimed (has a password set).",
			}),
		}),
	})
	.openapi("EmailListSuccessResponse");

export const emailDetailSuccessResponseSchema = z
	.object({
		success: z.literal(true).openapi({
			description: "Indicates that the request was successful.",
		}),
		result: emailSchema,
	})
	.openapi("EmailDetailSuccessResponse");

export const emailsDeleteSuccessResponseSchema = z
	.object({
		success: z.literal(true).openapi({
			description: "Indicates that the request was successful.",
		}),
		result: z.object({
			deletedCount: z.number().openapi({
				description: "The number of emails deleted.",
			}),
		}),
	})
	.openapi("DeleteEmailsSuccessResponse");

export const emailDeleteSuccessResponseSchema = z
	.object({
		success: z.literal(true).openapi({
			description: "Indicates that the request was successful.",
		}),
		result: z.object({
			message: z.string().openapi({
				description: "A message indicating the email was deleted.",
			}),
		}),
	})
	.openapi("DeleteEmailSuccessResponse");

export const domainsSuccessResponseSchema = z
	.object({
		success: z.literal(true).openapi({
			description: "Indicates that the request was successful.",
		}),
		result: z.object({
			public: z.array(z.string()).openapi({
				description: "List of public email domains.",
			}),
			temp: z.array(z.string()).openapi({
				description: "List of temporary email domains.",
			}),
			stats: z.object({
				public: z.number().openapi({ description: "Number of public domains." }),
				temp: z.number().openapi({ description: "Number of temporary domains." }),
				private: z.number().openapi({ description: "Number of private domains." }),
			}),
		}),
	})
	.openapi("DomainsSuccessResponse");

// Error schemas
export const errorResponseSchema = z
	.object({
		success: z.literal(false).openapi({
			description: "Indicates that the request failed.",
		}),
		error: z.string().openapi({
			description: "The error message.",
		}),
	})
	.openapi("ErrorResponse");

export const lockingRequestSchema = z.object({
	emailAddress: z.string().email(),
	password: z.string().min(8),
});

export const lockingSuccessResponseSchema = z.object({
	success: z.literal(true),
	result: z.object({
		message: z.string(),
	}),
});

export const inboxStatusSuccessResponseSchema = z.object({
	success: z.literal(true),
	result: z.object({
		locked: z.boolean(),
		isPrivate: z.boolean(),
	}),
});

// Type exports
export type Email = z.infer<typeof emailSchema>;
export type EmailSummary = z.infer<typeof emailSummarySchema>;
export type InboxStatus = z.infer<typeof inboxStatusSuccessResponseSchema>["result"];
