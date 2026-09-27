import type { Metadata } from "next";
import { AdSenseScript } from "@/components/AdSenseScript";
import { WebApplicationStructuredData } from "@/components/WebApplicationStructuredData";
import { LandingPage } from "@/features/rooms/components/LandingPage";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function Home() {
  return <><WebApplicationStructuredData /><AdSenseScript /><LandingPage /></>;
}
