# Scaffold-HBAR · Bonzo Lend

[![CI](https://github.com/Caerlower/scaffold-hbar-bonzo-lend/actions/workflows/lint.yaml/badge.svg)](https://github.com/Caerlower/scaffold-hbar-bonzo-lend/actions/workflows/lint.yaml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![Node](https://img.shields.io/badge/node-%E2%89%A520.18.3-brightgreen.svg)](./.nvmrc)
[![Scaffold-HBAR](https://img.shields.io/badge/scaffold--hbar-external%20template-8259EF.svg)](https://docs.hedera.com/solutions/tools/scaffold-hbar)

**One command from zero to a working Hedera lending dApp** — supply, borrow, repay, and withdraw against [Bonzo Finance](https://bonzo.finance/), with native HTS association checks and an optional HCS audit trail.

```bash
npm create scaffold-hbar@latest my-bonzo-app -- --template Caerlower/scaffold-hbar-bonzo-lend
cd my-bonzo-app && yarn install && yarn next:dev
```

Open [http://localhost:3000](http://localhost:3000) · connect a Hedera **testnet** wallet · explore **Markets**.

---

## Why this template

| Need | What you get |
| --- | --- |
| Real DeFi, not a toy | Live Bonzo LendingPool + ProtocolDataProvider on Hedera testnet/mainnet |
| Hedera-native depth | HTS association via Mirror Node · optional HCS topic · `AuditAnchor` contract |
| Fast onboarding | Scaffold-HBAR monorepo · RainbowKit/wagmi · Hardhat deploy · typed ABIs |
| AI-friendly | [`AGENTS.md`](./AGENTS.md) maps every package for coding agents |

Bonzo is load-bearing: remove it and the product disappears. That is the point of the [Scaffold-HBAR Template Bounty](https://hedera.com/blog/scaffold-hbar-template-bounty/) ecosystem rubric.

---

## Quick start

### Option A — Scaffold (recommended)

```bash
npm create scaffold-hbar@latest my-bonzo-app -- \
  --template Caerlower/scaffold-hbar-bonzo-lend \
  --frontend nextjs-app \
  --solidity-framework hardhat \
  --network testnet \
  --package-manager yarn

cd my-bonzo-app
yarn next:dev
```

### Option B — Clone this repo

```bash
git clone https://github.com/Caerlower/scaffold-hbar-bonzo-lend.git
cd scaffold-hbar-bonzo-lend
corepack enable && corepack prepare yarn@stable --activate
yarn install
yarn next:dev
```

### Prerequisites

| Tool | Version |
| --- | --- |
| Node.js | ≥ **20.18.3** (see [`.nvmrc`](./.nvmrc)) |
| Yarn | 3.x via Corepack |
| Git | `user.name` / `user.email` set |
| Wallet | **MetaMask** on Hedera Testnet (296) for contract calls; **HashPack** for HTS associate |

**Testnet funds**

1. HBAR — [Hedera Portal faucet](https://portal.hedera.com/faucet)
2. HTS assets (USDC, SAUCE, …) — Bonzo Discord `#testnet-faucet` or [SaucerSwap testnet](https://testnet.saucerswap.finance/)  
   Guide: [Bonzo testnet docs](https://docs.bonzo.finance/hub/bonzo-lend/bonzo-lend-testnet)

### Testnet status (Bonzo writes)

This template targets Bonzo’s **current** published testnet contracts ([lend-contracts](https://docs.bonzo.finance/hub/developer/bonzo-lend/lend-contracts)):

| Item | Address / note |
| --- | --- |
| LendingPool | `0xf67DBe9bD1B331cA379c44b5562EAa1CE831EbC2` (`paused() = false`) |
| ProtocolDataProvider | `0x121A2AFFA5f595175E60E01EAeF0deC43Cc3b024` |
| USDC (HTS) | `0x…1549` / Token ID `0.0.5449` (same token as SaucerSwap testnet) |

**As of 2026-10-02:** market **reads** work. Live **supply / borrow** against Bonzo testnet revert on-chain (`CALLER_NOT_AUTHORIZED` on deposit — e.g. [this USDC deposit](https://hashscan.io/testnet/transaction/0x38618e9496d4b7b4fd92520b0c5191ae7b799e6f6565734b1669d43cca4d5f90)). The older pool (`0x7710…`) is still `paused() = true`. Prefer **MetaMask** for EVM writes; use **HashPack** to associate Token IDs (`0.0.x`). Your **AuditAnchor** deploy remains the template’s on-chain proof of life independent of Bonzo’s testnet health.

---

## What you can do in the app

| Route | Purpose |
| --- | --- |
| [`/`](./packages/nextjs/app/page.tsx) | Overview and guided next steps |
| [`/markets`](./packages/nextjs/app/markets/page.tsx) | Live reserves, APYs, liquidity |
| [`/supply`](./packages/nextjs/app/supply/page.tsx) | Deposit / withdraw (WHBAR uses Bonzo `msg.value` scaling) |
| [`/borrow`](./packages/nextjs/app/borrow/page.tsx) | Variable-rate borrow / repay |
| [`/portfolio`](./packages/nextjs/app/portfolio/page.tsx) | Collateral, debt, health factor |
| [`/audit`](./packages/nextjs/app/audit/page.tsx) | HCS messages + `AuditAnchor` counter |

Debug Contracts and the local explorer remain available under `/debug` and `/blockexplorer`.

---

## Project layout

```text
scaffold-hbar-bonzo-lend/
├── packages/
│   ├── hardhat/                 # AuditAnchor.sol, deploy, tests
│   └── nextjs/                  # Next.js App Router UI + Bonzo hooks
├── docs/
│   ├── ARCHITECTURE.md          # System design
│   └── TESTNET.md               # Deploy + faucet + Hashscan proofs
├── template.json                # Scaffold-HBAR external template manifest
├── AGENTS.md                    # Instructions for AI coding agents
├── CONTRIBUTING.md
├── SECURITY.md
└── LICENSE
```

Details: **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)**

---

## Common commands

```bash
yarn install                 # install workspaces
yarn next:dev                # frontend (talks to live Hedera / Bonzo)
yarn next:build              # production build
yarn next:serve              # serve production build (next start)
yarn lint                    # Next + Hardhat ESLint
yarn format                  # Prettier
yarn test                    # Hardhat tests (Hedera fork)
yarn hardhat:compile
yarn hardhat:deploy --network localhost
yarn hardhat:deploy --network hederaTestnet
yarn hardhat:account:generate
```

---

## Deploy `AuditAnchor` (testnet)

```bash
yarn hardhat:account:generate    # or yarn hardhat:account:import
# Fund the printed address at portal.hedera.com/faucet
yarn hardhat:deploy --network hederaTestnet
```

Addresses and ABIs are written to [`packages/nextjs/contracts/deployedContracts.ts`](./packages/nextjs/contracts/deployedContracts.ts).

Full checklist + Hashscan proofs: **[docs/TESTNET.md](./docs/TESTNET.md)**

---

## Environment

Copy examples; never commit secrets.

| File | Purpose |
| --- | --- |
| [`packages/hardhat/.env.example`](./packages/hardhat/.env.example) | Deployer keystore / RPC |
| [`packages/nextjs/.env.example`](./packages/nextjs/.env.example) | WalletConnect, RPC, HCS operator |

Optional HCS (server-only):

```bash
# packages/nextjs/.env.local
HEDERA_OPERATOR_ID=0.0.xxxxx
HEDERA_OPERATOR_KEY=302e...   # or 0x-prefixed ECDSA
HCS_AUDIT_TOPIC_ID=0.0.yyyyy  # from POST /api/hcs/topic
```

---

## Architecture (short)

```text
Wallet (RainbowKit / wagmi / viem)
    │
    ├─► Bonzo LendingPool          deposit / withdraw / borrow / repay
    ├─► ProtocolDataProvider       markets + user positions
    ├─► WHBAR helper (0x…3ad1)     wrap / Bonzo native-HBAR path
    ├─► Mirror Node                HTS association + HCS reads
    ├─► /api/hcs/*                 topic create / submit (operator key)
    └─► AuditAnchor                optional on-chain action anchors
```

**Hedera testnet cores** (from [Bonzo supply-scripts](https://github.com/Bonzo-Labs/supply-scripts)):

| Contract | Address |
| --- | --- |
| LendingPool | `0xf67DBe9bD1B331cA379c44b5562EAa1CE831EbC2` |
| ProtocolDataProvider | `0x121A2AFFA5f595175E60E01EAeF0deC43Cc3b024` |
| WETHGateway | `0x16197Ef10F26De77C9873d075f8774BdEc20A75d` |
| WHBAR token | `0x0000000000000000000000000000000000003ad2` |
| WHBAR wrap helper | `0x0000000000000000000000000000000000003ad1` |

---

## Testnet proofs

| Proof | Hashscan |
| --- | --- |
| AuditAnchor deploy | [transaction](https://hashscan.io/testnet/transaction/0x1629be01318a618b87a13c440fe192f47110e4f94543bb4cb6084fac721e5a25) |
| AuditAnchor contract | [0x3e485CA7…F96d12](https://hashscan.io/testnet/contract/0x3e485CA75B4A49d186912Bb53C5BF1FEadF96d12) |
| `recordAction` | [transaction](https://hashscan.io/testnet/transaction/0xdc9d8da7cfa5b989432d93cd0221b21dcb290bc92ecb7ff2a6b8aff4d4b9f5c1) |
| WHBAR wrap | [transaction](https://hashscan.io/testnet/transaction/0x4d39d53f1dba03cd62b17f02f62bf2db4665f4843f4b8135c3fff6ef0c96ed1b) |

---

## Contributing & security

- [CONTRIBUTING.md](./CONTRIBUTING.md) — PRs, style, local checks
- [SECURITY.md](./SECURITY.md) — private keys, disclosure
- [AGENTS.md](./AGENTS.md) — map for Cursor / Claude Code / Codex

---

## Links

- [Bonzo Finance](https://bonzo.finance/) · [testnet app](https://testnet.bonzo.finance/) · [dev contracts](https://docs.bonzo.finance/hub/developer/bonzo-lend/lend-contracts)
- [Scaffold HBAR docs](https://docs.hedera.com/solutions/tools/scaffold-hbar)
- [Hedera Portal faucet](https://portal.hedera.com/faucet) · [HashScan](https://hashscan.io/)

---

## License

[MIT](./LICENSE)
