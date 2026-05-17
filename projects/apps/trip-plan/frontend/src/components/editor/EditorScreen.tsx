import { DesktopEditorShell } from "./DesktopEditorShell";
import type { EditorScreenProps } from "./EditorScreen.types";
import { MobileEditorShell } from "./MobileEditorShell";
import { useEditorScreenState } from "./useEditorScreenState";
import { useEditorViewportMode } from "./useEditorViewportMode";

export function EditorScreen(props: EditorScreenProps) {
  const state = useEditorScreenState(props);
  const viewportMode = useEditorViewportMode();

  if (viewportMode === "mobile") {
    return <MobileEditorShell props={props} state={state} />;
  }

  return <DesktopEditorShell props={props} state={state} />;
}
