"use client";

import { useCallback, useState } from "react";
import { Address, Hash, parseUnits, zeroHash } from "viem";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { useDeployedContractInfo, useTargetNetwork, useTransactor } from "~~/hooks/scaffold-hbar";
import { VARIABLE_RATE_MODE, auditAnchorAbi, erc20Abi, lendingPoolAbi } from "~~/utils/bonzo/abis";
import { type BonzoReserveMeta, getBonzoCore, getBonzoReserves } from "~~/utils/bonzo/addresses";
import { type LendingAction, actionToAnchorType } from "~~/utils/bonzo/format";
import type { ContractName } from "~~/utils/scaffold-hbar/contract";
import { notification } from "~~/utils/scaffold-hbar/notification";

type AuditPayload = {
  action: LendingAction;
  asset: Address;
  amount: string;
  txHash: Hash;
  symbol: string;
};

async function submitHcsAudit(payload: AuditPayload): Promise<string | null> {
  try {
    const res = await fetch("/api/hcs/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { sequenceNumber?: string };
    return data.sequenceNumber ?? null;
  } catch {
    return null;
  }
}

export const useBonzoLending = () => {
  const { address } = useAccount();
  const { targetNetwork } = useTargetNetwork();
  const core = getBonzoCore(targetNetwork.id);
  const publicClient = usePublicClient({ chainId: targetNetwork.id });
  const { writeContractAsync } = useWriteContract();
  const writeTx = useTransactor();
  const { data: auditAnchor } = useDeployedContractInfo({
    contractName: "AuditAnchor" as ContractName,
  });
  const [pending, setPending] = useState(false);

  const findReserve = useCallback(
    (symbol: string): BonzoReserveMeta | undefined =>
      getBonzoReserves(targetNetwork.id).find(r => r.symbol.toUpperCase() === symbol.toUpperCase()),
    [targetNetwork.id],
  );

  const ensureAllowance = useCallback(
    async (token: Address, spender: Address, amount: bigint) => {
      if (!address || !publicClient) throw new Error("Wallet not ready");
      const allowance = (await publicClient.readContract({
        address: token,
        abi: erc20Abi,
        functionName: "allowance",
        args: [address, spender],
      })) as bigint;
      if (allowance >= amount) return;
      const hash = await writeTx(() =>
        writeContractAsync({
          address: token,
          abi: erc20Abi,
          functionName: "approve",
          args: [spender, amount],
          chainId: targetNetwork.id,
        }),
      );
      if (!hash) throw new Error("Approve failed");
    },
    [address, publicClient, writeContractAsync, writeTx, targetNetwork.id],
  );

  const afterSuccess = useCallback(
    async (payload: AuditPayload, amountWei: bigint) => {
      const seq = await submitHcsAudit(payload);
      if (auditAnchor?.address && address) {
        try {
          const hcsRef = seq ? (`0x${BigInt(seq).toString(16).padStart(64, "0")}` as Hash) : zeroHash;
          await writeTx(() =>
            writeContractAsync({
              address: auditAnchor.address,
              abi: auditAnchorAbi,
              functionName: "recordAction",
              args: [actionToAnchorType(payload.action), payload.asset, amountWei, hcsRef],
              chainId: targetNetwork.id,
            }),
          );
        } catch (e) {
          console.warn("AuditAnchor record skipped", e);
        }
      }
      if (seq) {
        notification.success(`HCS audit sequence ${seq}`);
      }
    },
    [address, auditAnchor, writeContractAsync, writeTx, targetNetwork.id],
  );

  const run = useCallback(
    async (action: LendingAction, symbol: string, amountHuman: string, decimals: number) => {
      if (!address || !core) {
        notification.error("Connect a wallet on Hedera testnet/mainnet");
        return;
      }
      const reserve = findReserve(symbol);
      if (!reserve) {
        notification.error(`Unknown reserve ${symbol}`);
        return;
      }
      const amount = parseUnits(amountHuman, decimals);
      if (amount <= 0n) {
        notification.error("Enter an amount greater than zero");
        return;
      }

      setPending(true);
      try {
        let txHash: Hash | undefined;

        // Bonzo WHBAR path: amount is 8-decimal token units; msg.value uses 18-decimal HBAR (= amount * 1e10).
        if (reserve.isNativeWrapped) {
          const hbarValue = amount * 10_000_000_000n;
          if (action === "deposit" || action === "repay") {
            if (reserve.wrapHelper) {
              await ensureAllowance(reserve.token, reserve.wrapHelper, amount);
            }
            await ensureAllowance(reserve.token, core.lendingPool, amount);
            if (action === "deposit") {
              txHash = await writeTx(() =>
                writeContractAsync({
                  address: core.lendingPool,
                  abi: lendingPoolAbi,
                  functionName: "deposit",
                  args: [reserve.token, amount, address, 0],
                  value: hbarValue,
                  chainId: targetNetwork.id,
                }),
              );
            } else {
              txHash = await writeTx(() =>
                writeContractAsync({
                  address: core.lendingPool,
                  abi: lendingPoolAbi,
                  functionName: "repay",
                  args: [reserve.token, amount, VARIABLE_RATE_MODE, address],
                  value: hbarValue,
                  chainId: targetNetwork.id,
                }),
              );
            }
          } else if (action === "withdraw") {
            txHash = await writeTx(() =>
              writeContractAsync({
                address: core.lendingPool,
                abi: lendingPoolAbi,
                functionName: "withdraw",
                args: [reserve.token, amount, reserve.wrapHelper ?? address],
                chainId: targetNetwork.id,
              }),
            );
          } else {
            txHash = await writeTx(() =>
              writeContractAsync({
                address: core.lendingPool,
                abi: lendingPoolAbi,
                functionName: "borrow",
                args: [reserve.token, amount, VARIABLE_RATE_MODE, 0, address],
                chainId: targetNetwork.id,
              }),
            );
          }
        } else {
          if (action === "deposit" || action === "repay") {
            await ensureAllowance(reserve.token, core.lendingPool, amount);
          }
          if (action === "deposit") {
            txHash = await writeTx(() =>
              writeContractAsync({
                address: core.lendingPool,
                abi: lendingPoolAbi,
                functionName: "deposit",
                args: [reserve.token, amount, address, 0],
                chainId: targetNetwork.id,
              }),
            );
          } else if (action === "withdraw") {
            txHash = await writeTx(() =>
              writeContractAsync({
                address: core.lendingPool,
                abi: lendingPoolAbi,
                functionName: "withdraw",
                args: [reserve.token, amount, address],
                chainId: targetNetwork.id,
              }),
            );
          } else if (action === "borrow") {
            txHash = await writeTx(() =>
              writeContractAsync({
                address: core.lendingPool,
                abi: lendingPoolAbi,
                functionName: "borrow",
                args: [reserve.token, amount, VARIABLE_RATE_MODE, 0, address],
                chainId: targetNetwork.id,
              }),
            );
          } else {
            txHash = await writeTx(() =>
              writeContractAsync({
                address: core.lendingPool,
                abi: lendingPoolAbi,
                functionName: "repay",
                args: [reserve.token, amount, VARIABLE_RATE_MODE, address],
                chainId: targetNetwork.id,
              }),
            );
          }
        }

        if (txHash) {
          notification.success(`${action} submitted`);
          await afterSuccess(
            { action, asset: reserve.token, amount: amountHuman, txHash, symbol: reserve.symbol },
            amount,
          );
        }
      } catch (e: any) {
        console.error(e);
        notification.error(e?.shortMessage || e?.message || `${action} failed`);
      } finally {
        setPending(false);
      }
    },
    [address, core, findReserve, ensureAllowance, writeContractAsync, writeTx, targetNetwork.id, afterSuccess],
  );

  return { run, pending, core, supported: !!core };
};
