import { useMemo } from "react";
import { loadScores } from "@/lib/leaderboard";
import { Trophy, ExternalLink } from "lucide-react";

function short(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function Leaderboard({ refreshKey }: { refreshKey: number }) {
  const scores = useMemo(() => loadScores().slice(0, 10), [refreshKey]);

  return (
    <div className="rounded-lg border border-border bg-card/50 p-5 backdrop-blur">
      <div className="mb-4 flex items-center gap-2">
        <Trophy className="h-5 w-5 text-[var(--neon-green)]" />
        <h2 className="font-pixel text-sm tracking-wider text-foreground">
          LEADERBOARD
        </h2>
      </div>
      {scores.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No scores yet. Be the first to make it on-chain.
        </p>
      ) : (
        <ol className="divide-y divide-border/60">
          {scores.map((s, i) => (
            <li
              key={s.txHash + i}
              className="flex items-center justify-between gap-3 py-2.5 text-sm"
            >
              <span className="font-pixel text-xs text-[var(--neon-green)]">
                #{String(i + 1).padStart(2, "0")}
              </span>
              <span className="flex-1 font-mono text-foreground">
                {short(s.address)}
              </span>
              <a
                href={`https://testnet.arcscan.app/tx/${s.txHash}`}
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:text-[var(--neon-green)]"
                title="View tx"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <span className="font-pixel tabular-nums text-foreground">
                {String(s.score).padStart(4, "0")}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
