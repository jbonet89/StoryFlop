import { GuidePage, resourceMetadata } from "@/components/ResourcePages";
import { guideSlugs } from "@/lib/resources";

type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return guideSlugs.map(slug => ({ slug })); }
export async function generateMetadata({ params }: Props) { return resourceMetadata("index", (await params).slug); }
export default async function Page({ params }: Props) { return <GuidePage slug={(await params).slug} />; }
