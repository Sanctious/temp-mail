import type { Context, Next } from "hono";
import { secureCompare } from "@/utils/auth";
import { ERR } from "@/utils/http";

// Extended bindings with MASTER_KEY
type MasterKeyBindings = CloudflareBindings & { MASTER_KEY?: string };

/**
 * Middleware to authenticate requests using the master key.
 * The master key should be provided in the X-Master-Key header.
 */
export async function masterKeyAuth(c: Context<{ Bindings: MasterKeyBindings }>, next: Next) {
	const masterKey = c.req.header("X-Master-Key");

	if (!masterKey) {
		return c.json(ERR("Unauthorized", "Missing X-Master-Key header"), 401);
	}

	const envMasterKey = c.env.MASTER_KEY;

	if (!envMasterKey) {
		return c.json(ERR("ServerError", "Master key not configured"), 500);
	}

	if (!secureCompare(masterKey, envMasterKey)) {
		return c.json(ERR("Unauthorized", "Invalid master key"), 401);
	}

	await next();
}
