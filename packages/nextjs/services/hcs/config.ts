/** Env helpers with no heavy SDK imports — safe for any route. */
export function resolveTopicId(): string | null {
  return process.env.HCS_AUDIT_TOPIC_ID || null;
}

export function getOperatorCredentials(): { accountId: string; privateKey: string } | null {
  const accountId = process.env.HEDERA_OPERATOR_ID;
  const privateKey = process.env.HEDERA_OPERATOR_KEY;
  if (!accountId || !privateKey) return null;
  return { accountId, privateKey };
}
