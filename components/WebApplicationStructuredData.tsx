const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://storyflop.com";

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "StoryFlop",
  url: siteUrl,
  applicationCategory: "BusinessApplication",
  applicationSubCategory: "Planning Poker",
  operatingSystem: "Any",
  browserRequirements: "Requires a modern web browser with JavaScript enabled",
  description: "Scrum Poker online gratuito para estimar story points en equipo y en tiempo real.",
  inLanguage: ["es", "en", "ca", "pt", "de", "eu"],
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "EUR",
  },
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

export function WebApplicationStructuredData() {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />;
}
