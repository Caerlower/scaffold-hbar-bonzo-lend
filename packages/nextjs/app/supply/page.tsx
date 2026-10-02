"use client";

import type { NextPage } from "next";
import { LendingForm } from "~~/components/bonzo/LendingForm";
import { useTargetNetwork } from "~~/hooks/scaffold-hbar";
import { getBonzoReserves } from "~~/utils/bonzo/addresses";

const SupplyPage: NextPage = () => {
  const { targetNetwork } = useTargetNetwork();
  const reserves = getBonzoReserves(targetNetwork.id);

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto w-full flex flex-col md:flex-row gap-6 items-start">
      <LendingForm
        action="deposit"
        reserves={reserves}
        defaultSymbol="WHBAR"
        title="Supply"
        description="Deposit into Bonzo LendingPool. WHBAR uses WETHGateway with native HBAR (msg.value)."
      />
      <LendingForm
        action="withdraw"
        reserves={reserves}
        defaultSymbol="WHBAR"
        title="Withdraw"
        description="Withdraw supplied balance. For WHBAR, approve aTokens to the gateway first (handled automatically)."
      />
    </div>
  );
};

export default SupplyPage;
