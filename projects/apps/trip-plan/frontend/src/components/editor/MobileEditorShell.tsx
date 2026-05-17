import { EditorChatPanel } from "./EditorChatPanel";
import type { EditorScreenProps } from "./EditorScreen.types";
import { MobileItineraryView } from "./MobileItineraryView";
import { MobileMapView } from "./MobileMapView";
import { MobileViewSwitcher } from "./MobileViewSwitcher";
import type { EditorScreenState } from "./useEditorScreenState";

interface MobileEditorShellProps {
  props: EditorScreenProps;
  state: EditorScreenState;
}

export function MobileEditorShell({ props, state }: MobileEditorShellProps) {
  const mobileHeaderAction = (
    <MobileViewSwitcher
      activeView={state.mobileView}
      onOpenDetails={state.openMobileDetails}
      onOpenMap={state.openMobileMap}
      onOpenChatList={state.openMobileChatList}
    />
  );

  if (state.mobileView === "details") {
    return <MobileItineraryView props={props} state={state} />;
  }

  if (state.mobileView === "map") {
    return <MobileMapView props={props} state={state} />;
  }

  return (
    <main className="relative h-dvh overflow-hidden bg-[var(--surface)] text-[var(--text)]">
      <EditorChatPanel
        chat={props.chat}
        className="h-dvh w-full border-0"
        mobileHeaderInset
        mobileHeaderAction={mobileHeaderAction}
        hideCollapseButton
        showListBackButton
        onBack={props.onBack}
        onCreateChatSession={state.createChatSession}
        onOpenChatList={state.openChatList}
        onSelectChatSession={state.selectChatSession}
        onToggleChat={props.onToggleChat}
      />
    </main>
  );
}
