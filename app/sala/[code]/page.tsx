import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PokerRoomGate } from "@/features/rooms/components/PokerRoomGate";
export async function generateMetadata(): Promise<Metadata> { const t = await getTranslations("Metadata"); return { title: t("roomTitle") }; }
export default async function RoomPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <PokerRoomGate code={code.toUpperCase()} />;
}
