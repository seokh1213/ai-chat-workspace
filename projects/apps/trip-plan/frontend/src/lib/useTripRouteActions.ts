import { type Dispatch, type SetStateAction, useEffect, useRef } from "react";

import { deleteTrip, getTripState, updateTrip } from "../api";
import type { Trip, TripState } from "../types";
import { readError } from "./format";
import { parseRoute, pushAppPath, type Screen } from "./route";
import { tripToForm } from "./tripForms";

type LoadState = "loading" | "ready" | "error";

interface UseTripRouteActionsProps {
  activeTrip: Trip | null;
  tripState: TripState | null;
  loadWorkspaces: () => Promise<unknown>;
  loadChat: (tripId: string, preferredSessionId?: string) => Promise<void>;
  prepareTripOpen: () => void;
  resetChatState: () => void;
  setLoadState: Dispatch<SetStateAction<LoadState>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setIsTripOpening: Dispatch<SetStateAction<boolean>>;
  setTripState: Dispatch<SetStateAction<TripState | null>>;
  setScreen: Dispatch<SetStateAction<Screen>>;
  setMetaForm: (form: ReturnType<typeof tripToForm>) => void;
  setSelectedDayId: Dispatch<SetStateAction<string>>;
  setFocusedItemId: Dispatch<SetStateAction<string | null>>;
  setTrips: Dispatch<SetStateAction<Trip[]>>;
}

export function useTripRouteActions({
  activeTrip,
  tripState,
  loadWorkspaces,
  loadChat,
  prepareTripOpen,
  resetChatState,
  setLoadState,
  setError,
  setIsTripOpening,
  setTripState,
  setScreen,
  setMetaForm,
  setSelectedDayId,
  setFocusedItemId,
  setTrips
}: UseTripRouteActionsProps) {
  const tripOpenRequestRef = useRef(0);

  useEffect(() => {
    void bootstrap();
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const route = parseRoute();
      if (route.screen === "create") {
        ++tripOpenRequestRef.current;
        resetChatState();
        setIsTripOpening(false);
        setTripState(null);
        setScreen("create");
        return;
      }
      if (route.tripId) {
        void enterTrip(route.tripId, { updatePath: false, chatSessionId: route.chatSessionId });
        return;
      }
      ++tripOpenRequestRef.current;
      resetChatState();
      setIsTripOpening(false);
      setTripState(null);
      setScreen("select");
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  async function bootstrap() {
    try {
      setLoadState("loading");
      await loadWorkspaces();
      setLoadState("ready");

      const route = parseRoute();
      if (route.screen === "create") {
        setScreen("create");
      } else if (route.tripId) {
        await enterTrip(route.tripId, { updatePath: false, chatSessionId: route.chatSessionId });
      }
    } catch (nextError) {
      setError(readError(nextError));
      setLoadState("error");
    }
  }

  async function enterTrip(tripId: string, options: { updatePath?: boolean; chatSessionId?: string } = {}) {
    const requestId = ++tripOpenRequestRef.current;
    setIsTripOpening(true);
    prepareTripOpen();
    try {
      const state = await getTripState(tripId);
      if (requestId !== tripOpenRequestRef.current) return;
      setTripState(state);
      setMetaForm(tripToForm(state.trip));
      setSelectedDayId(state.days[0]?.id ?? "");
      setFocusedItemId(null);
      setScreen("edit");
      if (options.updatePath !== false) {
        pushAppPath(`/trips/${encodeURIComponent(tripId)}`);
      }
      await loadChat(tripId, options.chatSessionId);
    } catch (nextError) {
      const message = readError(nextError);
      if (options.updatePath === false && !tripState) {
        setError(message);
        setLoadState("error");
      } else {
        window.alert(message);
      }
    } finally {
      if (requestId === tripOpenRequestRef.current) {
        setIsTripOpening(false);
      }
    }
  }

  function navigateToCreate() {
    ++tripOpenRequestRef.current;
    resetChatState();
    setIsTripOpening(false);
    setTripState(null);
    setScreen("create");
    pushAppPath("/trips/new");
  }

  function navigateToSelect() {
    ++tripOpenRequestRef.current;
    resetChatState();
    setIsTripOpening(false);
    setTripState(null);
    setScreen("select");
    pushAppPath("/");
  }

  async function renameTrip(trip: Trip) {
    const title = window.prompt("여행 이름", trip.title)?.trim();
    if (!title || title === trip.title) return;

    try {
      const updated = await updateTrip(trip.id, {
        title,
        destinationName: trip.destinationName ?? "",
        startDate: trip.startDate ?? "",
        endDate: trip.endDate ?? ""
      });
      setTrips((current) => current.map((candidate) => (candidate.id === updated.id ? updated : candidate)));
      if (activeTrip?.id === updated.id) {
        const state = await getTripState(updated.id);
        setTripState(state);
        setMetaForm(tripToForm(state.trip));
      }
    } catch (nextError) {
      window.alert(readError(nextError));
    }
  }

  async function removeTrip(trip: Trip) {
    if (!window.confirm(`'${trip.title}' 여행을 삭제할까요? 일정, 장소, 대화도 함께 삭제됩니다.`)) return;

    try {
      await deleteTrip(trip.id);
      setTrips((current) => current.filter((candidate) => candidate.id !== trip.id));
      if (activeTrip?.id === trip.id) {
        navigateToSelect();
      }
    } catch (nextError) {
      window.alert(readError(nextError));
    }
  }

  async function deleteActiveTrip() {
    if (!activeTrip) return;
    await removeTrip(activeTrip);
  }

  return {
    bootstrap,
    enterTrip,
    navigateToCreate,
    navigateToSelect,
    renameTrip,
    removeTrip,
    deleteActiveTrip
  };
}
