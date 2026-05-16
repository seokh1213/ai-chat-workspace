import { type Dispatch, type FormEvent, type SetStateAction, useEffect, useRef, useState } from "react";

import { createTrip, importSetupChatSession, sendSetupAssistantMessage } from "../api";
import type { SetupAssistantMessage, Trip, TripFormState } from "../types";
import { emptyTripForm } from "./formDefaults";
import { readError } from "./format";
import { applySetupActions, normalizeTripForm } from "./tripForms";

const setupIntro: SetupAssistantMessage = {
  role: "assistant",
  content: "목적지와 날짜를 먼저 잡고, 동행과 이동 방식을 알려주세요. 그 기준으로 초기 일정의 밀도와 권역을 정리하겠습니다."
};

interface UseSetupTripCreatorProps {
  workspaceId: string;
  setTrips: Dispatch<SetStateAction<Trip[]>>;
  enterTrip: (tripId: string, options?: { chatSessionId?: string }) => Promise<void>;
}

export function useSetupTripCreator({ workspaceId, setTrips, enterTrip }: UseSetupTripCreatorProps) {
  const [tripForm, setTripForm] = useState<TripFormState>(emptyTripForm);
  const [isTripSubmitting, setIsTripSubmitting] = useState(false);
  const [setupMessages, setSetupMessages] = useState<SetupAssistantMessage[]>([setupIntro]);
  const [setupChatText, setSetupChatText] = useState("");
  const [isSetupSending, setIsSetupSending] = useState(false);
  const tripFormRef = useRef(tripForm);

  useEffect(() => {
    tripFormRef.current = tripForm;
  }, [tripForm]);

  async function submitTrip(event: FormEvent) {
    event.preventDefault();
    const payload = normalizeTripForm(tripForm);
    if (!workspaceId || !payload.title || isTripSubmitting) return;
    setIsTripSubmitting(true);
    try {
      const trip = await createTrip(workspaceId, payload);
      const setupTranscript = setupMessages.filter((message) => message.content.trim());
      const importedSetup = setupTranscript.length > 1
        ? await importSetupChatSession(trip.id, "초안 설계", setupTranscript)
        : null;
      setTrips((current) => [trip, ...current]);
      setTripForm(emptyTripForm);
      setSetupMessages([setupIntro]);
      setSetupChatText("");
      await enterTrip(trip.id, { chatSessionId: importedSetup?.session.id });
    } catch (nextError) {
      window.alert(readError(nextError));
    } finally {
      setIsTripSubmitting(false);
    }
  }

  async function submitSetupChat(event: FormEvent) {
    event.preventDefault();
    const content = setupChatText.trim();
    if (!content) return;

    const userMessage: SetupAssistantMessage = { role: "user", content };
    const nextMessages = [...setupMessages, userMessage];
    const startedAt = performance.now();
    setSetupMessages(nextMessages);
    setSetupChatText("");
    setIsSetupSending(true);
    try {
      const response = await sendSetupAssistantMessage(content, normalizeTripForm(tripForm), setupMessages);
      const applied = applySetupActions(tripFormRef.current, response.actions);
      if (applied.changed) setTripForm(applied.form);
      setSetupMessages([
        ...nextMessages,
        {
          ...response.message,
          durationMs: performance.now() - startedAt,
          appliedActions: applied.summaries
        }
      ]);
    } catch (nextError) {
      setSetupMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: `상담 내용을 정리하지 못했습니다. ${readError(nextError)}`,
          durationMs: performance.now() - startedAt
        }
      ]);
    } finally {
      setIsSetupSending(false);
    }
  }

  return {
    tripForm,
    setTripForm,
    isTripSubmitting,
    setupMessages,
    setupChatText,
    setSetupChatText,
    isSetupSending,
    submitTrip,
    submitSetupChat
  };
}
