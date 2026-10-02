import { Client, PrivateKey, TopicCreateTransaction, TopicId, TopicMessageSubmitTransaction } from "@hiero-ledger/sdk";
import { getOperatorCredentials, resolveTopicId } from "~~/services/hcs/config";

export { resolveTopicId };

export function getOperatorClient(network: "testnet" | "mainnet" = "testnet"): Client | null {
  const creds = getOperatorCredentials();
  if (!creds) return null;

  const client = network === "mainnet" ? Client.forMainnet() : Client.forTestnet();
  const key = creds.privateKey.startsWith("0x")
    ? PrivateKey.fromStringECDSA(creds.privateKey)
    : PrivateKey.fromString(creds.privateKey);
  client.setOperator(creds.accountId, key);
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
