import { DatabaseService } from "./service";

export function createDatabaseService(db: D1Database) {
	return new DatabaseService(db);
}

export * from "./d1";
// R2 storage disabled - uncomment to enable attachments
// export * from "./r2";
export * from "./service";
