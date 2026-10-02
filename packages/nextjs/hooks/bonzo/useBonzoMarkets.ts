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
  decimals?: bigint;
  borrowingEnabled?: boolean;
  isActive?: boolean;
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
  } = useReadContracts({
    contracts: reserveDataContracts,
    query: { enabled: !!core && reserves.length > 0 },
  });

  const {
    data: configResults,
    isLoading: loadingConfig,
    refetch: refetchConfig,
  } = useReadContracts({
    contracts: configContracts,
    query: { enabled: !!core && reserves.length > 0 },
  });

  const { data: onChainReserves } = useReadContract({
    address: core?.protocolDataProvider,
    abi: protocolDataProviderAbi,
    functionName: "getAllReservesTokens",
    chainId: targetNetwork.id,
    query: { enabled: !!core },
  });

  const markets: MarketRow[] = useMemo(() => {
    return reserves.map((r, i) => {
      const rd = reserveDataResults?.[i]?.result as
        | readonly [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, number]
        | undefined;
      const cfg = configResults?.[i]?.result as
        | readonly [bigint, bigint, bigint, bigint, bigint, boolean, boolean, boolean, boolean, boolean]
        | undefined;
      return {
        ...r,
        availableLiquidity: rd?.[0],
        liquidityRate: rd?.[3],
        variableBorrowRate: rd?.[4],
        decimals: cfg?.[0],
        borrowingEnabled: cfg?.[6],
        isActive: cfg?.[8],
      };
    });
  }, [reserves, reserveDataResults, configResults]);

  return {
    core,
    markets,
    onChainReserves,
    isLoading: loadingReserve || loadingConfig,
    refetch: async () => {
      await Promise.all([refetchReserve(), refetchConfig()]);
    },
    supported: !!core,
  };
};
