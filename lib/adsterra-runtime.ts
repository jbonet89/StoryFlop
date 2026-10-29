"use client";
import { adsterraDelivery, adsterraFormats, type AdsterraFormat } from "@/lib/adsterra";
let started = false;
let reloadRequested = false;
export function hasAdsterraRuntime() { return started; }
export function discardAdsterraRuntime() { if (started && !reloadRequested) { reloadRequested = true; window.location.reload(); } }
export function loadAdsterraTag(container: HTMLElement, format: AdsterraFormat, failed: () => void) {
  const delivery = adsterraDelivery(window.location.hostname, navigator.userAgent);
  if (!delivery) return;
  const unit = adsterraFormats[format];
  // Mount the supplied tag in the actual publisher document, never inside our own iframe.
  const script = document.createElement("script");
  if (format === "native") {
    script.async = true; script.setAttribute("data-cfasync", "false");
    const target = document.createElement("div"); target.id = `container-${unit.key}`;
    container.append(target);
  } else {
    Object.assign(window, { atOptions: { key: unit.key, format: "iframe", height: unit.height, width: unit.width, params: {} } });
    script.async = false;
  }
  script.src = delivery === "fixture" ? `/__adsterra-test/${format}.js` : `https://bauval.org/${format === "native" ? "21" : "22"}/${unit.key}`;
  script.onerror = failed;
  started = true;
  container.append(script);
}
