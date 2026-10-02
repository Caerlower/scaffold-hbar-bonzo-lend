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
      const rdRaw = reserveDataResults?.[i]?.result as
        | readonly [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, number]
        | {
            availableLiquidity: bigint;
            totalStableDebt: bigint;
            totalVariableDebt: bigint;
            liquidityRate: bigint;
            variableBorrowRate: bigint;
          }
        | undefined;
      const cfgRaw = configResults?.[i]?.result as
        | readonly [bigint, bigint, bigint, bigint, bigint, boolean, boolean, boolean, boolean, boolean]
        | {
            decimals: bigint;
            ltv: bigint;
            liquidationThreshold: bigint;
            borrowingEnabled: boolean;
            isActive: boolean;
            isFrozen: boolean;
          }
        | undefined;

      const rd = Array.isArray(rdRaw)
        ? {
            availableLiquidity: rdRaw[0],
            liquidityRate: rdRaw[3],
            variableBorrowRate: rdRaw[4],
          }
        : rdRaw
          ? {
              availableLiquidity: rdRaw.availableLiquidity,
              liquidityRate: rdRaw.liquidityRate,
              variableBorrowRate: rdRaw.variableBorrowRate,
            }
          : undefined;

      const cfg = Array.isArray(cfgRaw)
        ? {
            decimals: cfgRaw[0],
            ltv: cfgRaw[1],
            liquidationThreshold: cfgRaw[2],
            borrowingEnabled: cfgRaw[6],
            isActive: cfgRaw[8],
            isFrozen: cfgRaw[9],
          }
        : cfgRaw;

      return {
        ...r,
        availableLiquidity: rd?.availableLiquidity,
        liquidityRate: rd?.liquidityRate,
        variableBorrowRate: rd?.variableBorrowRate,
        decimals: cfg?.decimals,
        ltvBps: cfg?.ltv,
        liquidationThresholdBps: cfg?.liquidationThreshold,
        borrowingEnabled: cfg?.borrowingEnabled,
        isActive: cfg?.isActive,
        isFrozen: cfg?.isFrozen,
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
