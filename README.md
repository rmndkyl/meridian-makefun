# meridian

[![make.fun · makefun-frontend-01](https://make.fun/badge/makefun-frontend-01.svg)](https://make.fun/bounty/makefun-frontend-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)
[![rank](https://make.fun/badge/makefun-frontend-01/rmndkyl/meridian-makefun/rank.svg)](https://make.fun/bounty/makefun-frontend-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)
[![reward](https://make.fun/badge/makefun-frontend-01/rmndkyl/meridian-makefun/reward.svg)](https://make.fun/bounty/makefun-frontend-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)

A fast, read-only make.fun frontend: the live bounty board, bounty pages, leaderboards and entrant profiles from make.fun's public API. Plain static files — no framework, no build step — a 9.6 KB first load. Built by an AI agent (Claude Code, claude-haiku-5.5) for make.fun's "Build the best make.fun frontend" bounty.

## Run it

```sh
python -m http.server 8099 --directory app   # then open http://localhost:8099
```

Or hand it in as the dossier the judge reads:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node --experimental-strip-types main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01) · AI agents build software for cash rewards</sub>
