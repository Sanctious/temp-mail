import type { ApiKey } from "@/schemas/apiKeys";
import type { Attachment, AttachmentSummary } from "@/schemas/attachments";
import type { Email, EmailSummary, InboxStatus } from "@/schemas/emails";

export class DatabaseService {
	constructor(private db: D1Database) {}

	// Email operations
	async insertEmail(emailData: Email) {
		try {
			const { success, error, meta } = await this.db
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

	async getEmailsByRecipient(emailAddress: string, limit: number, cursor?: string) {
		try {
			let query = `SELECT id, from_address, to_address, subject, received_at, expires_at, has_attachments, attachment_count
         FROM emails
         WHERE to_address = ?`;
			const params: any[] = [emailAddress];

			if (cursor) {
				// Decode cursor: base64(received_at#id)
				const decoded = atob(cursor);
				const [receivedAt, id] = decoded.split("#");
				query += ` AND (received_at < ? OR (received_at = ? AND id < ?))`;
				params.push(Number(receivedAt), Number(receivedAt), id);
			}

			query += ` ORDER BY received_at DESC, id DESC LIMIT ?`;
			params.push(limit + 1); // Get one extra to see if there's a next page

			const { results } = await this.db.prepare(query).bind(...params).all();

			const hasNextPage = results.length > limit;
			const items = results.slice(0, limit);

			const processedItems = items.map((row: any) => ({
				id: row.id,
				fromAddress: row.from_address,
				toAddress: row.to_address,
				subject: row.subject,
				receivedAt: row.received_at,
				expiresAt: row.expires_at,
				hasAttachments: Boolean(row.has_attachments),
				attachmentCount: row.attachment_count,
			}));

			let nextCursor: string | null = null;
			if (hasNextPage) {
				const lastItem = items[items.length - 1] as any;
				nextCursor = btoa(`${lastItem.received_at}#${lastItem.id}`);
			}

			return { results: processedItems as EmailSummary[], nextCursor, error: undefined };
		} catch (e: unknown) {
			const error = e instanceof Error ? e : new Error(String(e));
			return { results: [], nextCursor: null, error };
		}
	}

	async getEmailById(emailId: string) {
		try {
			const row = await this.db
				.prepare(`SELECT * FROM emails WHERE id = ?`)
				.bind(emailId)
				.first<any>();

			if (row) {
				const email = {
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
				return { result: email as Email, error: undefined };
			}

			return { result: undefined, error: undefined };
		} catch (e: unknown) {
			const error = e instanceof Error ? e : new Error(String(e));
			return { result: undefined, error };
		}
	}

	async countEmailsByRecipient(emailAddress: string) {
		try {
			const row = await this.db
				.prepare(`SELECT COUNT(*) as count FROM emails WHERE to_address = ?`)
				.bind(emailAddress)
				.first<any>();
			return { count: row?.count || 0, error: undefined };
		} catch (e: unknown) {
			const error = e instanceof Error ? e : new Error(String(e));
			return { count: 0, error };
		}
	}

	async deleteEmailsByRecipient(emailAddress: string) {
		try {
			const { meta, error } = await this.db
				.prepare(`DELETE FROM emails WHERE to_address = ?`)
				.bind(emailAddress)
				.run();
			return { meta, error };
		} catch (e: unknown) {
			const error = e instanceof Error ? e : new Error(String(e));
			return { meta: undefined, error };
		}
	}

	async deleteEmailById(emailId: string) {
		try {
			const { meta, error } = await this.db
				.prepare(`DELETE FROM emails WHERE id = ?`)
				.bind(emailId)
				.run();
			return { meta, error };
		} catch (e: unknown) {
			const error = e instanceof Error ? e : new Error(String(e));
			return { meta: undefined, error };
		}
	}

	// Inbox operations (Locking/Unlocking)
	async getInboxStatus(address: string): Promise<{ result: InboxStatus; error?: Error }> {
		try {
			const row = await this.db
				.prepare(`SELECT is_locked, password_hash FROM inboxes WHERE address = ?`)
				.bind(address)
				.first<any>();

			return {
				result: {
					locked: Boolean(row?.is_locked),
					isPrivate: Boolean(row?.password_hash),
				},
			};
		} catch (e: unknown) {
			return {
				result: { locked: false, isPrivate: false },
				error: e instanceof Error ? e : new Error(String(e)),
			};
		}
	}

	async getInboxDetails(address: string) {
		try {
			const row = await this.db
				.prepare(`SELECT * FROM inboxes WHERE address = ?`)
				.bind(address)
				.first<any>();
			return { result: row, error: undefined };
		} catch (e: unknown) {
			return { result: undefined, error: e instanceof Error ? e : new Error(String(e)) };
		}
	}

	async lockInbox(address: string, passwordHash: string, apiKeyId: string) {
		try {
			const now = Math.floor(Date.now() / 1000);
			const { success, error } = await this.db
				.prepare(
					`INSERT INTO inboxes (address, password_hash, owner_api_key_id, is_locked, created_at)
					 VALUES (?, ?, ?, 1, ?)
					 ON CONFLICT(address) DO UPDATE SET
					 password_hash = excluded.password_hash,
					 owner_api_key_id = excluded.owner_api_key_id,
					 is_locked = 1`,
				)
				.bind(address, passwordHash, apiKeyId, now)
				.run();
			return { success, error };
		} catch (e: unknown) {
			return { success: false, error: e instanceof Error ? e : new Error(String(e)) };
		}
	}

	async unlockInbox(address: string) {
		try {
			const { success, error } = await this.db
				.prepare(`UPDATE inboxes SET is_locked = 0, password_hash = NULL, owner_api_key_id = NULL WHERE address = ?`)
				.bind(address)
				.run();
			return { success, error };
		} catch (e: unknown) {
			return { success: false, error: e instanceof Error ? e : new Error(String(e)) };
		}
	}

	// Attachment operations
	async insertAttachment(attachmentData: Attachment) {
		try {
			const { success, error, meta } = await this.db
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

	async getAttachmentsByEmailId(emailId: string) {
		try {
			const { results } = await this.db
				.prepare(
					`SELECT id, filename, content_type, size, created_at
         FROM attachments
         WHERE email_id = ?
         ORDER BY created_at ASC`,
				)
				.bind(emailId)
				.all();
			
			const processedResults = results.map((row: any) => ({
				id: row.id,
				filename: row.filename,
				contentType: row.content_type,
				size: row.size,
				createdAt: row.created_at,
			}));

			return { results: processedResults as AttachmentSummary[], error: undefined };
		} catch (e: unknown) {
			const error = e instanceof Error ? e : new Error(String(e));
			return { results: [], error };
		}
	}

	async getAttachmentById(attachmentId: string) {
		try {
			const row = await this.db
				.prepare(`SELECT * FROM attachments WHERE id = ?`)
				.bind(attachmentId)
				.first<any>();
			
			if (row) {
				const attachment = {
					id: row.id,
					emailId: row.email_id,
					filename: row.filename,
					contentType: row.content_type,
					size: row.size,
					r2Key: row.r2_key,
					createdAt: row.created_at,
				};
				return { result: attachment as Attachment, error: undefined };
			}
			return { result: undefined, error: undefined };
		} catch (e: unknown) {
			const error = e instanceof Error ? e : new Error(String(e));
			return { result: undefined, error };
		}
	}

	async deleteAttachmentById(attachmentId: string) {
		try {
			const { success, error, meta } = await this.db
				.prepare(`DELETE FROM attachments WHERE id = ?`)
				.bind(attachmentId)
				.run();
			return { success, error, meta };
		} catch (e: unknown) {
			const error = e instanceof Error ? e : new Error(String(e));
			return { success: false, error: error, meta: undefined };
		}
	}

	async updateEmailAttachmentInfo(
		emailId: string,
		hasAttachments: boolean,
		attachmentCount: number,
	) {
		try {
			const { success, error, meta } = await this.db
				.prepare(
					`UPDATE emails
         SET has_attachments = ?, attachment_count = ?
         WHERE id = ?`,
				)
				.bind(hasAttachments ? 1 : 0, attachmentCount, emailId)
				.run();
			return { success, error, meta };
		} catch (e: unknown) {
			const error = e instanceof Error ? e : new Error(String(e));
			return { success: false, error: error, meta: undefined };
		}
	}

	// API Key operations
	async insertApiKey(apiKeyData: Omit<ApiKey, "last_used_at"> & { key_hash: string }) {
		try {
			const { success, error, meta } = await this.db
				.prepare(
					`INSERT INTO api_keys (id, key_hash, name, created_at, expires_at, is_active)
         VALUES (?, ?, ?, ?, ?, ?)`,
				)
				.bind(
					apiKeyData.id,
					apiKeyData.key_hash,
					apiKeyData.name,
					apiKeyData.created_at,
					apiKeyData.expires_at,
					apiKeyData.is_active ? 1 : 0,
				)
				.run();
			return { success, error, meta };
		} catch (e: unknown) {
			const error = e instanceof Error ? e : new Error(String(e));
			return { success: false, error: error, meta: undefined };
		}
	}

	async getApiKeyByHash(keyHash: string) {
		try {
			const row = await this.db
				.prepare(`SELECT * FROM api_keys WHERE key_hash = ? AND is_active = 1`)
				.bind(keyHash)
				.first<any>();

			if (row) {
				const apiKey = {
					...row,
					is_active: Boolean(row.is_active),
				};
				return { result: apiKey as ApiKey & { key_hash: string }, error: undefined };
			}

			return { result: undefined, error: undefined };
		} catch (e: unknown) {
			const error = e instanceof Error ? e : new Error(String(e));
			return { result: undefined, error };
		}
	}

	async getApiKeyById(keyId: string) {
		try {
			const row = await this.db
				.prepare(`SELECT id, name, created_at, last_used_at, expires_at, is_active FROM api_keys WHERE id = ?`)
				.bind(keyId)
				.first<any>();

			if (row) {
				const apiKey = {
					...row,
					is_active: Boolean(row.is_active),
				};
				return { result: apiKey as ApiKey, error: undefined };
			}

			return { result: undefined, error: undefined };
		} catch (e: unknown) {
			const error = e instanceof Error ? e : new Error(String(e));
			return { result: undefined, error };
		}
	}

	async listApiKeys() {
		try {
			const { results } = await this.db
				.prepare(`SELECT id, name, created_at, last_used_at, expires_at, is_active FROM api_keys ORDER BY created_at DESC`)
				.all();

			const processedResults = results.map((key: any) => ({
				...key,
				is_active: Boolean(key.is_active),
			}));

			return { results: processedResults as ApiKey[], error: undefined };
		} catch (e: unknown) {
			const error = e instanceof Error ? e : new Error(String(e));
			return { results: [], error };
		}
	}

	async updateApiKeyLastUsed(keyId: string, timestamp: number) {
		try {
			const { success, error, meta } = await this.db
				.prepare(`UPDATE api_keys SET last_used_at = ? WHERE id = ?`)
				.bind(timestamp, keyId)
				.run();
			return { success, error, meta };
		} catch (e: unknown) {
			const error = e instanceof Error ? e : new Error(String(e));
			return { success: false, error: error, meta: undefined };
		}
	}

	async revokeApiKey(keyId: string) {
		try {
			const { success, error, meta } = await this.db
				.prepare(`UPDATE api_keys SET is_active = 0 WHERE id = ?`)
				.bind(keyId)
				.run();
			return { success, error, meta };
		} catch (e: unknown) {
			const error = e instanceof Error ? e : new Error(String(e));
			return { success: false, error: error, meta: undefined };
		}
	}

	async deleteApiKey(keyId: string) {
		try {
			const { meta, error } = await this.db
				.prepare(`DELETE FROM api_keys WHERE id = ?`)
				.bind(keyId)
				.run();
			return { meta, error };
		} catch (e: unknown) {
			const error = e instanceof Error ? e : new Error(String(e));
			return { meta: undefined, error };
		}
	}

	async deleteExpiredApiKeys(timestamp: number) {
		try {
			const { success, error, meta } = await this.db
				.prepare(`DELETE FROM api_keys WHERE expires_at IS NOT NULL AND expires_at < ?`)
				.bind(timestamp)
				.run();
			return { success, error, meta };
		} catch (e: unknown) {
			const error = e instanceof Error ? e : new Error(String(e));
			return { success: false, error: error, meta: undefined };
		}
	}
}
