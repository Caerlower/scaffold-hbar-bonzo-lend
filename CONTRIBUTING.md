# Contributing

Thanks for improving this Scaffold-HBAR template.

## Setup

```bash
corepack enable && corepack prepare yarn@stable --activate
yarn install
yarn next:dev
```

Node ≥ 20.18.3 (`.nvmrc`).

## Before you open a PR

```bash
yarn lint
yarn next:check-types
yarn hardhat:test
yarn next:build
```

Keep diffs focused. Prefer extending `hooks/bonzo/*` over one-off contract calls in pages.

## Style

- TypeScript, App Router, DaisyUI utility classes
- `~~/` import alias in Next.js
- Hardhat deploy files: `snake_case`
- No secrets in git (see [SECURITY.md](./SECURITY.md))

## Architecture

See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md). Do not fork Bonzo core contracts — integrate via addresses in `packages/nextjs/utils/bonzo/addresses.ts`.

## Commit messages

Short imperative summary, e.g. `fix: handle WHBAR association warning`.
