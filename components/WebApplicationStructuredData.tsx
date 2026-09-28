import { getLocale, getTranslations } from "next-intl/server";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://storyflop.com";

export async function WebApplicationStructuredData() {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("Metadata")]);
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "StoryFlop",
    url: `${siteUrl}/${locale}`,
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "Planning Poker",
    operatingSystem: "Any",
    browserRequirements: "Requires a modern web browser with JavaScript enabled",
    description: t("description"),
    inLanguage: locale,
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
    featureList: [
      "Private Planning Poker votes",
      "Real-time team estimation",
      "Round history",
      "Voter and observer roles",
      "Unlimited voting rounds and room participants",
      "Multiple collaborators can manage stories and voting rounds",
      "No registration required",
    ],
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />;
}
