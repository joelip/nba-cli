import type {
  DailyUpdateInput,
  DailyUpdatePayload,
  LotteryWatchLine,
  ResultGamePayload,
  TonightGamePayload,
} from "./types";
import {
  formatBroadcast,
  formatLeaderLine,
  formatPacificTime,
  formatRecord,
  formatScore,
  formatStandingsTeamName,
  formatTeamName,
  getLotteryRanking,
  isFocusTeam,
  pickWinnersAndLosers,
} from "./helpers";
import { getResultSet, normalizeResultSetLoose } from "../../normalize/statsResultSets";

export function buildTelegramDailyUpdate(input: DailyUpdateInput): string {
  const payload = buildDailyUpdatePayload(input);
  return formatDailyUpdate(payload, input.focusTeam.name);
}

export function buildDailyUpdatePayload(input: DailyUpdateInput): DailyUpdatePayload {
  const lastNightResults = buildLastNightResults(input);
  const tonightGames = buildTonightGames(input);
  const lotteryWatch = buildLotteryWatch(input);

  return {
    headerDate: input.date.todayISO,
    yesterdayDate: input.date.yesterdayISO,
    lastNightResults,
    tonightGames,
    lotteryWatch,
  };
}

function buildLastNightResults(input: DailyUpdateInput): ResultGamePayload[] {
  return input.raw.scoreboardYesterday.scoreboard.games.map((game) => {
    const { winner, loser, winnerLeader, loserLeader } = pickWinnersAndLosers(game);

    return {
      winner: {
        name: formatTeamName(winner),
        tricode: winner.teamTricode,
        score: formatScore(winner.score),
        leaderLine: formatLeaderLine(winner.teamTricode, winnerLeader),
      },
      loser: {
        name: formatTeamName(loser),
        tricode: loser.teamTricode,
        score: formatScore(loser.score),
        leaderLine: formatLeaderLine(loser.teamTricode, loserLeader),
      },
    };
  });
}

function buildTonightGames(input: DailyUpdateInput): TonightGamePayload[] {
  return input.raw.scoreboardToday.scoreboard.games.map((game) => ({
    timePacific: formatPacificTime(game, input.date.timeZone),
    away: formatTeamName(game.awayTeam),
    home: formatTeamName(game.homeTeam),
    broadcast: formatBroadcast(game),
  }));
}

function buildLotteryWatch(input: DailyUpdateInput): DailyUpdatePayload["lotteryWatch"] {
  if (!input.raw.standings) {
    return undefined;
  }

  const standingsSet = getResultSet(input.raw.standings, "Standings");
  if (!standingsSet) {
    return {
      title: `Draft Lottery Watch (${input.focusTeam.name} +2)`,
      lines: [{ text: "Standings data not found in response." }],
    };
  }

  const rows = normalizeResultSetLoose(standingsSet);
  const ranking = getLotteryRanking(rows);
  const focusIndex = ranking.findIndex((row) => isFocusTeam(row, input.focusTeam));

  if (focusIndex === -1) {
    return {
      title: `Draft Lottery Watch (${input.focusTeam.name} +2)`,
      lines: [{ text: "Focus team not found in standings." }],
    };
  }

  const start = Math.max(0, focusIndex - 2);
  const end = Math.min(ranking.length - 1, focusIndex + 2);
  const lines: LotteryWatchLine[] = [];

  for (let i = start; i <= end; i += 1) {
    const row = ranking[i];
    const teamName = formatStandingsTeamName(row);
    const record = formatRecord(row);
    const lineText = record ? `${i + 1}. ${teamName} (${record})` : `${i + 1}. ${teamName}`;
    lines.push({
      text: lineText,
      highlight: i === focusIndex,
    });
  }

  return {
    title: `Draft Lottery Watch (${input.focusTeam.name} +2)`,
    lines,
  };
}

function formatDailyUpdate(payload: DailyUpdatePayload, focusTeamName: string): string {
  const lines: string[] = [];

  lines.push(`🏀 **NBA Daily Update — ${payload.headerDate}**`);
  lines.push("");
  lines.push(`**Last Night's Results (${payload.yesterdayDate}):**`);

  for (const game of payload.lastNightResults) {
    lines.push(`• **${game.winner.name} ${game.winner.score} - ${game.loser.name} ${game.loser.score}**`);
    lines.push(`  ${game.winner.leaderLine}`);
    lines.push(`  ${game.loser.leaderLine}`);
  }

  lines.push("");
  lines.push(`**Tonight's Games (${payload.headerDate}):**`);

  for (const game of payload.tonightGames) {
    lines.push(`• ${game.timePacific} — ${game.away} @ ${game.home} — **${game.broadcast}**`);
  }

  if (payload.lotteryWatch) {
    lines.push("");
    lines.push(`**🎰 ${payload.lotteryWatch.title}:**`);
    for (const line of payload.lotteryWatch.lines) {
      if (line.highlight) {
        lines.push(`• **${line.text}**`);
      } else {
        lines.push(`• ${line.text}`);
      }
    }
  } else {
    lines.push("");
    lines.push(`**🎰 Draft Lottery Watch (${focusTeamName} +2):**`);
    lines.push("• No standings data provided.");
  }

  return lines.join("\n");
}
