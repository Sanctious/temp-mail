import type { Attachment, AttachmentSummary } from "@/schemas/attachments";
import type { Email, EmailSummary } from "@/schemas/emails";

/**
 * Insert an email into the database
 */
export async function insertEmail(db: D1Database, emailData: Email) {
	try {
		const { success, error, meta } = await db
			.prepare(
				`INSERT INTO emails (id, from_address, to_address, subject, received_at, expires_at, html_content, text_content, has_attachments, attachment_count)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			)
			.bind(
				emailData.id,
				emailData.fromAddress,
				emailData.toAddress,
				emailData.subject,
				emailData.receivedAt,
				emailData.expiresAt,
				emailData.htmlContent,
				emailData.textContent,
				emailData.hasAttachments ? 1 : 0,
				emailData.attachmentCount,
			)
			.run();
		return { success, error, meta };
	} catch (e: unknown) {
		const error = e instanceof Error ? e : new Error(String(e));
		return { success: false, error: error, meta: undefined };
	}
}

/**
 * Get emails by recipient email address (Legacy, use DatabaseService for cursor-based)
 */
export async function getEmailsByRecipient(
	db: D1Database,
	emailAddress: string,
	limit: number,
	offset: number,
) {
	try {
		const { results } = await db
			.prepare(
				`SELECT id, from_address, to_address, subject, received_at, expires_at, has_attachments, attachment_count
         FROM emails
         WHERE to_address = ?
         ORDER BY received_at DESC
         LIMIT ? OFFSET ?`,
			)
			.bind(emailAddress, limit, offset)
			.all();

		// Convert SQLite boolean integers to proper booleans and camelCase
		const convertedResults = results.map((row: any) => ({
			id: row.id,
			fromAddress: row.from_address,
			toAddress: row.to_address,
			subject: row.subject,
			receivedAt: row.received_at,
			expiresAt: row.expires_at,
			hasAttachments: Boolean(row.has_attachments),
			attachmentCount: row.attachment_count,
		}));

		return { results: convertedResults as EmailSummary[], error: undefined };
	} catch (e: unknown) {
		const error = e instanceof Error ? e : new Error(String(e));
		return { results: [], error: error };
	}
}

/**
 * Get an email by ID
 */
export async function getEmailById(db: D1Database, emailId: string) {
	try {
		const row = await db.prepare("SELECT * FROM emails WHERE id = ?").bind(emailId).first<any>();

		if (row) {
			const convertedResult = {
				id: row.id,
				fromAddress: row.from_address,
				toAddress: row.to_address,
				subject: row.subject,
				receivedAt: row.received_at,
				expiresAt: row.expires_at,
				htmlContent: row.html_content,
				textContent: row.text_content,
				hasAttachments: Boolean(row.has_attachments),
				attachmentCount: row.attachment_count,
			};
			return { result: convertedResult as Email, error: undefined };
		}

		return { result: null, error: undefined };
	} catch (e: unknown) {
		const error = e instanceof Error ? e : new Error(String(e));
		return { result: null, error: error };
	}
}

/**
 * Delete emails older than a specific timestamp
 */
export async function deleteOldEmails(db: D1Database, timestamp: number) {
	try {
		const { success, error, meta } = await db
			.prepare("DELETE FROM emails WHERE received_at < ?")
			.bind(timestamp)
			.run();
		return { success, error, meta };
	} catch (e: unknown) {
		const error = e instanceof Error ? e : new Error(String(e));
		return { success: false, error: error, meta: undefined };
	}
}

/**
 * Delete emails by recipient email address
 */
export async function deleteEmailsByRecipient(db: D1Database, emailAddress: string) {
	try {
		const { success, error, meta } = await db
			.prepare("DELETE FROM emails WHERE to_address = ?")
			.bind(emailAddress)
			.run();
		return { success, error, meta };
	} catch (e: unknown) {
		const error = e instanceof Error ? e : new Error(String(e));
		return { success: false, error: error, meta: undefined };
	}
}

/**
 * Delete an email by ID
 */
export async function deleteEmailById(db: D1Database, emailId: string) {
	try {
		const { success, error, meta } = await db
			.prepare("DELETE FROM emails WHERE id = ?")
			.bind(emailId)
			.run();
		return { success, error, meta };
	} catch (e: unknown) {
		const error = e instanceof Error ? e : new Error(String(e));
		return { success: false, error: error, meta: undefined };
	}
}

/**
 * Count emails by recipient email address
 */
export async function countEmailsByRecipient(db: D1Database, emailAddress: string) {
	try {
		const result = await db
			.prepare("SELECT count(*) as count FROM emails WHERE to_address = ?")
			.bind(emailAddress)
			.first<{ count: number }>();
		return { count: result?.count || 0, error: undefined };
	} catch (e: unknown) {
		const error = e instanceof Error ? e : new Error(String(e));
		return { count: 0, error: error };
	}
}

/**
 * Insert an attachment into the database
 */
export async function insertAttachment(db: D1Database, attachmentData: Attachment) {
	try {
		const { success, error, meta } = await db
			.prepare(
				`INSERT INTO attachments (id, email_id, filename, content_type, size, r2_key, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
			)
			.bind(
				attachmentData.id,
				attachmentData.emailId,
				attachmentData.filename,
				attachmentData.contentType,
				attachmentData.size,
				attachmentData.r2Key,
				attachmentData.createdAt,
			)
			.run();
		return { success, error, meta };
	} catch (e: unknown) {
		const error = e instanceof Error ? e : new Error(String(e));
		return { success: false, error: error, meta: undefined };
	}
}

/**
 * Get attachments by email ID
 */
export async function getAttachmentsByEmailId(db: D1Database, emailId: string) {
	try {
		const { results } = await db
			.prepare(
				`SELECT id, filename, content_type, size, created_at
         FROM attachments
         WHERE email_id = ?
         ORDER BY created_at ASC`,
			)
			.bind(emailId)
			.all();
		
		const convertedResults = results.map((row: any) => ({
			id: row.id,
			filename: row.filename,
			contentType: row.content_type,
			size: row.size,
			createdAt: row.created_at,
		}));

		return { results: convertedResults as AttachmentSummary[], error: undefined };
	} catch (e: unknown) {
		const error = e instanceof Error ? e : new Error(String(e));
		return { results: [], error: error };
	}
}
