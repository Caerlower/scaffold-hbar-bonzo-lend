"use client";

import { useReadContract } from "wagmi";
import { useTargetNetwork } from "~~/hooks/scaffold-hbar";
import { lendingPoolAbi } from "~~/utils/bonzo/abis";
import { getBonzoCore } from "~~/utils/bonzo/addresses";

/**
 * Bonzo LendingPool pause flag (Aave v2 `paused()`).
 * When true, supply/borrow/repay/withdraw writes revert with error "64".
 */
export const useBonzoPoolPaused = () => {
  const { targetNetwork } = useTargetNetwork();
  const core = getBonzoCore(targetNetwork.id);

  const { data, isLoading, isError, refetch } = useReadContract({
    address: core?.lendingPool,
    abi: lendingPoolAbi,
    functionName: "paused",
    chainId: targetNetwork.id,
    query: { enabled: !!core, staleTime: 30_000 },
  });

  return {
    paused: data === true,
    unknown: isError,
    isLoading,
    refetch,
    supported: !!core,
  };
};
