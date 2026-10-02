"use client";

import { useCallback, useState } from "react";
import { Address, Hash, parseUnits, zeroHash } from "viem";
import { useAccount, useBalance, usePublicClient, useSwitchChain, useWalletClient } from "wagmi";
import { useDeployedContractInfo, useHederaAccountId, useTargetNetwork, useTransactor } from "~~/hooks/scaffold-hbar";
import { VARIABLE_RATE_MODE, auditAnchorAbi, erc20Abi, lendingPoolAbi, whbarHelperAbi } from "~~/utils/bonzo/abis";
import {
  type BonzoReserveMeta,
  MIRROR_NODE_URL,
  bonzoNetworkKey,
  getBonzoCore,
  getBonzoReserves,
} from "~~/utils/bonzo/addresses";
import { type LendingAction, actionToAnchorType } from "~~/utils/bonzo/format";
import { sendHederaWalletTx } from "~~/utils/bonzo/sendHederaWalletTx";
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

/** Mirror Node: is this HTS token associated to the Hedera account? */
async function isTokenAssociated(networkId: number, accountId: string, tokenEvm: string): Promise<boolean | null> {
  const key = bonzoNetworkKey(networkId);
  if (!key) return null;
  const base = MIRROR_NODE_URL[key];
  try {
    const [acctRes, tokenRes] = await Promise.all([
      fetch(`${base}/api/v1/accounts/${accountId}/tokens?limit=100`),
      fetch(`${base}/api/v1/tokens/${tokenEvm.toLowerCase()}`),
    ]);
    if (!tokenRes.ok) return true; // not an HTS id we can resolve — allow
    const tokenData = (await tokenRes.json()) as { token_id?: string };
    if (!tokenData.token_id) return true;
    if (!acctRes.ok) return null;
    const acctData = (await acctRes.json()) as { tokens?: { token_id?: string }[] };
    return (acctData.tokens ?? []).some(t => t.token_id === tokenData.token_id);
  } catch {
    return null;
  }
}

export const useBonzoLending = () => {
  const { address, connector, chain } = useAccount();
  const { targetNetwork } = useTargetNetwork();
  const core = getBonzoCore(targetNetwork.id);
  const publicClient = usePublicClient({ chainId: targetNetwork.id });
  // Don't lock wallet client to target chainId — HashPack WC often reports a different active chain
  const { data: walletClient, refetch: refetchWalletClient } = useWalletClient();
  const { switchChainAsync } = useSwitchChain();
  const writeTx = useTransactor(walletClient ?? undefined);
  const { data: hbarBalance } = useBalance({ address, chainId: targetNetwork.id });
  const { accountId, isLoading: accountIdLoading } = useHederaAccountId(address, targetNetwork.id);
  const { data: auditAnchor } = useDeployedContractInfo({
    contractName: "AuditAnchor" as ContractName,
  });
  const [pending, setPending] = useState(false);

  const findReserve = useCallback(
    (symbol: string): BonzoReserveMeta | undefined =>
      getBonzoReserves(targetNetwork.id).find(r => r.symbol.toUpperCase() === symbol.toUpperCase()),
    [targetNetwork.id],
  );

  const ensureWalletReady = useCallback(async () => {
    if (!address) throw new Error("Connect a wallet first");
    if (!walletClient) {
      throw new Error("Wallet client not ready — reconnect HashPack via WalletConnect on Hedera Testnet");
    }

    let walletChainId = await walletClient.getChainId();
    if (walletChainId !== targetNetwork.id) {
      const label =
        walletChainId === 295 ? "Hedera Mainnet" : walletChainId === 296 ? "Hedera Testnet" : `chain ${walletChainId}`;
      notification.info(`Wallet is on ${label}. Switching to ${targetNetwork.name}…`);
      try {
        await switchChainAsync({ chainId: targetNetwork.id });
        await refetchWalletClient();
        walletChainId = await walletClient.getChainId();
      } catch {
        // HashPack often ignores eth_switchChain — user must flip network in the wallet UI
      }
      if (walletChainId !== targetNetwork.id) {
        throw new Error(
          `HashPack is on ${label} (${walletChainId}), but this dApp needs ${targetNetwork.name} (${targetNetwork.id}). In HashPack: switch network to Testnet, then disconnect & reconnect this site.`,
        );
      }
    }
  }, [address, walletClient, targetNetwork, switchChainAsync, refetchWalletClient]);

  /** Direct wallet write — Hedera-aware send helper (MetaMask writeContract / WC sign+broadcast). */
  const walletWrite = useCallback(
    async (params: {
      address: Address;
      abi: any;
      functionName: string;
      args?: readonly unknown[];
      value?: bigint;
    }) => {
      await ensureWalletReady();
      if (!walletClient || !address) throw new Error("Wallet client not ready");
      notification.info("Approve the transaction in HashPack / MetaMask…");

      // HashPack often shows a bare "Error!" if it cannot estimate gas for HTS ERC-20 calls.
      // Pre-estimate (or fall back to a high Hedera-safe limit) and send legacy gasPrice.
      let gas = 2_000_000n;
      if (publicClient) {
        try {
          const estimated = await publicClient.estimateContractGas({
            ...(params as any),
            account: address,
          });
          gas = (estimated * 150n) / 100n;
          if (gas < 400_000n) gas = 400_000n;
        } catch {
          /* keep fallback */
        }
      }
      const gasPrice =
        (publicClient ? await publicClient.getGasPrice().catch(() => undefined) : undefined) ?? 750_000_000_000n; // 750 gwei fallback (Hedera JSON-RPC)

      const hash = await writeTx(() =>
        sendHederaWalletTx(walletClient, params as any, {
          from: address,
          chain: walletClient.chain ?? targetNetwork,
          chainId: targetNetwork.id,
          gas,
          gasPrice,
          publicClient: publicClient ?? undefined,
          connectorId: connector?.id ?? connector?.name,
        }),
      );
      if (!hash) throw new Error("Transaction was cancelled or failed to submit");
      return hash;
    },
    [ensureWalletReady, walletClient, writeTx, address, targetNetwork, publicClient, connector],
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
      // Hedera HTS ERC-20 facades reject approve(type(uint256).max) with INVALID_OPERATION —
      // always approve the exact amount needed for this action.
      await walletWrite({
        address: token,
        abi: erc20Abi,
        functionName: "approve",
        args: [spender, amount],
      });
    },
    [address, publicClient, walletWrite],
  );

  const afterSuccess = useCallback(
    async (payload: AuditPayload, amountWei: bigint) => {
      const seq = await submitHcsAudit(payload);
      if (auditAnchor?.address && address) {
        try {
          await walletWrite({
            address: auditAnchor.address,
            abi: auditAnchorAbi,
            functionName: "recordAction",
            args: [actionToAnchorType(payload.action), payload.asset, amountWei, seq ? (`0x${BigInt(seq).toString(16).padStart(64, "0")}` as Hash) : zeroHash],
          });
        } catch (e) {
          console.warn("AuditAnchor record skipped", e);
        }
      }
      if (seq) {
        notification.success(`HCS audit sequence ${seq}`);
      }
    },
    [address, auditAnchor, walletWrite],
  );

  const run = useCallback(
    async (action: LendingAction, symbol: string, amountHuman: string, decimals: number) => {
      if (!address || !core) {
        notification.error("Connect a wallet on Hedera testnet/mainnet");
        return;
      }
      if (accountIdLoading) {
        notification.error("Still resolving Hedera account — try again in a second");
        return;
      }
      if (!accountId) {
        notification.error(
          "This EVM address is not a Hedera account yet. Disconnect the burner, connect HashPack, or fund via “Get testnet HBAR”.",
        );
        return;
      }
      if (hbarBalance !== undefined && hbarBalance.value === 0n) {
        notification.error("Wallet has 0 HBAR — you need testnet HBAR for gas. Use “Get testnet HBAR” in the footer.");
        return;
      }
      if (!walletClient) {
        notification.error("Wallet not ready for signing. Reconnect HashPack via WalletConnect on Hedera Testnet.");
        return;
      }

      if (publicClient) {
        try {
          const isPaused = (await publicClient.readContract({
            address: core.lendingPool,
            abi: lendingPoolAbi,
            functionName: "paused",
          })) as boolean;
          if (isPaused) {
            notification.error(
              "Bonzo LendingPool is paused on testnet (paused() = true). Writes revert with error 64 until Bonzo unpauses.",
            );
            return;
          }
        } catch {
          /* older deployments without paused() */
        }
      }

      const reserve = findReserve(symbol);
      if (!reserve) {
        notification.error(`Unknown reserve ${symbol}`);
        return;
      }

      // HTS association required to hold/receive the token (supply, repay, and borrow).
      if (action === "deposit" || action === "repay" || action === "borrow") {
        const associated = await isTokenAssociated(targetNetwork.id, accountId, reserve.token);
        if (associated === false) {
          notification.error(
            `${reserve.symbol} is not associated on ${accountId}. Copy Token ID ${reserve.tokenId || reserve.token} → associate in HashPack (MetaMask does not skip this), then retry.`,
          );
          return;
        }
      }

      let amount: bigint;
      try {
        amount = parseUnits(amountHuman, decimals);
      } catch {
        notification.error("Invalid amount");
        return;
      }
      if (amount <= 0n) {
        notification.error("Enter an amount greater than zero");
        return;
      }

      if (!reserve.isNativeWrapped && (action === "deposit" || action === "repay") && publicClient) {
        const bal = (await publicClient.readContract({
          address: reserve.token,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [address],
        })) as bigint;
        if (bal < amount) {
          notification.error(
            `Insufficient ${reserve.symbol} balance (${bal.toString()} base units). Get testnet tokens from Bonzo Discord #testnet-faucet, then retry.`,
          );
          return;
        }
      }

      if (action === "borrow") {
        if (!publicClient) {
          notification.error("RPC not ready");
          return;
        }
        const accountData = (await publicClient.readContract({
          address: core.lendingPool,
          abi: lendingPoolAbi,
          functionName: "getUserAccountData",
          args: [address],
        })) as readonly [bigint, bigint, bigint, bigint, bigint, bigint];
        const [, , availableBorrows] = accountData;
        if (availableBorrows === 0n) {
          notification.error(
            "Nothing to borrow against yet. Go to Supply, deposit collateral (e.g. USDC or WHBAR), then borrow.",
          );
          return;
        }
      }

      setPending(true);
      try {
        let txHash: Hash | undefined;

        if (reserve.isNativeWrapped) {
          // amount = 8-decimal WHBAR units; JSON-RPC value uses 18-decimal HBAR (= amount * 1e10)
          const hbarValue = amount * 10_000_000_000n;
          if (action === "deposit") {
            // 1) Wrap native HBAR → WHBAR (opens HashPack with a payable tx — no ERC-20 approve first)
            if (reserve.wrapHelper) {
              await walletWrite({
                address: reserve.wrapHelper,
                abi: whbarHelperAbi,
                functionName: "deposit",
                value: hbarValue,
              });
            }
            // 2) Approve LendingPool to pull WHBAR
            await ensureAllowance(reserve.token, core.lendingPool, amount);
            // 3) Supply WHBAR
            txHash = await walletWrite({
              address: core.lendingPool,
              abi: lendingPoolAbi,
              functionName: "deposit",
              args: [reserve.token, amount, address, 0],
            });
          } else if (action === "repay") {
            if (reserve.wrapHelper) {
              await walletWrite({
                address: reserve.wrapHelper,
                abi: whbarHelperAbi,
                functionName: "deposit",
                value: hbarValue,
              });
            }
            await ensureAllowance(reserve.token, core.lendingPool, amount);
            txHash = await walletWrite({
              address: core.lendingPool,
              abi: lendingPoolAbi,
              functionName: "repay",
              args: [reserve.token, amount, VARIABLE_RATE_MODE, address],
            });
          } else if (action === "withdraw") {
            txHash = await walletWrite({
              address: core.lendingPool,
              abi: lendingPoolAbi,
              functionName: "withdraw",
              args: [reserve.token, amount, reserve.wrapHelper ?? address],
            });
          } else {
            txHash = await walletWrite({
              address: core.lendingPool,
              abi: lendingPoolAbi,
              functionName: "borrow",
              args: [reserve.token, amount, VARIABLE_RATE_MODE, 0, address],
            });
          }
        } else {
          if (action === "deposit" || action === "repay") {
            await ensureAllowance(reserve.token, core.lendingPool, amount);
          }
          if (action === "deposit") {
            txHash = await walletWrite({
              address: core.lendingPool,
              abi: lendingPoolAbi,
              functionName: "deposit",
              args: [reserve.token, amount, address, 0],
            });
          } else if (action === "withdraw") {
            txHash = await walletWrite({
              address: core.lendingPool,
              abi: lendingPoolAbi,
              functionName: "withdraw",
              args: [reserve.token, amount, address],
            });
          } else if (action === "borrow") {
            txHash = await walletWrite({
              address: core.lendingPool,
              abi: lendingPoolAbi,
              functionName: "borrow",
              args: [reserve.token, amount, VARIABLE_RATE_MODE, 0, address],
            });
          } else {
            txHash = await walletWrite({
              address: core.lendingPool,
              abi: lendingPoolAbi,
              functionName: "repay",
              args: [reserve.token, amount, VARIABLE_RATE_MODE, address],
            });
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
        // useTransactor already shows a toast for wallet/RPC failures — avoid duplicate popups.
        console.error("Bonzo lending action failed", e);
      } finally {
        setPending(false);
      }
    },
    [
      address,
      core,
      accountId,
      accountIdLoading,
      hbarBalance,
      walletClient,
      findReserve,
      ensureAllowance,
      walletWrite,
      publicClient,
      targetNetwork.id,
      afterSuccess,
    ],
  );

  return {
    run,
    pending,
    core,
    supported: !!core,
    accountId,
    accountIdLoading,
    isBurner: connector?.id === "burnerWallet",
    connectorId: connector?.id,
    connectorName: connector?.name,
    hbarBalance: hbarBalance?.value,
    walletChainId: chain?.id,
    wrongNetwork: !!chain && chain.id !== targetNetwork.id,
  };
};
