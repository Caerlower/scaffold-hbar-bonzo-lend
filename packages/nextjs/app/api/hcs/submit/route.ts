import { NextResponse } from "next/server";
import { resolveTopicId, submitAuditMessage } from "~~/services/hcs/server";

export async function POST(req: Request) {
  try {
    const topicId = resolveTopicId();
    if (!topicId) {
      return NextResponse.json(
        { error: "HCS_AUDIT_TOPIC_ID not set. Create a topic via POST /api/hcs/topic first." },
        { status: 400 },
      );
    }
    const body = await req.json();
    const message = JSON.stringify({
      ...body,
      timestamp: new Date().toISOString(),
      protocol: "bonzo",
      template: "scaffold-hbar-bonzo-lend",
    });
    const sequenceNumber = await submitAuditMessage(topicId, message);
    return NextResponse.json({ topicId, sequenceNumber });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "HCS submit failed" }, { status: 500 });
  }
}
