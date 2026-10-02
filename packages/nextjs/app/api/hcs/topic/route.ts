import { NextResponse } from "next/server";
import { createAuditTopic, resolveTopicId } from "~~/services/hcs/server";

/**
 * GET  — returns configured HCS_AUDIT_TOPIC_ID (if any)
 * POST — creates a new public HCS topic (requires operator env vars) and returns its id
 */
export async function GET() {
  return NextResponse.json({ topicId: resolveTopicId() });
}

export async function POST() {
  try {
    const existing = resolveTopicId();
    if (existing) {
      return NextResponse.json({ topicId: existing, created: false });
    }
    const topicId = await createAuditTopic();
    return NextResponse.json({
      topicId,
      created: true,
      hint: "Persist this value as HCS_AUDIT_TOPIC_ID in packages/nextjs/.env.local",
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to create topic" }, { status: 500 });
  }
}
