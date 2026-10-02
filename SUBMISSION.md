# Testnet proof checklist (bounty eligibility)

Complete these once before submission. Do **not** commit private keys.

## 1. Fund a deployer

Faucet is open (or reopen): https://portal.hedera.com/faucet

Suggested deployer EVM address generated during setup (complete the captcha Confirm if still open):

`0xb66687Ed61aec8502F8601Fd977365f974B8156f`

If that key was discarded, generate a new one:

```bash
yarn hardhat:account:generate
# fund the printed address via the Portal faucet
```

Or import an existing funded key:

```bash
yarn hardhat:account:import
```

Private key for the generated address was written to `/tmp/bonzo-deployer.json` on this machine only (not in the repo). Prefer regenerating with `account:generate` if unsure.

## 2. Deploy AuditAnchor

```bash
yarn hardhat:deploy --network hederaTestnet
```

Paste the Hashscan contract URL into [README.md](README.md) under **Verifiable testnet transactions**.

## 3. Bonzo interaction

1. Fund HTS test assets (Bonzo Discord `#testnet-faucet` or SaucerSwap testnet).
2. `yarn next:dev`, connect HashPack/testnet wallet, open `/supply`.
3. Supply a small amount (e.g. WHBAR via gateway or USDC after association).
4. Paste the Hashscan **transaction** URL into the README.

## 4. Optional HCS

```bash
# packages/nextjs/.env.local
HEDERA_OPERATOR_ID=0.0.x
HEDERA_OPERATOR_KEY=...
# POST http://localhost:3000/api/hcs/topic → save as:
HCS_AUDIT_TOPIC_ID=0.0.y
```

## 5. Publish

```bash
gh auth refresh -h github.com   # if needed
git init   # if .git is incomplete
git add .
git commit -m "feat: Bonzo Lend Scaffold-HBAR template"
git remote add origin git@github.com:<you>/hedra-template-bounty.git
git push -u origin HEAD
```

Verify:

```bash
npm create scaffold-hbar@latest /tmp/bonzo-smoke -- --template <you>/hedra-template-bounty --yes --skip-hedera-skills
```
