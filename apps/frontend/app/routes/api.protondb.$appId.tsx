import { parseParameters } from "@ryot/ts-utils";
import { z } from "zod";
import type { Route } from "./+types/api.protondb.$appId";

const summarySchema = z.object({
	tier: z.string(),
	total: z.number(),
	trendingTier: z.string().nullish(),
});

export type ProtonDbSummary = z.infer<typeof summarySchema>;

const getSummary = async (appId: number) => {
	const response = await fetch(
		`https://www.protondb.com/api/v1/reports/summaries/${appId}.json`,
		{
			headers: { "User-Agent": "Mozilla/5.0" },
			signal: AbortSignal.timeout(5000),
		},
	);
	if (!response.ok) return null;
	const parsed = summarySchema.safeParse(await response.json());
	return parsed.success ? parsed.data : null;
};

export const loader = async ({ params }: Route.LoaderArgs) => {
	const { appId } = parseParameters(
		params,
		z.object({ appId: z.coerce.number().int().positive() }),
	);
	const summary = await getSummary(appId).catch(() => null);
	return Response.json(summary, {
		headers: { "Cache-Control": "private, max-age=3600" },
	});
};
