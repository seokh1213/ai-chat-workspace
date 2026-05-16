export type Screen = "select" | "create" | "edit";

export function parseRoute(pathname = window.location.pathname): { screen: Screen; tripId?: string; chatSessionId?: string } {
  if (pathname === "/trips/new") {
    return { screen: "create" };
  }

  const chatMatch = pathname.match(/^\/trips\/([^/]+)\/chat\/([^/]+)$/);
  if (chatMatch?.[1] && chatMatch[2]) {
    return {
      screen: "edit",
      tripId: decodeURIComponent(chatMatch[1]),
      chatSessionId: decodeURIComponent(chatMatch[2])
    };
  }

  const match = pathname.match(/^\/trips\/([^/]+)$/);
  if (match?.[1]) {
    return { screen: "edit", tripId: decodeURIComponent(match[1]) };
  }

  return { screen: "select" };
}

export function pushAppPath(pathname: string) {
  if (window.location.pathname !== pathname) {
    const mapHash = pathname.startsWith("/trips/") && window.location.hash.startsWith("#map=") ? window.location.hash : "";
    window.history.pushState({}, "", `${pathname}${mapHash}`);
  }
}
