"use client";

import type { NextPage } from "next";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";
import { useBonzoUserAccount } from "~~/hooks/bonzo/useBonzoUserAccount";
import { useTargetNetwork } from "~~/hooks/scaffold-hbar";

const PortfolioPage: NextPage = () => {
  const { isConnected } = useAccount();
  const { accountData, positions, isLoading, supported } = useBonzoUserAccount();
  const { targetNetwork } = useTargetNetwork();

  if (!supported) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <div className="alert alert-warning">Switch to Hedera testnet/mainnet.</div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <div className="alert">Connect your wallet to view positions.</div>
      </div>
    );
  }

  const [collateral, debt, available, , , health] = accountData ?? [];

  const healthDisplay =
    health !== undefined ? (health > 2n ** 128n ? "∞" : Number(formatUnits(health, 18)).toFixed(3)) : "—";

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto w-full">
      <h1 className="text-3xl font-bold mb-1">Portfolio</h1>
      <p className="text-base-content/70 mb-6">Your Bonzo account on {targetNetwork.name}</p>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <span className="loading loading-spinner loading-lg" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Stat label="Collateral (base)" value={collateral !== undefined ? formatUnits(collateral, 8) : "—"} />
            <Stat label="Debt (base)" value={debt !== undefined ? formatUnits(debt, 8) : "—"} />
            <Stat label="Available borrows" value={available !== undefined ? formatUnits(available, 8) : "—"} />
            <Stat label="Health factor" value={healthDisplay} />
          </div>

          <div className="overflow-x-auto bg-base-100 rounded-2xl border border-base-300 shadow-md">
            <table className="table">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Supplied</th>
                  <th>Variable debt</th>
                  <th>Collateral</th>
                </tr>
              </thead>
              <tbody>
                {positions.map(p => (
                  <tr key={p.symbol}>
                    <td className="font-semibold">{p.symbol}</td>
                    <td className="font-mono text-sm">{formatUnits(p.supplied, p.decimals)}</td>
                    <td className="font-mono text-sm">{formatUnits(p.variableDebt, p.decimals)}</td>
                    <td>{p.usageAsCollateralEnabled ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-base-content/50 mt-3">
            Base currency units follow Bonzo/Aave oracle denomination (often 8 decimals on Hedera deployments).
          </p>
        </>
      )}
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-base-100 rounded-xl border border-base-300 p-4">
    <p className="text-xs uppercase tracking-wide text-base-content/50 m-0 mb-1">{label}</p>
    <p className="font-mono font-semibold m-0 truncate" title={value}>
      {Number.isFinite(Number(value)) ? Number(value).toLocaleString(undefined, { maximumFractionDigits: 4 }) : value}
    </p>
  </div>
);

export default PortfolioPage;
