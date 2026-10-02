import { BaseError as BaseViemError, ContractFunctionRevertedError } from "viem";

/**
 * Parses a viem/wagmi error into a short user-facing string.
 */
export const getParsedError = (error: any): string => {
  const parsedError = error?.walk ? error.walk() : error;
  const raw =
    parsedError instanceof BaseViemError
      ? [parsedError.details, parsedError.shortMessage, parsedError.message].filter(Boolean).join(" ")
      : String(parsedError?.message ?? parsedError ?? "");

  if (/CALLER_NOT_AUTHORIZED/i.test(raw)) {
    return "Bonzo pool reverted: CALLER_NOT_AUTHORIZED (testnet lending writes are currently blocked upstream).";
  }
  if (/not been authorized by the user|Unauthorized|user rejected|User rejected|rejected the request/i.test(raw)) {
    return "Transaction rejected in the wallet. Approve the popup and retry.";
  }
  if (/wallet_sendTransaction|does not support the requested method|Unsupported method|Missing or invalid parameters/i.test(raw)) {
    return "Wallet could not send the EVM tx. Use MetaMask on Hedera Testnet (296), or reconnect an ECDSA HashPack account via WalletConnect.";
  }

  if (parsedError instanceof BaseViemError) {
    if (
      parsedError instanceof ContractFunctionRevertedError &&
      parsedError.data &&
      parsedError.data.errorName !== "Error"
    ) {
      const customErrorArgs = parsedError.data.args?.toString() ?? "";
      return `${parsedError.shortMessage?.replace(/reverted\.$/, "reverted:") ?? "Reverted"} ${
        parsedError.data.errorName
      }(${customErrorArgs})`;
    }
    return parsedError.details || parsedError.shortMessage || parsedError.message || parsedError.name;
  }

  return parsedError?.message ?? "An unknown error occurred";
};
