import { useEffect, useState } from "react";

const KEY = "iar-progress-v2";
export type Progress = { quiz: Record<string, boolean>; done: Record<string, boolean> };
const empty: Progress = { quiz: {}, done: {} };
const listeners = new Set<(p: Progress) => void>();

function read(): Progress {
  try { const s = localStorage.getItem(KEY); return s ? { ...empty, ...JSON.parse(s) } : empty; } catch { return empty; }
}
function write(p: Progress) {
  localStorage.setItem(KEY, JSON.stringify(p));
  listeners.forEach((l) => l(p));
}

/** Progression enregistrée uniquement sur l'appareil (aucun compte requis). */
export function useProgress() {
  const [p, setP] = useState<Progress>(empty);
  useEffect(() => { setP(read()); listeners.add(setP); return () => { listeners.delete(setP); }; }, []);
  return {
    progress: p,
    answer: (id: string, ok: boolean) => write({ ...read(), quiz: { ...read().quiz, [id]: ok } }),
    markDone: (id: string, v = true) => write({ ...read(), done: { ...read().done, [id]: v } }),
    reset: () => write(empty),
  };
}
