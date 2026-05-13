export type ScoreEntry = {
  address: string;
  score: number;
  txHash: string;
  at: number;
};

const KEY = "snake-arc:leaderboard";
const CHECKIN_KEY = "snake-arc:checkin";
const BONUS_KEY = "snake-arc:bonus";

export function loadScores(): ScoreEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveScore(entry: ScoreEntry) {
  const all = loadScores();
  all.push(entry);
  all.sort((a, b) => b.score - a.score);
  localStorage.setItem(KEY, JSON.stringify(all.slice(0, 50)));
}

export function lastCheckIn(address: string): number {
  if (typeof window === "undefined") return 0;
  try {
    const map = JSON.parse(localStorage.getItem(CHECKIN_KEY) || "{}");
    return Number(map[address.toLowerCase()] || 0);
  } catch {
    return 0;
  }
}

export function recordCheckIn(address: string) {
  const map = JSON.parse(localStorage.getItem(CHECKIN_KEY) || "{}");
  map[address.toLowerCase()] = Date.now();
  localStorage.setItem(CHECKIN_KEY, JSON.stringify(map));
}

export function getBonus(address: string): number {
  if (typeof window === "undefined") return 0;
  try {
    const map = JSON.parse(localStorage.getItem(BONUS_KEY) || "{}");
    return Number(map[address.toLowerCase()] || 0);
  } catch {
    return 0;
  }
}

export function addBonus(address: string, points: number) {
  const map = JSON.parse(localStorage.getItem(BONUS_KEY) || "{}");
  const k = address.toLowerCase();
  map[k] = Number(map[k] || 0) + points;
  localStorage.setItem(BONUS_KEY, JSON.stringify(map));
}

export const COOLDOWN_MS = 24 * 60 * 60 * 1000;
