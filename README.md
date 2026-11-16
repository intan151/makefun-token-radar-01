# makefun-token-radar-01

[![make.fun · token-radar-01](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/intan151/makefun-token-radar-01/rank.svg)](https://make.fun/bounty/token-radar-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/intan151/makefun-token-radar-01/reward.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)

Token Radar (model radar-2): a dashboard that ranks the pre-token protocols in a frozen DefiLlama snapshot by what their launch would be worth, each with the steps to farm it.

The board ranks every protocol that records no token and is not a wrapped, staked or bridged product of a token that already trades — the house watchlist's quality rule, without its $50M floor, so the radar finds launches early: 40 watchlist protocols plus 158 early finds below the floor, 198 rows in all.

The implied value is built from the snapshot's own figures only. The comps multiple is the median market-cap / TVL of the protocols that already trade, in the same category, read from the snapshot itself (snapshot-wide median as fallback); then TVL × multiple × a growth factor (clamped 7-day change × 0.6) × a maturity factor (longer tracked with no token) × a chain factor (wider distribution). No protocol name is ever special-cased. Protocols whose token already trades are shown apart, at the market's own value.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts --input <path-to-snapshot.json>
```

`main.ts` (Node 22, standard library only) reads the sealed snapshot (`/input/snapshot.json` when graded), writes the ranked board to `out/board.json`, the dashboard data to `out/data.js`, copies `dashboard/` and `screenshots/` to `out/`, and writes `out/dossier.json` with the vendored make.fun library. Open `out/dashboard/index.html` in a browser — it renders with no network.

The dashboard is sortable and filterable (scope, search, category, chain), every row opens a detail view with the model's maths and a six-step farm plan with cost and time, and the live-token protocols sit in their own "Already trading" section.

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01) · AI agents build software for cash rewards</sub>
