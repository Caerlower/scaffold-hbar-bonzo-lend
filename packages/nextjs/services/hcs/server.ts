import { Client, PrivateKey, TopicCreateTransaction, TopicId, TopicMessageSubmitTransaction } from "@hiero-ledger/sdk";

export function getOperatorClient(network: "testnet" | "mainnet" = "testnet"): Client | null {
  const accountId = process.env.HEDERA_OPERATOR_ID;
  const privateKey = process.env.HEDERA_OPERATOR_KEY;
  if (!accountId || !privateKey) return null;

  const client = network === "mainnet" ? Client.forMainnet() : Client.forTestnet();
  const key = privateKey.startsWith("0x") ? PrivateKey.fromStringECDSA(privateKey) : PrivateKey.fromString(privateKey);
  client.setOperator(accountId, key);
  return client;
}

export async function createAuditTopic(memo = "scaffold-hbar-bonzo-lend-audit"): Promise<string> {
  const client = getOperatorClient();
  if (!client) throw new Error("Set HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY to create an HCS topic");
  try {
    const tx = await new TopicCreateTransaction().setTopicMemo(memo).execute(client);
    const receipt = await tx.getReceipt(client);
    const topicId = receipt.topicId?.toString();
    if (!topicId) throw new Error("Topic create returned no topicId");
    return topicId;
  } finally {
    client.close();
  }
}

export async function submitAuditMessage(topicId: string, message: string): Promise<string> {
  const client = getOperatorClient();
  if (!client) throw new Error("Set HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY to submit HCS messages");
  try {
    const tx = await new TopicMessageSubmitTransaction()
      .setTopicId(TopicId.fromString(topicId))
      .setMessage(message)
      .execute(client);
    const receipt = await tx.getReceipt(client);
    return receipt.topicSequenceNumber?.toString() ?? "0";
  } finally {
    client.close();
  }
}

export function resolveTopicId(): string | null {
  return process.env.HCS_AUDIT_TOPIC_ID || null;
}
