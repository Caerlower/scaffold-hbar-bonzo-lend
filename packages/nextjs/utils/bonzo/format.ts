export const rayToPercent = (ray?: bigint): number => {
  if (ray === undefined) return 0;
  // RAY = 1e27; APY approximation as annual rate % = ray / 1e25
  return Number(ray) / 1e25;
};

export const formatRayApy = (ray?: bigint): string => {
  if (ray === undefined) return "—";
  const pct = rayToPercent(ray);
  return `${pct.toFixed(2)}%`;
};

/** Protocol config basis points (e.g. LTV 7500 → 75.00%) */
export const formatBps = (bps?: bigint): string => {
  if (bps === undefined) return "—";
  return `${(Number(bps) / 100).toFixed(2)}%`;
};

export const shortenAddress = (address: string, chars = 4): string => {
  if (address.length < chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}…${address.slice(-chars)}`;
};

export const ACTION_LABELS = ["Deposit", "Withdraw", "Borrow", "Repay", "Associate"] as const;

export type LendingAction = "deposit" | "withdraw" | "borrow" | "repay";

export const actionToAnchorType = (action: LendingAction): number => {
  switch (action) {
    case "deposit":
      return 0;
    case "withdraw":
      return 1;
    case "borrow":
      return 2;
    case "repay":
      return 3;
  }
};
