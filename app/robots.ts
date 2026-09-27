import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://story-flop.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    // Las salas declaran `noindex` en su propia metadata. Deben poder rastrearse
    // para que los buscadores puedan leer esa directiva.
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
