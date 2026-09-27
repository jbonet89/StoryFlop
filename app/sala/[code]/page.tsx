import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { RoomAdSense } from "@/features/room/components/RoomAdSense";
import { PokerRoomGate } from "@/features/rooms/components/PokerRoomGate";
export async function generateMetadata(): Promise<Metadata> { const t = await getTranslations("Metadata"); return { title: t("roomTitle") }; }
export default async function RoomPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <><RoomAdSense /><PokerRoomGate code={code.toUpperCase()} /></>;
}
