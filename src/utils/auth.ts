import { createId } from "@paralleldrive/cuid2";

/**
 * Generate a new API key with a prefix for identification
 */
export function generateApiKey(): string {
	const prefix = "tm_";
	const randomPart = createId() + createId(); // Double cuid2 for extra entropy
	return prefix + randomPart;
}

/**
 * Hash an API key using SHA-256
 */
export async function hashApiKey(key: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(key);
	const hashBuffer = await crypto.subtle.digest("SHA-256", data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Verify an API key against a stored hash
 */
export async function verifyApiKey(key: string, storedHash: string): Promise<boolean> {
	const keyHash = await hashApiKey(key);
	return keyHash === storedHash;
}

/**
 * Generate a unique API key ID
 */
export function generateApiKeyId(): string {
	return "ak_" + createId();
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
export function secureCompare(a: string, b: string): boolean {
	if (a.length !== b.length) {
		return false;
	}

	let result = 0;
	for (let i = 0; i < a.length; i++) {
		result |= a.charCodeAt(i) ^ b.charCodeAt(i);
	}
	return result === 0;
}
