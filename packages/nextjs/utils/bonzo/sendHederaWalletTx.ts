import {
  type Address,
  type Hash,
  type Hex,
  type PublicClient,
  type WalletClient,
  encodeFunctionData,
  getAddress,
  numberToHex,
} from "viem";

type WriteContractLike = {
  address: Address;
  abi: readonly unknown[] | any;
  functionName: string;
  args?: readonly unknown[];
  value?: bigint;
};

/**
 * Contract writes for Hedera wallets.
 *
 * - MetaMask / injected: standard `writeContract`
 * - WalletConnect (HashPack): sign then broadcast via JSON-RPC, with eth_sendTransaction fallback
 *   (HashPack does not support `wallet_sendTransaction`)
 */
export async function sendHederaWalletTx(
  walletClient: WalletClient,
  params: WriteContractLike,
  opts: {
    from: Address;
    chain: WalletClient["chain"];
    chainId: number;
    gas: bigint;
    gasPrice: bigint;
    publicClient?: PublicClient;
    connectorId?: string;
  },
): Promise<Hash> {
  const from = getAddress(opts.from);
  const to = getAddress(params.address);
  const id = (opts.connectorId || "").toLowerCase();
  const injected = id.includes("metamask") || id.includes("injected") || id.includes("rabby");

  if (injected) {
    return (await walletClient.writeContract({
      address: to,
      abi: params.abi,
      functionName: params.functionName,
      args: params.args,
      value: params.value,
      account: from,
      chain: opts.chain,
      gas: opts.gas,
      gasPrice: opts.gasPrice,
      type: "legacy",
    } as any)) as Hash;
  }

  const data = encodeFunctionData({
    abi: params.abi as any,
    functionName: params.functionName,
    args: params.args as any,
  });

  let nonce = 0n;
  if (opts.publicClient) {
    try {
      nonce = BigInt(await opts.publicClient.getTransactionCount({ address: from }));
    } catch {
      /* wallet may fill */
    }
  }

  const tx = {
    from,
    to,
    data,
    value: numberToHex(params.value ?? 0n),
    gas: numberToHex(opts.gas),
    gasPrice: numberToHex(opts.gasPrice),
    nonce: numberToHex(nonce),
  };

  const request = walletClient.request.bind(walletClient);

  if (opts.publicClient) {
    try {
      const signed = (await request({ method: "eth_signTransaction", params: [tx] })) as Hex | string;
      if (signed && signed !== "null") {
        return await opts.publicClient.sendRawTransaction({ serializedTransaction: signed as Hex });
      }
    } catch {
      /* fall through */
    }
  }

  try {
    const hash = (await request({ method: "eth_sendTransaction", params: [tx] })) as Hash;
    if (hash && hash !== ("null" as Hash)) return hash;
  } catch {
    /* try minimal */
  }

  const minimal = { from, to, data, value: numberToHex(params.value ?? 0n) };
  const hash = (await request({ method: "eth_sendTransaction", params: [minimal] })) as Hash | string;
  if (!hash || hash === "null") {
    throw new Error(
      "Wallet could not send the transaction. Prefer MetaMask on Hedera Testnet (296), or reconnect HashPack (ECDSA) via WalletConnect.",
    );
  }
  return hash as Hash;
}
