import {
  type CSSProperties,
  type Dispatch,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type SetStateAction,
  useEffect,
  useRef,
  useState
} from "react";

import { clearDocumentResizeState, cssEscapeValue, scrollDetailNodeIntoView, setDocumentResizeState } from "../../lib/dom";
import { clampNumber } from "../../lib/format";
import { emptyItemForm, emptyPlaceForm } from "../../lib/formDefaults";
import type { MobileEditorView } from "../../lib/mobileView";
import { useMobileEditorView } from "../../lib/useMobileEditorView";
import { dedupePlaces, hasCoordinates } from "../../lib/tripDisplay";
import type {
  ItineraryItem,
  Place,
  TripState,
  UpsertItineraryItemRequest,
  UpsertPlaceRequest
} from "../../types";
import type { EditorLayout } from "../../lib/editorLayout";

interface UseEditorScreenStateProps {
  className: string;
  tripState: TripState;
  dayItems: ItineraryItem[];
  selectedDayId: string;
  focusedItemId: string | null;
  layout: EditorLayout;
  activeChatId: string | null;
  chatCollapsed: boolean;
  plannerCollapsed: boolean;
  scheduleCollapsed: boolean;
  placesCollapsed: boolean;
  editingItemId: string | null;
  editingPlaceId: string | null;
  itemForm: UpsertItineraryItemRequest;
  placeForm: UpsertPlaceRequest;
  onOpenChatList: () => void;
  onCreateChatSession: () => void;
  onSelectChatSession: (sessionId: string) => void;
  onToggleChat: () => void;
  onTogglePlanner: () => void;
  onToggleSchedule: () => void;
  onTogglePlaces: () => void;
  onCancelEditItem: () => void;
  onCancelEditPlace: () => void;
  onItemFormChange: (form: UpsertItineraryItemRequest) => void;
  onPlaceFormChange: (form: UpsertPlaceRequest) => void;
  onSubmitItem: (event: FormEvent) => void;
  onSubmitPlace: (event: FormEvent) => void;
  onFocusItem: (itemId: string | null) => void;
  onLayoutChange: (layout: EditorLayout) => void;
}

export interface EditorScreenState {
  editorClassName: string;
  layoutStyle: CSSProperties;
  routeNumbers: Map<string, number>;
  visiblePlaces: Place[];
  itemCountByDay: Map<string, number>;
  expandedItems: Set<string>;
  expandedPlaces: Set<string>;
  isAddingItem: boolean;
  isAddingPlace: boolean;
  focusedMapPlaceId: string | null;
  shouldCenterFocusedPlace: boolean;
  detailHighlight: { type: "item" | "place"; id: string } | null;
  mobileView: MobileEditorView;
  openMobileChatList: () => void;
  closeMobileChat: () => void;
  openMobileDetails: () => void;
  openMobileMap: () => void;
  startAddItem: () => void;
  startAddPlace: () => void;
  cancelItemForm: () => void;
  cancelPlaceForm: () => void;
  submitItemForm: (event: FormEvent) => void;
  submitPlaceForm: (event: FormEvent) => void;
  focusItemOnMap: (itemId: string) => void;
  focusPlaceOnMap: (place: Place) => void;
  highlightPlaceOnMap: (placeId: string) => void;
  showItemDetails: (itemId: string) => void;
  showPlaceDetails: (placeId: string) => void;
  clearDetailHighlight: () => void;
  openChatList: () => void;
  createChatSession: () => void;
  selectChatSession: (sessionId: string) => void;
  startPanelResize: (event: ReactPointerEvent, panel: "planner" | "chat") => void;
  resizePanelByKey: (event: ReactKeyboardEvent, panel: "planner" | "chat") => void;
  toggleExpandedItem: (itemId: string) => void;
  toggleExpandedPlace: (placeId: string) => void;
  startPlacesResize: (event: ReactPointerEvent) => void;
  resizePlacesByKey: (event: ReactKeyboardEvent) => void;
}

export function useEditorScreenState(props: UseEditorScreenStateProps): EditorScreenState {
  const routeNumbers = new Map<string, number>();
  props.dayItems.filter(hasCoordinates).forEach((item, index) => routeNumbers.set(item.id, index + 1));
  const visiblePlaces = dedupePlaces(props.tripState.places);
  const itemCountByDay = new Map<string, number>();
  props.tripState.itineraryItems.forEach((item) => {
    itemCountByDay.set(item.tripDayId, (itemCountByDay.get(item.tripDayId) ?? 0) + 1);
  });
  const [expandedItems, setExpandedItems] = useState<Set<string>>(() => new Set());
  const [expandedPlaces, setExpandedPlaces] = useState<Set<string>>(() => new Set());
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isAddingPlace, setIsAddingPlace] = useState(false);
  const [focusedMapPlaceId, setFocusedMapPlaceId] = useState<string | null>(null);
  const [shouldCenterFocusedPlace, setShouldCenterFocusedPlace] = useState(false);
  const [detailHighlight, setDetailHighlight] = useState<{ type: "item" | "place"; id: string } | null>(null);
  const { mobileView, setMobileView } = useMobileEditorView(props.activeChatId);
  const focusClearTimerRef = useRef<number | null>(null);
  const detailFocusClearTimerRef = useRef<number | null>(null);
  const suppressDetailHighlightClearRef = useRef(false);
  const editorClassName = [
    props.className,
    `mobile-${mobileView}-open`,
    props.activeChatId ? "mobile-chat-detail" : "mobile-chat-list"
  ]
    .filter(Boolean)
    .join(" ");
  const layoutStyle = {
    "--planner-width": `${props.layout.plannerWidth}px`,
    "--chat-width": `${props.layout.chatWidth}px`,
    "--places-height": `${props.layout.placesHeight}px`
  } as CSSProperties;

  useEffect(() => {
    return () => {
      if (focusClearTimerRef.current != null) window.clearTimeout(focusClearTimerRef.current);
      if (detailFocusClearTimerRef.current != null) window.clearTimeout(detailFocusClearTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (props.editingItemId) setIsAddingItem(false);
  }, [props.editingItemId]);

  useEffect(() => {
    if (props.editingPlaceId) setIsAddingPlace(false);
  }, [props.editingPlaceId]);

  function openMobileChatList() {
    if (props.chatCollapsed) {
      props.onToggleChat();
    }
    props.onOpenChatList();
    setMobileView("chat", "push");
  }

  function closeMobileChat() {
    setMobileView("map");
  }

  function openMobileDetails() {
    if (props.plannerCollapsed) {
      props.onTogglePlanner();
    }
    setMobileView("details", "push");
  }

  function startAddItem() {
    props.onCancelEditItem();
    props.onItemFormChange(emptyItemForm);
    setIsAddingItem(true);
    setMobileView("details");
    if (props.scheduleCollapsed) props.onToggleSchedule();
  }

  function startAddPlace() {
    props.onCancelEditPlace();
    props.onPlaceFormChange(emptyPlaceForm);
    setIsAddingPlace(true);
    setMobileView("details");
    if (props.placesCollapsed) props.onTogglePlaces();
  }

  function focusItemOnMap(itemId: string) {
    if (focusClearTimerRef.current != null) window.clearTimeout(focusClearTimerRef.current);
    setFocusedMapPlaceId(null);
    props.onFocusItem(itemId);
    setMobileView("map");
    focusClearTimerRef.current = window.setTimeout(() => {
      props.onFocusItem(null);
      focusClearTimerRef.current = null;
    }, 2000);
  }

  function focusPlaceOnMapById(placeId: string, center: boolean) {
    if (focusClearTimerRef.current != null) window.clearTimeout(focusClearTimerRef.current);
    props.onFocusItem(null);
    setFocusedMapPlaceId(placeId);
    setShouldCenterFocusedPlace(center);
    if (center) setMobileView("map");
    focusClearTimerRef.current = window.setTimeout(() => {
      setFocusedMapPlaceId(null);
      setShouldCenterFocusedPlace(false);
      focusClearTimerRef.current = null;
    }, 2000);
  }

  function showDetails(type: "item" | "place", id: string) {
    if (focusClearTimerRef.current != null) {
      window.clearTimeout(focusClearTimerRef.current);
      focusClearTimerRef.current = null;
    }
    if (detailFocusClearTimerRef.current != null) {
      window.clearTimeout(detailFocusClearTimerRef.current);
      detailFocusClearTimerRef.current = null;
    }
    setDetailHighlight({ type, id });
    setFocusedMapPlaceId(null);
    setShouldCenterFocusedPlace(false);
    setMobileView("details");
    if (type === "item" && props.scheduleCollapsed) props.onToggleSchedule();
    if (type === "place" && props.placesCollapsed) props.onTogglePlaces();
    suppressDetailHighlightClearRef.current = true;
    window.requestAnimationFrame(() => scrollDetailNodeIntoView(`[data-detail-${type}-id="${cssEscapeValue(id)}"]`));
    window.setTimeout(() => {
      suppressDetailHighlightClearRef.current = false;
    }, 650);
  }

  function startPanelResize(event: ReactPointerEvent, panel: "planner" | "chat") {
    event.preventDefault();
    const startX = event.clientX;
    const startLayout = props.layout;
    setDocumentResizeState("col-resize");

    const handleMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      props.onLayoutChange({
        ...startLayout,
        plannerWidth: panel === "planner" ? clampNumber(startLayout.plannerWidth + deltaX, 420, 580) : startLayout.plannerWidth,
        chatWidth: panel === "chat" ? clampNumber(startLayout.chatWidth - deltaX, 360, 560) : startLayout.chatWidth
      });
    };
    const handleUp = () => {
      clearDocumentResizeState();
      window.removeEventListener("pointermove", handleMove);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp, { once: true });
  }

  function resizePanelByKey(event: ReactKeyboardEvent, panel: "planner" | "chat") {
    const deltaX = event.key === "ArrowLeft" ? -24 : event.key === "ArrowRight" ? 24 : 0;
    if (!deltaX) return;
    event.preventDefault();
    props.onLayoutChange({
      ...props.layout,
      plannerWidth: panel === "planner" ? clampNumber(props.layout.plannerWidth + deltaX, 420, 580) : props.layout.plannerWidth,
      chatWidth: panel === "chat" ? clampNumber(props.layout.chatWidth - deltaX, 360, 560) : props.layout.chatWidth
    });
  }

  function toggleSetValue(setter: Dispatch<SetStateAction<Set<string>>>, id: string) {
    setter((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function startPlacesResize(event: ReactPointerEvent) {
    event.preventDefault();
    const startY = event.clientY;
    const startLayout = props.layout;
    setDocumentResizeState("row-resize");

    const handleMove = (moveEvent: PointerEvent) => {
      props.onLayoutChange({
        ...startLayout,
        placesHeight: clampNumber(startLayout.placesHeight - (moveEvent.clientY - startY), 190, 520)
      });
    };
    const handleUp = () => {
      clearDocumentResizeState();
      window.removeEventListener("pointermove", handleMove);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp, { once: true });
  }

  function resizePlacesByKey(event: ReactKeyboardEvent) {
    const deltaY = event.key === "ArrowUp" ? -24 : event.key === "ArrowDown" ? 24 : 0;
    if (!deltaY) return;
    event.preventDefault();
    props.onLayoutChange({
      ...props.layout,
      placesHeight: clampNumber(props.layout.placesHeight - deltaY, 190, 520)
    });
  }

  return {
    editorClassName,
    layoutStyle,
    routeNumbers,
    visiblePlaces,
    itemCountByDay,
    expandedItems,
    expandedPlaces,
    isAddingItem,
    isAddingPlace,
    focusedMapPlaceId,
    shouldCenterFocusedPlace,
    detailHighlight,
    mobileView,
    openMobileChatList,
    closeMobileChat,
    openMobileDetails,
    openMobileMap: () => setMobileView("map", "push"),
    startAddItem,
    startAddPlace,
    cancelItemForm: () => {
      setIsAddingItem(false);
      props.onCancelEditItem();
    },
    cancelPlaceForm: () => {
      setIsAddingPlace(false);
      props.onCancelEditPlace();
    },
    submitItemForm: (event) => {
      const canSubmit = Boolean(props.itemForm.title.trim());
      void Promise.resolve(props.onSubmitItem(event)).then(() => {
        if (canSubmit) setIsAddingItem(false);
      });
    },
    submitPlaceForm: (event) => {
      const canSubmit = Boolean(props.placeForm.name.trim());
      void Promise.resolve(props.onSubmitPlace(event)).then(() => {
        if (canSubmit) setIsAddingPlace(false);
      });
    },
    focusItemOnMap,
    focusPlaceOnMap: (place) => focusPlaceOnMapById(place.id, true),
    highlightPlaceOnMap: (placeId) => focusPlaceOnMapById(placeId, false),
    showItemDetails: (itemId) => showDetails("item", itemId),
    showPlaceDetails: (placeId) => showDetails("place", placeId),
    clearDetailHighlight: () => {
      if (suppressDetailHighlightClearRef.current) return;
      if (detailHighlight) setDetailHighlight(null);
      if (detailFocusClearTimerRef.current != null) {
        window.clearTimeout(detailFocusClearTimerRef.current);
        detailFocusClearTimerRef.current = null;
      }
    },
    openChatList: () => {
      props.onOpenChatList();
      setMobileView("chat");
    },
    createChatSession: () => {
      if (props.chatCollapsed) props.onToggleChat();
      setMobileView("chat");
      props.onCreateChatSession();
    },
    selectChatSession: (sessionId) => {
      setMobileView("chat");
      props.onSelectChatSession(sessionId);
    },
    startPanelResize,
    resizePanelByKey,
    toggleExpandedItem: (itemId) => toggleSetValue(setExpandedItems, itemId),
    toggleExpandedPlace: (placeId) => toggleSetValue(setExpandedPlaces, placeId),
    startPlacesResize,
    resizePlacesByKey
  };
}
