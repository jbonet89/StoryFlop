import { readFileSync } from "node:fs";
const base = (process.argv[2] ?? "https://storyflop.com").replace(/\/$/, "");
const locales = ["es", "en", "fr", "it", "de", "pt", "ca", "eu", "ru"];
const tasks = [];
for (const locale of locales) {
  const { guides, ui } = JSON.parse(readFileSync(`messages/resources/${locale}.json`, "utf8"));
  const pages = [["/recursos",ui.indexTitle],["/demo",ui.demoTitle],["/sobre-storyflop",ui.aboutTitle],["/recursos/plantilla-refinamiento",ui.templateTitle],...guides.map(guide => [`/recursos/${guide.slug}`, guide.title])];
  for (const [path,title] of pages) tasks.push({ locale, path: locale === "es" ? path : `/${locale}${path}`, title, guide: guides.some(guide => `/recursos/${guide.slug}` === path) });
}
const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://storyflop.com";
let cursor = 0; const failures = [];
async function worker() {
  while (cursor < tasks.length) {
    const task = tasks[cursor++];
    try {
      const response = await fetch(base + task.path, { signal: AbortSignal.timeout(20000) });
      const html = await response.text();
      const fail = message => { throw new Error(message); };
      if (response.status !== 200) fail(`HTTP ${response.status}`);
      if (!html.includes(`lang="${task.locale}"`)) fail("document language");
      if (!html.includes(`rel="canonical" href="${site}${task.path}"`)) fail("canonical");
      if (!html.includes('hrefLang="en"') && !html.includes('hreflang="en"')) fail("language alternates");
      const visible = html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "");
      const encodedTitle = task.title.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#x27;");
      if (!visible.includes(task.title) && !visible.includes(encodedTitle)) fail("server-rendered title");
      if (html.includes("adsbygoogle.js")) fail("ad runtime on resource");
      if (task.guide && !html.includes('"@type":"Article"')) fail("Article structured data");
    } catch (error) { failures.push({ path: task.path, issue: error.message }); }
  }
}
await Promise.all(Array.from({ length: 4 }, worker));
const sitemap = await (await fetch(base + "/sitemap.xml")).text();
for (const task of tasks) if (!sitemap.includes(`${site}${task.path}<`)) failures.push({ path: task.path, issue: "not in sitemap" });
const robots = await (await fetch(base + "/robots.txt")).text();
if (/Disallow:\s*\/\s*$/im.test(robots) || /Disallow:\s*\/recursos/i.test(robots)) failures.push({ path: "/robots.txt", issue: "resource crawl blocked" });
console.log(JSON.stringify({ checkedAt: new Date().toISOString(), base, pages: tasks.length, languages: locales.length, failures }, null, 2));
console.log("This checks public technical accessibility, not Google's indexing decisions or account approval.");
if (failures.length) process.exitCode = 1;
