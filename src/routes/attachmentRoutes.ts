// External imports
import { OpenAPIHono } from "@hono/zod-openapi";

// Database imports
import { createDatabaseService } from "@/database";
import * as r2 from "@/database/r2";

// Schema imports
import {
	deleteAttachmentRoute,
	downloadAttachmentRoute,
	getAttachmentsByEmailIdRoute,
} from "@/schemas/attachments/routeDefinitions";

// Middleware imports
import { apiKeyAuth } from "@/middlewares/apiKeyAuth";
import { inboxLockAuth } from "@/middlewares/inboxLockAuth";

// Utility imports
import { ERR, OK } from "@/utils/http";

const attachmentRoutes = new OpenAPIHono<{ Bindings: CloudflareBindings }>();

// Apply auth middlewares
attachmentRoutes.use("/attachments/*", apiKeyAuth);
attachmentRoutes.use("/attachments/email/:emailId", inboxLockAuth);
attachmentRoutes.use("/attachments/:attachmentId", inboxLockAuth);

// @ts-ignore
attachmentRoutes.openapi(getAttachmentsByEmailIdRoute, async (c) => {
	const { emailId } = c.req.valid("param");
	const dbService = createDatabaseService(c.env.D1);
	const { results, error } = await dbService.getAttachmentsByEmailId(emailId);

	if (error) return c.json(ERR("Database error"), 500);
	return c.json(OK(results));
});

// @ts-ignore
attachmentRoutes.openapi(downloadAttachmentRoute, async (c) => {
	const { attachmentId } = c.req.valid("param");
	const dbService = createDatabaseService(c.env.D1);
	const { result: attachment, error: dbError } = await dbService.getAttachmentById(attachmentId);

	if (dbError) return c.json(ERR("Database error"), 500);
	if (!attachment) return c.json(ERR("Attachment not found"), 404);

	const { success, data, error: r2Error } = await r2.getAttachment(c.env.R2, attachment.r2Key);
	if (!success || !data) {
		return c.json(ERR(r2Error?.message || "Failed to retrieve attachment"), 404);
	}

	c.header("Content-Type", attachment.contentType);
	c.header("Content-Disposition", `attachment; filename="${attachment.filename}"`);
	c.header("Content-Length", attachment.size.toString());

	return c.body(data.body);
});

// @ts-ignore
attachmentRoutes.openapi(deleteAttachmentRoute, async (c) => {
	const { attachmentId } = c.req.valid("param");
	const dbService = createDatabaseService(c.env.D1);
	const { result: attachment, error: dbError } = await dbService.getAttachmentById(attachmentId);

	if (dbError) return c.json(ERR("Database error"), 500);
	if (!attachment) return c.json(ERR("Attachment not found"), 404);

	const { success: r2Success } = await r2.deleteAttachment(c.env.R2, attachment.r2Key);
	const { success: dbSuccess, error: dbDeleteError } = await dbService.deleteAttachmentById(attachmentId);

	if (!dbSuccess) return c.json(ERR(dbDeleteError?.message || "Failed to delete attachment"), 500);

	const { results: remaining } = await dbService.getAttachmentsByEmailId(attachment.emailId);
	await dbService.updateEmailAttachmentInfo(attachment.emailId, remaining.length > 0, remaining.length);

	return c.json(OK({ message: "Attachment deleted successfully" }));
});

export default attachmentRoutes;
