"use client";

import type { NextPage } from "next";
import { LendingForm } from "~~/components/bonzo/LendingForm";
import { useTargetNetwork } from "~~/hooks/scaffold-hbar";
import { getBonzoReserves } from "~~/utils/bonzo/addresses";

const SupplyPage: NextPage = () => {
  const { targetNetwork } = useTargetNetwork();
  const reserves = getBonzoReserves(targetNetwork.id);

  return (
    <div className="px-4 py-8 md:px-8 md:py-10 max-w-5xl mx-auto w-full">
      <header className="mb-8 max-w-2xl">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight m-0">Supply</h1>
        <p className="mt-2 text-base-content/65 text-sm md:text-base m-0 leading-relaxed">
          Deposit assets into Bonzo to earn yield, or withdraw your supplied balance.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 items-start justify-items-stretch md:justify-items-start">
        <LendingForm
          action="deposit"
          reserves={reserves}
          defaultSymbol="USDC"
          title="Supply"
          description="Deposit into the Bonzo LendingPool. WHBAR uses 8 decimals and sends native HBAR as msg.value."
        />
        <LendingForm
          action="withdraw"
          reserves={reserves}
          defaultSymbol="USDC"
          title="Withdraw"
          description="Withdraw your supplied balance. WHBAR routes through the wrap helper when configured."
        />
      </div>
    </div>
  );
};

export default SupplyPage;
