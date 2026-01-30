import { LiveClient } from "../clients/liveClient";
import { StatsClient, type SeasonType } from "../clients/statsClient";
import { buildTelegramDailyUpdate } from "../formats/telegram/dailyUpdate";
import { normalizeISTStandings } from "../normalize/istStandings";
import { normalizeLeagueStandingsV3 } from "../normalize/leagueStandingsV3";
import { normalizePlayoffPicture } from "../normalize/playoffPicture";
import { normalizeScoreboardV3 } from "../normalize/scoreboardV3";
import { flattenScheduleGames } from "../normalize/scheduleLeagueV2";

type Command =
  | "scoreboard"
  | "schedule"
  | "live"
  | "standings"
  | "ist-standings"
  | "playoff-picture"
  | "daily-update";

type ParsedOptions = Record<string, string | boolean>;
interface ParsedArgs {
  positionals: string[];
  options: ParsedOptions;
}

const args = Bun.argv.slice(2);
const rawCommand = args[0];

function isCommand(value: string | undefined): value is Command {
  return (
    value === "scoreboard" ||
    value === "schedule" ||
    value === "live" ||
    value === "standings" ||
    value === "ist-standings" ||
    value === "playoff-picture" ||
    value === "daily-update"
  );
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

  const commandArgs = args.slice(1);
  if (commandArgs.includes("--help") || commandArgs.includes("-h")) {
    printCommandHelp(rawCommand);
    return;
  }

  const { positionals, options } = parseArgs(
    commandArgs.filter((arg) => arg !== "--help" && arg !== "-h"),
  );

  switch (rawCommand) {
    case "scoreboard": {
      const date = positionals[0] ?? new Date().toISOString().slice(0, 10);
      const client = new StatsClient();
      const response = await client.scoreboardV3(date);
      if (isTruthyOption(options, "raw")) {
        console.log(JSON.stringify(response, null, 2));
        return;
      }
      console.log(JSON.stringify(normalizeScoreboardV3(response), null, 2));
      return;
    }
    case "schedule": {
      const season = optionValue(options, "season") ?? positionals[0];
      const client = new StatsClient();
      const response = await client.scheduleLeagueV2({ season });
      if (isTruthyOption(options, "raw")) {
        console.log(JSON.stringify(response, null, 2));
        return;
      }
      console.log(JSON.stringify(flattenScheduleGames(response), null, 2));
      return;
    }
    case "standings": {
      const season = optionValue(options, "season") ?? positionals[0];
      if (!season) {
        console.error("standings requires a season (example: 2025-26).");
        process.exitCode = 1;
        return;
      }
      const seasonTypeInput =
        optionValue(options, "type") ?? optionValue(options, "season-type");
      const seasonType = parseSeasonType(seasonTypeInput);
      if (seasonTypeInput && !seasonType) {
        console.error(
          `Invalid season type: ${seasonTypeInput}. Expected one of: ${SEASON_TYPES.join(", ")}.`,
        );
        process.exitCode = 1;
        return;
      }
      const seasonYear = optionValue(options, "season-year");
      const client = new StatsClient();
      const response = await client.leagueStandingsV3({
        season,
        seasonType,
        seasonYear,
      });
      if (isTruthyOption(options, "raw")) {
        console.log(JSON.stringify(response, null, 2));
        return;
      }
      console.log(JSON.stringify(normalizeLeagueStandingsV3(response), null, 2));
      return;
    }
    case "ist-standings": {
      const season = optionValue(options, "season") ?? positionals[0];
      if (!season) {
        console.error("ist-standings requires a season (example: 2025-26).");
        process.exitCode = 1;
        return;
      }
      const section =
        optionValue(options, "section") ??
        (isTruthyOption(options, "group") ? "group" : undefined) ??
        (isTruthyOption(options, "wildcard") ? "wildcard" : undefined);
      if (section && section !== "group" && section !== "wildcard") {
        console.error("Invalid section. Use 'group' or 'wildcard'.");
        process.exitCode = 1;
        return;
      }
      const client = new StatsClient();
      const response = await client.istStandings({
        season,
        section: section ?? "group",
      });
      if (isTruthyOption(options, "raw")) {
        console.log(JSON.stringify(response, null, 2));
        return;
      }
      console.log(JSON.stringify(normalizeISTStandings(response), null, 2));
      return;
    }
    case "playoff-picture": {
      const seasonId = optionValue(options, "season-id") ?? positionals[0];
      if (!seasonId) {
        console.error("playoff-picture requires a seasonId (example: 22025).");
        process.exitCode = 1;
        return;
      }
      const client = new StatsClient();
      const response = await client.playoffPicture({ seasonId });
      if (isTruthyOption(options, "raw")) {
        console.log(JSON.stringify(response, null, 2));
        return;
      }
      console.log(JSON.stringify(normalizePlayoffPicture(response), null, 2));
      return;
    }
    case "daily-update": {
      const timeZone =
        optionValue(options, "timezone") ??
        optionValue(options, "tz") ??
        "America/Los_Angeles";
      const todayISO =
        optionValue(options, "today") ?? getDateISOInTimeZone(new Date(), timeZone);
      const yesterdayISO =
        optionValue(options, "yesterday") ?? shiftDateISO(todayISO, -1);
      const teamName = optionValue(options, "team") ?? "Kings";
      const teamCity = optionValue(options, "team-city") ?? "Sacramento";
      const teamSlug = optionValue(options, "team-slug") ?? "kings";

      const client = new StatsClient();
      const scoreboardYesterday = await client.scoreboardV3(yesterdayISO);
      const scoreboardToday = await client.scoreboardV3(todayISO);

      let standings;
      if (!isTruthyOption(options, "no-standings")) {
        const season =
          optionValue(options, "season") ?? deriveSeasonFromDate(todayISO);
        standings = await client.leagueStandingsV3({ season });
      }

      const message = buildTelegramDailyUpdate({
        date: {
          todayISO,
          yesterdayISO,
          timeZone,
        },
        focusTeam: {
          name: teamName,
          city: teamCity,
          slug: teamSlug,
        },
        raw: {
          scoreboardYesterday,
          scoreboardToday,
          standings,
        },
      });

      console.log(message);
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
  standings [SEASON]        Fetch league standings (normalized by default)
                            Options: --type "Regular Season"
                                     --season-year YYYY
  ist-standings [SEASON]    Fetch IST standings (normalized by default)
                            Options: --section group|wildcard
  playoff-picture [ID]      Fetch playoff picture (normalized by default)
                            SeasonId format: 2YYYY (example: 22025)
  live                      Fetch today's live scoreboard (raw JSON)
  daily-update              Build Telegram daily update message

Options:
  --raw     Print raw API response JSON
  -h, --help    Show this help message

Tip:
  Use "<command> --help" for command-specific help.
`);
}

function printCommandHelp(command: Command) {
  switch (command) {
    case "scoreboard":
      printScoreboardHelp();
      return;
    case "schedule":
      printScheduleHelp();
      return;
    case "standings":
      printStandingsHelp();
      return;
    case "ist-standings":
      printIstStandingsHelp();
      return;
    case "playoff-picture":
      printPlayoffPictureHelp();
      return;
    case "daily-update":
      printDailyUpdateHelp();
      return;
    case "live":
      printLiveHelp();
      return;
  }
}

function printScoreboardHelp() {
  console.log(`scoreboard

Usage:
  ./nba-cli scoreboard [YYYY-MM-DD] [--raw]

Arguments:
  YYYY-MM-DD    Optional. Defaults to today's date.

Options:
  --raw         Print the raw API response JSON.
  -h, --help    Show this help message.
`);
}

function printScheduleHelp() {
  console.log(`schedule

Usage:
  ./nba-cli schedule [SEASON] [--season YYYY-YY] [--raw]

Arguments:
  SEASON        Optional. Season in YYYY-YY format (example: 2025-26).

Options:
  --season      Season in YYYY-YY format (overrides positional).
  --raw         Print the raw API response JSON.
  -h, --help    Show this help message.
`);
}

function printStandingsHelp() {
  console.log(`standings

Usage:
  ./nba-cli standings <SEASON> [options]

Arguments:
  SEASON        Required. Season in YYYY-YY format (example: 2025-26).

Options:
  --season       Season in YYYY-YY format (overrides positional).
  --type         Season type. One of: ${SEASON_TYPES.join(", ")}.
  --season-year  Optional season year (YYYY) for NBA API SeasonYear.
  --raw          Print the raw API response JSON.
  -h, --help     Show this help message.
`);
}

function printIstStandingsHelp() {
  console.log(`ist-standings

Usage:
  ./nba-cli ist-standings <SEASON> [options]

Arguments:
  SEASON        Required. Season in YYYY-YY format (example: 2025-26).

Options:
  --season      Season in YYYY-YY format (overrides positional).
  --section     'group' or 'wildcard' (default: group).
  --group       Shorthand for --section group.
  --wildcard    Shorthand for --section wildcard.
  --raw         Print the raw API response JSON.
  -h, --help    Show this help message.
`);
}

function printPlayoffPictureHelp() {
  console.log(`playoff-picture

Usage:
  ./nba-cli playoff-picture <SEASON_ID> [--raw]

Arguments:
  SEASON_ID     Required. SeasonId in 2YYYY format (example: 22025).

Options:
  --season-id   SeasonId in 2YYYY format (overrides positional).
  --raw         Print the raw API response JSON.
  -h, --help    Show this help message.
`);
}

function printDailyUpdateHelp() {
  console.log(`daily-update

Usage:
  ./nba-cli daily-update [options]

Options:
  --today        Date in YYYY-MM-DD format (defaults to today in PT).
  --yesterday    Date in YYYY-MM-DD format (defaults to yesterday in PT).
  --timezone     IANA timezone (default: America/Los_Angeles).
  --season       Season in YYYY-YY format for standings (default: derived from today).
  --no-standings Skip standings fetch (lottery section will note missing data).
  --team         Focus team name (default: Kings).
  --team-city    Focus team city (default: Sacramento).
  --team-slug    Focus team slug (default: kings).
  -h, --help     Show this help message.
`);
}

function printLiveHelp() {
  console.log(`live

Usage:
  ./nba-cli live

Options:
  -h, --help    Show this help message.
`);
}

function parseArgs(argsToParse: string[]): ParsedArgs {
  const positionals: string[] = [];
  const options: ParsedOptions = {};

  for (let i = 0; i < argsToParse.length; i += 1) {
    const arg = argsToParse[i];
    if (!arg.startsWith("--")) {
      positionals.push(arg);
      continue;
    }

    const trimmed = arg.slice(2);
    const [key, valueFromArg] = trimmed.split("=", 2);
    if (valueFromArg !== undefined) {
      options[key] = valueFromArg;
      continue;
    }

    const next = argsToParse[i + 1];
    if (next && !next.startsWith("--")) {
      options[key] = next;
      i += 1;
    } else {
      options[key] = true;
    }
  }

  return { positionals, options };
}

function optionValue(options: ParsedOptions, key: string): string | undefined {
  const value = options[key];
  return typeof value === "string" ? value : undefined;
}

function isTruthyOption(options: ParsedOptions, key: string): boolean {
  const value = options[key];
  return value === true || value === "true";
}

const SEASON_TYPES: SeasonType[] = [
  "Regular Season",
  "Pre Season",
  "PlayIn",
  "Playoffs",
  "All Star",
];

function parseSeasonType(value?: string): SeasonType | undefined {
  if (!value) {
    return undefined;
  }
  return SEASON_TYPES.includes(value as SeasonType)
    ? (value as SeasonType)
    : undefined;
}

function getDateISOInTimeZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";

  return `${year}-${month}-${day}`;
}

function shiftDateISO(dateISO: string, deltaDays: number): string {
  const base = new Date(`${dateISO}T00:00:00Z`);
  if (Number.isNaN(base.getTime())) {
    return dateISO;
  }
  const shifted = new Date(base.getTime() + deltaDays * 24 * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
}

function deriveSeasonFromDate(dateISO: string): string {
  const year = Number.parseInt(dateISO.slice(0, 4), 10);
  const month = Number.parseInt(dateISO.slice(5, 7), 10);
  const seasonYear = month <= 9 ? year - 1 : year;
  const nextYearShort = String(seasonYear + 1).slice(2);
  return `${seasonYear}-${nextYearShort}`;
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
