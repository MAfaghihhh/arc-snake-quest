import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount, useChainId } from "wagmi";
import { toast, Toaster } from "sonner";
import { Gamepad2, Coins, CalendarCheck, Sparkles, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WalletButton } from "@/components/WalletButton";
import { NetworkBanner } from "@/components/NetworkBanner";
import { SnakeGame, type GameOverPayload } from "@/components/SnakeGame";
import { Leaderboard } from "@/components/Leaderboard";
import { ARC_TESTNET_ID } from "@/lib/arc";
import { usePayFee } from "@/lib/payments";
import {
  COOLDOWN_MS,
  addBonus,
  getBonus,
  lastCheckIn,
  recordCheckIn,
  saveScore,
} from "@/lib/leaderboard";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const onArc = isConnected && chainId === ARC_TESTNET_ID;

  const [playing, setPlaying] = useState(false);
  const [gameOver, setGameOver] = useState<GameOverPayload | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [starting, setStarting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const { pay } = usePayFee();

  // Tick for cooldown UI
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // If user changes network mid-game, pause.
  useEffect(() => {
    if (playing && !onArc) {
      setPlaying(false);
      toast.warning("Game paused — switch back to Arc Testnet to continue.");
    }
  }, [playing, onArc]);

  const checkInRemaining = useMemo(() => {
    if (!address) return 0;
    const last = lastCheckIn(address);
    return Math.max(0, COOLDOWN_MS - (now - last));
  }, [address, now]);

  const bonus = address ? getBonus(address) : 0;

  const handlePlay = useCallback(async () => {
    if (!onArc) return;
    setStarting(true);
    try {
      const tx = await pay();
      toast.success("Entry paid", {
        description: `Tx ${tx.slice(0, 10)}…`,
      });
      setGameOver(null);
      setPlaying(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Transaction failed";
      toast.error("Could not start game", { description: msg });
    } finally {
      setStarting(false);
    }
  }, [pay, onArc]);

  const handleGameOver = useCallback((p: GameOverPayload) => {
    setPlaying(false);
    setGameOver(p);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!address || !gameOver) return;
    setSubmitting(true);
    try {
      const tx = await pay();
      saveScore({
        address,
        score: gameOver.score + (bonus || 0),
        txHash: tx,
        at: Date.now(),
      });
      toast.success("Score submitted", { description: "Added to leaderboard." });
      setGameOver(null);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Transaction failed";
      toast.error("Submission failed", { description: msg });
    } finally {
      setSubmitting(false);
    }
  }, [address, gameOver, bonus, pay]);

  const handleCheckIn = useCallback(async () => {
    if (!address || checkInRemaining > 0) return;
    setChecking(true);
    try {
      await pay();
      addBonus(address, 10);
      recordCheckIn(address);
      toast.success("Daily check-in complete", { description: "+10 bonus points" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Transaction failed";
      toast.error("Check-in failed", { description: msg });
    } finally {
      setChecking(false);
    }
  }, [address, pay, checkInRemaining]);

  const cooldownLabel = useMemo(() => {
    if (checkInRemaining <= 0) return "Available";
    const h = Math.floor(checkInRemaining / 3_600_000);
    const m = Math.floor((checkInRemaining % 3_600_000) / 60_000);
    const s = Math.floor((checkInRemaining % 60_000) / 1000);
    return `${h}h ${m}m ${s}s`;
  }, [checkInRemaining]);

  return (
    <div className="min-h-screen text-foreground">
      <Toaster theme="dark" position="top-center" richColors />

      <header className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-5">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-md border border-[var(--neon-green)]/40 bg-black/40 shadow-[0_0_18px_color-mix(in_oklab,var(--neon-green)_40%,transparent)]">
            <Gamepad2 className="h-5 w-5 text-[var(--neon-green)]" />
          </div>
          <div className="leading-tight">
            <h1 className="font-pixel text-[10px] tracking-widest text-[var(--neon-green)] sm:text-xs">
              SNAKE ON ARC
            </h1>
            <p className="text-[10px] text-muted-foreground">Powered by Circle USDC</p>
          </div>
        </div>
        <WalletButton />
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-20">
        <NetworkBanner />

        <section className="mb-8 grid gap-3 sm:grid-cols-3">
          <StatCard
            icon={<Coins className="h-4 w-4" />}
            label="Entry / Submit / Check-in"
            value="0.1 USDC"
          />
          <StatCard
            icon={<Sparkles className="h-4 w-4" />}
            label="Your bonus points"
            value={String(bonus)}
          />
          <StatCard
            icon={<CalendarCheck className="h-4 w-4" />}
            label="Daily check-in"
            value={cooldownLabel}
          />
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="scanline relative overflow-hidden rounded-xl border border-border bg-card/40 p-5 backdrop-blur">
            <SnakeGame active={playing} onGameOver={handleGameOver} />
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Button
                variant="arcade"
                size="lg"
                onClick={handlePlay}
                disabled={!onArc || playing || starting}
              >
                {starting ? "Confirm in wallet…" : playing ? "Game in progress" : "Play Game (0.1 USDC)"}
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={handleCheckIn}
                disabled={!onArc || checkInRemaining > 0 || checking}
              >
                <CalendarCheck className="mr-2 h-4 w-4" />
                {checking
                  ? "Confirm in wallet…"
                  : checkInRemaining > 0
                    ? `Check-in in ${cooldownLabel}`
                    : "Daily Check-In (+10)"}
              </Button>
            </div>
            {!isConnected && (
              <p className="mt-4 text-center text-sm text-muted-foreground">
                Connect your wallet to begin.
              </p>
            )}
            {isConnected && !onArc && (
              <p className="mt-4 text-center text-sm text-warn">
                Switch to Arc Testnet to enable gameplay.
              </p>
            )}
          </div>

          <Leaderboard refreshKey={refreshKey} />
        </div>

        <footer className="mt-12 text-center text-xs text-muted-foreground">
          <p>
            Arc Testnet · Chain ID {ARC_TESTNET_ID} ·{" "}
            <a
              className="underline hover:text-[var(--neon-green)]"
              href="https://faucet.circle.com/"
              target="_blank"
              rel="noreferrer"
            >
              Get testnet USDC
            </a>{" "}
            ·{" "}
            <a
              className="inline-flex items-center gap-1 underline hover:text-[var(--neon-green)]"
              href="https://testnet.arcscan.app"
              target="_blank"
              rel="noreferrer"
            >
              ArcScan <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </footer>
      </main>

      <Dialog open={!!gameOver} onOpenChange={(o) => !o && setGameOver(null)}>
        <DialogContent className="border-[color-mix(in_oklab,var(--neon-green)_40%,transparent)] bg-card">
          <DialogHeader>
            <DialogTitle className="font-pixel text-sm tracking-widest text-[var(--neon-green)]">
              GAME OVER
            </DialogTitle>
            <DialogDescription>
              Final score:{" "}
              <span className="font-pixel text-foreground">
                {String(gameOver?.score ?? 0).padStart(4, "0")}
              </span>
              {bonus > 0 && (
                <>
                  {" "}
                  + bonus{" "}
                  <span className="font-pixel text-[var(--neon-green)]">{bonus}</span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="ghost" onClick={() => setGameOver(null)}>
              Close
            </Button>
            <Button
              variant="arcade"
              onClick={handleSubmit}
              disabled={submitting || !onArc}
            >
              {submitting ? "Confirm in wallet…" : "Submit Score (0.1 USDC)"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card/40 p-4 backdrop-blur">
      <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="font-pixel text-base text-foreground">{value}</div>
    </div>
  );
}
