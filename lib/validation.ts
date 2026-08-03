import { z } from "zod";
import { AVATARS, DECK, REACTIONS } from "./constants";

export const displayNameSchema = z.string().trim().min(2, "DISPLAY_NAME_TOO_SHORT").max(32, "DISPLAY_NAME_TOO_LONG");
export const roomNameSchema = z.string().trim().min(2, "ROOM_NAME_TOO_SHORT").max(60, "ROOM_NAME_TOO_LONG");
export const avatarSchema = z.enum(AVATARS);
export const roomCodeSchema = z.string().trim().transform(value => value.toUpperCase()).pipe(z.string().regex(/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{8}$/, "INVALID_ROOM_CODE"));
export const taskSchema = z.object({ title: z.string().trim().min(1, "TASK_TITLE_REQUIRED").max(120), description: z.string().trim().max(1000).optional().default("") });
export const voteSchema = z.enum(DECK);
export const reactionSchema = z.string().refine(value => REACTIONS.some(option => option.emoji === value), "INVALID_REACTION");
