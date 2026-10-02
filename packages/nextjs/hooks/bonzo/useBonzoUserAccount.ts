"use client";

import { useMemo } from "react";
import { useAccount, useReadContract, useReadContracts } from "wagmi";
import { useTargetNetwork } from "~~/hooks/scaffold-hbar";
import { lendingPoolAbi, protocolDataProviderAbi } from "~~/utils/bonzo/abis";
import { getBonzoCore, getBonzoReserves } from "~~/utils/bonzo/addresses";

export type UserReserveRow = {
  symbol: string;
  token: `0x${string}`;
  supplied: bigint;
  variableDebt: bigint;
  stableDebt: bigint;
  usageAsCollateralEnabled: boolean;
  decimals: number;
};

export const useBonzoUserAccount = () => {
  const { address } = useAccount();
  const { targetNetwork } = useTargetNetwork();
  const core = getBonzoCore(targetNetwork.id);
  const reserves = getBonzoReserves(targetNetwork.id);

  const {
    data: accountData,
    isLoading: loadingAccount,
    refetch: refetchAccount,
  } = useReadContract({
    address: core?.lendingPool,
    abi: lendingPoolAbi,
    functionName: "getUserAccountData",
    args: address ? [address] : undefined,
    chainId: targetNetwork.id,
    query: { enabled: !!core && !!address, staleTime: 12_000 },
  });

  const userReserveContracts = useMemo(() => {
    if (!core || !address) return [];
    return reserves.map(r => ({
      address: core.protocolDataProvider,
      abi: protocolDataProviderAbi,
      functionName: "getUserReserveData" as const,
      args: [r.token, address] as const,
      chainId: targetNetwork.id,
    }));
  }, [core, address, reserves, targetNetwork.id]);

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
    data: userReserveResults,
    isLoading: loadingReserves,
    refetch: refetchReserves,
  } = useReadContracts({
    contracts: userReserveContracts,
    query: { enabled: !!core && !!address && reserves.length > 0, staleTime: 12_000 },
  });

  const { data: configResults } = useReadContracts({
    contracts: configContracts,
    query: { enabled: !!core && reserves.length > 0, staleTime: 60_000 },
  });

  const positions: UserReserveRow[] = useMemo(() => {
    return reserves.map((r, i) => {
      const ur = userReserveResults?.[i]?.result as
        | readonly [bigint, bigint, bigint, bigint, bigint, bigint, bigint, number, boolean]
        | undefined;
      const cfg = configResults?.[i]?.result as
        | readonly [bigint, bigint, bigint, bigint, bigint, boolean, boolean, boolean, boolean, boolean]
        | undefined;
      return {
        symbol: r.symbol,
        token: r.token as `0x${string}`,
        supplied: ur?.[0] ?? 0n,
        stableDebt: ur?.[1] ?? 0n,
        variableDebt: ur?.[2] ?? 0n,
        usageAsCollateralEnabled: ur?.[8] ?? false,
        decimals: cfg ? Number(cfg[0]) : 8,
      };
    });
  }, [reserves, userReserveResults, configResults]);

  return {
    core,
    accountData: accountData as readonly [bigint, bigint, bigint, bigint, bigint, bigint] | undefined,
    positions,
    isLoading: loadingAccount || loadingReserves,
    refetch: async () => {
      await Promise.all([refetchAccount(), refetchReserves()]);
    },
    supported: !!core,
  };
};
