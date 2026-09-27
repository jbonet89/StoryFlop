"use client";

import { useEffect } from "react";

const ADSENSE_CLIENT = "ca-pub-2657741160026304";
const ADSENSE_ROOM_SESSION_KEY = "storyflop:adsense-room-loaded";

export function RoomAdSense() {
  useEffect(() => {
    if (sessionStorage.getItem(ADSENSE_ROOM_SESSION_KEY)) return;
    sessionStorage.setItem(ADSENSE_ROOM_SESSION_KEY, "1");
    const script = document.createElement("script");
    script.id = "storyflop-adsense-room-entry";
    script.async = true;
    script.crossOrigin = "anonymous";
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
    document.head.appendChild(script);
  }, []);

  return null;
}
