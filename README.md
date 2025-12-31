# 2D Voting Simulator

React + TypeScript + Vite playground for simulating voting systems in a 2D space.

## Features
- add/drag voter clusters (click) and candidates (Shift+click), see weights/spread, selection panel edits, delete.
- density settings, adjustable voter count
- Voting systems: plurality, approval, Condorcet (pairwise matrix), IRV with round history.
- IRV animation player that recolors voters by current round leader.
- Scenario management: save/load JSON and three built-in presets demonstrating edge cases.

## Run locally
```bash
cd voting-2d
npm install
npm run dev
```

Open the printed localhost URL. Run tests with `npm test`.
