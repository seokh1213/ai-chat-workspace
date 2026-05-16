import { useEffect, useState } from "react";

import {
  type MobileEditorView,
  readMobileViewFromUrl,
  replaceMobileViewInUrl,
  writeMobileViewToUrl
} from "./mobileView";

type MobileViewHistoryMode = "push" | "replace";

export function useMobileEditorView(activeChatId: string | null) {
  const [mobileView, setMobileViewState] = useState<MobileEditorView>(() => readMobileViewFromUrl() ?? (activeChatId ? "chat" : "map"));

  useEffect(() => {
    if (activeChatId && !readMobileViewFromUrl()) {
      setMobileView("chat", "replace");
    }
  }, [activeChatId]);

  useEffect(() => {
    const handlePopState = () => {
      setMobileViewState(readMobileViewFromUrl() ?? "map");
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  function setMobileView(nextView: MobileEditorView, historyMode: MobileViewHistoryMode = "replace") {
    setMobileViewState(nextView);
    if (historyMode === "push") {
      writeMobileViewToUrl(nextView);
    } else {
      replaceMobileViewInUrl(nextView);
    }
  }

  return { mobileView, setMobileView };
}
