import type { Place, SetupAssistantAction, Trip, TripFormState, UpdateTripRequest, UpsertPlaceRequest } from "../types";

export function tripToForm(trip: Trip): TripFormState {
  return {
    title: trip.title,
    destinationName: trip.destinationName ?? "",
    destinationLat: trip.destinationLat,
    destinationLng: trip.destinationLng,
    startDate: trip.startDate ?? "",
    endDate: trip.endDate ?? ""
  };
}

export function placeToForm(place: Place): UpsertPlaceRequest {
  return {
    name: place.name,
    category: place.category ?? "",
    note: place.note ?? "",
    address: place.address ?? "",
    source: place.source ?? "",
    sourceUrl: place.sourceUrl ?? "",
    imageUrl: place.imageUrl ?? "",
    lat: place.lat ?? undefined,
    lng: place.lng ?? undefined
  };
}

export function normalizeTripForm(form: TripFormState): UpdateTripRequest {
  return {
    title: form.title.trim(),
    destinationName: form.destinationName.trim(),
    destinationLat: form.destinationLat,
    destinationLng: form.destinationLng,
    startDate: form.startDate,
    endDate: form.endDate
  };
}

export function applySetupActions(
  form: TripFormState,
  actions: SetupAssistantAction[]
): { form: TripFormState; changed: boolean; summaries: string[] } {
  let nextForm = form;
  const summaries: string[] = [];

  actions.forEach((action) => {
    if (action.type !== "updateDraftTrip") return;
    const patch: Partial<TripFormState> = {};

    if (action.title?.trim()) patch.title = action.title.trim();
    if (action.destinationName?.trim()) patch.destinationName = action.destinationName.trim();
    if (typeof action.destinationLat === "number" && Number.isFinite(action.destinationLat)) patch.destinationLat = action.destinationLat;
    if (typeof action.destinationLng === "number" && Number.isFinite(action.destinationLng)) patch.destinationLng = action.destinationLng;
    if (action.startDate?.trim()) patch.startDate = action.startDate.trim();
    if (action.endDate?.trim()) patch.endDate = action.endDate.trim();

    const changedLabels = setupPatchLabels(nextForm, patch);
    if (changedLabels.length === 0) return;

    nextForm = { ...nextForm, ...patch };
    summaries.push(...changedLabels);
  });

  return {
    form: nextForm,
    changed: nextForm !== form,
    summaries: [...new Set(summaries)]
  };
}

function setupPatchLabels(form: TripFormState, patch: Partial<TripFormState>): string[] {
  const labels: string[] = [];
  if (patch.title && patch.title !== form.title) labels.push("여행 이름");
  if (patch.destinationName && patch.destinationName !== form.destinationName) labels.push("목적지");
  if (patch.destinationLat != null && patch.destinationLat !== form.destinationLat) labels.push("지도 중심");
  if (patch.destinationLng != null && patch.destinationLng !== form.destinationLng && !labels.includes("지도 중심")) {
    labels.push("지도 중심");
  }
  if (patch.startDate && patch.startDate !== form.startDate) labels.push("출발일");
  if (patch.endDate && patch.endDate !== form.endDate) labels.push("귀국일");
  return labels;
}
