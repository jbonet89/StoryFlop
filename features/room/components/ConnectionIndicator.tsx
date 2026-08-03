import { Wifi, WifiOff } from "lucide-react";
import { useTranslations } from "next-intl";
import type { RealtimeStatus } from "@/features/rooms/hooks";

export function ConnectionIndicator({ status }: { status: RealtimeStatus }) {
  const t = useTranslations("Connection");
  const online = status === "en_directo";
  const labels: Record<RealtimeStatus, string> = { conectando: t("connecting"), en_directo: t("live"), reconectando: t("reconnecting"), sin_conexion: t("offline"), error: t("error") };
  return <span className={`connection ${status}`} aria-live="polite">{online ? <Wifi size={13} /> : <WifiOff size={13} />}{labels[status]}</span>;
}
