# Agent instructions — Bonzo Lend

Briefing for coding agents (Cursor, Claude Code, Codex). Claude Code also loads [`CLAUDE.md`](./CLAUDE.md).

Scaffold-HBAR dApp: **Bonzo Finance** lending on Hedera (testnet/mainnet). Stack: Next.js App Router, RainbowKit, wagmi, viem, Hardhat, DaisyUI. Yarn workspaces — prefer `yarn <script>`.

## Do not

- Commit `.env`, `.env.local`, private keys, or operator credentials
- Fork or redeploy Bonzo — use [`packages/nextjs/utils/bonzo/addresses.ts`](./packages/nextjs/utils/bonzo/addresses.ts)
- Add unused SDK imports to “tick a box”

## Commands

```bash
yarn next:dev
yarn next:build
yarn lint
yarn test
yarn hardhat:compile
yarn hardhat:deploy --network localhost
yarn hardhat:deploy --network hederaTestnet
yarn hardhat:account:generate
```

## Layout

### Hardhat (`packages/hardhat`)

| Path | Role |
| --- | --- |
| `contracts/AuditAnchor.sol` | On-chain lending action anchors |
| `deploy/00_deploy_audit_anchor.ts` | Deploy script |
| `test/AuditAnchor.test.ts` | Unit tests |
| `hardhat.config.ts` | `hederaTestnet` (296), `hederaMainnet` (295) |

Deploy updates `packages/nextjs/contracts/deployedContracts.ts`.

### Frontend (`packages/nextjs`)

| Path | Role |
| --- | --- |
| `utils/bonzo/addresses.ts` | Bonzo + reserve addresses |
| `utils/bonzo/abis.ts` | LendingPool, DataProvider, ERC20, AuditAnchor |
| `hooks/bonzo/useBonzoMarkets.ts` | Markets |
| `hooks/bonzo/useBonzoUserAccount.ts` | Portfolio / health |
| `hooks/bonzo/useBonzoLending.ts` | Lending writes + HCS/anchor side effects |
| `hooks/bonzo/useHtsAssociation.ts` | Mirror Node association |
| `components/bonzo/LendingForm.tsx` | Shared form UI |
| `app/{markets,supply,borrow,portfolio,audit}` | Product routes |
| `app/api/hcs/*` | Topic create / submit / messages |
| `services/hcs/server.ts` | Hiero SDK (server-only) |
| `contracts/externalContracts.ts` | Bonzo wired for scaffold hooks |

Docs: [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md).

### HCS message schema

```json
{
  "action": "deposit",
  "asset": "0x…",
  "amount": "1.0",
  "txHash": "0x…",
  "symbol": "USDC",
  "timestamp": "ISO-8601",
  "protocol": "bonzo",
  "template": "scaffold-hbar-bonzo-lend"
}
```

Env: `HEDERA_OPERATOR_ID`, `HEDERA_OPERATOR_KEY`, `HCS_AUDIT_TOPIC_ID` (never `NEXT_PUBLIC_*`).

## Patterns

```typescript
import { useBonzoLending } from "~~/hooks/bonzo/useBonzoLending";

const { run, pending } = useBonzoLending();
await run("deposit", "USDC", "10", 6);
```

WHBAR: `amount` is 8 decimals; `msg.value = amount * 1e10`. Prefer `hooks/bonzo` over raw contract calls in pages.

## Style

| Style | Use |
| --- | --- |
| `UpperCamelCase` | types, components |
| `lowerCamelCase` | variables, functions |
| `CONSTANT_CASE` | constants |
| `snake_case` | Hardhat deploy filenames |

Use `~~` imports. App Router pages that use hooks need `"use client"`. Prefer DaisyUI (`btn`, `table`, `alert`).
