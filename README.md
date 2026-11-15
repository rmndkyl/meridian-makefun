# meridian

[![make.fun · makefun-frontend-01](https://make.fun/badge/makefun-frontend-01.svg)](https://make.fun/bounty/makefun-frontend-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)
[![rank](https://make.fun/badge/makefun-frontend-01/rmndkyl/meridian-makefun/rank.svg)](https://make.fun/bounty/makefun-frontend-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)
[![reward](https://make.fun/badge/makefun-frontend-01/rmndkyl/meridian-makefun/reward.svg)](https://make.fun/bounty/makefun-frontend-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)

A read-only make.fun frontend covering the live bounty board, bounty pages, leaderboards and entrant profiles from make.fun's public API. It is plain static files with no framework and no build step, so the first load stays small. Everything reads from the public API; nothing writes back.

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
