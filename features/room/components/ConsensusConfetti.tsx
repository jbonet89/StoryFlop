"use client";
import { useEffect, useRef, type CSSProperties, type RefObject } from "react";

export function ConsensusConfetti({ roundId, status, unanimous, originRef }: { roundId?: string; status?: string; unanimous: boolean; originRef: RefObject<HTMLDivElement | null> }) {
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
    const table = originRef.current?.querySelector(".felt")?.getBoundingClientRect();
    if (!table) return;
    element.style.setProperty("--origin-x", `${table.left + table.width / 2}px`);
    element.style.setProperty("--origin-y", `${table.top + table.height / 2}px`);
    // Sample constant horizontal velocity and gravity. Unlike straight CSS
    // segments, this trajectory slows smoothly through its apex without a kink.
    const animations = Array.from(element.children).map((piece, index) => {
      const duration = 1400 + (index * 37) % 240;
      const seconds = duration / 1000;
      const reach = (90 + (index * 67) % Math.min(480, window.innerWidth * .42)) * (index % 2 ? -1 : 1);
      const peak = Math.min(120 + (index * 43) % 180, Math.max(40, table.top + table.height / 2 - 30));
      const gravity = 1100;
      const velocity = Math.sqrt(2 * gravity * peak);
      const frames = Array.from({ length: 81 }, (_, frame) => {
        const progress = frame / 80;
        const time = progress * seconds;
        return { transform: `translate(${reach * progress}px,${-velocity * time + .5 * gravity * time * time}px) rotate(${(index % 2 ? -1 : 1) * 620 * progress}deg)`, opacity: Math.min(1, progress * 15, (1 - progress) * 5), offset: progress };
      });
      return piece.animate(frames, { duration, delay: index % 5 * 20, easing: "linear", fill: "both" });
    });
    element.classList.add("is-firing");
    const timer = window.setTimeout(() => element.classList.remove("is-firing"), 1800);
    return () => { window.clearTimeout(timer); animations.forEach(animation => animation.cancel()); element.classList.remove("is-firing"); };
  }, [roundId, status, unanimous, originRef]);

  return <div ref={stage} className="consensus-confetti" aria-hidden="true">
    {Array.from({ length: 40 }, (_, index) => {
      return <i key={index} style={{ "--color": ["#c084fc", "#ffd444", "#4ade80", "#38bdf8", "#fb7185"][index % 5] } as CSSProperties} />;
    })}
  </div>;
}
