"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useHederaAccountId, useTargetNetwork } from "~~/hooks/scaffold-hbar";
import { MIRROR_NODE_URL, bonzoNetworkKey } from "~~/utils/bonzo/addresses";

/**
 * Checks whether an HTS token (by EVM address) is associated to the connected Hedera account
 * via Mirror Node. Association is required before ERC-20 approve/transfer of HTS assets.
 */
export const useHtsAssociation = (tokenEvmAddress?: string) => {
  const { address } = useAccount();
  const { targetNetwork } = useTargetNetwork();
  const { accountId } = useHederaAccountId(address);
  const [associated, setAssociated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    const key = bonzoNetworkKey(targetNetwork.id);
    if (!key || !accountId || !tokenEvmAddress) {
      setAssociated(null);
      return;
    }
    setLoading(true);
    try {
      const base = MIRROR_NODE_URL[key];
      const tokenPath = tokenEvmAddress.toLowerCase();
      const res = await fetch(`${base}/api/v1/accounts/${accountId}/tokens?limit=100`);
      if (!res.ok) {
        setAssociated(null);
        return;
      }
      const data = (await res.json()) as {
        tokens?: { token_id?: string; automatic_association?: boolean }[];
      };
      // Mirror returns token_id (0.0.x). Resolve EVM -> token id.
      const tokenRes = await fetch(`${base}/api/v1/tokens/${tokenPath}`);
      if (!tokenRes.ok) {
        // Fallback: treat as associated if we cannot resolve (ERC-20-only tokens)
        setAssociated(true);
        return;
      }
      const tokenData = (await tokenRes.json()) as { token_id?: string };
      const tokenId = tokenData.token_id;
      if (!tokenId) {
        setAssociated(true);
        return;
      }
      const hit = (data.tokens ?? []).some(t => t.token_id === tokenId);
      setAssociated(hit);
    } catch {
      setAssociated(null);
    } finally {
      setLoading(false);
    }
  }, [accountId, targetNetwork.id, tokenEvmAddress]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { associated, loading, refresh, accountId };
};
