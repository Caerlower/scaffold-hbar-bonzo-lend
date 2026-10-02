"use client";

import type { NextPage } from "next";
import { LendingForm } from "~~/components/bonzo/LendingForm";
import { useTargetNetwork } from "~~/hooks/scaffold-hbar";
import { getBonzoReserves } from "~~/utils/bonzo/addresses";

const BorrowPage: NextPage = () => {
  const { targetNetwork } = useTargetNetwork();
  const reserves = getBonzoReserves(targetNetwork.id);

  return (
    <div className="px-4 py-8 md:px-8 md:py-10 max-w-5xl mx-auto w-full">
      <header className="mb-8 max-w-2xl">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight m-0">Borrow</h1>
        <p className="mt-2 text-base-content/65 text-sm md:text-base m-0 leading-relaxed">
          Borrow against your collateral, or repay outstanding variable debt.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 items-start justify-items-stretch md:justify-items-start">
        <LendingForm
          action="borrow"
          reserves={reserves}
          defaultSymbol="USDC"
          title="Borrow"
          description="Variable-rate borrow against your collateral. Supply first so your health factor stays healthy."
        />
        <LendingForm
          action="repay"
          reserves={reserves}
          defaultSymbol="USDC"
          title="Repay"
          description="Repay variable debt. WHBAR repay uses the WETH gateway with native HBAR."
        />
      </div>
    </div>
  );
};

export default BorrowPage;
