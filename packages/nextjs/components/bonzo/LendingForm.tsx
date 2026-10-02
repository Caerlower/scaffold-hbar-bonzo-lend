"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useBonzoLending } from "~~/hooks/bonzo/useBonzoLending";
import { useBonzoPoolPaused } from "~~/hooks/bonzo/useBonzoPoolPaused";
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
  const { isConnected } = useAccount();
  const selected = reserves.find(r => r.symbol === symbol);
  const { associated, loading: assocLoading, accountId: assocAccountId } = useHtsAssociation(selected?.token);
  const { run, pending, supported, accountId, accountIdLoading, isBurner, hbarBalance, wrongNetwork, walletChainId } =
    useBonzoLending();
  const { paused: poolPaused } = useBonzoPoolPaused();

  const hederaReady = !!accountId;
  const hasGas = hbarBalance !== undefined && hbarBalance > 0n;

  return (
    <div className="bg-base-100 rounded-2xl border border-base-300 p-6 md:p-7 w-full max-w-md shadow-sm flex flex-col gap-5">
      <header className="space-y-1.5">
        <h2 className="text-xl font-semibold tracking-tight m-0">{title}</h2>
        <p className="text-sm text-base-content/65 leading-relaxed m-0">{description}</p>
      </header>

      {!supported && (
        <div className="alert alert-warning text-sm py-3">
          <span>Switch to Hedera testnet or mainnet to use Bonzo.</span>
        </div>
      )}

      {poolPaused && (
        <div className="alert alert-error text-sm py-3">
          <span>
            Bonzo LendingPool is <strong>paused</strong> on this network right now (on-chain{" "}
            <code className="text-xs">paused() = true</code>). Supply / borrow will revert with Aave error{" "}
            <code className="text-xs">64</code> until Bonzo unpauses testnet. Markets reads and AuditAnchor still work
            for the demo.
          </span>
        </div>
      )}

      {wrongNetwork && (
        <div className="alert alert-error text-sm py-3">
          <span>
            HashPack is on chain {walletChainId}
            {walletChainId === 295 ? " (Mainnet)" : ""}. This page needs Hedera{" "}
            <strong>Testnet (296)</strong>. In HashPack switch to Testnet, then disconnect & reconnect this site.
          </span>
        </div>
      )}

      {isConnected && !accountIdLoading && !hederaReady && (
        <div className="alert alert-warning text-sm py-3">
          <span>
            {isBurner
              ? "Burner wallet is not a Hedera account (0 HBAR / never funded). Disconnect it, then connect HashPack or use “Get testnet HBAR”."
              : "This address is not on Hedera yet. Fund it with testnet HBAR so Mirror Node creates the account."}
          </span>
        </div>
      )}

      {isConnected && hederaReady && !hasGas && (
        <div className="alert alert-warning text-sm py-3">
          <span>Wallet has 0 HBAR for gas. Use “Get testnet HBAR” in the footer, then retry.</span>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${action}-asset`} className="text-sm font-medium text-base-content/85">
          Asset
        </label>
        <select
          id={`${action}-asset`}
          className="select select-bordered w-full rounded-full"
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
              {r.isNativeWrapped ? " · wraps native HBAR" : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-[1fr_5.5rem] gap-3 items-end">
        <div className="flex flex-col gap-1.5 min-w-0">
          <label htmlFor={`${action}-amount`} className="text-sm font-medium text-base-content/85">
            Amount
          </label>
          <input
            id={`${action}-amount`}
            className="input input-bordered w-full rounded-full"
            type="text"
            inputMode="decimal"
            placeholder="0.0"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${action}-decimals`} className="text-sm font-medium text-base-content/85">
            Decimals
          </label>
          <input
            id={`${action}-decimals`}
            className="input input-bordered w-full rounded-full text-center tabular-nums px-2"
            type="number"
            min={0}
            max={18}
            value={decimals}
            onChange={e => setDecimals(Number(e.target.value))}
            title="Token decimals (USDC = 6, WHBAR = 8)"
          />
        </div>
      </div>

      {selected && (
        <div className="rounded-2xl bg-base-200/70 px-3.5 py-3 text-sm space-y-1">
          <p className="m-0 font-medium text-base-content/90">
            {selected.isNativeWrapped ? "WHBAR (HTS) association" : "HTS association"}
          </p>
          {!isConnected ? (
            <p className="m-0 text-base-content/55">Connect a wallet to check association.</p>
          ) : accountIdLoading || assocLoading ? (
            <p className="m-0 text-base-content/55">Checking Mirror Node…</p>
          ) : !assocAccountId && !accountId ? (
            <p className="m-0 text-warning">No Hedera account for this address yet — fund it before associating tokens.</p>
          ) : associated === false ? (
            <div className="space-y-1">
              <p className="m-0 text-warning">
                {symbol} is not associated{assocAccountId ? ` on ${assocAccountId}` : ""}.
              </p>
              <p className="m-0 text-base-content/60 text-xs leading-relaxed">
                {selected.isNativeWrapped
                  ? "Native HBAR still uses the WHBAR HTS token under the hood. "
                  : ""}
                HashPack → Assets → Associate → paste Token ID{" "}
                <span className="font-mono font-semibold">
                  {selected.tokenId || selected.token}
                </span>
                {selected.tokenId ? " (not the 0x address)" : ""}, then Supply again.
              </p>
            </div>
          ) : associated === true ? (
            <p className="m-0 text-success">Associated on this account.</p>
          ) : (
            <p className="m-0 text-base-content/55">Could not verify association (Mirror Node).</p>
          )}
        </div>
      )}

      <button
        type="button"
        className="btn btn-primary w-full rounded-full mt-1"
        disabled={
          pending ||
          !supported ||
          !amount ||
          poolPaused ||
          (associated === false && (action === "deposit" || action === "repay"))
        }
        onClick={() => void run(action, symbol, amount, decimals)}
      >
        {pending ? <span className="loading loading-spinner loading-sm" /> : title}
      </button>
      {associated === false && (action === "deposit" || action === "repay") && (
        <p className="m-0 text-xs text-center text-warning -mt-2">
          Associate {symbol} in HashPack before supplying
          {selected?.isNativeWrapped ? " (required even for native HBAR)" : ""}.
        </p>
      )}
    </div>
  );
};
