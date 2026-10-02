"use client";

import { useMemo } from "react";
import { useReadContract, useReadContracts } from "wagmi";
import { useTargetNetwork } from "~~/hooks/scaffold-hbar";
import { protocolDataProviderAbi } from "~~/utils/bonzo/abis";
import { type BonzoReserveMeta, getBonzoCore, getBonzoReserves } from "~~/utils/bonzo/addresses";

export type MarketRow = BonzoReserveMeta & {
  availableLiquidity?: bigint;
  liquidityRate?: bigint;
  variableBorrowRate?: bigint;
  /** On-chain decimals from ProtocolDataProvider config */
  decimals?: bigint;
  ltvBps?: bigint;
  liquidationThresholdBps?: bigint;
  borrowingEnabled?: boolean;
  isActive?: boolean;
  isFrozen?: boolean;
};

/**
 * Live Bonzo markets: known reserve metadata + on-chain reserve/config data.
 */
export const useBonzoMarkets = () => {
  const { targetNetwork } = useTargetNetwork();
  const core = getBonzoCore(targetNetwork.id);
  const reserves = getBonzoReserves(targetNetwork.id);

  const reserveDataContracts = useMemo(() => {
    if (!core) return [];
    return reserves.map(r => ({
      address: core.protocolDataProvider,
      abi: protocolDataProviderAbi,
      functionName: "getReserveData" as const,
      args: [r.token] as const,
      chainId: targetNetwork.id,
    }));
  }, [core, reserves, targetNetwork.id]);

  const configContracts = useMemo(() => {
    if (!core) return [];
    return reserves.map(r => ({
      address: core.protocolDataProvider,
      abi: protocolDataProviderAbi,
      functionName: "getReserveConfigurationData" as const,
      args: [r.token] as const,
      chainId: targetNetwork.id,
    }));
  }, [core, reserves, targetNetwork.id]);

  const {
    data: reserveDataResults,
    isLoading: loadingReserve,
    refetch: refetchReserve,
    isError: reserveError,
  } = useReadContracts({
    contracts: reserveDataContracts,
    query: { enabled: !!core && reserves.length > 0, staleTime: 12_000 },
  });

  const {
    data: configResults,
    isLoading: loadingConfig,
    refetch: refetchConfig,
  } = useReadContracts({
    contracts: configContracts,
    query: { enabled: !!core && reserves.length > 0, staleTime: 12_000 },
  });

  const { data: onChainReserves } = useReadContract({
    address: core?.protocolDataProvider,
    abi: protocolDataProviderAbi,
    functionName: "getAllReservesTokens",
    chainId: targetNetwork.id,
    query: { enabled: !!core, staleTime: 60_000 },
  });

  const markets: MarketRow[] = useMemo(() => {
    return reserves.map((r, i) => {
      const rdResult = reserveDataResults?.[i]?.result as unknown;
      const cfgResult = configResults?.[i]?.result as unknown;

      let availableLiquidity: bigint | undefined;
      let liquidityRate: bigint | undefined;
      let variableBorrowRate: bigint | undefined;
      if (Array.isArray(rdResult)) {
        availableLiquidity = rdResult[0] as bigint;
        liquidityRate = rdResult[3] as bigint;
        variableBorrowRate = rdResult[4] as bigint;
      } else if (rdResult && typeof rdResult === "object") {
        const o = rdResult as Record<string, bigint>;
        availableLiquidity = o.availableLiquidity;
        liquidityRate = o.liquidityRate;
        variableBorrowRate = o.variableBorrowRate;
      }

      let decimals: bigint | undefined;
      let ltvBps: bigint | undefined;
      let liquidationThresholdBps: bigint | undefined;
      let borrowingEnabled: boolean | undefined;
      let isActive: boolean | undefined;
      let isFrozen: boolean | undefined;
      if (Array.isArray(cfgResult)) {
        decimals = cfgResult[0] as bigint;
        ltvBps = cfgResult[1] as bigint;
        liquidationThresholdBps = cfgResult[2] as bigint;
        borrowingEnabled = cfgResult[6] as boolean;
        isActive = cfgResult[8] as boolean;
        isFrozen = cfgResult[9] as boolean;
      } else if (cfgResult && typeof cfgResult === "object") {
        const o = cfgResult as Record<string, bigint | boolean>;
        decimals = o.decimals as bigint | undefined;
        ltvBps = o.ltv as bigint | undefined;
        liquidationThresholdBps = o.liquidationThreshold as bigint | undefined;
        borrowingEnabled = o.borrowingEnabled as boolean | undefined;
        isActive = o.isActive as boolean | undefined;
        isFrozen = o.isFrozen as boolean | undefined;
      }

      return {
        ...r,
        availableLiquidity,
        liquidityRate,
        variableBorrowRate,
        decimals,
        ltvBps,
        liquidationThresholdBps,
        borrowingEnabled,
        isActive,
        isFrozen,
      };
    });
  }, [reserves, reserveDataResults, configResults]);

  const emptyPool =
    markets.length > 0 &&
    markets.every(m => (m.availableLiquidity ?? 0n) === 0n && (m.liquidityRate ?? 0n) === 0n);

  return {
    core,
    markets,
    emptyPool,
    onChainReserves,
    isLoading: loadingReserve || loadingConfig,
    isError: reserveError,
    refetch: async () => {
      await Promise.all([refetchReserve(), refetchConfig()]);
    },
    supported: !!core,
  };
};
