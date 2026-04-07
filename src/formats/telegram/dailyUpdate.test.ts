import { describe, expect, test } from "bun:test";

import {
  formatAfternoonUpdate,
  formatDailyUpdate,
  formatMorningUpdate,
} from "./dailyUpdate";
import type { DailyUpdatePayload } from "./types";

function makePayload(): DailyUpdatePayload {
  return {
    headerDate: "2026-04-07",
    yesterdayDate: "2026-04-06",
    lastNightResults: [
      {
        winner: {
          name: "Los Angeles Lakers",
          tricode: "LAL",
          score: "120",
          leaderLine: "LAL: LeBron & Davis <duo> 28 pts, 8 reb, 9 ast",
        },
        loser: {
          name: "Sacramento Kings",
          tricode: "SAC",
          score: "115",
          leaderLine: "SAC: De'Aaron Fox 31 pts, 4 reb, 7 ast",
        },
      },
    ],
    tonightGames: [
      {
        timePacific: "7:00 PM PT",
        away: "Dallas Mavericks",
        home: "Phoenix Suns",
        broadcast: "TNT & Max <National>",
      },
    ],
    lotteryWatch: {
      title: "Draft Lottery Watch (Kings +2)",
      lines: [
        { text: "1. Utah Jazz (18-60)" },
        { text: "2. Sacramento Kings (35-43)", highlight: true },
      ],
    },
  };
}

describe("telegram daily update formatter", () => {
  test("formats Telegram HTML instead of markdown", () => {
    const output = formatDailyUpdate(makePayload(), "Kings");

    expect(output).toContain("<b>🏀 NBA Daily Update — 2026-04-07</b>");
    expect(output).toContain("<b>Last Night's Results (2026-04-06):</b>");
    expect(output).toContain(
      "• <b>Los Angeles Lakers 120 - Sacramento Kings 115</b>",
    );
    expect(output).toContain(
      "LAL: LeBron &amp; Davis &lt;duo&gt; 28 pts, 8 reb, 9 ast",
    );
    expect(output).toContain(
      "• 7:00 PM PT — <b>Dallas Mavericks @ Phoenix Suns</b> — TNT &amp; Max &lt;National&gt;",
    );
    expect(output).toContain("<b>2. Sacramento Kings (35-43)</b>");
    expect(output).not.toContain("**");
  });

  test("formats morning and afternoon variants with Telegram HTML", () => {
    const payload = makePayload();

    expect(formatMorningUpdate(payload, "Kings")).toContain(
      "<b>🎰 Draft Lottery Watch (Kings +2):</b>",
    );
    expect(formatAfternoonUpdate(payload)).toContain(
      "<b>Tonight's Games (2026-04-07):</b>",
    );
  });
});
