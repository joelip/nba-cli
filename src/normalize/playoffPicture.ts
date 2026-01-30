import type { PlayoffPictureResponse } from "../models/playoffPicture";
import {
  getResultSet,
  normalizeResultSet,
  type RowFromHeaders,
} from "./statsResultSets";

const EAST_CONF_PLAYOFF_PICTURE_HEADERS = [
  "CONFERENCE",
  "HIGH_SEED_RANK",
  "HIGH_SEED_TEAM",
  "HIGH_SEED_TEAM_ID",
  "LOW_SEED_RANK",
  "LOW_SEED_TEAM",
  "LOW_SEED_TEAM_ID",
  "HIGH_SEED_SERIES_W",
  "HIGH_SEED_SERIES_L",
  "HIGH_SEED_SERIES_REMAINING_G",
  "HIGH_SEED_SERIES_REMAINING_HOME_G",
  "HIGH_SEED_SERIES_REMAINING_AWAY_G",
] as const;

const WEST_CONF_PLAYOFF_PICTURE_HEADERS = [
  "CONFERENCE",
  "HIGH_SEED_RANK",
  "HIGH_SEED_TEAM",
  "HIGH_SEED_TEAM_ID",
  "LOW_SEED_RANK",
  "LOW_SEED_TEAM",
  "LOW_SEED_TEAM_ID",
  "HIGH_SEED_SERIES_W",
  "HIGH_SEED_SERIES_L",
  "HIGH_SEED_SERIES_REMAINING_G",
  "HIGH_SEED_SERIES_REMAINING_HOME_G",
  "HIGH_SEED_SERIES_REMAINING_AWAY_G",
] as const;

const EAST_CONF_REMAINING_GAMES_HEADERS = [
  "TEAM",
  "TEAM_ID",
  "REMAINING_G",
  "REMAINING_HOME_G",
  "REMAINING_AWAY_G",
] as const;

const WEST_CONF_REMAINING_GAMES_HEADERS = [
  "TEAM",
  "TEAM_ID",
  "REMAINING_G",
  "REMAINING_HOME_G",
  "REMAINING_AWAY_G",
] as const;

const EAST_CONF_STANDINGS_HEADERS = [
  "CONFERENCE",
  "RANK",
  "TEAM",
  "TEAM_SLUG",
  "TEAM_ID",
  "WINS",
  "LOSSES",
  "PCT",
  "DIV",
  "CONF",
  "HOME",
  "AWAY",
  "GB",
  "GR_OVER_500",
  "GR_OVER_500_HOME",
  "GR_OVER_500_AWAY",
  "GR_UNDER_500",
  "GR_UNDER_500_HOME",
  "GR_UNDER_500_AWAY",
  "RANKING_CRITERIA",
  "CLINCHED_PLAYOFFS",
  "CLINCHED_CONFERENCE",
  "CLINCHED_DIVISION",
  "Clinched_Play_In",
  "ELIMINATED_PLAYOFFS",
  "SOSA_REMAINING",
  "ReturnToPlay_East_PI_Flag",
  "ReturnToPlay_Already_Eliminated",
  "Seeding_Game_1_Outcome",
  "Seeding_Game_2_Outcome",
  "Seeding_Game_3_Outcome",
  "Seeding_Game_4_Outcome",
  "Seeding_Game_5_Outcome",
  "Seeding_Game_6_Outcome",
  "Seeding_Game_7_Outcome",
  "Seeding_Game_8_Outcome",
  "Seeding_Game_1_ID",
  "Seeding_Game_2_ID",
  "Seeding_Game_3_ID",
  "Seeding_Game_4_ID",
  "Seeding_Game_5_ID",
  "Seeding_Game_6_ID",
  "Seeding_Game_7_ID",
  "Seeding_Game_8_ID",
  "Seeding_Game_1_Opponent",
  "Seeding_Game_2_Opponent",
  "Seeding_Game_3_Opponent",
  "Seeding_Game_4_Opponent",
  "Seeding_Game_5_Opponent",
  "Seeding_Game_6_Opponent",
  "Seeding_Game_7_Opponent",
  "Seeding_Game_8_Opponent",
  "Seeding_Game_1_Label",
  "Seeding_Game_2_Label",
  "Seeding_Game_3_Label",
  "Seeding_Game_4_Label",
  "Seeding_Game_5_Label",
  "Seeding_Game_6_Label",
  "Seeding_Game_7_Label",
  "Seeding_Game_8_Label",
] as const;

const WEST_CONF_STANDINGS_HEADERS = [
  "CONFERENCE",
  "RANK",
  "TEAM",
  "TEAM_SLUG",
  "TEAM_ID",
  "WINS",
  "LOSSES",
  "PCT",
  "DIV",
  "CONF",
  "HOME",
  "AWAY",
  "GB",
  "GR_OVER_500",
  "GR_OVER_500_HOME",
  "GR_OVER_500_AWAY",
  "GR_UNDER_500",
  "GR_UNDER_500_HOME",
  "GR_UNDER_500_AWAY",
  "RANKING_CRITERIA",
  "CLINCHED_PLAYOFFS",
  "CLINCHED_CONFERENCE",
  "CLINCHED_DIVISION",
  "Clinched_Play_In",
  "ELIMINATED_PLAYOFFS",
  "SOSA_REMAINING",
  "ReturnToPlay_West_PI_Flag",
  "ReturnToPlay_Already_Eliminated",
  "Seeding_Game_1_Outcome",
  "Seeding_Game_2_Outcome",
  "Seeding_Game_3_Outcome",
  "Seeding_Game_4_Outcome",
  "Seeding_Game_5_Outcome",
  "Seeding_Game_6_Outcome",
  "Seeding_Game_7_Outcome",
  "Seeding_Game_8_Outcome",
  "Seeding_Game_1_ID",
  "Seeding_Game_2_ID",
  "Seeding_Game_3_ID",
  "Seeding_Game_4_ID",
  "Seeding_Game_5_ID",
  "Seeding_Game_6_ID",
  "Seeding_Game_7_ID",
  "Seeding_Game_8_ID",
  "Seeding_Game_1_Opponent",
  "Seeding_Game_2_Opponent",
  "Seeding_Game_3_Opponent",
  "Seeding_Game_4_Opponent",
  "Seeding_Game_5_Opponent",
  "Seeding_Game_6_Opponent",
  "Seeding_Game_7_Opponent",
  "Seeding_Game_8_Opponent",
  "Seeding_Game_1_Label",
  "Seeding_Game_2_Label",
  "Seeding_Game_3_Label",
  "Seeding_Game_4_Label",
  "Seeding_Game_5_Label",
  "Seeding_Game_6_Label",
  "Seeding_Game_7_Label",
  "Seeding_Game_8_Label",
] as const;

export type EastConfPlayoffPictureRow =
  RowFromHeaders<typeof EAST_CONF_PLAYOFF_PICTURE_HEADERS>;
export type WestConfPlayoffPictureRow =
  RowFromHeaders<typeof WEST_CONF_PLAYOFF_PICTURE_HEADERS>;
export type EastConfRemainingGamesRow =
  RowFromHeaders<typeof EAST_CONF_REMAINING_GAMES_HEADERS>;
export type WestConfRemainingGamesRow =
  RowFromHeaders<typeof WEST_CONF_REMAINING_GAMES_HEADERS>;
export type EastConfStandingsRow =
  RowFromHeaders<typeof EAST_CONF_STANDINGS_HEADERS>;
export type WestConfStandingsRow =
  RowFromHeaders<typeof WEST_CONF_STANDINGS_HEADERS>;

export interface PlayoffPictureNormalized {
  east: {
    playoffPicture: EastConfPlayoffPictureRow[];
    remainingGames: EastConfRemainingGamesRow[];
    standings: EastConfStandingsRow[];
  };
  west: {
    playoffPicture: WestConfPlayoffPictureRow[];
    remainingGames: WestConfRemainingGamesRow[];
    standings: WestConfStandingsRow[];
  };
}

export function normalizePlayoffPicture(
  response: PlayoffPictureResponse,
): PlayoffPictureNormalized {
  const eastPlayoff = getResultSet(response, "EastConfPlayoffPicture");
  const eastRemaining = getResultSet(response, "EastConfRemainingGames");
  const eastStandings = getResultSet(response, "EastConfStandings");
  const westPlayoff = getResultSet(response, "WestConfPlayoffPicture");
  const westRemaining = getResultSet(response, "WestConfRemainingGames");
  const westStandings = getResultSet(response, "WestConfStandings");

  if (
    !eastPlayoff ||
    !eastRemaining ||
    !eastStandings ||
    !westPlayoff ||
    !westRemaining ||
    !westStandings
  ) {
    throw new Error("Missing playoffpicture result sets in response.");
  }

  return {
    east: {
      playoffPicture: normalizeResultSet(
        eastPlayoff,
        EAST_CONF_PLAYOFF_PICTURE_HEADERS,
      ),
      remainingGames: normalizeResultSet(
        eastRemaining,
        EAST_CONF_REMAINING_GAMES_HEADERS,
      ),
      standings: normalizeResultSet(eastStandings, EAST_CONF_STANDINGS_HEADERS),
    },
    west: {
      playoffPicture: normalizeResultSet(
        westPlayoff,
        WEST_CONF_PLAYOFF_PICTURE_HEADERS,
      ),
      remainingGames: normalizeResultSet(
        westRemaining,
        WEST_CONF_REMAINING_GAMES_HEADERS,
      ),
      standings: normalizeResultSet(westStandings, WEST_CONF_STANDINGS_HEADERS),
    },
  };
}
