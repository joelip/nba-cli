# nba-cli

Bun-based CLI and TypeScript client for NBA stats/live data.

## Requirements

- [Bun](https://bun.sh) installed and available on your PATH.

## Setup

```bash
bun install
```

## CLI usage

Run via the wrapper script:

```bash
./nba-cli <command> [options]
```

Or via Bun directly:

```bash
bun run src/cli/index.ts <command> [options]
```

### Commands

#### `scoreboard`

Fetch daily scoreboard (normalized by default).

```bash
./nba-cli scoreboard 2025-11-05
./nba-cli scoreboard 2025-11-05 --raw
```

#### `schedule`

Fetch season schedule (normalized by default).

Season format: `YYYY-YY` (example: `2025-26`).

```bash
./nba-cli schedule 2025-26
./nba-cli schedule --season 2025-26 --raw
```

#### `standings`

Fetch league standings (normalized by default).

```bash
./nba-cli standings 2025-26
./nba-cli standings 2025-26 --type "Regular Season"
./nba-cli standings 2025-26 --season-year 2025
```

Season type options:
`Regular Season`, `Pre Season`, `PlayIn`, `Playoffs`, `All Star`.

#### `ist-standings`

Fetch in‑season tournament standings (normalized by default).

```bash
./nba-cli ist-standings 2025-26
./nba-cli ist-standings 2025-26 --section group
./nba-cli ist-standings 2025-26 --section wildcard
```

#### `playoff-picture`

Fetch playoff picture (normalized by default).

SeasonId format: `2YYYY` (example: `22025`).

```bash
./nba-cli playoff-picture 22025
./nba-cli playoff-picture 22025 --raw
```

#### `daily-update`

Build the full Telegram daily update message (yesterday's results + tonight's games + lottery watch).

```bash
./nba-cli daily-update
./nba-cli daily-update --today 2026-01-30 --yesterday 2026-01-29
./nba-cli daily-update --season 2025-26
./nba-cli daily-update --no-standings
./nba-cli daily-update --team "Kings" --team-city "Sacramento" --team-slug "kings"
```

#### `yesterdays-results`

Build the morning-style Telegram update (yesterday's results + lottery watch).

```bash
./nba-cli yesterdays-results
./nba-cli yesterdays-results --today 2026-01-30 --yesterday 2026-01-29
./nba-cli yesterdays-results --season 2025-26
```

#### `todays-schedule`

Build the afternoon-style Telegram update (tonight's games).

```bash
./nba-cli todays-schedule
./nba-cli todays-schedule --today 2026-01-30 --yesterday 2026-01-29
```

Options:
- `--today` / `--yesterday`: override dates (YYYY-MM-DD)
- `--timezone`: IANA TZ (default `America/Los_Angeles`)
- `--season`: standings season (YYYY-YY)
- `--no-standings`: skip standings fetch
- `--team`, `--team-city`, `--team-slug`: focus team for lottery watch

#### `live`

Fetch today's live scoreboard (raw JSON).

```bash
./nba-cli live
```

### Help

```bash
./nba-cli --help
./nba-cli standings --help
```

## Output modes

All commands support `--raw` to print the raw API response JSON.

## Cache

Season schedule responses are cached on disk by default:

- Location: `.cache/nba-cli/` in the repo root.
- Filenames are human‑readable (for example: `scheduleleaguev2_2025-26_00.json`).

## Library usage (TypeScript)

```ts
import { StatsClient, LiveClient } from "./src/index";

const stats = new StatsClient();
const live = new LiveClient();

const scoreboard = await stats.scoreboardV3("2025-11-05");
const standings = await stats.leagueStandingsV3({ season: "2025-26" });
const liveScoreboard = await live.todaysScoreboard();
```
