import { useCallback } from "react";
import { useAccount, useChainId, useWriteContract } from "wagmi";
import { ARC_TESTNET_ID, ERC20_ABI, FEE_AMOUNT, TREASURY_ADDRESS, USDC_ADDRESS } from "@/lib/arc";

/**
 * Sends 0.1 USDC on Arc Testnet to the treasury.
 * Returns the tx hash on confirmation request (wallet confirms send).
 */
export function usePayFee() {
  const { address } = useAccount();
  const chainId = useChainId();
  const { writeContractAsync, isPending } = useWriteContract();

  const pay = useCallback(async (): Promise<`0x${string}`> => {
    if (!address) throw new Error("Wallet not connected");
    if (chainId !== ARC_TESTNET_ID) throw new Error("Wrong network");
    return await writeContractAsync({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: "transfer",
      args: [TREASURY_ADDRESS, FEE_AMOUNT],
      chainId: ARC_TESTNET_ID,
    });
  }, [address, chainId, writeContractAsync]);

  return { pay, isPending };
}
