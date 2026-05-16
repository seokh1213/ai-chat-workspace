import { type Dispatch, type FormEvent, type SetStateAction, useState } from "react";

import {
  addItineraryItem,
  addPlace,
  deleteItineraryItem,
  deletePlace,
  getTripState,
  rollbackCheckpoint,
  updateItineraryItem,
  updatePlace,
  updateTrip
} from "../api";
import type {
  ItineraryItem,
  Place,
  Trip,
  TripDay,
  TripFormState,
  TripState,
  UpsertItineraryItemRequest,
  UpsertPlaceRequest
} from "../types";
import { emptyItemForm, emptyPlaceForm, emptyTripForm } from "./formDefaults";
import { readError } from "./format";
import { localizedPlaceName } from "./tripDisplay";
import { normalizeTripForm, placeToForm, tripToForm } from "./tripForms";

interface UseTripEditorActionsProps {
  activeTrip: Trip | null;
  selectedDay: TripDay | undefined;
  selectedDayId: string;
  setTripState: Dispatch<SetStateAction<TripState | null>>;
  setSelectedDayId: Dispatch<SetStateAction<string>>;
  setTrips: Dispatch<SetStateAction<Trip[]>>;
  setScheduleCollapsed: Dispatch<SetStateAction<boolean>>;
  setPlacesCollapsed: Dispatch<SetStateAction<boolean>>;
}

export function useTripEditorActions({
  activeTrip,
  selectedDay,
  selectedDayId,
  setTripState,
  setSelectedDayId,
  setTrips,
  setScheduleCollapsed,
  setPlacesCollapsed
}: UseTripEditorActionsProps) {
  const [itemForm, setItemForm] = useState<UpsertItineraryItemRequest>(emptyItemForm);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [placeForm, setPlaceForm] = useState<UpsertPlaceRequest>(emptyPlaceForm);
  const [editingPlaceId, setEditingPlaceId] = useState<string | null>(null);
  const [focusedItemId, setFocusedItemId] = useState<string | null>(null);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [metaForm, setMetaForm] = useState<TripFormState>(emptyTripForm);
  const [isMetaSaving, setIsMetaSaving] = useState(false);

  function selectDay(dayId: string) {
    setSelectedDayId(dayId);
    setFocusedItemId(null);
  }

  function cancelEditItem() {
    setEditingItemId(null);
    setFocusedItemId(null);
    setItemForm(emptyItemForm);
  }

  function cancelEditPlace() {
    setEditingPlaceId(null);
    setPlaceForm(emptyPlaceForm);
  }

  async function refreshTripState() {
    if (!activeTrip) return;
    const state = await getTripState(activeTrip.id);
    setTripState(state);
    if (!state.days.some((day) => day.id === selectedDayId)) {
      setSelectedDayId(state.days[0]?.id ?? "");
      setFocusedItemId(null);
    }
  }

  async function submitMeta(event: FormEvent) {
    event.preventDefault();
    if (!activeTrip) return;
    const payload = normalizeTripForm(metaForm);
    if (!payload.title) return;

    setIsMetaSaving(true);
    try {
      const trip = await updateTrip(activeTrip.id, payload);
      setTrips((current) => current.map((candidate) => (candidate.id === trip.id ? trip : candidate)));
      const state = await getTripState(trip.id);
      setTripState(state);
      setMetaForm(tripToForm(state.trip));
      if (!state.days.some((day) => day.id === selectedDayId)) {
        setSelectedDayId(state.days[0]?.id ?? "");
      }
    } catch (nextError) {
      window.alert(readError(nextError));
      setMetaForm(tripToForm(activeTrip));
    } finally {
      setIsMetaSaving(false);
    }
  }

  async function rollbackToCheckpoint(checkpointId: string) {
    if (!window.confirm("이 변경 전 상태로 되돌릴까요? 현재 상태도 되돌리기 전 체크포인트로 저장됩니다.")) return;

    setIsRollingBack(true);
    try {
      const state = await rollbackCheckpoint(checkpointId);
      setTripState(state);
      setMetaForm(tripToForm(state.trip));
      setSelectedDayId(state.days[0]?.id ?? "");
      setFocusedItemId(null);
    } catch (nextError) {
      window.alert(readError(nextError));
    } finally {
      setIsRollingBack(false);
    }
  }

  async function submitItem(event: FormEvent) {
    event.preventDefault();
    if (!selectedDay || !itemForm.title?.trim()) return;

    if (editingItemId) {
      await updateItineraryItem(editingItemId, itemForm);
      setEditingItemId(null);
      setFocusedItemId(editingItemId);
    } else {
      const item = await addItineraryItem(selectedDay.id, itemForm);
      setFocusedItemId(item.id);
    }
    setItemForm(emptyItemForm);
    await refreshTripState();
  }

  async function removeItem(itemId: string) {
    await deleteItineraryItem(itemId);
    if (focusedItemId === itemId) {
      setFocusedItemId(null);
    }
    await refreshTripState();
  }

  function startEditItem(item: ItineraryItem) {
    setEditingItemId(item.id);
    setFocusedItemId(item.id);
    setItemForm({
      title: item.title,
      type: item.type,
      category: item.category ?? "",
      timeText: item.timeText ?? "",
      durationMinutes: item.durationMinutes ?? undefined,
      memo: item.memo ?? "",
      lat: item.lat ?? undefined,
      lng: item.lng ?? undefined
    });
    setScheduleCollapsed(false);
  }

  function usePlaceAsItem(place: Place) {
    setEditingItemId(null);
    setItemForm({
      ...emptyItemForm,
      title: place.name,
      category: place.category ?? "",
      memo: place.note ?? "",
      lat: place.lat ?? undefined,
      lng: place.lng ?? undefined
    });
    setScheduleCollapsed(false);
  }

  function startEditPlace(place: Place) {
    setEditingPlaceId(place.id);
    setPlaceForm(placeToForm(place));
    setPlacesCollapsed(false);
  }

  async function submitPlace(event: FormEvent) {
    event.preventDefault();
    if (!activeTrip || !placeForm.name.trim()) return;

    if (editingPlaceId) {
      await updatePlace(editingPlaceId, placeForm);
    } else {
      await addPlace(activeTrip.id, placeForm);
    }
    setEditingPlaceId(null);
    setPlaceForm(emptyPlaceForm);
    await refreshTripState();
  }

  async function removePlace(place: Place) {
    const confirmed = window.confirm(`조사 장소 "${localizedPlaceName(place)}"을 삭제할까요? 이미 일정에 사용된 노드는 유지되고 장소 연결만 해제됩니다.`);
    if (!confirmed) return;

    await deletePlace(place.id);
    if (editingPlaceId === place.id) {
      setEditingPlaceId(null);
      setPlaceForm(emptyPlaceForm);
    }
    await refreshTripState();
  }

  return {
    metaForm,
    setMetaForm,
    isMetaSaving,
    itemForm,
    setItemForm,
    editingItemId,
    placeForm,
    setPlaceForm,
    editingPlaceId,
    focusedItemId,
    setFocusedItemId,
    isRollingBack,
    selectDay,
    cancelEditItem,
    cancelEditPlace,
    submitMeta,
    rollbackToCheckpoint,
    submitItem,
    removeItem,
    startEditItem,
    usePlaceAsItem,
    startEditPlace,
    submitPlace,
    removePlace
  };
}
