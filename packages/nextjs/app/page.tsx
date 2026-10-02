"use client";

import Link from "next/link";
import { HederaPortalFaucet } from "@scaffold-hbar-ui/components";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { BanknotesIcon, ChartBarIcon, ClipboardDocumentListIcon, WalletIcon } from "@heroicons/react/24/outline";
import { HederaAddress } from "~~/components/scaffold-hbar";
import { useTargetNetwork } from "~~/hooks/scaffold-hbar";

const Home: NextPage = () => {
  const { address: connectedAddress, status } = useAccount();
  const { targetNetwork } = useTargetNetwork();
  const isConnected = status === "connected" && connectedAddress;

  return (
    <div className="flex items-center flex-col grow">
      <div className="hedera-gradient dark:bg-none dark:bg-hedera-charcoal w-full py-14 px-5">
        <div className="max-w-3xl mx-auto text-center text-white">
          <p className="uppercase tracking-widest text-sm text-white/80 mb-2">Scaffold-HBAR template</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">Bonzo Lend</h1>
          <p className="text-lg text-white/90 m-0">
            Supply, borrow, repay, and withdraw against Bonzo Finance on Hedera — with HTS association checks and an HCS
            audit trail.
          </p>
        </div>
      </div>

      <div className="w-full max-w-4xl mx-auto px-5 -mt-8">
        <div className="bg-base-100 rounded-2xl shadow-lg p-6 text-center">
          {isConnected ? (
            <div className="flex flex-col items-center gap-2">
              <p className="font-semibold text-sm text-base-content/60 uppercase tracking-wider m-0">Connected</p>
              <HederaAddress address={connectedAddress} chain={targetNetwork} />
              <p className="text-xs text-base-content/50 m-0">Network: {targetNetwork.name}</p>
            </div>
          ) : (
            <p className="font-semibold text-sm text-base-content/60 uppercase tracking-wider m-0">
              Connect a Hedera testnet wallet to start
            </p>
          )}
        </div>
      </div>

      <div className="w-full max-w-4xl mx-auto px-5 mt-8 pb-16 grid grid-cols-1 md:grid-cols-2 gap-5">
        {[
          {
            href: "/markets",
            title: "Markets",
            desc: "Live Bonzo reserves, liquidity, and APYs from ProtocolDataProvider.",
            icon: ChartBarIcon,
          },
          {
            href: "/supply",
            title: "Supply / Withdraw",
            desc: "Deposit HTS assets or native HBAR via WETHGateway into Bonzo.",
            icon: BanknotesIcon,
          },
          {
            href: "/borrow",
            title: "Borrow / Repay",
            desc: "Variable-rate borrow and repay against your collateral.",
            icon: WalletIcon,
          },
          {
            href: "/portfolio",
            title: "Portfolio",
            desc: "Supplies, debt, borrow power, and health factor.",
            icon: WalletIcon,
          },
          {
            href: "/audit",
            title: "HCS Audit",
            desc: "Immutable lending action log on Hedera Consensus Service.",
            icon: ClipboardDocumentListIcon,
          },
        ].map(card => (
          <Link
            key={card.href}
            href={card.href}
            className="bg-base-100 rounded-2xl shadow-md p-6 border border-base-300 hover:shadow-lg transition-shadow"
          >
            <div className="w-12 h-12 rounded-full hedera-gradient flex items-center justify-center mb-3">
              <card.icon className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-bold text-lg mb-1">{card.title}</h3>
            <p className="text-sm text-base-content/70 m-0">{card.desc}</p>
          </Link>
        ))}
      </div>

      <div className="w-full max-w-4xl mx-auto px-5 pb-16">
        <div className="bg-base-100 rounded-2xl shadow-md p-6 border border-base-300">
          <h3 className="font-bold text-lg mb-3">Quick start</h3>
          <ol className="list-decimal list-inside text-sm space-y-2 text-base-content/80">
            <li>
              Fund testnet HBAR via{" "}
              <HederaPortalFaucet variant="link" label="portal.hedera.com/faucet" showIcon={false} />
            </li>
            <li>
              Get Bonzo testnet HTS assets (USDC, SAUCE, …) from Bonzo Discord{" "}
              <code className="bg-base-200 px-1 rounded">#testnet-faucet</code> or SaucerSwap testnet
            </li>
            <li>
              Deploy <code className="bg-base-200 px-1 rounded">AuditAnchor</code>:{" "}
              <code className="bg-base-200 px-1 rounded">yarn hardhat:deploy --network hederaTestnet</code>
            </li>
            <li>
              Optional HCS: set operator env vars, <code className="bg-base-200 px-1 rounded">POST /api/hcs/topic</code>
              , save <code className="bg-base-200 px-1 rounded">HCS_AUDIT_TOPIC_ID</code>
            </li>
            <li>
              Open <Link href="/markets">Markets</Link> and supply
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default Home;
