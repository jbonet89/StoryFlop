"use client";
import { useEffect, useRef, type CSSProperties } from "react";

export function ConsensusConfetti({ roundId, status, unanimous }: { roundId?: string; status?: string; unanimous: boolean }) {
  const stage = useRef<HTMLDivElement>(null);
  const armedRound = useRef<string | undefined>(undefined);
  const firedRound = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (status === "voting") {
      armedRound.current = roundId;
      firedRound.current = undefined;
    }
    if (!roundId || status !== "revealed" || !unanimous || armedRound.current !== roundId || firedRound.current === roundId) return;
    firedRound.current = roundId;
    const element = stage.current;
    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    element.classList.add("is-firing");
    const timer = window.setTimeout(() => element.classList.remove("is-firing"), 1800);
    return () => { window.clearTimeout(timer); element.classList.remove("is-firing"); };
  }, [roundId, status, unanimous]);

  return <div ref={stage} className="consensus-confetti" aria-hidden="true">
    {Array.from({ length: 40 }, (_, index) => {
      const reach = (110 + (index * 67) % 500) * (index % 2 ? -1 : 1);
      const peak = 160 + (index * 43) % 310;
      return <i key={index} style={{ "--reach": `${reach}px`, "--peak": `${peak}px`, "--color": ["#c084fc", "#ffd444", "#4ade80", "#38bdf8", "#fb7185"][index % 5], "--delay": `${index % 5 * 20}ms` } as CSSProperties} />;
    })}
  </div>;
}
