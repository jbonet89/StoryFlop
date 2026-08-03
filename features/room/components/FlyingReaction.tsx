"use client";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { createPortal } from "react-dom";

export interface ReactionAnimation {
  eventId: string;
  emoji: string;
  senderMemberId: string;
  targetMemberId: string;
  senderName: string;
  targetName: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
}

export function FlyingReactions({ animations, onComplete }: { animations: ReactionAnimation[]; onComplete: (eventId: string) => void }) {
  const reduced = useReducedMotion();
  if (typeof document === "undefined") return null;
  return createPortal(<div className="reaction-flight-layer" aria-hidden="true"><AnimatePresence>{animations.map(animation => {
    const middle = { x: (animation.from.x + animation.to.x) / 2, y: Math.min(animation.from.y, animation.to.y) - 90 };
    return <motion.div
      key={animation.eventId}
      className="flying-reaction"
      data-event-id={animation.eventId}
      data-sender-id={animation.senderMemberId}
      data-target-id={animation.targetMemberId}
      data-emoji={animation.emoji}
      initial={reduced ? { x: animation.to.x, y: animation.to.y, opacity: 0, scale: .8 } : { x: animation.from.x, y: animation.from.y, opacity: 0, scale: .8, rotate: 0 }}
      animate={reduced ? { x: animation.to.x, y: animation.to.y, opacity: [0, 1, 0], scale: [1, 1.35, 1] } : { x: [animation.from.x, middle.x, animation.to.x], y: [animation.from.y, middle.y, animation.to.y], opacity: [0, 1, 1, 0], scale: [.8, 1.5, 1], rotate: [0, 15, -5] }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduced ? .45 : .95, ease: "easeInOut" }}
      onAnimationComplete={() => onComplete(animation.eventId)}
    >{animation.emoji}</motion.div>;
  })}</AnimatePresence></div>, document.body);
}
