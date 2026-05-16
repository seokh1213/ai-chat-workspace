import type { TripFormState, UpsertItineraryItemRequest, UpsertPlaceRequest } from "../types";

export const emptyItemForm: UpsertItineraryItemRequest = {
  title: "",
  type: "custom",
  category: "",
  timeText: "",
  memo: ""
};

export const emptyPlaceForm: UpsertPlaceRequest = {
  name: "",
  category: "",
  note: "",
  address: "",
  source: "",
  sourceUrl: "",
  imageUrl: ""
};

export const emptyTripForm: TripFormState = {
  title: "",
  destinationName: "",
  destinationLat: null,
  destinationLng: null,
  startDate: "",
  endDate: ""
};
