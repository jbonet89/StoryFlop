import { useTranslations } from "next-intl";

/** Visible editorial content, rendered in the initial HTML as well as the client. */
export function PlanningGuide() {
  const t = useTranslations("LandingSeo");
  return <article className="seo-section planning-guide" id="guia" aria-labelledby="guide-title">
    <header className="seo-heading"><span>{t("guideEyebrow")}</span><h2 id="guide-title">{t("guideTitle")}</h2><p>{t("guideIntro")}</p></header>
    <div className="guide-layout">
      <div className="guide-chapters">
        <section><h3>{t("guidePointsTitle")}</h3><p>{t("guidePointsBody")}</p></section>
        <section><h3>{t("guidePrepareTitle")}</h3><p>{t("guidePrepareBody")}</p></section>
        <section><h3>{t("guideDiscussTitle")}</h3><p>{t("guideDiscussBody")}</p></section>
      </div>
      <aside className="guide-example" aria-labelledby="example-title">
        <span className="guide-label">{t("guideExampleLabel")}</span>
        <h3 id="example-title">{t("guideExampleTitle")}</h3>
        <p>{t("guideExampleBefore")}</p>
        <div className="guide-votes" aria-label={t("guideVotesLabel")}><span>3</span><span>5</span><span>13</span></div>
        <p>{t("guideExampleAfter")}</p>
        <h4>{t("guideTakeawayTitle")}</h4><p>{t("guideTakeawayBody")}</p>
      </aside>
    </div>
    <section className="guide-checklist"><h3>{t("guideChecklistTitle")}</h3><ul>{["guideCheck1", "guideCheck2", "guideCheck3"].map(key => <li key={key}>{t(key)}</li>)}</ul></section>
  </article>;
}
