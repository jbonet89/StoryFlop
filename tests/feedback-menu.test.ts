import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { FeedbackMenuLink } from "@/components/FeedbackMenuLink";

describe("acceso desde la sala", () => {
  it.each([['es', '/sobre-storyflop'], ['en', '/en/sobre-storyflop'], ['ca', '/ca/sobre-storyflop']])("abre el formulario localizado en otra pestaña para %s", (locale, path) => {
    const html = renderToStaticMarkup(createElement(FeedbackMenuLink, { locale, label: "Proponer una mejora", newTabLabel: "nueva pestaña" }));
    expect(html).toContain(`href="${path}#proponer-mejora"`);
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('aria-label="Proponer una mejora (nueva pestaña)"');
  });
});
