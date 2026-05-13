import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { ARC_TESTNET_ID, arcTestnet } from "@/lib/arc";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export function NetworkBanner() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();

  if (!isConnected) return null;
  if (chainId === ARC_TESTNET_ID) return null;

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-lg border border-warn/60 bg-warn/10 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 text-warn" />
        <p className="text-sm font-medium text-foreground">
          Please switch to <span className="text-warn">Arc Testnet</span> to continue.
        </p>
      </div>
      <Button
        variant="warn"
        onClick={() => switchChain({ chainId: arcTestnet.id })}
        disabled={isPending}
      >
        {isPending ? "Switching…" : "Switch Network"}
      </Button>
    </div>
  );
}
