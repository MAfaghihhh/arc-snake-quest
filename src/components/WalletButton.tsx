import { useAccount, useChainId, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { ARC_TESTNET_ID, arcTestnet } from "@/lib/arc";
import { Button } from "@/components/ui/button";
import { Wallet, LogOut, AlertTriangle } from "lucide-react";

function short(addr?: string) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function WalletButton() {
  const { address, isConnected } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain, isPending: switching } = useSwitchChain();

  if (!isConnected) {
    const injected = connectors.find((c) => c.id === "injected") ?? connectors[0];
    return (
      <Button
        variant="arcade"
        onClick={() => injected && connect({ connector: injected, chainId: ARC_TESTNET_ID })}
        disabled={isPending || !injected}
      >
        <Wallet className="mr-2 h-4 w-4" />
        {isPending ? "Connecting…" : "Connect Wallet"}
      </Button>
    );
  }

  const wrongNetwork = chainId !== ARC_TESTNET_ID;

  return (
    <div className="flex items-center gap-2">
      {wrongNetwork && (
        <Button
          variant="warn"
          size="sm"
          onClick={() => switchChain({ chainId: arcTestnet.id })}
          disabled={switching}
        >
          <AlertTriangle className="mr-2 h-4 w-4" />
          {switching ? "Switching…" : "Switch Network"}
        </Button>
      )}
      <div className="rounded-md border border-border bg-card/60 px-3 py-2 text-xs font-mono text-foreground shadow-[0_0_12px_color-mix(in_oklab,var(--neon-green)_30%,transparent)]">
        {short(address)}
      </div>
      <Button variant="ghost" size="icon" onClick={() => disconnect()} title="Disconnect">
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}
