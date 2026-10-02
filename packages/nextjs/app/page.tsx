"use client";

import Link from "next/link";
import { HederaPortalFaucet } from "@scaffold-hbar-ui/components";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import {
  ArrowRightIcon,
  BanknotesIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  WalletIcon,
} from "@heroicons/react/24/outline";
import { HederaAddress } from "~~/components/scaffold-hbar";
import { useTargetNetwork } from "~~/hooks/scaffold-hbar";

const cards = [
  {
    href: "/markets",
    title: "Markets",
    desc: "Live Bonzo reserves, supply/borrow APYs, and liquidity.",
    icon: ChartBarIcon,
  },
  {
    href: "/supply",
    title: "Supply",
    desc: "Deposit or withdraw HTS assets. WHBAR uses Bonzo’s native HBAR path.",
    icon: BanknotesIcon,
  },
  {
    href: "/borrow",
    title: "Borrow",
    desc: "Variable-rate borrow and repay against your collateral.",
    icon: WalletIcon,
  },
  {
    href: "/portfolio",
    title: "Portfolio",
    desc: "Supplies, debt, available borrows, and health factor.",
    icon: WalletIcon,
  },
  {
    href: "/audit",
    title: "Audit trail",
    desc: "HCS topic messages and on-chain AuditAnchor records.",
    icon: ClipboardDocumentListIcon,
  },
] as const;

const Home: NextPage = () => {
  const { address: connectedAddress, status } = useAccount();
  const { targetNetwork } = useTargetNetwork();
  const isConnected = status === "connected" && connectedAddress;

  return (
    <div className="flex items-center flex-col grow">
      <div className="hedera-gradient dark:bg-none dark:bg-hedera-charcoal w-full py-16 px-5">
        <div className="max-w-3xl mx-auto text-center text-white">
          <p className="uppercase tracking-[0.2em] text-xs text-white/75 mb-3">Scaffold-HBAR · External template</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Bonzo Lend</h1>
          <p className="text-base md:text-lg text-white/90 m-0 max-w-2xl mx-auto leading-relaxed">
            Production starting point for lending on Hedera. Talk to live Bonzo pools, check HTS association, and
            optionally log every action to HCS.
          </p>
          <div className="flex flex-wrap gap-3 justify-center mt-8">
            <Link href="/markets" className="btn btn-primary gap-2">
              Open markets
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
            <Link href="/supply" className="btn btn-ghost bg-white/10 text-white border-white/20 hover:bg-white/20">
              Supply assets
            </Link>
          </div>
        </div>
      </div>

      <div className="w-full max-w-4xl mx-auto px-5 -mt-8">
        <div className="bg-base-100 rounded-2xl shadow-lg p-6 text-center border border-base-300">
          {isConnected ? (
            <div className="flex flex-col items-center gap-2">
              <p className="font-semibold text-sm text-base-content/60 uppercase tracking-wider m-0">Connected</p>
              <HederaAddress address={connectedAddress} chain={targetNetwork} />
              <p className="text-xs text-base-content/50 m-0">Network: {targetNetwork.name}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <p className="font-semibold text-sm text-base-content/70 m-0">Connect a Hedera testnet wallet to begin</p>
              <p className="text-xs text-base-content/50 m-0 max-w-md">
                Use HashPack (or another Hedera wallet) on testnet. Fund HBAR from the Portal faucet first.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="w-full max-w-4xl mx-auto px-5 mt-10 pb-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-base-content/50 mb-4">Explore</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cards.map(card => (
            <Link
              key={card.href}
              href={card.href}
              className="group bg-base-100 rounded-2xl p-6 border border-base-300 hover:border-primary/40 hover:shadow-md transition-all"
            >
              <div className="w-11 h-11 rounded-full hedera-gradient flex items-center justify-center mb-3">
                <card.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">{card.title}</h3>
              <p className="text-sm text-base-content/70 m-0">{card.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="w-full max-w-4xl mx-auto px-5 pb-16 mt-6">
        <div className="bg-base-100 rounded-2xl p-6 md:p-8 border border-base-300">
          <h2 className="font-bold text-lg mb-4">First-run checklist</h2>
          <ol className="space-y-3 text-sm text-base-content/80 m-0 list-none p-0">
            {[
              <>
                Fund testnet HBAR via{" "}
                <HederaPortalFaucet variant="link" label="portal.hedera.com/faucet" showIcon={false} />
              </>,
              <>
                Get Bonzo test assets from Discord{" "}
                <code className="bg-base-200 px-1.5 py-0.5 rounded text-xs">#testnet-faucet</code> or SaucerSwap testnet
              </>,
              <>
                Deploy AuditAnchor:{" "}
                <code className="bg-base-200 px-1.5 py-0.5 rounded text-xs">
                  yarn hardhat:deploy --network hederaTestnet
                </code>
              </>,
              <>
                Optional HCS: set operator env vars, then{" "}
                <code className="bg-base-200 px-1.5 py-0.5 rounded text-xs">POST /api/hcs/topic</code>
              </>,
              <>
                Open{" "}
                <Link href="/markets" className="link link-primary">
                  Markets
                </Link>{" "}
                and supply from{" "}
                <Link href="/supply" className="link link-primary">
                  /supply
                </Link>
              </>,
            ].map((step, i) => (
              <li key={i} className="flex gap-3 items-start">
                <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
};

export default Home;
