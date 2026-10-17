import { GuidePage, resourceMetadata } from "@/components/ResourcePages";

// These pages resolve language from request headers; do not serve an SSG fallback.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props) { return resourceMetadata("index", (await params).slug); }
export default async function Page({ params }: Props) { return <GuidePage slug={(await params).slug} />; }
