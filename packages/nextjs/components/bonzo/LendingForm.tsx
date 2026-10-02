"use client";

import { useState } from "react";
import { useBonzoLending } from "~~/hooks/bonzo/useBonzoLending";
import { useHtsAssociation } from "~~/hooks/bonzo/useHtsAssociation";
import type { BonzoReserveMeta } from "~~/utils/bonzo/addresses";
import type { LendingAction } from "~~/utils/bonzo/format";

type LendingFormProps = {
  action: LendingAction;
  reserves: BonzoReserveMeta[];
  defaultSymbol?: string;
  title: string;
  description: string;
};

export const LendingForm = ({ action, reserves, defaultSymbol, title, description }: LendingFormProps) => {
  const [symbol, setSymbol] = useState(defaultSymbol || reserves[0]?.symbol || "USDC");
  const [amount, setAmount] = useState("");
  const [decimals, setDecimals] = useState(symbol === "USDC" ? 6 : 8);
  const selected = reserves.find(r => r.symbol === symbol);
  const { associated, loading: assocLoading, accountId } = useHtsAssociation(selected?.token);
  const { run, pending, supported } = useBonzoLending();

  return (
    <div className="bg-base-100 rounded-2xl shadow-md border border-base-300 p-6 max-w-lg w-full">
      <h2 className="text-xl font-bold mb-1">{title}</h2>
      <p className="text-sm text-base-content/70 mb-6">{description}</p>

      {!supported && (
        <div className="alert alert-warning mb-4">
          <span>Switch wallet to Hedera testnet (or mainnet) to use Bonzo.</span>
        </div>
      )}

      <label className="form-control w-full mb-4">
        <span className="label-text font-medium mb-1">Asset</span>
        <select
          className="select select-bordered w-full"
          value={symbol}
          onChange={e => {
            const next = e.target.value;
            setSymbol(next);
            setDecimals(next === "USDC" ? 6 : 8);
          }}
        >
          {reserves.map(r => (
            <option key={r.symbol} value={r.symbol}>
              {r.symbol}
              {r.isNativeWrapped ? " (native HBAR via gateway)" : ""}
            </option>
          ))}
        </select>
      </label>

      <label className="form-control w-full mb-4">
        <span className="label-text font-medium mb-1">Amount</span>
        <input
          className="input input-bordered w-full"
          type="text"
          inputMode="decimal"
          placeholder="0.0"
          value={amount}
          onChange={e => setAmount(e.target.value)}
        />
        <span className="label-text-alt mt-1">Decimals default: {decimals} (adjust if your token differs)</span>
      </label>

      <label className="form-control w-full mb-4">
        <span className="label-text font-medium mb-1">Token decimals</span>
        <input
          className="input input-bordered w-full"
          type="number"
          min={0}
          max={18}
          value={decimals}
          onChange={e => setDecimals(Number(e.target.value))}
        />
      </label>

      {selected && !selected.isNativeWrapped && (
        <div className="mb-4 text-sm">
          <p className="m-0 font-medium">HTS association</p>
          {assocLoading ? (
            <p className="text-base-content/60 m-0">Checking Mirror Node…</p>
          ) : associated === false ? (
            <p className="text-warning m-0">
              Token not associated to {accountId || "your account"}. Associate it in HashPack (Assets → Associate)
              before approving, or the lending tx will fail.
            </p>
          ) : associated === true ? (
            <p className="text-success m-0">Associated on this account.</p>
          ) : (
            <p className="text-base-content/60 m-0">Connect a wallet to check association.</p>
          )}
        </div>
      )}

      <button
        className="btn btn-primary w-full"
        disabled={pending || !supported || !amount}
        onClick={() => void run(action, symbol, amount, decimals)}
      >
        {pending ? <span className="loading loading-spinner loading-sm" /> : title}
      </button>
    </div>
  );
};
