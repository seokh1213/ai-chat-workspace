import { formatDateRange } from "../../lib/tripDisplay";
import { MapCanvas } from "../map/MapCanvas";
import type { EditorScreenProps } from "./EditorScreen.types";
import { MobileMapDayStrip } from "./MobileMapDayStrip";
import { MobileTripTopBar } from "./MobileTripTopBar";
import { MobileViewSwitcher } from "./MobileViewSwitcher";
import type { EditorScreenState } from "./useEditorScreenState";

interface MobileMapViewProps {
  props: EditorScreenProps;
  state: EditorScreenState;
}

export function MobileMapView({ props, state }: MobileMapViewProps) {
  const subtitle = [props.tripState.trip.destinationName, formatDateRange(props.tripState.trip)].filter(Boolean).join(" · ") || "지도";

  return (
    <section className="map-zone h-dvh overflow-hidden bg-[var(--map-bg)] text-[var(--text)]">
      <MobileTripTopBar
        title={props.tripState.trip.title || "여행 이름 미정"}
        subtitle={subtitle}
        backLabel="일정 화면으로 돌아가기"
        onBack={state.openMobileDetails}
        actions={(
          <MobileViewSwitcher
            activeView={state.mobileView}
            onOpenDetails={state.openMobileDetails}
            onOpenMap={state.openMobileMap}
            onOpenChatList={state.openMobileChatList}
          />
        )}
      />
      <MobileMapDayStrip
        days={props.tripState.days}
        selectedDayId={props.selectedDayId}
        itemCountByDay={state.itemCountByDay}
        onSelectDay={props.onSelectDay}
      />
      <MapCanvas
        tripState={props.tripState}
        dayItems={props.dayItems}
        selectedDay={props.selectedDay}
        focusedItemId={props.focusedItemId}
        focusedPlaceId={state.focusedMapPlaceId}
        centerFocusedPlace={state.shouldCenterFocusedPlace}
        onFocusPlace={state.highlightPlaceOnMap}
        onShowItemDetails={state.showItemDetails}
        onShowPlaceDetails={state.showPlaceDetails}
        layoutKey={`mobile-map-${state.focusedMapPlaceId ?? ""}-${props.focusedItemId ?? ""}`}
      />
    </section>
  );
}
