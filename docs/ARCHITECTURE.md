# Architecture

This template is a Yarn workspace monorepo generated for [Scaffold-HBAR](https://docs.hedera.com/solutions/tools/scaffold-hbar).

## Packages

| Package | Role |
| --- | --- |
| `packages/hardhat` | Solidity (`AuditAnchor`), Hardhat deploy scripts, unit tests, Hedera network config |
| `packages/nextjs` | Next.js 15 App Router UI, wagmi/RainbowKit, Bonzo integration hooks, HCS API routes |

## Data flow

```text
┌─────────────┐     wagmi / viem      ┌──────────────────────┐
│   Browser   │ ───────────────────►  │ Bonzo LendingPool    │
│  (Next.js)  │                       │ ProtocolDataProvider │
│             │ ───────────────────►  │ WHBAR helper         │
└──────┬──────┘                       └──────────────────────┘
       │
       │ fetch /api/hcs/*
       ▼
┌─────────────┐     Hiero SDK         ┌──────────────────────┐
│ Next server │ ───────────────────►  │ HCS topic (optional) │
└──────┬──────┘                       └──────────────────────┘
       │
       │ Mirror Node REST
       ▼
┌────────────────────────────────────┐
│ Association status · HCS messages  │
└────────────────────────────────────┘
```

## Bonzo integration

- Addresses live in [`packages/nextjs/utils/bonzo/addresses.ts`](../packages/nextjs/utils/bonzo/addresses.ts).
- Minimal Aave v2–compatible ABIs live in [`packages/nextjs/utils/bonzo/abis.ts`](../packages/nextjs/utils/bonzo/abis.ts).
- Hooks under `packages/nextjs/hooks/bonzo/` wrap reads/writes; UI should prefer these over raw `useContract*`.
- External contracts are also registered in [`externalContracts.ts`](../packages/nextjs/contracts/externalContracts.ts) for Scaffold debug hooks.

### WHBAR notes

Bonzo WHBAR is not a plain WETH gateway deposit:

1. Token address `0x…3ad2` (HTS).
2. Wrap helper `0x…3ad1` (`deposit()`).
3. LendingPool `deposit` / `repay` for WHBAR expect `msg.value = amount * 1e10` when `amount` is in **8-decimal** token units (see Bonzo supply-scripts).

`useBonzoLending` implements that scaling.

## Audit trail

1. Optional HCS JSON messages via `/api/hcs/submit` (requires operator env).
2. Optional on-chain `AuditAnchor.recordAction` after a successful lending tx (requires deploy).

## Networks

| Chain | ID | Config |
| --- | --- | --- |
| Hedera testnet | 296 | default for this template |
| Hedera mainnet | 295 | addresses included; use with care |
| Local Hardhat fork | 31337 | `yarn hardhat:chain` |

## Template manifest

[`template.json`](../template.json) declares Scaffold-HBAR capabilities and the CLI outro steps shown after `npm create scaffold-hbar`.
