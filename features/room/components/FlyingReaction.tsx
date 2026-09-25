"use client";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { createPortal } from "react-dom";
import { reactionMotionKind } from "@/lib/reactions";

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

const EMOJI_OFFSET = 17;

interface ReactionProps {
  animation: ReactionAnimation;
  scale: number;
  onComplete: (eventId: string) => void;
}

function StickyReaction({ animation, scale, onComplete }: ReactionProps) {
  const fromX = animation.from.x - EMOJI_OFFSET;
  const fromY = animation.from.y - EMOJI_OFFSET;
  const toX = animation.to.x - EMOJI_OFFSET;
  const toY = animation.to.y - EMOJI_OFFSET;
  const arcY = Math.min(fromY, toY) - Math.max(70, Math.abs(toX - fromX) * .18);
  return <motion.span className="flying-reaction sticky-reaction" data-emoji={animation.emoji}
    initial={{ x: fromX, y: fromY, opacity: 1, scale, rotate: 0 }}
    animate={{
      x: [fromX, fromX + (toX - fromX) * .45, toX, toX + 3, toX],
      y: [fromY, arcY, toY, toY + 8, toY + 105],
      opacity: [1, 1, 1, 1, 0], scale: [scale, scale * 1.08, scale * 1.12, scale * 1.08, scale * .92],
      rotate: [0, -14, 8, -3, 5],
    }}
    transition={{ duration: 2.25, times: [0, .3, .55, .65, 1], ease: ["easeOut", "easeIn", "easeOut", "linear"] }}
    onAnimationComplete={() => onComplete(animation.eventId)}>{animation.emoji}</motion.span>;
}

function AirplaneReaction({ animation, scale, onComplete }: ReactionProps) {
  const fromX = animation.from.x - EMOJI_OFFSET;
  const fromY = animation.from.y - EMOJI_OFFSET;
  const toX = animation.to.x - EMOJI_OFFSET;
  const toY = animation.to.y - EMOJI_OFFSET;
  const dx = toX - fromX;
  const dy = toY - fromY;
  const distance = Math.max(Math.hypot(dx, dy), 1);
  const normalX = -dy / distance;
  const normalY = dx / distance;
  const curve = Math.min(Math.max(distance * .2, 45), 105);
  const heading = Math.atan2(dy, dx) * 180 / Math.PI + 45;
  return <motion.span className="flying-reaction airplane-reaction" data-emoji={animation.emoji}
    initial={{ x: fromX, y: fromY, opacity: 0, scale: scale * .65, rotate: heading - 18 }}
    animate={{
      x: [fromX, fromX + dx * .23 + normalX * curve, fromX + dx * .62 + normalX * curve * .7, toX],
      y: [fromY, fromY + dy * .23 + normalY * curve, fromY + dy * .62 + normalY * curve * .7, toY],
      opacity: [0, 1, 1, 0], scale: [scale * .65, scale, scale * 1.08, scale * .82],
      rotate: [heading - 18, heading, heading + 10, heading + 24],
    }}
    transition={{ duration: 1.18, times: [0, .22, .68, 1], ease: ["easeOut", "linear", "easeIn"] }}
    onAnimationComplete={() => onComplete(animation.eventId)}>{animation.emoji}</motion.span>;
}

function BouncingReaction({ animation, scale, onComplete }: ReactionProps) {
  const fromX = animation.from.x - EMOJI_OFFSET;
  const fromY = animation.from.y - EMOJI_OFFSET;
  const toX = animation.to.x - EMOJI_OFFSET;
  const toY = animation.to.y - EMOJI_OFFSET;
  const arcY = Math.min(fromY, toY) - Math.max(80, Math.abs(toX - fromX) * .2);
  return <motion.span className="flying-reaction bouncing-reaction" data-emoji={animation.emoji}
    initial={{ x: fromX, y: fromY, opacity: 1, scale, rotate: 0 }}
    animate={{
      x: [fromX, fromX + (toX - fromX) * .48, toX, toX + 8, toX + 15, toX + 20, toX + 24],
      y: [fromY, arcY, toY, toY - 48, toY, toY - 19, toY],
      opacity: [1, 1, 1, 1, 1, 1, 0], scale: [scale, scale * 1.04, scale, scale * .96, scale * .92, scale * .88, scale * .82],
      rotate: [0, 150, 300, 385, 455, 505, 540],
    }}
    transition={{ duration: 1.48, times: [0, .35, .58, .7, .81, .9, 1], ease: ["easeOut", "easeIn", "easeOut", "easeIn", "easeOut", "easeIn"] }}
    onAnimationComplete={() => onComplete(animation.eventId)}>{animation.emoji}</motion.span>;
}

function ReactionEffect({ animation, scale, onComplete, reduced }: ReactionProps & { reduced: boolean | null }) {
  if (reduced) return <motion.span className="flying-reaction" data-emoji={animation.emoji}
    initial={{ x: animation.to.x - EMOJI_OFFSET, y: animation.to.y - EMOJI_OFFSET, opacity: 1, scale }}
    animate={{ opacity: [1, 1, 0], scale: [scale, scale * 1.12, scale] }} transition={{ duration: .45 }}
    onAnimationComplete={() => onComplete(animation.eventId)}>{animation.emoji}</motion.span>;
  const kind = reactionMotionKind(animation.emoji);
  if (kind === "sticky") return <StickyReaction animation={animation} scale={scale} onComplete={onComplete} />;
  if (kind === "airplane") return <AirplaneReaction animation={animation} scale={scale} onComplete={onComplete} />;
  return <BouncingReaction animation={animation} scale={scale} onComplete={onComplete} />;
}

export function FlyingReactions({ animations, onComplete }: { animations: ReactionAnimation[]; onComplete: (eventId: string) => void }) {
  const reduced = useReducedMotion();
  if (typeof document === "undefined") return null;
  return createPortal(<div className="reaction-flight-layer" aria-hidden="true"><AnimatePresence>{animations.map(animation => {
    const scale = Math.min(Math.max(animation.scale, 1), 3);
    return <div className="reaction-effect" key={animation.eventId} data-event-id={animation.eventId} data-sender-id={animation.senderMemberId} data-target-id={animation.targetMemberId} data-emoji={animation.emoji} data-scale={scale.toFixed(2)}>
      <ReactionEffect animation={animation} scale={scale} reduced={reduced} onComplete={onComplete} />
    </div>;
  })}</AnimatePresence></div>, document.body);
}
