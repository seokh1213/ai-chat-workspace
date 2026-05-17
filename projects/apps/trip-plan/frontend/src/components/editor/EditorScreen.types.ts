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
  onSubmitItem: (event: FormEvent) => void;
  onEditItem: (item: ItineraryItem) => void;
  onCancelEditItem: () => void;
  onUsePlace: (place: Place) => void;
  placeForm: UpsertPlaceRequest;
  editingPlaceId: string | null;
  onPlaceFormChange: (form: UpsertPlaceRequest) => void;
  onSubmitPlace: (event: FormEvent) => void;
  onEditPlace: (place: Place) => void;
  onCancelEditPlace: () => void;
  onDeletePlace: (place: Place) => void;
  onFocusItem: (itemId: string | null) => void;
  onDeleteItem: (itemId: string) => void;
  onBack: () => void;
  chatSessions: ChatSession[];
  chatSessionId: string;
  activeChatId: string | null;
  isChatSessionCreating: boolean;
  isChatSessionsLoading: boolean;
  isChatDetailLoading: boolean;
  checkpoints: CheckpointSummary[];
  isRollingBack: boolean;
  messages: ChatMessage[];
  editRuns: AiEditRunSummary[];
  pendingChatAttachments: PendingChatAttachment[];
  chatText: string;
  isChatSending: boolean;
  chatStreamLabel: string | null;
  chatActivity: ChatRunActivityEvent | null;
  chatElapsedSeconds: number;
  chatStreamingText: string;
  chatOperationPreview: string[];
  onSelectChatSession: (sessionId: string) => void;
  onCreateChatSession: () => void;
  onOpenChatList: () => void;
  onRollbackCheckpoint: (checkpointId: string) => void;
  onChatTextChange: (text: string) => void;
  onAddChatFiles: (files: FileList | File[] | null) => void;
  onRemovePendingChatAttachment: (localId: string) => void;
  onSubmitChat: (event: FormEvent) => void;
  onStopChat: () => void;
  onDeleteTrip: () => void;
  onRenameChatSession: (session: ChatSession) => void;
  onUpdateChatSessionTitle: (session: ChatSession, title: string) => Promise<void>;
  onCopyChatSession: (session: ChatSession) => Promise<void>;
  onDeleteChatSession: (session: ChatSession) => void;
}
