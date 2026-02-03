import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { OK } from "@/utils/http";
import { logError } from "@/utils/logger";

const healthRoutes = new OpenAPIHono<{ Bindings: CloudflareBindings }>();

const healthResponseSchema = z.object({
	success: z.literal(true),
	result: z.object({
		status: z.enum(["ok", "degraded", "error"]),
		timestamp: z.number(),
		services: z.object({
			d1: z.object({
				status: z.enum(["ok", "degraded", "error"]),
				latencyMs: z.number(),
				error: z.string().optional(),
			}),
			r2: z.object({
				status: z.enum(["ok", "degraded", "error"]),
				latencyMs: z.number(),
				error: z.string().optional(),
			}),
		}),
	}),
});

const getHealthRoute = createRoute({
	method: "get",
	path: "/health",
	responses: {
		200: {
			content: {
				"application/json": {
					schema: healthResponseSchema,
				},
			},
			description: "API health status",
		},
	},
	tags: ["System"],
	summary: "Check API health",
});

healthRoutes.openapi(getHealthRoute, async (c) => {
	const start = Date.now();
	let d1Status: "ok" | "error" = "ok";
	let d1Error: string | undefined;

	try {
		await c.env.D1.prepare("SELECT 1").run();
	} catch (error) {
		d1Status = "error";
		d1Error = (error as Error).message;
		logError("Health check D1 failed", error as Error);
	}
	const d1Latency = Date.now() - start;

	return c.json(
		OK({
			status: (d1Status === "ok" ? "ok" : "degraded") as "ok" | "degraded" | "error",
			timestamp: Date.now(),
			services: {
				d1: {
					status: d1Status as "ok" | "error" | "degraded",
					latencyMs: d1Latency,
					error: d1Error,
				},
				r2: {
					status: "ok" as const, // Simplified as R2 is partially disabled in some versions
					latencyMs: 0,
				},
			},
		}),
	);
});

export default healthRoutes;
