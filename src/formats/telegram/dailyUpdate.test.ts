import { describe, expect, test } from "bun:test";

import type { DailyUpdatePayload } from "./types";
import { formatMorningUpdate } from "./dailyUpdate";

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
