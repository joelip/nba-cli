import { LiveClient } from "../clients/liveClient";
import { StatsClient } from "../clients/statsClient";
import { normalizeScoreboardV3 } from "../normalize/scoreboardV3";
import { flattenScheduleGames } from "../normalize/scheduleLeagueV2";

type Command = "scoreboard" | "schedule" | "live";

const args = Bun.argv.slice(2);
const rawCommand = args[0];
const flags = new Set(args.filter((arg) => arg.startsWith("--")));

function isCommand(value: string | undefined): value is Command {
  return value === "scoreboard" || value === "schedule" || value === "live";
}

function hasFlag(flag: string): boolean {
  return flags.has(flag);
}

async function run() {
  if (!rawCommand || rawCommand === "--help" || rawCommand === "-h") {
    printHelp();
    return;
  }

  if (!isCommand(rawCommand)) {
    console.error(`Unknown command: ${rawCommand}`);
    printHelp();
    process.exitCode = 1;
    return;
  }

  switch (rawCommand) {
    case "scoreboard": {
      const date = args[1] ?? new Date().toISOString().slice(0, 10);
      const client = new StatsClient();
      const response = await client.scoreboardV3(date);
      if (hasFlag("--raw")) {
        console.log(JSON.stringify(response, null, 2));
        return;
      }
      console.log(JSON.stringify(normalizeScoreboardV3(response), null, 2));
      return;
    }
    case "schedule": {
      const season = args[1];
      const client = new StatsClient();
      const response = await client.scheduleLeagueV2({ season });
      if (hasFlag("--raw")) {
        console.log(JSON.stringify(response, null, 2));
        return;
      }
      console.log(JSON.stringify(flattenScheduleGames(response), null, 2));
      return;
    }
    case "live": {
      const client = new LiveClient();
      const response = await client.todaysScoreboard();
      console.log(JSON.stringify(response, null, 2));
      return;
    }
  }
}

function printHelp() {
  console.log(`nba-cli (Bun)

Usage:
  bun run src/cli/index.ts <command> [options]

Commands:
  scoreboard [YYYY-MM-DD]   Fetch daily scoreboard (normalized by default)
  schedule [SEASON]         Fetch season schedule (normalized by default)
                            Season format: YYYY-YY (example: 2025-26)
  live                      Fetch today's live scoreboard (raw JSON)

Options:
  --raw     Print raw API response JSON
  -h, --help    Show this help message
`);
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
