import { useEffect, useRef, useState, useCallback } from "react";

export type GameOverPayload = { score: number };

const GRID = 22;
const TICK_BASE = 140;
const TICK_MIN = 55;

type Vec = { x: number; y: number };
type Dir = "U" | "D" | "L" | "R";

const DIRS: Record<Dir, Vec> = {
  U: { x: 0, y: -1 },
  D: { x: 0, y: 1 },
  L: { x: -1, y: 0 },
  R: { x: 1, y: 0 },
};

function randCell(snake: Vec[]): Vec {
  while (true) {
    const c = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
    if (!snake.some((s) => s.x === c.x && s.y === c.y)) return c;
  }
}

export function SnakeGame({
  active,
  onGameOver,
}: {
  active: boolean;
  onGameOver: (p: GameOverPayload) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const stateRef = useRef({
    snake: [{ x: 10, y: 10 }] as Vec[],
    dir: "R" as Dir,
    nextDir: "R" as Dir,
    food: { x: 5, y: 5 } as Vec,
    alive: true,
    score: 0,
  });

  const reset = useCallback(() => {
    const snake = [{ x: 10, y: 10 }];
    stateRef.current = {
      snake,
      dir: "R",
      nextDir: "R",
      food: randCell(snake),
      alive: true,
      score: 0,
    };
    setScore(0);
  }, []);

  // Reset whenever a new session starts
  useEffect(() => {
    if (active) reset();
  }, [active, reset]);

  // Keyboard
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const cur = stateRef.current.dir;
      const set = (d: Dir, opp: Dir) => {
        if (cur !== opp) stateRef.current.nextDir = d;
      };
      if (k === "arrowup" || k === "w") set("U", "D");
      else if (k === "arrowdown" || k === "s") set("D", "U");
      else if (k === "arrowleft" || k === "a") set("L", "R");
      else if (k === "arrowright" || k === "d") set("R", "L");
      if (
        ["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)
      )
        e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  // Game loop
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let last = performance.now();
    let acc = 0;

    const step = () => {
      const s = stateRef.current;
      if (!s.alive) return;
      s.dir = s.nextDir;
      const head = s.snake[0];
      const nv = DIRS[s.dir];
      const next: Vec = { x: head.x + nv.x, y: head.y + nv.y };
      if (
        next.x < 0 ||
        next.y < 0 ||
        next.x >= GRID ||
        next.y >= GRID ||
        s.snake.some((c) => c.x === next.x && c.y === next.y)
      ) {
        s.alive = false;
        onGameOver({ score: s.score });
        return;
      }
      s.snake.unshift(next);
      if (next.x === s.food.x && next.y === s.food.y) {
        s.score += 1;
        setScore(s.score);
        s.food = randCell(s.snake);
      } else {
        s.snake.pop();
      }
    };

    const draw = () => {
      const cvs = canvasRef.current;
      if (!cvs) return;
      const ctx = cvs.getContext("2d");
      if (!ctx) return;
      const size = cvs.width;
      const cell = size / GRID;

      // bg
      ctx.fillStyle = "#06090e";
      ctx.fillRect(0, 0, size, size);

      // grid glow
      ctx.strokeStyle = "rgba(57, 255, 138, 0.06)";
      ctx.lineWidth = 1;
      for (let i = 1; i < GRID; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cell, 0);
        ctx.lineTo(i * cell, size);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * cell);
        ctx.lineTo(size, i * cell);
        ctx.stroke();
      }

      const s = stateRef.current;

      // food (pulsing magenta)
      const t = performance.now() / 300;
      const pulse = 0.6 + 0.4 * Math.sin(t);
      ctx.shadowBlur = 18 * pulse;
      ctx.shadowColor = "#ff3df3";
      ctx.fillStyle = "#ff3df3";
      ctx.fillRect(
        s.food.x * cell + 3,
        s.food.y * cell + 3,
        cell - 6,
        cell - 6,
      );
      ctx.shadowBlur = 0;

      // snake (glowing green)
      s.snake.forEach((seg, i) => {
        const head = i === 0;
        ctx.shadowBlur = head ? 18 : 10;
        ctx.shadowColor = "#39ff8a";
        ctx.fillStyle = head ? "#aaffc6" : "#39ff8a";
        ctx.fillRect(seg.x * cell + 2, seg.y * cell + 2, cell - 4, cell - 4);
      });
      ctx.shadowBlur = 0;
    };

    const loop = (now: number) => {
      const speed = Math.max(TICK_MIN, TICK_BASE - stateRef.current.score * 4);
      acc += now - last;
      last = now;
      while (acc >= speed) {
        step();
        acc -= speed;
        if (!stateRef.current.alive) break;
      }
      draw();
      if (stateRef.current.alive) raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active, onGameOver]);

  // Touch swipe
  useEffect(() => {
    if (!active) return;
    let sx = 0,
      sy = 0;
    const cvs = canvasRef.current;
    if (!cvs) return;
    const onStart = (e: TouchEvent) => {
      sx = e.touches[0].clientX;
      sy = e.touches[0].clientY;
    };
    const onEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - sx;
      const dy = e.changedTouches[0].clientY - sy;
      const cur = stateRef.current.dir;
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 20 && cur !== "L") stateRef.current.nextDir = "R";
        else if (dx < -20 && cur !== "R") stateRef.current.nextDir = "L";
      } else {
        if (dy > 20 && cur !== "U") stateRef.current.nextDir = "D";
        else if (dy < -20 && cur !== "D") stateRef.current.nextDir = "U";
      }
    };
    cvs.addEventListener("touchstart", onStart, { passive: true });
    cvs.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      cvs.removeEventListener("touchstart", onStart);
      cvs.removeEventListener("touchend", onEnd);
    };
  }, [active]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex w-full items-center justify-between font-pixel text-xs text-[var(--neon-green)]">
        <span>SCORE</span>
        <span className="text-lg drop-shadow-[0_0_8px_var(--neon-green)]">
          {String(score).padStart(4, "0")}
        </span>
      </div>
      <canvas
        ref={canvasRef}
        width={528}
        height={528}
        className="aspect-square w-full max-w-[528px] rounded-md border border-[color-mix(in_oklab,var(--neon-green)_40%,transparent)] bg-black shadow-[0_0_40px_color-mix(in_oklab,var(--neon-green)_25%,transparent)]"
      />
      <p className="text-center text-xs text-muted-foreground">
        Arrow keys / WASD on desktop · Swipe on mobile
      </p>
    </div>
  );
}
