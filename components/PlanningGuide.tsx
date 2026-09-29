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
    <section className="history-section" aria-labelledby="history-title">
      <header><span className="guide-label">{t("historyEyebrow")}</span><h2 id="history-title">{t("historyOriginTitle")}</h2><p>{t("historyIntro")}</p></header>
      <div className="history-timeline">
        <article><time dateTime="2002">2002</time><h3><a href="https://agilealliance.org/author/5062067/" target="_blank" rel="noreferrer">James Grenning</a></h3><p>{t("history2002Body")}</p></article>
        <article><time dateTime="2005">2005</time><h3><a href="https://en.wikipedia.org/wiki/Mike_Cohn" target="_blank" rel="noreferrer">Mike Cohn</a></h3><p>{t("history2005Body")}</p></article>
        <article><time dateTime="2020">{t("historyTodayLabel")}</time><h3>{t("historyTodayTitle")}</h3><p>{t("historyTodayBody")}</p></article>
      </div>
      <nav className="history-sources" aria-label={t("historySourcesLabel")}>
        <a href="https://wingman-sw.com/articles/planning-poker" target="_blank" rel="noreferrer">{t("historyOriginalSource")}</a>
        <a href="https://es.wikipedia.org/wiki/Planning_poker" target="_blank" rel="noreferrer">Wikipedia: Planning Poker</a>
        <a href="https://www.pearson.com/en-ca/subject-catalog/p/agile-estimating-and-planning/P200000009438" target="_blank" rel="noreferrer">Agile Estimating and Planning</a>
      </nav>
    </section>
  </article>;
}
