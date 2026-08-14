"use client";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { createPortal } from "react-dom";

export interface ReactionAnimation {
  eventId: string;
  emoji: string;
  scale: number;
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
    const scale = Math.min(Math.max(animation.scale, 1), 3);
    if (reduced) return <motion.span key={animation.eventId} className="flying-reaction" initial={{ x: animation.to.x - 17, y: animation.to.y - 17, opacity: 1, scale }} animate={{ opacity: [1, 1, 0], scale: [scale, scale * 1.12, scale] }} transition={{ duration: .45 }} onAnimationComplete={() => onComplete(animation.eventId)}>{animation.emoji}</motion.span>;
    return <div className="reaction-effect" key={animation.eventId} data-event-id={animation.eventId} data-sender-id={animation.senderMemberId} data-target-id={animation.targetMemberId} data-emoji={animation.emoji} data-scale={scale.toFixed(2)}>
      <motion.span className="flying-reaction" initial={{ x: animation.from.x - 17, y: animation.from.y - 17, opacity: 1, scale, rotate: 0 }} animate={{ x: [animation.from.x - 17, animation.from.x - 17, animation.to.x - 17], y: [animation.from.y - 17, animation.from.y - 17, animation.to.y - 17], opacity: [1, 1, 1, 0], scale: [scale, scale, scale, scale * .9], rotate: [0, 0, -8, -8] }} transition={{ duration: .78, times: [0, .26, .94, 1], ease: "linear" }} onAnimationComplete={() => onComplete(animation.eventId)}>{animation.emoji}</motion.span>
    </div>;
  })}</AnimatePresence></div>, document.body);
}
