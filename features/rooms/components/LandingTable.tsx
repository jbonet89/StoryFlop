"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FlyingReactions, type ReactionAnimation } from "@/features/room/components/FlyingReaction";

export function LandingTable({ readyLabel }: { readyLabel: string }) {
  const tableRef = useRef<HTMLDivElement>(null);
  const [animations, setAnimations] = useState<ReactionAnimation[]>([]);
  const removeAnimation = useCallback((eventId: string) => {
    setAnimations(current => current.filter(animation => animation.eventId !== eventId));
  }, []);

  useEffect(() => {
    function launch(emoji: string, sender: string, target: string) {
      if (document.hidden) return;
      const table = tableRef.current;
      const from = table?.querySelector(`[data-character="${sender}"]`)?.getBoundingClientRect();
      const to = table?.querySelector(`[data-character="${target}"]`)?.getBoundingClientRect();
      if (!from || !to || !from.width || !to.width) return;
      if (from.bottom < 0 || from.top > window.innerHeight || to.bottom < 0 || to.top > window.innerHeight) return;
      setAnimations(current => [...current, {
        eventId: `landing-${sender}-${Date.now()}`,
        emoji, scale: 1,
        senderMemberId: sender, targetMemberId: target,
        senderName: sender, targetName: target,
        from: { x: from.left + from.width / 2, y: from.top + from.height / 2 },
        to: { x: to.left + to.width / 2, y: to.top + to.height / 2 },
      }]);
    }

    let bananaInterval: number | undefined;
    let airplaneInterval: number | undefined;
    const firstBanana = window.setTimeout(() => {
      launch("🍌", "lion", "frog");
      bananaInterval = window.setInterval(() => launch("🍌", "lion", "frog"), 15_000);
    }, 1_200);
    const firstAirplane = window.setTimeout(() => {
      launch("✈️", "panda", "fox");
      airplaneInterval = window.setInterval(() => launch("✈️", "panda", "fox"), 15_000);
    }, 4_200);
    const clearAnimations = () => setAnimations([]);
    window.addEventListener("scroll", clearAnimations, true);
    window.addEventListener("resize", clearAnimations);
    document.addEventListener("visibilitychange", clearAnimations);
    return () => {
      window.clearTimeout(firstBanana);
      window.clearTimeout(firstAirplane);
      window.clearInterval(bananaInterval);
      window.clearInterval(airplaneInterval);
      window.removeEventListener("scroll", clearAnimations, true);
      window.removeEventListener("resize", clearAnimations);
      document.removeEventListener("visibilitychange", clearAnimations);
    };
  }, []);

  return <>
    <div ref={tableRef} className="mini-table" aria-hidden="true">
      <span className="mini-seat s1" data-character="panda">🐼</span><span className="mini-seat s2">🐙</span><span className="mini-seat s3" data-character="lion">🦁</span>
      <div className="mini-felt"><span>SPRINT 24</span><strong>{readyLabel}</strong><div><i>3</i><i>5</i><i>8</i></div></div>
      <span className="mini-seat s4" data-character="frog">🐸</span><span className="mini-seat s5" data-character="fox">🦊</span>
    </div>
    {animations.length > 0 && <FlyingReactions animations={animations} onComplete={removeAnimation} />}
  </>;
}
