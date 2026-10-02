/**
 * Bonzo Finance protocol addresses on Hedera.
 * Source of truth for testnet/mainnet cores: Bonzo supply-scripts bonzo_contracts.json
 * https://github.com/Bonzo-Labs/supply-scripts/blob/main/bonzo_contracts.json
 */
import { Address } from "viem";
import * as chains from "viem/chains";

export type BonzoNetworkKey = "hedera_testnet" | "hedera_mainnet";

export type BonzoCoreAddresses = {
  lendingPool: Address;
  addressesProvider: Address;
  protocolDataProvider: Address;
  wethGateway: Address;
  aaveOracle: Address;
  walletBalanceProvider: Address;
};

export type BonzoReserveMeta = {
  symbol: string;
  token: Address;
  aToken: Address;
  variableDebt: Address;
  isNativeWrapped?: boolean;
};

export const BONZO_CORE: Record<BonzoNetworkKey, BonzoCoreAddresses> = {
  hedera_testnet: {
    lendingPool: "0x7710a96b01e02eD00768C3b39BfA7B4f1c128c62",
    addressesProvider: "0xa184010a65343280e795eeF0B0B6eD870b551e6f",
    protocolDataProvider: "0xe7432d9012d2a6cd811FDf42ecE43a0aa680c958",
    wethGateway: "0xA824820e35D6AE4D368153e83b7920B2DC3Cf964",
    aaveOracle: "0x4aa505a308EdBA7854C031976DB56A8Aa635d3a6",
    walletBalanceProvider: "0x2D0c5133666113BB04d71D9Dbc34f0e2dc6B1F52",
  },
  hedera_mainnet: {
    lendingPool: "0x236897c518996163E7b313aD21D1C9fCC7BA1afc",
    addressesProvider: "0x76b846DAB3646527bfb75952E1f33AfAA72B56D1",
    protocolDataProvider: "0x78feDC4D7010E409A0c0c7aF964cc517D3dCde18",
    wethGateway: "0x9a601543e9264255BebB20Cef0E7924e97127105",
    aaveOracle: "0xc0Bb4030b55093981700559a0B751DCf7Db03cBB",
    walletBalanceProvider: "0xD64ffB431cF66fDEDB6f98Af07c63F49295b69e5",
  },
};

/** Known reserves with testnet deployments (empty addresses omitted). */
export const BONZO_RESERVES: Record<BonzoNetworkKey, BonzoReserveMeta[]> = {
  hedera_testnet: [
    {
      symbol: "WHBAR",
      token: "0x0000000000000000000000000000000000003ad2",
      aToken: "0xe65dAF55D9A2F7768bdd27d430726b2Df7144636",
      variableDebt: "0xacE6c84d8737e377c1f85BE5f7BC82E4fF3248E6",
      isNativeWrapped: true,
    },
    {
      symbol: "USDC",
      token: "0x0000000000000000000000000000000000001549",
      aToken: "0xee72C37fEc48C9FeC6bbD0982ecEb7d7a038841e",
      variableDebt: "0x5F52FB083A807554b0A9bdB6b5777Fa4C620b7A6",
    },
    {
      symbol: "SAUCE",
      token: "0x0000000000000000000000000000000000120f46",
      aToken: "0xC4d4315Ac919253b8bA48D5e609594921eb5525c",
      variableDebt: "0x65be417A48511d2f20332673038e5647a4ED194D",
    },
    {
      symbol: "HBARX",
      token: "0x0000000000000000000000000000000000220ced",
      aToken: "0x37FfB9d2c91ef6858E54DD5B05805339A1aEA207",
      variableDebt: "0x7A617Ec0B2aF56d4BD5f2aeBB547fcD3439987AD",
    },
    {
      symbol: "XSAUCE",
      token: "0x000000000000000000000000000000000015a59b",
      aToken: "0x2217F55E2056C15a21ED7a600446094C36720f29",
      variableDebt: "0xD1C09A79C5A2b1eA488A1a00b23FCEDa40f750f9",
    },
    {
      symbol: "KARATE",
      token: "0x00000000000000000000000000000000003991ed",
      aToken: "0xd5D2e84E2d29E3b8C49C2ec08Bc9d5CA01639de9",
      variableDebt: "0x0AeCA92D29fF9CEb3751dB01034bFE71E7f6B13c",
    },
  ],
  hedera_mainnet: [
    {
      symbol: "WHBAR",
      token: "0x0000000000000000000000000000000000163b5a",
      aToken: "0x6e96a607F2F5657b39bf58293d1A006f9415aF32",
      variableDebt: "0xCD5A1FF3AD6EDd7e85ae6De3854f3915dD8c9103",
      isNativeWrapped: true,
    },
    {
      symbol: "USDC",
      token: "0x000000000000000000000000000000000006f89a",
      aToken: "0xB7687538c7f4CAD022d5e97CC778d0b46457c5DB",
      variableDebt: "0x8a90C2f80Fc266e204cb37387c69EA2ed42A3cc1",
    },
    {
      symbol: "SAUCE",
      token: "0x00000000000000000000000000000000000b2ad5",
      aToken: "0x2bcC0a304c0bc816D501c7C647D958b9A5bc716d",
      variableDebt: "0x736c5dbB8ADC643f04c1e13a9C25f28d3D4f0503",
    },
  ],
};

export function bonzoNetworkKey(chainId: number): BonzoNetworkKey | null {
  if (chainId === chains.hederaTestnet.id) return "hedera_testnet";
  if (chainId === chains.hedera.id) return "hedera_mainnet";
  return null;
}

export function getBonzoCore(chainId: number): BonzoCoreAddresses | null {
  const key = bonzoNetworkKey(chainId);
  return key ? BONZO_CORE[key] : null;
}

export function getBonzoReserves(chainId: number): BonzoReserveMeta[] {
  const key = bonzoNetworkKey(chainId);
  return key ? BONZO_RESERVES[key] : [];
}

export const MIRROR_NODE_URL: Record<BonzoNetworkKey, string> = {
  hedera_testnet: "https://testnet.mirrornode.hedera.com",
  hedera_mainnet: "https://mainnet.mirrornode.hedera.com",
};

export const HASHSCAN_BASE: Record<BonzoNetworkKey, string> = {
  hedera_testnet: "https://hashscan.io/testnet",
  hedera_mainnet: "https://hashscan.io/mainnet",
};
