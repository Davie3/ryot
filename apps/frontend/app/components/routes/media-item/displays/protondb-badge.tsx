import { Badge, Tooltip } from "@mantine/core";
import {
	MediaLot,
	type MetadataDetailsQuery,
} from "@ryot/generated/graphql/backend/graphql";
import { changeCase } from "@ryot/ts-utils";
import { skipToken, useQuery } from "@tanstack/react-query";
import { $path } from "safe-routes";
import { clientGqlService } from "~/lib/shared/react-query";
import type { ProtonDbSummary } from "~/routes/api.protondb.$appId";

const STEAM_APP_ID_QUERY = `
	query ProtonDbSteamAppId($metadataId: String!) {
		metadataDetails(metadataId: $metadataId) {
			response {
				externalIdentifiers {
					steamAppId
				}
			}
		}
	}
`;

type SteamAppIdResponse = {
	metadataDetails: {
		response: { externalIdentifiers?: { steamAppId?: number | null } | null };
	};
};

const TIER_COLORS: Record<string, string> = {
	native: "#2e8b57",
	platinum: "#b4c7dc",
	gold: "#cfb53b",
	silver: "#a6a6a6",
	bronze: "#cd7f32",
	borked: "#e03131",
};

type Metadata = MetadataDetailsQuery["metadataDetails"]["response"];

export function ProtonDbBadge(props: {
	metadata: Pick<Metadata, "id" | "lot" | "isPartial">;
}) {
	const isEligible =
		props.metadata.lot === MediaLot.VideoGame && !props.metadata.isPartial;

	const steamAppIdQuery = useQuery({
		queryKey: ["protondb", "steamAppId", props.metadata.id],
		queryFn: isEligible
			? () =>
					clientGqlService
						.request<SteamAppIdResponse>(STEAM_APP_ID_QUERY, {
							metadataId: props.metadata.id,
						})
						.then(
							(d) =>
								d.metadataDetails.response.externalIdentifiers?.steamAppId ??
								null,
						)
			: skipToken,
	});
	const appId = steamAppIdQuery.data;

	const summaryQuery = useQuery({
		staleTime: 60 * 60 * 1000,
		queryKey: ["protondb", "summary", appId],
		queryFn: appId
			? () =>
					fetch($path("/api/protondb/:appId", { appId: String(appId) })).then(
						(r) => r.json() as Promise<ProtonDbSummary | null>,
					)
			: skipToken,
	});
	const summary = summaryQuery.data;

	if (!appId || !summary) return null;

	const trending =
		summary.trendingTier && summary.trendingTier !== summary.tier
			? `, trending ${changeCase(summary.trendingTier)}`
			: "";

	return (
		<Tooltip label={`${summary.total} reports${trending}`}>
			<Badge
				autoContrast
				component="a"
				target="_blank"
				rel="noreferrer"
				w="fit-content"
				color={TIER_COLORS[summary.tier] ?? "gray"}
				href={`https://www.protondb.com/app/${appId}`}
				style={{ cursor: "pointer" }}
			>
				ProtonDB: {changeCase(summary.tier)}
			</Badge>
		</Tooltip>
	);
}
