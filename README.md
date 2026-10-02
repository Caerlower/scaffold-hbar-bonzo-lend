# Scaffold-HBAR — Bonzo Lend

Production-oriented Scaffold-HBAR template for **Bonzo Finance** lending on Hedera. Supply, borrow, repay, and withdraw against live Bonzo pools, with HTS association checks, an optional HCS audit topic, and an on-chain `AuditAnchor` contract.

```bash
npm create scaffold-hbar@latest my-bonzo-app -- --template Caerlower/hedra-template-bounty
```

## Why this template

Bonzo is an Aave v2–compatible lending protocol deployed on Hedera. Removing Bonzo removes the product — the integration is load-bearing, not decorative. The template also composes:

| Layer | Role |
| --- | --- |
| **Bonzo LendingPool / WETHGateway / ProtocolDataProvider** | Markets, supply, borrow, repay, withdraw |
| **HTS** | Association status via Mirror Node before ERC-20 approve/deposit |
| **HCS** | Optional immutable JSON audit log of lending actions |
| **AuditAnchor.sol** | On-chain anchor of action + optional HCS sequence |

## Prerequisites

- [Node.js](https://nodejs.org/) ≥ 20.18.3
- [Git](https://git-scm.com/) with `user.name` / `user.email`
- Yarn (recommended) via Corepack: `corepack enable && corepack prepare yarn@stable --activate`
- Hedera testnet account with HBAR from the [Portal faucet](https://portal.hedera.com/faucet)
- Bonzo testnet HTS assets (USDC, SAUCE, HBARX, …) from Bonzo Discord `#testnet-faucet` or [SaucerSwap testnet](https://testnet.saucerswap.finance/) — see [Bonzo testnet guide](https://docs.bonzo.finance/hub/bonzo-lend/bonzo-lend-testnet)

## Quick start (this repo)

```bash
yarn install

# Terminal A — frontend (talks to live Bonzo on Hedera testnet)
yarn next:dev

# Optional local fork + AuditAnchor
yarn hardhat:chain
yarn hardhat:deploy --network localhost
```

Open [http://localhost:3000](http://localhost:3000).

### Deploy AuditAnchor to Hedera testnet

```bash
yarn hardhat:account:generate   # or :import
# Fund the deployer, set alias in packages/hardhat/.env (see .env.example)
yarn hardhat:deploy --network hederaTestnet
```

ABIs/addresses are written to `packages/nextjs/contracts/deployedContracts.ts`.

### Optional HCS audit topic

In `packages/nextjs/.env.local`:

```bash
HEDERA_OPERATOR_ID=0.0.xxxxx
HEDERA_OPERATOR_KEY=302e...   # or 0x-prefixed ECDSA
HCS_AUDIT_TOPIC_ID=0.0.yyyyy  # after create
```

Then either call `POST /api/hcs/topic` once and persist the returned id as `HCS_AUDIT_TOPIC_ID`, or create a topic with the Hiero SDK and set it yourself. Successful lending txs call `POST /api/hcs/submit` and optionally `AuditAnchor.recordAction`.

## App routes

| Route | Purpose |
| --- | --- |
| `/` | Overview + quick start |
| `/markets` | Live reserve APYs and liquidity |
| `/supply` | Deposit / withdraw (WHBAR via gateway) |
| `/borrow` | Borrow / repay (variable rate) |
| `/portfolio` | Collateral, debt, health factor |
| `/audit` | HCS messages + AuditAnchor count |

## Environment

See:

- [`packages/hardhat/.env.example`](packages/hardhat/.env.example)
- [`packages/nextjs/.env.example`](packages/nextjs/.env.example)

Never commit `.env` / `.env.local` or private keys.

## Architecture

```
Wallet (RainbowKit / wagmi)
    │
    ├─► Bonzo LendingPool (deposit / withdraw / borrow / repay)
    ├─► Bonzo WETHGateway (native HBAR ↔ WHBAR)
    ├─► ProtocolDataProvider (markets + user positions)
    ├─► Mirror Node (HTS association + HCS message reads)
    ├─► Next.js API (/api/hcs/*) ──► HCS topic (operator key)
    └─► AuditAnchor (optional on-chain record)
```

Core testnet addresses (from [Bonzo supply-scripts](https://github.com/Bonzo-Labs/supply-scripts)):

- LendingPool: `0x7710a96b01e02eD00768C3b39BfA7B4f1c128c62`
- ProtocolDataProvider: `0xe7432d9012d2a6cd811FDf42ecE43a0aa680c958`
- WETHGateway: `0xA824820e35D6AE4D368153e83b7920B2DC3Cf964`

## Quality commands

```bash
yarn lint
yarn hardhat:test
yarn next:build
yarn hardhat:compile
```

## Verifiable testnet transactions

| Proof | Link |
| --- | --- |
| AuditAnchor deploy | [0x1629be01…1e5a25](https://hashscan.io/testnet/transaction/0x1629be01318a618b87a13c440fe192f47110e4f94543bb4cb6084fac721e5a25) |
| AuditAnchor contract | [0x3e485CA7…F96d12](https://hashscan.io/testnet/contract/0x3e485CA75B4A49d186912Bb53C5BF1FEadF96d12) |
| AuditAnchor `recordAction` | [0xdc9d8da7…f4d9f5c1](https://hashscan.io/testnet/transaction/0xdc9d8da7cfa5b989432d93cd0221b21dcb290bc92ecb7ff2a6b8aff4d4b9f5c1) |
| WHBAR wrap (HTS) | [0x4d39d53f…c96ed1b](https://hashscan.io/testnet/transaction/0x4d39d53f1dba03cd62b17f02f62bf2db4665f4843f4b8135c3fff6ef0c96ed1b) |

Mirror Node:

- Contract: `https://testnet.mirrornode.hedera.com/api/v1/contracts/0x3e485CA75B4A49d186912Bb53C5BF1FEadF96d12`
- Account: `https://testnet.mirrornode.hedera.com/api/v1/accounts/0xb66687Ed61aec8502F8601Fd977365f974B8156f`

For more proofs (live Bonzo supply from the UI), see [SUBMISSION.md](SUBMISSION.md).

## Licence

MIT — see [`LICENCE`](LICENCE).

## Links

- [Bonzo Finance](https://bonzo.finance/) / [testnet app](https://testnet.bonzo.finance/)
- [Bonzo developer contracts](https://docs.bonzo.finance/hub/developer/bonzo-lend/lend-contracts)
- [Scaffold HBAR docs](https://docs.hedera.com/solutions/tools/scaffold-hbar)
- [Hedera Portal faucet](https://portal.hedera.com/faucet)
- [HashScan](https://hashscan.io/)
