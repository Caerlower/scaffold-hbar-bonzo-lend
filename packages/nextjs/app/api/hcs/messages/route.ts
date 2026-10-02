import { NextResponse } from "next/server";
import { resolveTopicId } from "~~/services/hcs/config";

const MIRROR_BASE: Record<string, string> = {
  testnet: process.env.HEDERA_MIRROR_TESTNET_URL ?? "https://testnet.mirrornode.hedera.com",
  mainnet: process.env.HEDERA_MIRROR_MAINNET_URL ?? "https://mainnet.mirrornode.hedera.com",
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const network = (searchParams.get("network") ?? "testnet").toLowerCase();
  const topicId = searchParams.get("topicId") || resolveTopicId();
  const limit = searchParams.get("limit") ?? "25";

  if (!topicId) {
    return NextResponse.json({ messages: [], topicId: null, error: "No topic configured" });
  }

  const base = MIRROR_BASE[network] ?? MIRROR_BASE.testnet;
  const url = `${base}/api/v1/topics/${topicId}/messages?order=desc&limit=${limit}`;

  try {
    const res = await fetch(url, { next: { revalidate: 15 } });
    if (!res.ok) {
      return NextResponse.json({ error: "Mirror node request failed", status: res.status }, { status: 502 });
    }
    const data = (await res.json()) as {
      messages?: { consensus_timestamp?: string; message?: string; sequence_number?: number }[];
    };
    const messages = (data.messages ?? []).map(m => {
      let decoded: unknown = null;
      try {
        decoded = m.message ? JSON.parse(Buffer.from(m.message, "base64").toString("utf8")) : null;
      } catch {
        decoded = m.message ? Buffer.from(m.message, "base64").toString("utf8") : null;
      }
      return {
        sequenceNumber: m.sequence_number,
        consensusTimestamp: m.consensus_timestamp,
        payload: decoded,
      };
    });
    return NextResponse.json({ topicId, messages });
  } catch (e) {
    console.error("[api/hcs/messages]", e);
    return NextResponse.json({ error: "Failed to load messages" }, { status: 502 });
  }
}
