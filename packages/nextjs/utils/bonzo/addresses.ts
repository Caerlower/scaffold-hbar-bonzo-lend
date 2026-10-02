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
  /** Hedera Token Service ID for HashPack association (e.g. 0.0.15058) */
  tokenId?: string;
  isNativeWrapped?: boolean;
  /** WHBAR helper contract used for wrap/unwrap (deposit()) — distinct from the HTS token address */
  wrapHelper?: Address;
};

export const BONZO_CORE: Record<BonzoNetworkKey, BonzoCoreAddresses> = {
  // Testnet redeployed (docs.bonzo.finance lend-contracts) — old 0x7710… pool is paused
  hedera_testnet: {
    lendingPool: "0xf67DBe9bD1B331cA379c44b5562EAa1CE831EbC2",
    addressesProvider: "0x873575d4AeeBe015AcF3BB17AAa9DD248cc76D68",
    protocolDataProvider: "0x121A2AFFA5f595175E60E01EAeF0deC43Cc3b024",
    wethGateway: "0x16197Ef10F26De77C9873d075f8774BdEc20A75d",
    aaveOracle: "0x9B940a1e60D652bCaf09C1d2224d1A4a544FDFb0",
    walletBalanceProvider: "0xBB265cFA2Ccaa97260fAfd7303fCE751F3081d51",
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
      tokenId: "0.0.15058",
      aToken: "0xf594C3d27463bEd0f651847aa7d323908CB5FFaA",
      variableDebt: "0xF9f8309a8F55e8E480B214B6725F8419FA029D57",
      isNativeWrapped: true,
      wrapHelper: "0x0000000000000000000000000000000000003ad1",
    },
    {
      symbol: "USDC",
      token: "0x0000000000000000000000000000000000001549",
      tokenId: "0.0.5449",
      aToken: "0x1348D518996a26a774Eb005b925A655808265D39",
      variableDebt: "0xD2A4c538E7CABD2516C29Dbb962E45Ca86F3bB48",
    },
    {
      symbol: "SAUCE",
      token: "0x0000000000000000000000000000000000120f46",
      tokenId: "0.0.1183558",
      aToken: "0x89568c3cD65C54AC41158e2A03E747cCC091f0BE",
      variableDebt: "0x51c27355064F85de57C6965CeF9baBA08CcfF13C",
    },
    {
      symbol: "HBARX",
      token: "0x0000000000000000000000000000000000220ced",
      tokenId: "0.0.2231533",
      aToken: "0x259F2BE6542Bf882b6EA4ab157F4112F4Cec0666",
      variableDebt: "0x7f6A2Af6921915A80673da5d233710918A18Db75",
    },
    {
      symbol: "XSAUCE",
      token: "0x000000000000000000000000000000000015a59b",
      tokenId: "0.0.1418651",
      aToken: "0x7521De32AdC1743684c1d802F2C288c6cA867981",
      variableDebt: "0x91E0F09F55DC746Bd44c9AF4A9a8F3C9E50e3625",
    },
    {
      symbol: "KARATE",
      token: "0x00000000000000000000000000000000003991ed",
      tokenId: "0.0.3772909",
      aToken: "0x704cec3C19d306eD082377ae1d88F772c1C8D0de",
      variableDebt: "0x2EA9dA7FcbE59d8ceE7dCb9724BF8714Ae3677fd",
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
