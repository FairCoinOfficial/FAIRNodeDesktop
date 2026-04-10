# FAIRNode Desktop monorepo (Bun)

Workspaces:
- `packages/common` — shared types & constants
- `packages/ui` — Vite + React + Tailwind renderer
- `packages/electron` — Electron main & preload

Scripts (root):
- `bun install` — install deps & link workspaces
- `bun run dev` — Vite dev server + Electron (hot reload)
- `bun run build` — renderer build + type-check main/preload
- `bun run dist` — package app via electron-builder

Notes:
- Uses Bun everywhere (`bun`, `bunx`).
- electron-builder outputs to `dist/`. Extra resources pulled from `resources/bin/<platform>`.
