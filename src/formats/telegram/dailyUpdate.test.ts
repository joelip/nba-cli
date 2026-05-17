import { describe, expect, test } from "bun:test";

import type { ScoreboardV3Response, TeamBoxScore } from "../../models/scoreboardV3";
import type { DailyUpdatePayload } from "./types";
import {
  buildAfternoonUpdatePayload,
  formatAfternoonUpdate,
  formatMorningUpdate,
} from "./dailyUpdate";

const payload: DailyUpdatePayload = {
  headerDate: "2026-04-16",
  yesterdayDate: "2026-04-15",
  lastNightResults: [
    {
      winner: {
        name: "Kings",
        tricode: "SAC",
        score: "110",
        leaderLine: "SAC: Player A 25 pts, 8 reb, 6 ast",
      },
      loser: {
        name: "Lakers",
        tricode: "LAL",
        score: "101",
        leaderLine: "LAL: Player B 29 pts, 7 reb, 5 ast",
      },
    },
  ],
  tonightGames: [],
  lotteryWatch: {
    title: "Draft Lottery Watch (Kings +2)",
    lines: [
      { text: "1. Team A (20-62)" },
      { text: "2. Kings (30-52)", highlight: true },
    ],
  },
};

describe("formatMorningUpdate", () => {
  test("includes the lottery watch by default", () => {
    const output = formatMorningUpdate(payload, "Kings");

    expect(output).toContain("**🎰 Draft Lottery Watch (Kings +2):**");
    expect(output).toContain("**2. Kings (30-52)**");
  });

  test("omits the lottery watch when includeLotteryWatch is false", () => {
    const output = formatMorningUpdate(payload, "Kings", {
      includeLotteryWatch: false,
    });

    expect(output).toContain("**Last Night's Results (2026-04-15):**");
    expect(output).not.toContain("Draft Lottery Watch");
  });
});

function team(overrides: Partial<TeamBoxScore>): TeamBoxScore {
  return {
    teamId: 0,
    teamName: "",
    teamCity: "",
    teamTricode: "",
    teamSlug: "",
    wins: 0,
    losses: 0,
    score: 0,
    seed: 0,
    inBonus: null,
    timeoutsRemaining: 0,
    periods: [],
    ...overrides,
  };
}

describe("buildAfternoonUpdatePayload", () => {
  test("builds today's schedule payload without yesterday results or lottery watch", () => {
    const scoreboardToday: ScoreboardV3Response = {
      meta: {
        version: 1,
        request: "",
        time: "",
      },
      scoreboard: {
        gameDate: "2026-05-17",
        leagueId: "00",
        leagueName: "NBA",
        games: [
          {
            gameId: "0042500201",
            gameCode: "20260517/CLEDET",
            gameStatus: 1,
            gameStatusText: "7:30 pm ET",
            period: 0,
            gameClock: "",
            gameTimeUTC: "2026-05-17T23:30:00Z",
            gameEt: "",
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
            broadcasters: {
              nationalBroadcasters: [{ broadcasterId: 1, broadcastDisplay: "TNT" }],
              nationalRadioBroadcasters: [],
              nationalOttBroadcasters: [],
              homeTvBroadcasters: [],
              homeRadioBroadcasters: [],
              homeOttBroadcasters: [],
              awayTvBroadcasters: [],
              awayRadioBroadcasters: [],
              awayOttBroadcasters: [],
            },
            awayTeam: team({
              teamId: 1610612739,
              teamName: "Cavaliers",
              teamCity: "Cleveland",
              teamTricode: "CLE",
              teamSlug: "cavaliers",
            }),
            homeTeam: team({
              teamId: 1610612765,
              teamName: "Pistons",
              teamCity: "Detroit",
              teamTricode: "DET",
              teamSlug: "pistons",
            }),
          },
        ],
      },
    };

    const payload = buildAfternoonUpdatePayload({
      todayISO: "2026-05-17",
      timeZone: "America/Los_Angeles",
      scoreboardToday,
    });

    expect(payload.lastNightResults).toEqual([]);
    expect(payload.lotteryWatch).toBeUndefined();
    expect(formatAfternoonUpdate(payload)).toContain(
      "• 4:30 PM PT — **Cleveland Cavaliers @ Detroit Pistons** — TNT",
    );
  });
});
