"use client";

import Link from "next/link";
import type { NextPage } from "next";
import { formatUnits } from "viem";
import { useBonzoMarkets } from "~~/hooks/bonzo/useBonzoMarkets";
import { useTargetNetwork } from "~~/hooks/scaffold-hbar";
import { HASHSCAN_BASE, bonzoNetworkKey } from "~~/utils/bonzo/addresses";
import { formatRayApy, shortenAddress } from "~~/utils/bonzo/format";

const MarketsPage: NextPage = () => {
  const { markets, isLoading, supported, onChainReserves } = useBonzoMarkets();
  const { targetNetwork } = useTargetNetwork();
  const key = bonzoNetworkKey(targetNetwork.id);

  if (!supported) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <div className="alert alert-warning">Connect to Hedera testnet or mainnet to load Bonzo markets.</div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-bold m-0">Markets</h1>
          <p className="text-base-content/70 m-0 mt-1">
            Bonzo Finance reserves on {targetNetwork.name}. Data from ProtocolDataProvider.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/supply" className="btn btn-primary btn-sm">
            Supply
          </Link>
          <Link href="/borrow" className="btn btn-outline btn-sm">
            Borrow
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <span className="loading loading-spinner loading-lg" />
        </div>
      ) : (
        <div className="overflow-x-auto bg-base-100 rounded-2xl border border-base-300 shadow-md">
          <table className="table">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Supply APY</th>
                <th>Borrow APY</th>
                <th>Available</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {markets.map(m => {
                const decimals = m.decimals !== undefined ? Number(m.decimals) : m.symbol === "USDC" ? 6 : 8;
                const liq = m.availableLiquidity !== undefined ? formatUnits(m.availableLiquidity, decimals) : "—";
                const scan = key ? `${HASHSCAN_BASE[key]}/token/${m.token}` : undefined;
                return (
                  <tr key={m.symbol}>
                    <td>
                      <div className="font-semibold">{m.symbol}</div>
                      {scan ? (
                        <a href={scan} target="_blank" rel="noreferrer" className="text-xs link">
                          {shortenAddress(m.token)}
                        </a>
                      ) : (
                        <span className="text-xs">{shortenAddress(m.token)}</span>
                      )}
                    </td>
                    <td>{formatRayApy(m.liquidityRate)}</td>
                    <td>{formatRayApy(m.variableBorrowRate)}</td>
                    <td className="font-mono text-sm">
                      {Number(liq).toLocaleString(undefined, { maximumFractionDigits: 4 })}
                    </td>
                    <td>
                      {m.isActive === false ? (
                        <span className="badge badge-ghost">Inactive</span>
                      ) : m.borrowingEnabled ? (
                        <span className="badge badge-success badge-outline">Borrowable</span>
                      ) : (
                        <span className="badge badge-outline">Supply only</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {onChainReserves && (
        <p className="text-xs text-base-content/50 mt-4">
          On-chain reserve count from getAllReservesTokens:{" "}
          {Array.isArray(onChainReserves) ? onChainReserves.length : 0}
        </p>
      )}
    </div>
  );
};

export default MarketsPage;
