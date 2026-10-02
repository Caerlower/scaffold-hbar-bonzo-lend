# Security

## Do not commit

- `.env`, `.env.local`, keystores, mnemonics, operator private keys
- WalletConnect secrets beyond the public project id patterns already used by Scaffold-HBAR

Use the `.env.example` files under `packages/*` as templates only.

## HCS operator keys

`HEDERA_OPERATOR_ID` / `HEDERA_OPERATOR_KEY` are **server-only**. They must never be prefixed with `NEXT_PUBLIC_`.

## Reporting issues

If you discover a vulnerability in *this template* (not in Bonzo or Hedera itself), open a private GitHub security advisory on this repository or contact the maintainer via GitHub.

For Bonzo protocol issues, use Bonzo’s official channels. For Hedera network issues, use Hedera support / Discord.
