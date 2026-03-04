import type {
  ESPNCompetition,
  ESPNCompetitor,
  ESPNLeaderCategory,
  ESPNScoreboardResponse,
} from "../models/espnScoreboard";
import type {
  Broadcasters,
  PlayerLeader,
  ScoreboardV3Response,
  TeamBoxScore,
} from "../models/scoreboardV3";

/**
 * Convert an ESPN scoreboard response into the ScoreboardV3Response shape
 * so all existing normalize/format code works unchanged.
 */
export function espnToScoreboardV3(
  espn: ESPNScoreboardResponse,
  dateISO: string,
): ScoreboardV3Response {
  const gameDate = dateISO.replace(/-/g, "");
  const games: ScoreboardV3Response["scoreboard"]["games"] = [];

  for (const event of espn.events ?? []) {
    const comp = event.competitions?.[0];
    if (!comp) {
      continue;
    }

    const homeComp = comp.competitors?.find((candidate) => candidate.homeAway === "home");
    const awayComp = comp.competitors?.find((candidate) => candidate.homeAway === "away");
    if (!homeComp || !awayComp) {
      continue;
    }

    const statusType = event.status?.type ?? comp.status?.type;
    const statusId = statusType?.id != null ? Number(statusType.id) : 0;
    const safeStatusId = Number.isFinite(statusId) ? statusId : 0;

    games.push({
      gameId: event.id,
      gameCode: `${gameDate}/${awayComp.team.abbreviation}${homeComp.team.abbreviation}`,
      gameStatus: safeStatusId,
      gameStatusText: statusType?.shortDetail ?? statusType?.detail ?? statusType?.name ?? "",
      period: event.status?.period ?? comp.status?.period ?? 0,
      gameClock: event.status?.displayClock || comp.status?.clock || "",
      gameTimeUTC: event.date ?? comp.date ?? "",
      gameEt: statusType?.detail ?? "",
      regulationPeriods: 4,
      seriesGameNumber: "",
      gameLabel: "",
      gameSubLabel: "",
      seriesText: "",
      ifNecessary: false,
      seriesConference: "",
      poRoundDesc: "",
      gameSubtype: "",
      isNeutral: false,
      homeTeam: competitorToTeamBoxScore(homeComp),
      awayTeam: competitorToTeamBoxScore(awayComp),
      broadcasters: buildBroadcasters(comp.broadcasts),
      gameLeaders: safeStatusId === 3 ? buildGameLeaders(homeComp, awayComp) : undefined,
    });
  }

  return {
    meta: {
      version: 1,
      request: `espn-scoreboard-${dateISO}`,
      time: new Date().toISOString(),
    },
    scoreboard: {
      gameDate: dateISO,
      leagueId: "00",
      leagueName: "National Basketball Association",
      games,
    },
  };
}

function competitorToTeamBoxScore(comp: ESPNCompetitor): TeamBoxScore {
  const overallRecord = comp.records?.find((r) => r.type === "total");

  let wins = 0;
  let losses = 0;
  if (overallRecord?.summary) {
    const [rawWins, rawLosses] = overallRecord.summary.split("-");
    wins = Number.parseInt(rawWins, 10) || 0;
    losses = Number.parseInt(rawLosses, 10) || 0;
  }

  return {
    teamId: Number.parseInt(comp.id, 10) || 0,
    teamName: comp.team.name,
    teamCity: comp.team.location,
    teamTricode: comp.team.abbreviation,
    teamSlug: slugify(comp.team.name),
    wins,
    losses,
    score: parseScore(comp.score),
    seed: 0,
    inBonus: null,
    timeoutsRemaining: 0,
    periods: [],
  };
}

function buildBroadcasters(broadcasts: ESPNCompetition["broadcasts"]): Broadcasters {
  const result: Broadcasters = {
    nationalBroadcasters: [],
    nationalRadioBroadcasters: [],
    nationalOttBroadcasters: [],
    homeTvBroadcasters: [],
    homeRadioBroadcasters: [],
    homeOttBroadcasters: [],
    awayTvBroadcasters: [],
    awayRadioBroadcasters: [],
    awayOttBroadcasters: [],
  };

  if (!broadcasts) {
    return result;
  }

  for (const broadcast of broadcasts) {
    const rawNames = broadcast.names ?? [];
    const names = rawNames.length > 0
      ? rawNames
      : [broadcast.type?.shortName, broadcast.type?.displayName].filter((name): name is string => Boolean(name));

    const broadcasters = names.map((name) => ({
      broadcasterId: 0,
      broadcastDisplay: name,
    }));

    const market = broadcast.market?.toLowerCase();
    if (!market) {
      continue;
    }

    switch (market) {
      case "national":
        result.nationalBroadcasters.push(...broadcasters);
        break;
      case "home":
        result.homeTvBroadcasters.push(...broadcasters);
        break;
      case "away":
        result.awayTvBroadcasters.push(...broadcasters);
        break;
      default:
        break;
    }
  }

  return result;
}

function buildGameLeaders(
  homeComp: ESPNCompetitor,
  awayComp: ESPNCompetitor,
): { homeLeaders: PlayerLeader; awayLeaders: PlayerLeader } | undefined {
  const homeLeader = extractLeaderFromCompetitor(homeComp);
  const awayLeader = extractLeaderFromCompetitor(awayComp);
  if (!homeLeader || !awayLeader) {
    return undefined;
  }

  return { homeLeaders: homeLeader, awayLeaders: awayLeader };
}

function extractLeaderFromCompetitor(
  comp: ESPNCompetitor,
): PlayerLeader | undefined {
  if (!comp.leaders || comp.leaders.length === 0) {
    return undefined;
  }

  const ptsCat = comp.leaders.find(
    (c) =>
      c.name === "points" ||
      c.name === "pointsPerGame" ||
      c.abbreviation === "Pts" ||
      c.abbreviation === "PTS",
  );

  if (!ptsCat?.leaders || ptsCat.leaders.length === 0) {
    return undefined;
  }

  const athlete = ptsCat.leaders[0].athlete;

  const pts = getStatValue(comp.leaders, ["points", "pointsPerGame"], ["Pts", "PTS"]);
  const rebounds = getStatValue(comp.leaders, ["rebounds", "reboundsPerGame"], ["Reb", "REB"]);
  const assists = getStatValue(comp.leaders, ["assists", "assistsPerGame"], ["Ast", "AST"]);

  return {
    personId: Number.parseInt(athlete.id, 10) || 0,
    name: athlete.displayName,
    jerseyNum: athlete.jersey,
    position: athlete.position?.abbreviation,
    teamTricode: comp.team.abbreviation,
    points: pts,
    rebounds: rebounds,
    assists: assists,
  };
}

function getStatValue(categories: ESPNLeaderCategory[], names: string[], abbrs: string[]): number {
  const cat = categories.find(
    (candidate) => names.includes(candidate.name) || abbrs.includes(candidate.abbreviation),
  );
  if (!cat?.leaders || cat.leaders.length === 0) {
    return 0;
  }

  const value = Number.parseFloat(String(cat.leaders[0].value));
  return Number.isNaN(value) ? 0 : Math.round(value);
}

function parseScore(score: string | number | null | undefined): number {
  if (typeof score === "number") {
    return Number.isFinite(score) ? score : 0;
  }

  const parsed = Number.parseInt(score ?? "", 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
