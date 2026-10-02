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
        description="Deposit into Bonzo LendingPool. For WHBAR, amount uses 8 decimals and the tx sends native HBAR as msg.value (Bonzo scaling)."
      />
      <LendingForm
        action="withdraw"
        reserves={reserves}
        defaultSymbol="WHBAR"
        title="Withdraw"
        description="Withdraw supplied balance. For WHBAR, underlying is sent to the wrap helper when configured."
      />
    </div>
  );
};

export default SupplyPage;
