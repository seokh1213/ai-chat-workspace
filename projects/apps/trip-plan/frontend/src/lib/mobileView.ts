export type MobileEditorView = "details" | "map" | "chat";

export function readMobileViewFromUrl(): MobileEditorView | null {
  const tab = new URLSearchParams(window.location.search).get("tab");
  return tab === "details" || tab === "map" || tab === "chat" ? tab : null;
}

export function writeMobileViewToUrl(view: MobileEditorView) {
  const search = new URLSearchParams(window.location.search);
  search.set("tab", view);
  const query = search.toString();
  const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
  if (nextUrl === `${window.location.pathname}${window.location.search}${window.location.hash}`) return;
  window.history.pushState(window.history.state, "", nextUrl);
}

export function replaceMobileViewInUrl(view: MobileEditorView) {
  const search = new URLSearchParams(window.location.search);
  search.set("tab", view);
  const query = search.toString();
  const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
  if (nextUrl === `${window.location.pathname}${window.location.search}${window.location.hash}`) return;
  window.history.replaceState(window.history.state, "", nextUrl);
}
