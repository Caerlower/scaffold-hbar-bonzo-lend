# Testnet deploy & proofs

Step-by-step for a funded Hedera testnet account. **Never commit private keys.**

## 1. Create a deployer

```bash
yarn hardhat:account:generate
# or
yarn hardhat:account:import
```

Fund the printed EVM address at https://portal.hedera.com/faucet

## 2. Deploy AuditAnchor

```bash
yarn hardhat:deploy --network hederaTestnet
```

Confirm on Hashscan (contract + create transaction).

## 3. Run the app against live Bonzo

```bash
yarn next:dev
```

1. Connect HashPack (testnet).
2. Get HTS assets from Bonzo Discord `#testnet-faucet` or SaucerSwap testnet.
3. Associate tokens in the wallet if prompted (`/supply` shows Mirror Node association status).
4. Prefer **USDC / SAUCE** for the first supply; WHBAR uses Bonzo’s native `msg.value` path.

## 4. Optional HCS topic

```bash
# packages/nextjs/.env.local
HEDERA_OPERATOR_ID=0.0.x
HEDERA_OPERATOR_KEY=...
```

```bash
curl -X POST http://localhost:3000/api/hcs/topic
# persist returned topicId as HCS_AUDIT_TOPIC_ID
```

## Recorded proofs (this repository)

| Proof | Link |
| --- | --- |
| AuditAnchor deploy | https://hashscan.io/testnet/transaction/0x1629be01318a618b87a13c440fe192f47110e4f94543bb4cb6084fac721e5a25 |
| AuditAnchor contract | https://hashscan.io/testnet/contract/0x3e485CA75B4A49d186912Bb53C5BF1FEadF96d12 |
| `recordAction` | https://hashscan.io/testnet/transaction/0xdc9d8da7cfa5b989432d93cd0221b21dcb290bc92ecb7ff2a6b8aff4d4b9f5c1 |
| WHBAR wrap | https://hashscan.io/testnet/transaction/0x4d39d53f1dba03cd62b17f02f62bf2db4665f4843f4b8135c3fff6ef0c96ed1b |

Mirror Node:

- https://testnet.mirrornode.hedera.com/api/v1/contracts/0x3e485CA75B4A49d186912Bb53C5BF1FEadF96d12
- https://testnet.mirrornode.hedera.com/api/v1/accounts/0xb66687Ed61aec8502F8601Fd977365f974B8156f
