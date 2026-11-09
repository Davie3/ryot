use media_models::MetadataExternalIdentifiers;
use serde::{Deserialize, Serialize};

const STEAM_EXTERNAL_GAME_SOURCE: i32 = 1;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct IgdbExternalGame {
    uid: Option<String>,
    external_game_source: Option<i32>,
}

pub fn external_identifiers(
    external_games: Option<Vec<IgdbExternalGame>>,
) -> Option<MetadataExternalIdentifiers> {
    external_games
        .unwrap_or_default()
        .into_iter()
        .filter(|g| g.external_game_source == Some(STEAM_EXTERNAL_GAME_SOURCE))
        .filter_map(|g| g.uid?.parse().ok())
        .min()
        .map(|steam_app_id| MetadataExternalIdentifiers {
            steam_app_id: Some(steam_app_id),
            ..Default::default()
        })
}
