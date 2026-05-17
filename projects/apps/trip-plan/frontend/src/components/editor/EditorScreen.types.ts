import type { FormEvent } from "react";

import type { EditorLayout } from "../../lib/editorLayout";
import type {
  AiEditRunSummary,
  ChatMessage,
  ChatRunActivityEvent,
  ChatSession,
  CheckpointSummary,
  ItineraryItem,
  Place,
  TripDay,
  TripFormState,
  TripState,
  UpsertItineraryItemRequest,
  UpsertPlaceRequest
} from "../../types";
import type { PendingChatAttachment } from "../chat/types";

export interface EditorChatProps {
  sessions: ChatSession[];
  activeChatId: string | null;
  isSessionCreating: boolean;
  isSessionsLoading: boolean;
  isDetailLoading: boolean;
  checkpoints: CheckpointSummary[];
  isRollingBack: boolean;
  messages: ChatMessage[];
  editRuns: AiEditRunSummary[];
  pendingAttachments: PendingChatAttachment[];
  text: string;
  isSending: boolean;
  streamLabel: string | null;
  activity: ChatRunActivityEvent | null;
  elapsedSeconds: number;
  streamingText: string;
  operationPreview: string[];
  onSelectSession: (sessionId: string) => void;
  onCreateSession: () => void;
  onOpenList: () => void;
  onRollbackCheckpoint: (checkpointId: string) => void;
  onTextChange: (text: string) => void;
  onAddFiles: (files: FileList | File[] | null) => void;
  onRemovePendingAttachment: (localId: string) => void;
  onSubmit: (event: FormEvent) => void;
  onStop: () => void;
  onRenameSession: (session: ChatSession) => void;
  onUpdateSessionTitle: (session: ChatSession, title: string) => Promise<void>;
  onCopySession: (session: ChatSession) => Promise<void>;
  onDeleteSession: (session: ChatSession) => void;
}

export interface EditorScreenProps {
  className: string;
  tripState: TripState;
  selectedDay?: TripDay;
  selectedDayId: string;
  focusedItemId: string | null;
  layout: EditorLayout;
  metaForm: TripFormState;
  isMetaSaving: boolean;
  onLayoutChange: (layout: EditorLayout) => void;
  onMetaFormChange: (form: TripFormState) => void;
  onSubmitMeta: (event: FormEvent) => void;
  onSelectDay: (dayId: string) => void;
  dayItems: ItineraryItem[];
  plannerCollapsed: boolean;
  chatCollapsed: boolean;
  scheduleCollapsed: boolean;
  placesCollapsed: boolean;
  onTogglePlanner: () => void;
  onToggleChat: () => void;
  onToggleSchedule: () => void;
  onTogglePlaces: () => void;
  itemForm: UpsertItineraryItemRequest;
  editingItemId: string | null;
  onItemFormChange: (form: UpsertItineraryItemRequest) => void;
  onSubmitItem: (event: FormEvent) => boolean | Promise<boolean>;
  onEditItem: (item: ItineraryItem) => void;
  onCancelEditItem: () => void;
  onUsePlace: (place: Place) => void;
  placeForm: UpsertPlaceRequest;
  editingPlaceId: string | null;
  onPlaceFormChange: (form: UpsertPlaceRequest) => void;
  onSubmitPlace: (event: FormEvent) => boolean | Promise<boolean>;
  onEditPlace: (place: Place) => void;
  onCancelEditPlace: () => void;
  onDeletePlace: (place: Place) => void;
  onFocusItem: (itemId: string | null) => void;
  onDeleteItem: (itemId: string) => void;
  onBack: () => void;
  chat: EditorChatProps;
  onDeleteTrip: () => void;
}
