import type { ESPNScoreboardResponse, ESPNCompetitor, ESPNLeaderCategory } from "../models/espnScoreboard";
import type { ScoreboardV3Response, TeamBoxScore, PlayerLeader, Broadcasters, Broadcaster } from "../models/scoreboardV3";

/**
 * Convert an ESPN scoreboard response into the ScoreboardV3Response shape
 * so all existing normalize/format code works unchanged.
 */
export function espnToScoreboardV3(espn: ESPNScoreboardResponse, dateISO: string): ScoreboardV3Response {
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
      games: espn.events.map((event) => {
        const comp = event.competitions[0];
        const homeComp = comp.competitors.find((c) => c.homeAway === "home")!;
        const awayComp = comp.competitors.find((c) => c.homeAway === "away")!;
        const statusId = Number(event.status.type.id);

        return {
          gameId: event.id,
          gameCode: `${dateISO.replace(/-/g, "")}/${awayComp.team.abbreviation}${homeComp.team.abbreviation}`,
          gameStatus: statusId,
          gameStatusText: event.status.type.shortDetail,
          period: event.status.period,
          gameClock: event.status.displayClock || "",
          gameTimeUTC: event.date,
          gameEt: event.status.type.detail,
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
          gameLeaders: statusId === 3
            ? buildGameLeaders(homeComp, awayComp)
            : undefined,
        };
      }),
    },
  };
}

function competitorToTeamBoxScore(comp: ESPNCompetitor): TeamBoxScore {
  const overallRecord = comp.records?.find((r) => r.type === "total");
  let wins = 0;
  let losses = 0;
  if (overallRecord) {
    const parts = overallRecord.summary.split("-");
    wins = Number(parts[0]) || 0;
    losses = Number(parts[1]) || 0;
  }

  return {
    teamId: Number(comp.id),
    teamName: comp.team.name,
    teamCity: comp.team.location,
    teamTricode: comp.team.abbreviation,
    teamSlug: comp.team.name.toLowerCase().replace(/\s+/g, "-"),
    wins,
    losses,
    score: Number(comp.score) || 0,
    seed: 0,
    inBonus: null,
    timeoutsRemaining: 0,
    periods: [],
  };
}

function buildBroadcasters(broadcasts: Array<{ market: string; names: string[] }> | undefined): Broadcasters {
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

  if (!broadcasts) return result;

  for (const b of broadcasts) {
    const list: Broadcaster[] = b.names.map((name) => ({
      broadcasterId: 0,
      broadcastDisplay: name,
    }));

    switch (b.market) {
      case "national":
        result.nationalBroadcasters.push(...list);
        break;
      case "home":
        result.homeTvBroadcasters.push(...list);
        break;
      case "away":
        result.awayTvBroadcasters.push(...list);
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
  if (!homeLeader || !awayLeader) return undefined;
  return { homeLeaders: homeLeader, awayLeaders: awayLeader };
}

function extractLeaderFromCompetitor(comp: ESPNCompetitor): PlayerLeader | undefined {
  if (!comp.leaders || comp.leaders.length === 0) return undefined;

  // ESPN game leaders use "points", "rebounds", "assists" as category names
  const ptsCat = comp.leaders.find((c) => c.name === "points" || c.name === "pointsPerGame" || c.abbreviation === "Pts" || c.abbreviation === "PTS");

  if (!ptsCat || ptsCat.leaders.length === 0) return undefined;

  const athlete = ptsCat.leaders[0].athlete;

  const pts = getStatValue(comp.leaders, ["points", "pointsPerGame"], ["Pts", "PTS"]);
  const reb = getStatValue(comp.leaders, ["rebounds", "reboundsPerGame"], ["Reb", "REB"]);
  const ast = getStatValue(comp.leaders, ["assists", "assistsPerGame"], ["Ast", "AST"]);

  return {
    personId: Number(athlete.id),
    name: athlete.displayName,
    jerseyNum: athlete.jersey,
    position: athlete.position?.abbreviation,
    teamTricode: comp.team.abbreviation,
    points: pts,
    rebounds: reb,
    assists: ast,
  };
}

function getStatValue(categories: ESPNLeaderCategory[], names: string[], abbrs: string[]): number {
  const cat = categories.find((c) => names.includes(c.name) || abbrs.includes(c.abbreviation));
  if (!cat || cat.leaders.length === 0) return 0;
  return Math.round(cat.leaders[0].value);
}
