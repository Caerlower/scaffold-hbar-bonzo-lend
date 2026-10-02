"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { CheckCircleIcon, DocumentDuplicateIcon } from "@heroicons/react/24/outline";
import { useBonzoLending } from "~~/hooks/bonzo/useBonzoLending";
import { useBonzoPoolPaused } from "~~/hooks/bonzo/useBonzoPoolPaused";
import { useHtsAssociation } from "~~/hooks/bonzo/useHtsAssociation";
import { useCopyToClipboard } from "~~/hooks/scaffold-hbar";
import type { BonzoReserveMeta } from "~~/utils/bonzo/addresses";
import type { LendingAction } from "~~/utils/bonzo/format";

type LendingFormProps = {
  action: LendingAction;
  reserves: BonzoReserveMeta[];
  defaultSymbol?: string;
  title: string;
  description: string;
};

type CopyField = "tokenId" | "evm";

export const LendingForm = ({ action, reserves, defaultSymbol, title, description }: LendingFormProps) => {
  const [symbol, setSymbol] = useState(defaultSymbol || reserves[0]?.symbol || "USDC");
  const [amount, setAmount] = useState("");
  const [copiedField, setCopiedField] = useState<CopyField | null>(null);
  const { isConnected } = useAccount();
  const selected = reserves.find(r => r.symbol === symbol);
  const decimals = selected?.tokenDecimals ?? 8;
  const { associated, loading: assocLoading, accountId: assocAccountId } = useHtsAssociation(selected?.token);
  const { run, pending, supported, accountId, accountIdLoading, isBurner, hbarBalance, wrongNetwork, walletChainId } =
    useBonzoLending();
  const { paused: poolPaused } = useBonzoPoolPaused();
  const { copyToClipboard } = useCopyToClipboard();

  const hederaReady = !!accountId;
  const hasGas = hbarBalance !== undefined && hbarBalance > 0n;
  const needsAssociation = associated === false && (action === "deposit" || action === "repay" || action === "borrow");

  const copyField = async (field: CopyField, value: string) => {
    await copyToClipboard(value);
    setCopiedField(field);
    window.setTimeout(() => setCopiedField(current => (current === field ? null : current)), 1600);
  };

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
            Bonzo LendingPool is paused on-chain (<code className="text-xs">paused() = true</code>). Writes will
            revert until Bonzo unpauses.
          </span>
        </div>
      )}

      {wrongNetwork && (
        <div className="alert alert-error text-sm py-3">
          <span>
            Wallet is on chain {walletChainId}
            {walletChainId === 295 ? " (Mainnet)" : ""}. Switch to Hedera <strong>Testnet (296)</strong>, then
            disconnect and reconnect.
          </span>
        </div>
      )}

      {isConnected && !accountIdLoading && !hederaReady && (
        <div className="alert alert-warning text-sm py-3">
          <span>
            {isBurner
              ? "Burner wallet is not a Hedera account. Disconnect it and connect MetaMask or HashPack on testnet."
              : "This address is not on Hedera yet. Fund it with testnet HBAR first."}
          </span>
        </div>
      )}

      {isConnected && hederaReady && !hasGas && (
        <div className="alert alert-warning text-sm py-3">
          <span>Wallet has 0 HBAR for gas. Use “Get testnet HBAR” in the footer.</span>
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
          onChange={e => setSymbol(e.target.value)}
        >
          {reserves.map(r => (
            <option key={r.symbol} value={r.symbol}>
              {r.symbol}
              {r.isNativeWrapped ? " · wraps native HBAR" : ""} · {r.tokenDecimals} decimals
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
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

      {selected && (
        <div className="rounded-2xl bg-base-200/70 px-3.5 py-3 text-sm space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <p className="m-0 font-medium text-base-content/90">HTS association</p>
            {!isConnected ? (
              <p className="m-0 text-xs text-base-content/55">Connect wallet</p>
            ) : accountIdLoading || assocLoading ? (
              <p className="m-0 text-xs text-base-content/55">Checking…</p>
            ) : associated === true ? (
              <p className="m-0 text-xs text-success">Associated</p>
            ) : associated === false ? (
              <p className="m-0 text-xs text-warning">Not associated</p>
            ) : (
              <p className="m-0 text-xs text-base-content/55">Unknown</p>
            )}
          </div>

          {selected.tokenId && (
            <div className="flex items-center justify-between gap-2 rounded-xl bg-base-100 border border-base-300 px-3 py-2">
              <div className="min-w-0">
                <p className="m-0 text-[11px] uppercase tracking-wide text-base-content/50">Token ID</p>
                <p className="m-0 font-mono text-sm font-semibold truncate">{selected.tokenId}</p>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm rounded-full gap-1 shrink-0"
                onClick={() => void copyField("tokenId", selected.tokenId!)}
                aria-label={`Copy Token ID ${selected.tokenId}`}
              >
                {copiedField === "tokenId" ? (
                  <CheckCircleIcon className="h-4 w-4 text-success" />
                ) : (
                  <DocumentDuplicateIcon className="h-4 w-4" />
                )}
                <span className="text-xs">{copiedField === "tokenId" ? "Copied" : "Copy"}</span>
              </button>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 rounded-xl bg-base-100 border border-base-300 px-3 py-2">
            <div className="min-w-0">
              <p className="m-0 text-[11px] uppercase tracking-wide text-base-content/50">EVM address</p>
              <p className="m-0 font-mono text-xs truncate">{selected.token}</p>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm rounded-full gap-1 shrink-0"
              onClick={() => void copyField("evm", selected.token)}
              aria-label={`Copy EVM address ${selected.token}`}
            >
              {copiedField === "evm" ? (
                <CheckCircleIcon className="h-4 w-4 text-success" />
              ) : (
                <DocumentDuplicateIcon className="h-4 w-4" />
              )}
              <span className="text-xs">{copiedField === "evm" ? "Copied" : "Copy"}</span>
            </button>
          </div>

          {associated === false && (
            <p className="m-0 text-base-content/60 text-xs leading-relaxed">
              Associate Token ID in HashPack (Assets → Associate) on{" "}
              {assocAccountId || accountId || "your Hedera account"}. MetaMask does not perform HTS association.
            </p>
          )}
        </div>
      )}

      <button
        type="button"
        className="btn btn-primary w-full rounded-full mt-1"
        disabled={pending || !supported || !amount || poolPaused || needsAssociation}
        onClick={() => void run(action, symbol, amount, decimals)}
      >
        {pending ? <span className="loading loading-spinner loading-sm" /> : title}
      </button>
    </div>
  );
};
