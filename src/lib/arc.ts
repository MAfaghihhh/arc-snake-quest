import { defineChain } from "viem";

// Arc Testnet — Circle's blockchain where USDC is the native gas token.
// Docs: https://docs.arc.network
export const ARC_TESTNET_ID = 5042002; // 0x4CEF52

export const arcTestnet = defineChain({
  id: ARC_TESTNET_ID,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.testnet.arc.network"] },
    public: { http: ["https://rpc.testnet.arc.network"] },
  },
  blockExplorers: {
    default: { name: "ArcScan", url: "https://testnet.arcscan.app" },
  },
  testnet: true,
});

// USDC ERC-20 interface on Arc Testnet (6 decimals).
export const USDC_ADDRESS = "0x3600000000000000000000000000000000000000" as const;
export const USDC_DECIMALS = 6;

// Treasury — receives the 0.1 USDC entry / submission / check-in fees.
// Replace with your project treasury. Defaults to a sink address so the demo
// always produces a real wallet popup on Arc Testnet.
export const TREASURY_ADDRESS =
  "0x000000000000000000000000000000000000dEaD" as const;

// 0.1 USDC, with 6 decimals.
export const FEE_AMOUNT = 100_000n;

export const ERC20_ABI = [
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;
