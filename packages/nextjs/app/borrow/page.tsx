"use client";

import type { NextPage } from "next";
import { LendingForm } from "~~/components/bonzo/LendingForm";
import { useTargetNetwork } from "~~/hooks/scaffold-hbar";
import { getBonzoReserves } from "~~/utils/bonzo/addresses";

const BorrowPage: NextPage = () => {
  const { targetNetwork } = useTargetNetwork();
  const reserves = getBonzoReserves(targetNetwork.id);

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto w-full flex flex-col md:flex-row gap-6 items-start">
      <LendingForm
        action="borrow"
        reserves={reserves}
        defaultSymbol="USDC"
        title="Borrow"
        description="Variable-rate borrow against your collateral. Supply first so health factor stays healthy."
      />
      <LendingForm
        action="repay"
        reserves={reserves}
        defaultSymbol="USDC"
        title="Repay"
        description="Repay variable debt. WHBAR repay uses WETHGateway with native HBAR."
      />
    </div>
  );
};

export default BorrowPage;
