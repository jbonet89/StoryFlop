// Safari can restore a page from bfcache or suspend it without a new React mount.
// Coalesce the overlapping browser events into one recovery attempt.
export function watchRoomRecovery(recover: () => void, browser = window, page = document) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const resume = () => {
    if (page.visibilityState === "hidden" || !browser.navigator.onLine) return;
    clearTimeout(timer);
    timer = setTimeout(recover, 100);
  };
  page.addEventListener("visibilitychange", resume);
  for (const event of ["focus", "pageshow", "online"]) browser.addEventListener(event, resume);
  return () => {
    clearTimeout(timer);
    page.removeEventListener("visibilitychange", resume);
    for (const event of ["focus", "pageshow", "online"]) browser.removeEventListener(event, resume);
  };
}
