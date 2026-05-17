import { useEffect, useState } from "react";

export type EditorViewportMode = "mobile" | "desktop";

const mobileEditorQuery = "(max-width: 820px), (max-width: 960px) and (max-height: 560px) and (orientation: landscape)";

function readEditorViewportMode(): EditorViewportMode {
  if (typeof window === "undefined") return "desktop";
  return window.matchMedia(mobileEditorQuery).matches ? "mobile" : "desktop";
}

export function useEditorViewportMode(): EditorViewportMode {
  const [mode, setMode] = useState<EditorViewportMode>(() => readEditorViewportMode());

  useEffect(() => {
    const mediaQuery = window.matchMedia(mobileEditorQuery);
    const handleChange = () => setMode(mediaQuery.matches ? "mobile" : "desktop");

    handleChange();
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return mode;
}
