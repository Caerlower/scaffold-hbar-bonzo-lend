"use client";

import { useCallback, useEffect, useState } from "react";
import type { NextPage } from "next";
import { useReadContract } from "wagmi";
import { useTargetNetwork } from "~~/hooks/scaffold-hbar";
import { auditAnchorAbi } from "~~/utils/bonzo/abis";
import { ACTION_LABELS } from "~~/utils/bonzo/format";
import { contracts } from "~~/utils/scaffold-hbar/contract";

type HcsMessage = {
  sequenceNumber?: number;
  consensusTimestamp?: string;
  payload?: unknown;
};

const AuditPage: NextPage = () => {
  const [topicId, setTopicId] = useState<string | null>(null);
  const [messages, setMessages] = useState<HcsMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { targetNetwork } = useTargetNetwork();
  const anchorAddress = contracts?.[targetNetwork.id]?.AuditAnchor?.address as `0x${string}` | undefined;

  const { data: anchorCount } = useReadContract({
    address: anchorAddress,
    abi: auditAnchorAbi,
    functionName: "actionCount",
    chainId: targetNetwork.id,
    query: { enabled: !!anchorAddress },
  });

  const load = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const topicRes = await fetch("/api/hcs/topic");
      const topicData = await topicRes.json();
      setTopicId(topicData.topicId ?? null);
      const msgRes = await fetch("/api/hcs/messages?network=testnet&limit=30");
      const msgData = await msgRes.json();
      if (msgData.error && !msgData.messages) setError(msgData.error);
      setMessages(msgData.messages ?? []);
    } catch (e: any) {
      setError(e?.message || "Failed to load audit feed");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const createTopic = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/hcs/topic", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Create failed");
      setTopicId(data.topicId);
      if (data.hint) setError(data.hint);
      await load();
    } catch (e: any) {
      setError(e?.message || "Create topic failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto w-full">
      <h1 className="text-3xl font-bold mb-1">Audit trail</h1>
      <p className="text-base-content/70 mb-6">
        Lending actions can be logged to an HCS topic and optionally anchored on-chain via AuditAnchor.
      </p>

      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <div className="bg-base-100 rounded-xl border border-base-300 p-4">
          <p className="text-xs uppercase text-base-content/50 m-0 mb-1">HCS topic</p>
          <p className="font-mono text-sm m-0 break-all">{topicId || "Not configured"}</p>
          <div className="flex gap-2 mt-3">
            <button className="btn btn-sm btn-primary" disabled={busy} onClick={() => void createTopic()}>
              Create topic
            </button>
            <button className="btn btn-sm btn-ghost" disabled={busy} onClick={() => void load()}>
              Refresh
            </button>
          </div>
        </div>
        <div className="bg-base-100 rounded-xl border border-base-300 p-4">
          <p className="text-xs uppercase text-base-content/50 m-0 mb-1">AuditAnchor records</p>
          <p className="font-mono text-2xl font-bold m-0">{anchorCount !== undefined ? String(anchorCount) : "—"}</p>
          <p className="text-xs text-base-content/50 m-0 mt-1">
            {anchorAddress
              ? `Deployed at ${anchorAddress}`
              : "Deploy AuditAnchor (`yarn hardhat:deploy --network hederaTestnet`) to enable on-chain anchors."}
          </p>
        </div>
      </div>

      {error && (
        <div className="alert alert-info mb-4">
          <span>{error}</span>
        </div>
      )}

      <div className="bg-base-100 rounded-2xl border border-base-300 shadow-md overflow-hidden">
        <div className="px-4 py-3 border-b border-base-300 font-semibold">Recent HCS messages</div>
        {busy && messages.length === 0 ? (
          <div className="p-8 flex justify-center">
            <span className="loading loading-spinner" />
          </div>
        ) : messages.length === 0 ? (
          <p className="p-6 text-sm text-base-content/60 m-0">
            No messages yet. Complete a supply/borrow with HCS configured.
          </p>
        ) : (
          <ul className="divide-y divide-base-300">
            {messages.map((m, i) => {
              const payload = m.payload as Record<string, unknown> | string | null;
              return (
                <li key={`${m.sequenceNumber}-${i}`} className="p-4 text-sm">
                  <div className="flex justify-between gap-2 mb-1">
                    <span className="font-mono text-xs">#{m.sequenceNumber}</span>
                    <span className="text-xs text-base-content/50">{m.consensusTimestamp}</span>
                  </div>
                  <pre className="bg-base-200 rounded-lg p-3 overflow-x-auto text-xs m-0">
                    {typeof payload === "string" ? payload : JSON.stringify(payload, null, 2)}
                  </pre>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="text-xs text-base-content/50 mt-4">
        Action labels for AuditAnchor: {ACTION_LABELS.join(", ")}. Set{" "}
        <code className="bg-base-200 px-1 rounded">HEDERA_OPERATOR_ID</code>,{" "}
        <code className="bg-base-200 px-1 rounded">HEDERA_OPERATOR_KEY</code>, and{" "}
        <code className="bg-base-200 px-1 rounded">HCS_AUDIT_TOPIC_ID</code> in{" "}
        <code className="bg-base-200 px-1 rounded">packages/nextjs/.env.local</code>.
      </p>
    </div>
  );
};

export default AuditPage;
