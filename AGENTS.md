# Agent instructions — Bonzo Lend template

Briefing for coding agents (Cursor, Claude Code, Codex). Claude Code also loads `CLAUDE.md`.

This Scaffold-HBAR app integrates **Bonzo Finance** (Aave v2–compatible lending) on Hedera testnet/mainnet. Stack: Next.js App Router, RainbowKit, wagmi, viem, Hardhat, DaisyUI.

Package manager: Yarn workspaces (`packageManager` in root `package.json`). Prefer `yarn <script>`; if the user scaffolded with npm, use `npm run <script>`.

## Do not

- Commit `.env`, `.env.local`, private keys, or operator credentials
- Fork or redeploy Bonzo core contracts — use external addresses in `packages/nextjs/utils/bonzo/addresses.ts` and `externalContracts.ts`
- Add decorative SDK imports that are unused by the lending flow

## Commands

```bash
yarn next:dev
yarn next:build
yarn lint
yarn hardhat:compile
yarn hardhat:test
yarn hardhat:deploy --network localhost
yarn hardhat:deploy --network hederaTestnet
yarn hardhat:account:generate
yarn hardhat:account:import
```

## Layout

### Hardhat (`packages/hardhat`)

- `contracts/AuditAnchor.sol` — on-chain lending action anchors (+ optional HCS ref)
- `deploy/00_deploy_audit_anchor.ts`
- `test/AuditAnchor.test.ts`
- Config: `hardhat.config.ts` (`hederaTestnet` 296, `hederaMainnet` 295)

After deploy, ABIs land in `packages/nextjs/contracts/deployedContracts.ts`.

### Frontend (`packages/nextjs`)

| Path | Role |
| --- | --- |
| `utils/bonzo/addresses.ts` | Bonzo core + reserve addresses |
| `utils/bonzo/abis.ts` | LendingPool, DataProvider, WETHGateway, ERC20, AuditAnchor ABIs |
| `hooks/bonzo/useBonzoMarkets.ts` | Reserve APYs / liquidity |
| `hooks/bonzo/useBonzoUserAccount.ts` | Portfolio / health |
| `hooks/bonzo/useBonzoLending.ts` | Approve + deposit/withdraw/borrow/repay + HCS/anchor side effects |
| `hooks/bonzo/useHtsAssociation.ts` | Mirror Node association check |
| `components/bonzo/LendingForm.tsx` | Shared action UI |
| `app/markets`, `supply`, `borrow`, `portfolio`, `audit` | Product routes |
| `app/api/hcs/*` | Topic create/submit + mirror message read |
| `services/hcs/server.ts` | Hiero SDK operator helpers (server-only) |
| `contracts/externalContracts.ts` | Bonzo + WHBAR/USDC wired for scaffold hooks |

### HCS message schema

```json
{
  "action": "deposit",
  "asset": "0x…",
  "amount": "1.0",
  "txHash": "0x…",
  "symbol": "WHBAR",
  "timestamp": "ISO-8601",
  "protocol": "bonzo",
  "template": "scaffold-hbar-bonzo-lend"
}
```

Env (Next.js): `HEDERA_OPERATOR_ID`, `HEDERA_OPERATOR_KEY`, `HCS_AUDIT_TOPIC_ID`.

## Frontend contract patterns

Use scaffold hooks for **deployed** contracts (`AuditAnchor` after deploy):

- `useScaffoldReadContract` / `useScaffoldWriteContract`
- Prefer direct `useReadContract` / `useWriteContract` for Bonzo externals (already wrapped in `hooks/bonzo/*`)

```typescript
import { useBonzoLending } from "~~/hooks/bonzo/useBonzoLending";

const { run, pending } = useBonzoLending();
await run("deposit", "USDC", "10", 6);
```

## Networks

- Next: `scaffold.config.ts` — default target includes Hedera testnet
- Hardhat: `hederaTestnet` / `hederaMainnet`
- Bonzo addresses keyed by chain id in `utils/bonzo/addresses.ts`

## Style

| Style | Use |
| --- | --- |
| `UpperCamelCase` | types, components |
| `lowerCamelCase` | variables, functions |
| `CONSTANT_CASE` | constants |
| `snake_case` | Hardhat deploy filenames |

Imports use the `~~` alias. App Router pages that use hooks need `"use client"`. Prefer DaisyUI (`btn`, `table`, `alert`) over one-off Tailwind chrome.
