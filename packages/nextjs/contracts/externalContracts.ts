/**
 * External Bonzo Finance contracts (not deployed by this template).
 * AuditAnchor is written to deployedContracts.ts after `yarn hardhat:deploy`.
 */
import { GenericContractsDeclaration } from "~~/utils/scaffold-hbar/contract";
import { lendingPoolAbi, protocolDataProviderAbi, wethGatewayAbi, erc20Abi } from "~~/utils/bonzo/abis";
import { BONZO_CORE, BONZO_RESERVES } from "~~/utils/bonzo/addresses";

const testnetCore = BONZO_CORE.hedera_testnet;
const mainnetCore = BONZO_CORE.hedera_mainnet;
const whbarTestnet = BONZO_RESERVES.hedera_testnet.find(r => r.symbol === "WHBAR")!;
const usdcTestnet = BONZO_RESERVES.hedera_testnet.find(r => r.symbol === "USDC")!;
const whbarMainnet = BONZO_RESERVES.hedera_mainnet.find(r => r.symbol === "WHBAR")!;
const usdcMainnet = BONZO_RESERVES.hedera_mainnet.find(r => r.symbol === "USDC")!;

const externalContracts = {
  // Hedera testnet
  296: {
    BonzoLendingPool: {
      address: testnetCore.lendingPool,
      abi: lendingPoolAbi,
    },
    BonzoProtocolDataProvider: {
      address: testnetCore.protocolDataProvider,
      abi: protocolDataProviderAbi,
    },
    BonzoWETHGateway: {
      address: testnetCore.wethGateway,
      abi: wethGatewayAbi,
    },
    WHBAR: {
      address: whbarTestnet.token,
      abi: erc20Abi,
    },
    USDC: {
      address: usdcTestnet.token,
      abi: erc20Abi,
    },
  },
  // Hedera mainnet
  295: {
    BonzoLendingPool: {
      address: mainnetCore.lendingPool,
      abi: lendingPoolAbi,
    },
    BonzoProtocolDataProvider: {
      address: mainnetCore.protocolDataProvider,
      abi: protocolDataProviderAbi,
    },
    BonzoWETHGateway: {
      address: mainnetCore.wethGateway,
      abi: wethGatewayAbi,
    },
    WHBAR: {
      address: whbarMainnet.token,
      abi: erc20Abi,
    },
    USDC: {
      address: usdcMainnet.token,
      abi: erc20Abi,
    },
  },
} as const;

export default externalContracts satisfies GenericContractsDeclaration;
