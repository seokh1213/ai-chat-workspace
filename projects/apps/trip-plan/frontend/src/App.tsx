import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Bot,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock3,
  Copy,
  Edit3,
  History,
  MapPinned,
  Navigation,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  Save,
  Send,
  Settings2,
  Trash2,
  X
} from "lucide-react";
import {
  type CSSProperties,
  type FormEvent,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from "react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import {
  addItineraryItem,
  cancelCurrentChatRun,
  createChatSession,
  createTrip,
  createWorkspace,
  deleteChatSession,
  deleteItineraryItem,
  deletePlace,
  deleteTrip,
  deleteWorkspace,
  getAiProviderStatuses,
  getChatSession,
  getChatSessions,
  getTrips,
  getTripState,
  getWorkspaces,
  importSetupChatSession,
  rollbackCheckpoint,
  sendChatMessage,
  sendSetupAssistantMessage,
  updateChatSession,
  updateItineraryItem,
  updatePlace,
  updateTrip,
  updateWorkspace
} from "./api";
import type {
  AiEditRunSummary,
  AiProviderStatus,
  ChatMessage,
  ChatRunActivityEvent,
  ChatSession,
  CheckpointSummary,
  ItineraryItem,
  Place,
  SetupAssistantMessage,
  SetupAssistantAction,
  Trip,
  TripDay,
  TripState,
  UpdateTripRequest,
  UpsertItineraryItemRequest,
  UpsertPlaceRequest,
  Workspace
} from "./types";

type Screen = "select" | "create" | "edit";
type LoadState = "loading" | "ready" | "error";
type MapTileMode = "english" | "local";
type MobileEditorView = "planner" | "chat";
type TripFormState = {
  title: string;
  destinationName: string;
  destinationLat: number | null;
  destinationLng: number | null;
  startDate: string;
  endDate: string;
};
type TripTextField = "title" | "destinationName" | "startDate" | "endDate";
type MapView = {
  center: L.LatLngExpression;
  zoom: number;
};
type EditorLayout = {
  plannerWidth: number;
  chatWidth: number;
  placesHeight: number;
};
type WorkspaceSettingsForm = {
  name: string;
  aiProvider: string;
  aiModel: string;
  aiEffort: string;
  openAiBaseUrl: string;
  openAiApiKey: string;
  openRouterApiKey: string;
  openRouterReferer: string;
  openRouterTitle: string;
};
type AiProviderId = "codex-app-server" | "openai-compatible" | "openrouter";
type AiProviderOption = {
  value: AiProviderId;
  label: string;
  description: string;
  defaultModel: string;
};
type AiModelOption = {
  value: string;
  label: string;
  description: string;
};
type AiEffortOption = {
  value: string;
  label: string;
  description: string;
};

const emptyItemForm: UpsertItineraryItemRequest = {
  title: "",
  type: "custom",
  category: "",
  timeText: "",
  memo: ""
};

const emptyPlaceForm: UpsertPlaceRequest = {
  name: "",
  category: "",
  note: "",
  address: "",
  source: "",
  sourceUrl: "",
  imageUrl: ""
};

const emptyTripForm: TripFormState = {
  title: "",
  destinationName: "",
  destinationLat: null,
  destinationLng: null,
  startDate: "",
  endDate: ""
};

const setupIntro: SetupAssistantMessage = {
  role: "assistant",
  content: "목적지와 날짜를 먼저 잡고, 동행과 이동 방식을 알려주세요. 그 기준으로 초기 일정의 밀도와 권역을 정리하겠습니다."
};

const weekdayLabels = ["일", "월", "화", "수", "목", "금", "토"];
const aiProviderOptions: AiProviderOption[] = [
  {
    value: "codex-app-server",
    label: "Codex app-server",
    description: "로컬 Codex 세션을 사용합니다. 모델과 추론 강도를 선택할 수 있습니다.",
    defaultModel: "gpt-5.4-mini"
  },
  {
    value: "openai-compatible",
    label: "OpenAI 호환",
    description: "OpenAI Chat Completions 형식의 Base URL과 API key를 사용합니다.",
    defaultModel: "gpt-5.4-mini"
  },
  {
    value: "openrouter",
    label: "OpenRouter",
    description: "OpenRouter 통합 엔드포인트와 API key를 사용합니다.",
    defaultModel: "openai/gpt-5.2"
  }
];
const codexModelOptions: AiModelOption[] = [
  { value: "gpt-5.4-mini", label: "GPT-5.4 Mini", description: "빠른 응답과 비용 균형" },
  { value: "gpt-5.4", label: "GPT-5.4", description: "일반 작업용 균형 모델" },
  { value: "gpt-5.3-codex-spark", label: "GPT-5.3 Codex Spark", description: "가벼운 코딩 작업에 빠른 모델" },
  { value: "gpt-5.3-codex", label: "GPT-5.3 Codex", description: "코딩 작업 특화 모델" },
  { value: "gpt-5.2", label: "GPT-5.2", description: "안정적인 장문 작업용 모델" },
  { value: "gpt-5.5", label: "GPT-5.5", description: "복잡한 작업용 고성능 모델" }
];
const openAiModelSuggestions = ["gpt-5.4-mini", "gpt-5.4", "gpt-5.2", "gpt-4.1"];
const openRouterModelSuggestions = ["openai/gpt-5.2", "openai/gpt-4o"];
const aiEffortOptions: AiEffortOption[] = [
  { value: "low", label: "낮음", description: "빠른 응답" },
  { value: "medium", label: "중간", description: "기본 균형값" },
  { value: "high", label: "높음", description: "복잡한 수정 검토" },
  { value: "xhigh", label: "매우 높음", description: "가장 깊은 추론" }
];
const markdownPlugins = [remarkGfm, remarkBreaks, remarkLenientStrong];
const editorLayoutStorageKey = "trip-planner-editor-layout";
const mapTileModeStorageKey = "trip-planner-map-tile-mode-v2";
const chatDraftStoragePrefix = "trip-planner-chat-draft";
const defaultEditorLayout: EditorLayout = {
  plannerWidth: 440,
  chatWidth: 420,
  placesHeight: 260
};

function App() {
  const [screen, setScreen] = useState<Screen>("select");
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspaceId, setWorkspaceId] = useState<string>("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [settingsWorkspace, setSettingsWorkspace] = useState<Workspace | null>(null);
  const [workspaceSettingsForm, setWorkspaceSettingsForm] = useState<WorkspaceSettingsForm>(() => workspaceToSettingsForm(null));
  const [providerStatuses, setProviderStatuses] = useState<AiProviderStatus[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [tripState, setTripState] = useState<TripState | null>(null);
  const [selectedDayId, setSelectedDayId] = useState<string>("");
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [chatSessionId, setChatSessionId] = useState<string>("");
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [editRuns, setEditRuns] = useState<AiEditRunSummary[]>([]);
  const [plannerCollapsed, setPlannerCollapsed] = useState(false);
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const [scheduleCollapsed, setScheduleCollapsed] = useState(false);
  const [placesCollapsed, setPlacesCollapsed] = useState(false);
  const [editorLayout, setEditorLayout] = useState<EditorLayout>(() => readEditorLayout());
  const [itemForm, setItemForm] = useState<UpsertItineraryItemRequest>(emptyItemForm);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [placeForm, setPlaceForm] = useState<UpsertPlaceRequest>(emptyPlaceForm);
  const [editingPlaceId, setEditingPlaceId] = useState<string | null>(null);
  const [focusedItemId, setFocusedItemId] = useState<string | null>(null);
  const [chatText, setChatText] = useState("");
  const [isChatSending, setIsChatSending] = useState(false);
  const [chatStreamLabel, setChatStreamLabel] = useState<string | null>(null);
  const [chatActivity, setChatActivity] = useState<ChatRunActivityEvent | null>(null);
  const [chatStreamingText, setChatStreamingText] = useState("");
  const [chatOperationPreview, setChatOperationPreview] = useState<string[]>([]);
  const [chatRunStartedAtMs, setChatRunStartedAtMs] = useState<number | null>(null);
  const [chatElapsedSeconds, setChatElapsedSeconds] = useState(0);
  const [isChatSessionCreating, setIsChatSessionCreating] = useState(false);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [tripForm, setTripForm] = useState<TripFormState>(emptyTripForm);
  const [metaForm, setMetaForm] = useState<TripFormState>(emptyTripForm);
  const [isMetaSaving, setIsMetaSaving] = useState(false);
  const [setupMessages, setSetupMessages] = useState<SetupAssistantMessage[]>([setupIntro]);
  const [setupChatText, setSetupChatText] = useState("");
  const [isSetupSending, setIsSetupSending] = useState(false);
  const chatAbortControllerRef = useRef<AbortController | null>(null);
  const chatStreamMutedRef = useRef(false);
  const chatStreamQueueRef = useRef("");
  const chatStreamPumpRef = useRef<number | null>(null);
  const chatStreamDeltaSeenRef = useRef(false);

  function clearChatStreamBuffer() {
    if (chatStreamPumpRef.current != null) {
      window.clearInterval(chatStreamPumpRef.current);
      chatStreamPumpRef.current = null;
    }
    chatStreamQueueRef.current = "";
    chatStreamDeltaSeenRef.current = false;
  }

  function enqueueChatStreamDelta(delta: string) {
    if (!delta) return;
    chatStreamDeltaSeenRef.current = true;
    chatStreamQueueRef.current += delta;
    if (chatStreamPumpRef.current != null) return;

    chatStreamPumpRef.current = window.setInterval(() => {
      const queued = chatStreamQueueRef.current;
      if (!queued) {
        if (chatStreamPumpRef.current != null) {
          window.clearInterval(chatStreamPumpRef.current);
          chatStreamPumpRef.current = null;
        }
        return;
      }

      const chunkSize = queued.length > 600 ? 28 : queued.length > 180 ? 14 : 7;
      const chunk = queued.slice(0, chunkSize);
      chatStreamQueueRef.current = queued.slice(chunk.length);
      setChatStreamingText((current) => `${current}${chunk}`);
    }, 24);
  }

  function waitForChatStreamDrain(timeoutMs = 5_000): Promise<void> {
    const startedAt = window.performance.now();
    return new Promise((resolve) => {
      const poll = () => {
        const elapsed = window.performance.now() - startedAt;
        if ((!chatStreamQueueRef.current && chatStreamPumpRef.current == null) || elapsed >= timeoutMs) {
          resolve();
          return;
        }
        window.setTimeout(poll, 40);
      };
      poll();
    });
  }

  useEffect(() => {
    void bootstrap();
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const route = parseRoute();
      if (route.screen === "create") {
        setTripState(null);
        setScreen("create");
        return;
      }
      if (route.tripId) {
        void enterTrip(route.tripId, { updatePath: false, chatSessionId: route.chatSessionId });
        return;
      }
      setTripState(null);
      setScreen("select");
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (workspaceId) {
      void loadTrips(workspaceId);
    }
  }, [workspaceId]);

  useEffect(() => {
    window.localStorage.setItem(editorLayoutStorageKey, JSON.stringify(editorLayout));
  }, [editorLayout]);

  useEffect(() => {
    const tripId = tripState?.trip.id;
    if (!tripId || !activeChatId) return;
    writeChatDraft(tripId, activeChatId, chatText);
  }, [activeChatId, chatText, tripState?.trip.id]);

  useEffect(() => {
    if (!isChatSending || chatRunStartedAtMs == null) {
      setChatElapsedSeconds(0);
      return;
    }

    const tick = () => {
      setChatElapsedSeconds(Math.max(0, Math.floor((Date.now() - chatRunStartedAtMs) / 1000)));
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [chatRunStartedAtMs, isChatSending]);

  useEffect(() => {
    if (!activeChatId) {
      setIsChatSending(false);
      setChatStreamLabel(null);
      setChatActivity(null);
      setChatStreamingText("");
      setChatRunStartedAtMs(null);
      clearChatStreamBuffer();
      return;
    }

    chatStreamMutedRef.current = false;
    clearChatStreamBuffer();
    setChatStreamingText("");
    const source = new EventSource(`/api/chat-sessions/${encodeURIComponent(activeChatId)}/events`);
    const settle = (label: string) => {
      if (chatStreamMutedRef.current) return;
      setChatStreamLabel(label);
      window.setTimeout(() => setChatStreamLabel(null), 1200);
    };
    const onStarted = (event: MessageEvent) => {
      const data = parseSseData<{ createdAt?: string; message?: string }>(event);
      chatStreamMutedRef.current = false;
      clearChatStreamBuffer();
      setIsChatSending(true);
      setChatStreamingText("");
      setChatActivity(null);
      setChatRunStartedAtMs(parseEventTimeMs(data?.createdAt) ?? Date.now());
      setChatStreamLabel(data?.message ?? "요청을 분석하는 중입니다.");
    };
    const onActivity = (event: MessageEvent) => {
      if (chatStreamMutedRef.current) return;
      const data = parseSseData<ChatRunActivityEvent>(event);
      if (!data) return;
      setIsChatSending(true);
      setChatActivity(data);
      setChatStreamLabel(data.label);
    };
    const onAssistantDelta = (event: MessageEvent) => {
      if (chatStreamMutedRef.current) return;
      const data = parseSseData<{ delta?: string }>(event);
      if (data?.delta) {
        setIsChatSending(true);
        setChatRunStartedAtMs((current) => current ?? Date.now());
        enqueueChatStreamDelta(data.delta);
        setChatActivity(null);
        setChatStreamLabel(null);
      }
    };
    const onAssistantCompleted = (event: MessageEvent) => {
      if (chatStreamMutedRef.current) return;
      const data = parseSseData<{ content?: string }>(event);
      if (data?.content && !chatStreamDeltaSeenRef.current) {
        setIsChatSending(true);
        setChatStreamingText(data.content);
        setChatActivity(null);
        setChatStreamLabel(null);
      }
    };
    const onProposed = (event: MessageEvent) => {
      if (chatStreamMutedRef.current) return;
      const data = parseSseData<{ operationCount?: number; operationPreview?: string[] }>(event);
      setChatOperationPreview(data?.operationPreview ?? []);
      setChatStreamLabel(data?.operationCount ? "변경안을 검증하는 중입니다." : "응답을 정리하는 중입니다.");
    };
    const refreshCompletedRun = async (run: AiEditRunSummary | null) => {
      try {
        if (activeChatId) {
          const detail = await getChatSession(activeChatId);
          setChatSessions((current) => current.map((session) => (session.id === detail.session.id ? detail.session : session)));
          setMessages(detail.messages);
          setEditRuns(detail.editRuns);
        }
        if (run?.status === "applied" && tripState?.trip.id) {
          const nextState = await getTripState(tripState.trip.id);
          setTripState(nextState);
          setSelectedDayId((currentDayId) =>
            nextState.days.some((day) => day.id === currentDayId) ? currentDayId : nextState.days[0]?.id ?? ""
          );
        }
      } catch (nextError) {
        console.debug("chat stream final refresh failed", nextError);
      } finally {
        setIsChatSending(false);
        setChatStreamingText("");
        setChatOperationPreview([]);
        setChatActivity(null);
        setChatRunStartedAtMs(null);
        clearChatStreamBuffer();
      }
    };
    const onCompleted = (event: MessageEvent) => {
      const run = parseSseData<AiEditRunSummary>(event);
      if (run?.id) {
        setEditRuns((current) => [run, ...current.filter((candidate) => candidate.id !== run.id)]);
      }
      settle(run?.status === "failed" ? "적용 실패" : "처리 완료");
      void waitForChatStreamDrain().then(() => refreshCompletedRun(run ?? null));
    };
    const onCancelled = (event: MessageEvent) => {
      chatStreamMutedRef.current = true;
      clearChatStreamBuffer();
      setIsChatSending(false);
      setChatStreamingText("");
      setChatActivity(null);
      setChatRunStartedAtMs(null);
      const run = parseSseData<AiEditRunSummary>(event);
      if (run?.id) {
        setEditRuns((current) => [run, ...current.filter((candidate) => candidate.id !== run.id)]);
      }
      setChatStreamLabel("중지됨");
      setChatOperationPreview([]);
      if (activeChatId) {
        void getChatSession(activeChatId).then((detail) => {
          setChatSessions((current) => current.map((session) => (session.id === detail.session.id ? detail.session : session)));
          setMessages(detail.messages);
          setEditRuns(detail.editRuns);
        }).catch((nextError) => {
          console.debug("chat cancel refresh failed", nextError);
        });
      }
      window.setTimeout(() => setChatStreamLabel(null), 1200);
    };
    const onSnapshot = (event: MessageEvent) => {
      const run = parseSseData<AiEditRunSummary>(event);
      if (run?.id) {
        setEditRuns((current) => [run, ...current.filter((candidate) => candidate.id !== run.id)]);
      }
    };

    source.addEventListener("run.started", onStarted);
    source.addEventListener("run.activity", onActivity);
    source.addEventListener("assistant.message.delta", onAssistantDelta);
    source.addEventListener("assistant.message.completed", onAssistantCompleted);
    source.addEventListener("operations.proposed", onProposed);
    source.addEventListener("run.applied", onCompleted);
    source.addEventListener("run.completed", onCompleted);
    source.addEventListener("run.failed", onCompleted);
    source.addEventListener("run.cancelled", onCancelled);
    source.addEventListener("run.snapshot", onSnapshot);
    source.onerror = (event) => {
      console.debug("chat event stream error", event);
    };

    return () => {
      source.close();
      clearChatStreamBuffer();
    };
  }, [activeChatId, tripState?.trip.id]);

  const activeTrip = tripState?.trip ?? null;
  const days = tripState?.days ?? [];
  const selectedDay = days.find((day) => day.id === selectedDayId) ?? days[0];
  const dayItems = useMemo(
    () => (selectedDay ? (tripState?.itineraryItems ?? []).filter((item) => item.tripDayId === selectedDay.id) : []),
    [selectedDay, tripState]
  );

  async function bootstrap() {
    try {
      setLoadState("loading");
      const nextWorkspaces = await getWorkspaces();
      const nextWorkspace = nextWorkspaces[0];

      setWorkspaces(nextWorkspaces);
      setWorkspaceId(nextWorkspace?.id ?? "");
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

  async function loadTrips(nextWorkspaceId: string) {
    const nextTrips = await getTrips(nextWorkspaceId);
    setTrips(nextTrips);
  }

  async function refreshProviderStatuses(): Promise<void> {
    try {
      const statuses = await getAiProviderStatuses();
      setProviderStatuses(statuses);
    } catch (nextError) {
      console.debug("provider status refresh failed", nextError);
    }
  }

  async function enterTrip(tripId: string, options: { updatePath?: boolean; chatSessionId?: string } = {}) {
    const state = await getTripState(tripId);
    setTripState(state);
    setMetaForm(tripToForm(state.trip));
    setSelectedDayId(state.days[0]?.id ?? "");
    setFocusedItemId(null);
    setScreen("edit");
    if (options.updatePath !== false) {
      pushAppPath(`/trips/${encodeURIComponent(tripId)}`);
    }
    await loadChat(tripId, options.chatSessionId);
  }

  async function loadChat(tripId: string, preferredSessionId?: string) {
    const sessions = await getChatSessions(tripId);
    setChatSessions(sessions);
    const session = sessions.find((candidate) => candidate.id === preferredSessionId);
    if (session) {
      setChatText(readChatDraft(tripId, session.id));
      setChatSessionId(session.id);
      setActiveChatId(session.id);
      setMessages([]);
      setEditRuns([]);
      const detail = await getChatSession(session.id);
      setMessages(detail.messages);
      setEditRuns(detail.editRuns);
      return;
    }

    setChatSessionId("");
    setActiveChatId(null);
    setMessages([]);
    setEditRuns([]);
    setChatText("");
  }

  async function selectChatSession(sessionId: string) {
    if (sessionId === chatSessionId) return;
    setChatText(activeTrip ? readChatDraft(activeTrip.id, sessionId) : "");
    setChatSessionId(sessionId);
    setActiveChatId(sessionId);
    setMessages([]);
    setEditRuns([]);
    const detail = await getChatSession(sessionId);
    setMessages(detail.messages);
    setEditRuns(detail.editRuns);
    if (activeTrip) {
      pushAppPath(`/trips/${encodeURIComponent(activeTrip.id)}/chat/${encodeURIComponent(sessionId)}`);
    }
  }

  async function createNextChatSession() {
    if (!activeTrip) return;
    setIsChatSessionCreating(true);
    try {
      await refreshProviderStatuses();
      const title = selectedDay ? `Day ${selectedDay.dayNumber} 일정 조율` : `전체 일정 조율 ${chatSessions.length + 1}`;
      const session = await createChatSession(activeTrip.id, title);
      setChatSessions((current) => [session, ...current]);
      setChatSessionId(session.id);
      setActiveChatId(session.id);
      setMessages([]);
      setEditRuns([]);
      setChatText("");
      pushAppPath(`/trips/${encodeURIComponent(activeTrip.id)}/chat/${encodeURIComponent(session.id)}`);
    } finally {
      setIsChatSessionCreating(false);
    }
  }

  function openChatList() {
    if (!activeTrip) return;
    setChatSessionId("");
    setActiveChatId(null);
    setMessages([]);
    setEditRuns([]);
    setChatText("");
    pushAppPath(`/trips/${encodeURIComponent(activeTrip.id)}`);
  }

  async function renameChat(session: ChatSession) {
    const title = window.prompt("대화 이름", session.title)?.trim();
    if (!title) return;
    await updateChatTitle(session, title);
  }

  async function updateChatTitle(session: ChatSession, title: string) {
    const nextTitle = title.trim();
    if (!nextTitle || nextTitle === session.title) return;

    try {
      const updated = await updateChatSession(session.id, nextTitle);
      setChatSessions((current) => current.map((candidate) => (candidate.id === updated.id ? updated : candidate)));
    } catch (nextError) {
      window.alert(readError(nextError));
      throw nextError;
    }
  }

  async function copyChatSessionMarkdown(session: ChatSession) {
    if (!activeTrip) return;

    try {
      const detail = session.id === activeChatId
        ? { session, messages, editRuns }
        : await getChatSession(session.id);
      await writeClipboardText(
        buildChatSessionMarkdown({
          trip: activeTrip,
          session: detail.session,
          messages: detail.messages,
          runs: detail.editRuns
        })
      );
    } catch (nextError) {
      window.alert(readError(nextError));
      throw nextError;
    }
  }

  async function removeChat(session: ChatSession) {
    if (!window.confirm(`'${session.title}' 대화를 삭제할까요?`)) return;

    try {
      await deleteChatSession(session.id);
      if (activeTrip) {
        removeChatDraft(activeTrip.id, session.id);
      }
      setChatSessions((current) => current.filter((candidate) => candidate.id !== session.id));
      if (activeChatId === session.id) {
        openChatList();
      }
    } catch (nextError) {
      window.alert(readError(nextError));
    }
  }

  async function submitWorkspace(event: FormEvent) {
    event.preventDefault();
    const name = workspaceName.trim();
    if (!name) return;
    const workspace = await createWorkspace(name);
    setWorkspaces((current) => [...current, workspace]);
    setWorkspaceId(workspace.id);
    setWorkspaceName("");
  }

  async function renameWorkspace(workspace: Workspace) {
    const name = window.prompt("워크스페이스 이름", workspace.name)?.trim();
    if (!name || name === workspace.name) return;

    try {
      const updated = await updateWorkspace(workspace.id, { name });
      setWorkspaces((current) => current.map((candidate) => (candidate.id === updated.id ? updated : candidate)));
    } catch (nextError) {
      window.alert(readError(nextError));
    }
  }

  function openWorkspaceSettings(workspace: Workspace) {
    setSettingsWorkspace(workspace);
    setWorkspaceSettingsForm(workspaceToSettingsForm(workspace));
    void refreshProviderStatuses();
  }

  async function submitWorkspaceSettings(event: FormEvent) {
    event.preventDefault();
    if (!settingsWorkspace) return;

    try {
      const updated = await updateWorkspace(settingsWorkspace.id, {
        name: workspaceSettingsForm.name.trim(),
        aiProvider: workspaceSettingsForm.aiProvider,
        aiModel: workspaceSettingsForm.aiModel.trim(),
        aiEffort: workspaceSettingsForm.aiEffort,
        openAiBaseUrl: workspaceSettingsForm.openAiBaseUrl.trim(),
        openAiApiKey: workspaceSettingsForm.openAiApiKey.trim(),
        openRouterApiKey: workspaceSettingsForm.openRouterApiKey.trim(),
        openRouterReferer: workspaceSettingsForm.openRouterReferer.trim(),
        openRouterTitle: workspaceSettingsForm.openRouterTitle.trim()
      });
      setWorkspaces((current) => current.map((candidate) => (candidate.id === updated.id ? updated : candidate)));
      setSettingsWorkspace(null);
      setWorkspaceSettingsForm(workspaceToSettingsForm(null));
    } catch (nextError) {
      window.alert(readError(nextError));
    }
  }

  async function removeWorkspace(workspace: Workspace) {
    if (workspaces.length <= 1) {
      window.alert("마지막 워크스페이스는 삭제할 수 없습니다.");
      return;
    }
    if (!window.confirm(`'${workspace.name}' 워크스페이스와 포함된 여행을 삭제할까요?`)) return;

    try {
      await deleteWorkspace(workspace.id);
      const remaining = workspaces.filter((candidate) => candidate.id !== workspace.id);
      setWorkspaces(remaining);
      if (workspace.id === workspaceId) {
        const nextWorkspace = remaining[0];
        setWorkspaceId(nextWorkspace?.id ?? "");
        setTripState(null);
        setScreen("select");
        pushAppPath("/");
      }
    } catch (nextError) {
      window.alert(readError(nextError));
    }
  }

  async function submitTrip(event: FormEvent) {
    event.preventDefault();
    const payload = normalizeTripForm(tripForm);
    if (!workspaceId || !payload.title) return;
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

  function navigateToCreate() {
    setTripState(null);
    setScreen("create");
    pushAppPath("/trips/new");
  }

  function navigateToSelect() {
    setTripState(null);
    setScreen("select");
    pushAppPath("/");
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

  async function deleteActiveTrip() {
    if (!activeTrip) return;
    await removeTrip(activeTrip);
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

  async function refreshTripState() {
    if (!activeTrip) return;
    const state = await getTripState(activeTrip.id);
    setTripState(state);
    if (!state.days.some((day) => day.id === selectedDayId)) {
      setSelectedDayId(state.days[0]?.id ?? "");
      setFocusedItemId(null);
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
    if (!editingPlaceId || !placeForm.name.trim()) return;

    await updatePlace(editingPlaceId, placeForm);
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
      const applied = applySetupActions(tripForm, response.actions);
      if (applied.changed) {
        setTripForm(applied.form);
      }
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

  async function submitChat(event: FormEvent) {
    event.preventDefault();
    const content = chatText.trim();
    if (!content || !chatSessionId) return;

    const abortController = new AbortController();
    chatAbortControllerRef.current = abortController;
    chatStreamMutedRef.current = false;
    clearChatStreamBuffer();
    setIsChatSending(true);
    setChatStreamLabel("요청을 보내는 중입니다.");
    setChatActivity(null);
    setChatRunStartedAtMs(Date.now());
    setChatStreamingText("");
    setChatOperationPreview([]);
    setChatText("");
    const startedAt = performance.now();
    const localUserMessage: ChatMessage = {
      id: `local_user_${Date.now()}`,
      chatSessionId,
      role: "user",
      content,
      status: "pending",
      metadataJson: "{}",
      createdAt: new Date().toISOString()
    };
    setMessages((current) => [...current, localUserMessage]);
    let accepted = false;
    try {
      const run = await sendChatMessage(chatSessionId, content, abortController.signal);
      accepted = true;
      setMessages((current) => [
        ...current.filter((message) => message.id !== localUserMessage.id),
        run.userMessage
      ]);
    } catch (nextError) {
      if (isAbortError(nextError)) {
        setMessages((current) => [
          ...current.map((message) =>
            message.id === localUserMessage.id ? { ...message, status: "completed" } : message
          ),
          {
            id: `local_assistant_${Date.now()}`,
            chatSessionId,
            role: "assistant",
            content: "응답 생성을 중지했습니다. 변경 사항은 적용하지 않습니다.",
            status: "cancelled",
            metadataJson: JSON.stringify({ durationMs: performance.now() - startedAt }),
            createdAt: new Date().toISOString()
          }
        ]);
        return;
      }
      setMessages((current) => [
        ...current,
        {
          id: `local_assistant_${Date.now()}`,
          chatSessionId,
          role: "assistant",
          content: `요청을 처리하지 못했습니다. ${readError(nextError)}`,
          status: "failed",
          metadataJson: JSON.stringify({ durationMs: performance.now() - startedAt }),
          createdAt: new Date().toISOString()
        }
      ]);
      setIsChatSending(false);
      setChatStreamingText("");
      setChatOperationPreview([]);
      setChatActivity(null);
      setChatRunStartedAtMs(null);
    } finally {
      if (chatAbortControllerRef.current === abortController) {
        chatAbortControllerRef.current = null;
      }
      if (!accepted && !abortController.signal.aborted) {
        setChatStreamingText("");
        setChatOperationPreview([]);
        chatStreamMutedRef.current = false;
        setIsChatSending(false);
      }
    }
  }

  async function stopChatResponse() {
    if (!chatSessionId || !isChatSending) return;
    chatStreamMutedRef.current = true;
    chatAbortControllerRef.current?.abort();
    clearChatStreamBuffer();
    setIsChatSending(false);
    setChatStreamingText("");
    setChatActivity(null);
    setChatRunStartedAtMs(null);
    setChatStreamLabel("중지됨");
    window.setTimeout(() => setChatStreamLabel(null), 1200);

    try {
      await cancelCurrentChatRun(chatSessionId);
    } catch (nextError) {
      console.debug("chat run cancel failed", nextError);
    }
  }

  if (loadState === "error") {
    return <ErrorScreen message={error ?? "앱을 불러오지 못했습니다."} onRetry={bootstrap} />;
  }

  if (screen === "create") {
    return (
      <SetupScreen
        workspaceName={workspaces.find((workspace) => workspace.id === workspaceId)?.name ?? ""}
        tripForm={tripForm}
        setupMessages={setupMessages}
        setupChatText={setupChatText}
        isSetupSending={isSetupSending}
        onTripFormChange={setTripForm}
        onSetupChatTextChange={setSetupChatText}
        onSubmitSetupChat={submitSetupChat}
        onSubmit={submitTrip}
        onCancel={navigateToSelect}
      />
    );
  }

  if (screen === "edit" && tripState && activeTrip) {
    const editorClassName = [
      "editor-shell",
      plannerCollapsed ? "planner-collapsed" : "",
      chatCollapsed ? "chat-collapsed" : ""
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <EditorScreen
        className={editorClassName}
        tripState={tripState}
        selectedDay={selectedDay}
        selectedDayId={selectedDayId}
        focusedItemId={focusedItemId}
        layout={editorLayout}
        metaForm={metaForm}
        isMetaSaving={isMetaSaving}
        onLayoutChange={setEditorLayout}
        onMetaFormChange={setMetaForm}
        onSubmitMeta={submitMeta}
        onSelectDay={(dayId) => {
          setSelectedDayId(dayId);
          setFocusedItemId(null);
        }}
        dayItems={dayItems}
        plannerCollapsed={plannerCollapsed}
        chatCollapsed={chatCollapsed}
        scheduleCollapsed={scheduleCollapsed}
        placesCollapsed={placesCollapsed}
        onTogglePlanner={() => setPlannerCollapsed((value) => !value)}
        onToggleChat={() => setChatCollapsed((value) => !value)}
        onToggleSchedule={() => setScheduleCollapsed((value) => !value)}
        onTogglePlaces={() => setPlacesCollapsed((value) => !value)}
        itemForm={itemForm}
        editingItemId={editingItemId}
        onItemFormChange={setItemForm}
        onSubmitItem={submitItem}
        onEditItem={startEditItem}
        onUsePlace={usePlaceAsItem}
        placeForm={placeForm}
        editingPlaceId={editingPlaceId}
        onPlaceFormChange={setPlaceForm}
        onSubmitPlace={submitPlace}
        onEditPlace={startEditPlace}
        onCancelEditPlace={() => {
          setEditingPlaceId(null);
          setPlaceForm(emptyPlaceForm);
        }}
        onDeletePlace={(place) => void removePlace(place)}
        onFocusItem={setFocusedItemId}
        onDeleteItem={removeItem}
        onBack={navigateToSelect}
        chatSessions={chatSessions}
        chatSessionId={chatSessionId}
        activeChatId={activeChatId}
        isChatSessionCreating={isChatSessionCreating}
        checkpoints={tripState.checkpoints}
        isRollingBack={isRollingBack}
        messages={messages}
        editRuns={editRuns}
        chatText={chatText}
        isChatSending={isChatSending}
        chatStreamLabel={chatStreamLabel}
        chatActivity={chatActivity}
        chatElapsedSeconds={chatElapsedSeconds}
        chatStreamingText={chatStreamingText}
        chatOperationPreview={chatOperationPreview}
        onSelectChatSession={(sessionId) => void selectChatSession(sessionId)}
        onCreateChatSession={() => void createNextChatSession()}
        onOpenChatList={openChatList}
        onRollbackCheckpoint={(checkpointId) => void rollbackToCheckpoint(checkpointId)}
        onChatTextChange={setChatText}
        onSubmitChat={submitChat}
        onStopChat={stopChatResponse}
        onDeleteTrip={() => void deleteActiveTrip()}
        onRenameChatSession={(session) => void renameChat(session)}
        onUpdateChatSessionTitle={(session, title) => updateChatTitle(session, title)}
        onCopyChatSession={(session) => copyChatSessionMarkdown(session)}
        onDeleteChatSession={(session) => void removeChat(session)}
      />
    );
  }

  return (
    <SelectScreen
      workspaces={workspaces}
      workspaceId={workspaceId}
      workspaceName={workspaceName}
      settingsWorkspace={settingsWorkspace}
      workspaceSettingsForm={workspaceSettingsForm}
      providerStatuses={providerStatuses}
      trips={trips}
      loading={loadState === "loading"}
      onWorkspaceChange={setWorkspaceId}
      onWorkspaceNameChange={setWorkspaceName}
      onCreateWorkspace={submitWorkspace}
      onRenameWorkspace={(workspace) => void renameWorkspace(workspace)}
      onOpenWorkspaceSettings={openWorkspaceSettings}
      onWorkspaceSettingsFormChange={setWorkspaceSettingsForm}
      onSubmitWorkspaceSettings={submitWorkspaceSettings}
      onCloseWorkspaceSettings={() => {
        setSettingsWorkspace(null);
        setWorkspaceSettingsForm(workspaceToSettingsForm(null));
      }}
      onDeleteWorkspace={(workspace) => void removeWorkspace(workspace)}
      onCreateTrip={navigateToCreate}
      onEnterTrip={enterTrip}
      onRenameTrip={(trip) => void renameTrip(trip)}
      onDeleteTrip={(trip) => void removeTrip(trip)}
    />
  );
}

function SelectScreen(props: {
  workspaces: Workspace[];
  workspaceId: string;
  workspaceName: string;
  settingsWorkspace: Workspace | null;
  workspaceSettingsForm: WorkspaceSettingsForm;
  providerStatuses: AiProviderStatus[];
  trips: Trip[];
  loading: boolean;
  onWorkspaceChange: (workspaceId: string) => void;
  onWorkspaceNameChange: (name: string) => void;
  onCreateWorkspace: (event: FormEvent) => void;
  onRenameWorkspace: (workspace: Workspace) => void;
  onOpenWorkspaceSettings: (workspace: Workspace) => void;
  onWorkspaceSettingsFormChange: (form: WorkspaceSettingsForm) => void;
  onSubmitWorkspaceSettings: (event: FormEvent) => void;
  onCloseWorkspaceSettings: () => void;
  onDeleteWorkspace: (workspace: Workspace) => void;
  onCreateTrip: () => void;
  onEnterTrip: (tripId: string) => void;
  onRenameTrip: (trip: Trip) => void;
  onDeleteTrip: (trip: Trip) => void;
}) {
  return (
    <main className="app-page select-page">
      <section className="select-shell">
        <div className="select-main">
          <div className="select-header">
            <div>
              <p className="eyebrow">Trip workspace</p>
              <h1>여행 작업실</h1>
            </div>
            <button className="primary-button" type="button" disabled={!props.workspaceId} onClick={props.onCreateTrip}>
              <Plus size={16} />
              여행 생성
            </button>
          </div>

          <div className="workspace-strip">
            {props.workspaces.map((workspace) => (
              <span className="workspace-pill" key={workspace.id}>
                <button
                  className={workspace.id === props.workspaceId ? "workspace-chip active" : "workspace-chip"}
                  type="button"
                  onClick={() => props.onWorkspaceChange(workspace.id)}
                >
                  {workspace.name}
                </button>
                <button type="button" aria-label="워크스페이스 이름 변경" onClick={() => props.onRenameWorkspace(workspace)}>
                  <Edit3 size={13} />
                </button>
                <button type="button" aria-label="워크스페이스 설정" onClick={() => props.onOpenWorkspaceSettings(workspace)}>
                  <Settings2 size={13} />
                </button>
                <button type="button" aria-label="워크스페이스 삭제" onClick={() => props.onDeleteWorkspace(workspace)}>
                  <Trash2 size={13} />
                </button>
              </span>
            ))}
            <form className="workspace-create" onSubmit={props.onCreateWorkspace}>
              <input
                value={props.workspaceName}
                onChange={(event) => props.onWorkspaceNameChange(event.target.value)}
                aria-label="워크스페이스 이름"
                placeholder="워크스페이스 이름을 입력해 주세요"
              />
              <button type="submit" aria-label="워크스페이스 추가">
                <Plus size={14} />
              </button>
            </form>
          </div>

          <div className="trip-list">
            {props.loading ? (
              <div className="empty-state">
                <CalendarDays size={22} />
                <strong>여행 목록을 불러오는 중입니다</strong>
              </div>
            ) : null}
            {!props.loading && props.trips.length === 0 ? (
              <div className="empty-state">
                <CalendarDays size={22} />
                <strong>아직 여행이 없습니다</strong>
                <span>목적지와 날짜를 정하면 편집 화면이 만들어집니다.</span>
              </div>
            ) : null}
            {props.trips.map((trip) => (
              <article className="trip-row" key={trip.id}>
                <button className="trip-row-main" type="button" onClick={() => props.onEnterTrip(trip.id)}>
                  <span className="trip-row-icon">
                    <MapPinned size={18} />
                  </span>
                  <span className="trip-row-body">
                    <strong>{trip.title}</strong>
                    <span>
                      {[trip.destinationName, formatDateRange(trip)].filter(Boolean).join(" · ") || "날짜 미정"}
                    </span>
                  </span>
                  <ChevronRight size={18} />
                </button>
                <span className="row-actions">
                  <button type="button" aria-label="여행 이름 변경" onClick={() => props.onRenameTrip(trip)}>
                    <Edit3 size={14} />
                  </button>
                  <button type="button" aria-label="여행 삭제" onClick={() => props.onDeleteTrip(trip)}>
                    <Trash2 size={14} />
                  </button>
                </span>
              </article>
            ))}
          </div>
        </div>
        {props.settingsWorkspace ? (
          <WorkspaceSettingsDialog
            workspace={props.settingsWorkspace}
            form={props.workspaceSettingsForm}
            providerStatuses={props.providerStatuses}
            onChange={props.onWorkspaceSettingsFormChange}
            onSubmit={props.onSubmitWorkspaceSettings}
            onClose={props.onCloseWorkspaceSettings}
          />
        ) : null}
      </section>
    </main>
  );
}

function WorkspaceSettingsDialog(props: {
  workspace: Workspace;
  form: WorkspaceSettingsForm;
  providerStatuses: AiProviderStatus[];
  onChange: (form: WorkspaceSettingsForm) => void;
  onSubmit: (event: FormEvent) => void;
  onClose: () => void;
}) {
  const providerOption = aiProviderOptions.find((option) => option.value === props.form.aiProvider) ?? aiProviderOptions[0];
  const isCodex = providerOption.value === "codex-app-server";
  const isOpenAiCompatible = providerOption.value === "openai-compatible";
  const isOpenRouter = providerOption.value === "openrouter";
  const hasSelectedCodexModel = codexModelOptions.some((option) => option.value === props.form.aiModel);
  const providerStatus = props.providerStatuses.find((status) => status.id === providerOption.value);

  const setField = (field: keyof WorkspaceSettingsForm, value: string) => {
    props.onChange({ ...props.form, [field]: value });
  };
  const setProvider = (value: AiProviderId) => {
    const nextProvider = aiProviderOptions.find((option) => option.value === value) ?? aiProviderOptions[0];
    props.onChange({
      ...props.form,
      aiProvider: nextProvider.value,
      aiModel: nextProvider.defaultModel,
      aiEffort: "medium"
    });
  };

  return (
    <div className="settings-overlay" role="presentation">
      <section className="settings-dialog" role="dialog" aria-modal="true" aria-labelledby="workspace-settings-title">
        <div className="settings-header">
          <div>
            <p className="eyebrow">Workspace settings</p>
            <h2 id="workspace-settings-title">워크스페이스 설정</h2>
          </div>
          <button className="icon-button" type="button" aria-label="설정 닫기" onClick={props.onClose}>
            <X size={16} />
          </button>
        </div>
        <form className="settings-form" onSubmit={props.onSubmit}>
          <label>
            <span>이름</span>
            <input value={props.form.name} onChange={(event) => setField("name", event.target.value)} />
          </label>
          <label>
            <span>AI Provider</span>
            <select value={providerOption.value} onChange={(event) => setProvider(event.target.value as AiProviderId)}>
              {aiProviderOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <small>{providerOption.description}</small>
          </label>
          <ProviderStatusCard status={providerStatus} />
          {isCodex ? (
            <>
              <label>
                <span>모델</span>
                <select value={props.form.aiModel} onChange={(event) => setField("aiModel", event.target.value)}>
                  {!hasSelectedCodexModel && props.form.aiModel ? <option value={props.form.aiModel}>{props.form.aiModel}</option> : null}
                  {codexModelOptions.map((model) => (
                    <option key={model.value} value={model.value}>
                      {model.label} · {model.description}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>추론 강도</span>
                <select value={props.form.aiEffort} onChange={(event) => setField("aiEffort", event.target.value)}>
                  {aiEffortOptions.map((effort) => (
                    <option key={effort.value} value={effort.value}>
                      {effort.label} · {effort.value} · {effort.description}
                    </option>
                  ))}
                </select>
              </label>
            </>
          ) : null}
          {isOpenAiCompatible ? (
            <>
              <label>
                <span>Base URL</span>
                <input
                  value={props.form.openAiBaseUrl}
                  onChange={(event) => setField("openAiBaseUrl", event.target.value)}
                  placeholder="https://api.openai.com/v1/chat/completions"
                />
              </label>
              <label>
                <span>API key</span>
                <input
                  value={props.form.openAiApiKey}
                  onChange={(event) => setField("openAiApiKey", event.target.value)}
                  placeholder="sk-..."
                  type="password"
                />
              </label>
              <label>
                <span>모델</span>
                <input
                  value={props.form.aiModel}
                  onChange={(event) => setField("aiModel", event.target.value)}
                  list="openai-compatible-models"
                  placeholder="gpt-5.4-mini"
                />
                <datalist id="openai-compatible-models">
                  {openAiModelSuggestions.map((model) => (
                    <option key={model} value={model} />
                  ))}
                </datalist>
              </label>
            </>
          ) : null}
          {isOpenRouter ? (
            <>
              <label>
                <span>OpenRouter API key</span>
                <input
                  value={props.form.openRouterApiKey}
                  onChange={(event) => setField("openRouterApiKey", event.target.value)}
                  placeholder="sk-or-..."
                  type="password"
                />
              </label>
              <label>
                <span>모델</span>
                <input
                  value={props.form.aiModel}
                  onChange={(event) => setField("aiModel", event.target.value)}
                  list="openrouter-models"
                  placeholder="openai/gpt-5.2"
                />
                <datalist id="openrouter-models">
                  {openRouterModelSuggestions.map((model) => (
                    <option key={model} value={model} />
                  ))}
                </datalist>
              </label>
              <label>
                <span>HTTP-Referer</span>
                <input
                  value={props.form.openRouterReferer}
                  onChange={(event) => setField("openRouterReferer", event.target.value)}
                  placeholder="http://localhost:5173"
                />
              </label>
              <label>
                <span>X-OpenRouter-Title</span>
                <input
                  value={props.form.openRouterTitle}
                  onChange={(event) => setField("openRouterTitle", event.target.value)}
                  placeholder="Trip Planner"
                />
              </label>
            </>
          ) : null}
          <div className="settings-summary">
            <strong>{props.workspace.name}</strong>
            <span>
              {providerOption.label} · {props.form.aiModel || "모델 미입력"}
              {isCodex ? ` · ${props.form.aiEffort}` : ""}
            </span>
          </div>
          <div className="form-actions">
            <button type="button" className="secondary-button" onClick={props.onClose}>
              취소
            </button>
            <button type="submit" className="primary-button">
              저장
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function ProviderStatusCard(props: { status?: AiProviderStatus }) {
  if (!props.status) {
    return (
      <div className="provider-status-card muted">
        <strong>상태 확인 중</strong>
        <span>설정 창을 열면 서버에서 공급자 상태를 확인합니다.</span>
      </div>
    );
  }

  return (
    <div className={props.status.available ? "provider-status-card ready" : "provider-status-card"}>
      <div className="provider-status-head">
        <strong>{props.status.displayName}</strong>
        <span>{providerStatusLabel(props.status.status)}</span>
      </div>
      {props.status.detail ? <p>{props.status.detail}</p> : null}
      {props.status.checks.length > 0 ? (
        <div className="provider-check-list">
          {props.status.checks.map((check) => (
            <span className={`provider-check ${check.status}`} key={`${check.label}-${check.detail ?? ""}`}>
              <strong>{check.label}</strong>
              <em>{providerCheckStatusLabel(check.status)}</em>
              {check.detail ? <small>{check.detail}</small> : null}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SetupScreen(props: {
  workspaceName: string;
  tripForm: TripFormState;
  setupMessages: SetupAssistantMessage[];
  setupChatText: string;
  isSetupSending: boolean;
  onTripFormChange: (form: TripFormState) => void;
  onSetupChatTextChange: (text: string) => void;
  onSubmitSetupChat: (event: FormEvent) => void;
  onSubmit: (event: FormEvent) => void;
  onCancel: () => void;
}) {
  const setField = (field: TripTextField, value: string) => {
    props.onTripFormChange({
      ...props.tripForm,
      [field]: value,
      ...(field === "destinationName" ? { destinationLat: null, destinationLng: null } : {})
    });
  };

  return (
    <main className="app-page setup-page">
      <section className="setup-shell">
        <div className="setup-column">
          <div className="form-heading">
            <div>
              <p className="eyebrow">{props.workspaceName || "Workspace"}</p>
              <h1>새 여행 만들기</h1>
            </div>
            <button className="text-back-button" type="button" onClick={props.onCancel}>
              <ChevronLeft size={16} />
              목록
            </button>
          </div>

          <form className="setup-form" onSubmit={props.onSubmit}>
            <label className="field">
              <span>여행 이름</span>
              <input value={props.tripForm.title} onChange={(event) => setField("title", event.target.value)} autoFocus />
            </label>
            <label className="field">
              <span>목적지</span>
              <input
                value={props.tripForm.destinationName}
                onChange={(event) => setField("destinationName", event.target.value)}
                placeholder="예: 오키나와"
              />
            </label>
            <DateRangeCalendar
              startDate={props.tripForm.startDate}
              endDate={props.tripForm.endDate}
              onChange={(startDate, endDate) => props.onTripFormChange({ ...props.tripForm, startDate, endDate })}
            />
            <div className="form-actions">
              <button className="secondary-button" type="button" onClick={props.onCancel}>
                취소
              </button>
              <button className="primary-button" type="submit" disabled={!props.tripForm.title.trim()}>
                편집 시작
              </button>
            </div>
          </form>
        </div>

        <aside className="setup-chat-panel">
          <div className="chat-header">
            <div>
              <strong>초안 설계</strong>
              <span>날짜와 취향 정리</span>
            </div>
            <span className="header-icon" aria-hidden="true">
              <Bot size={20} />
            </span>
          </div>
          <div className="setup-chat-log">
            {props.setupMessages.map((message, index) => (
              <SetupMessageBubble message={message} key={`${message.role}-${index}`} />
            ))}
            {props.isSetupSending ? <div className="assistant-message pending">정리 중입니다.</div> : null}
          </div>
          <div className="quick-prompts">
            {["렌터카 기준으로 권역을 나눠줘", "가족 여행이라 무리 없는 일정이 좋아", "맛집과 카페를 일정 중간에 넣고 싶어"].map(
              (prompt) => (
                <button key={prompt} type="button" onClick={() => props.onSetupChatTextChange(prompt)}>
                  {prompt}
                </button>
              )
            )}
          </div>
          <form className="chat-form" onSubmit={props.onSubmitSetupChat}>
            <textarea
              value={props.setupChatText}
              onChange={(event) => props.onSetupChatTextChange(event.target.value)}
              onKeyDown={(event) => submitOnCommandEnter(event)}
              placeholder="동행, 이동 방식, 꼭 가고 싶은 곳을 입력하세요. Enter 전송, Shift/Option+Enter 줄바꿈"
              rows={3}
            />
            <button className="send-button" type="submit" disabled={!props.setupChatText.trim() || props.isSetupSending}>
              <Send size={16} />
            </button>
          </form>
        </aside>
      </section>
    </main>
  );
}

function DateRangeCalendar(props: {
  startDate: string;
  endDate: string;
  onChange: (startDate: string, endDate: string) => void;
}) {
  const initialMonth = props.startDate ? parseIsoDate(props.startDate) : new Date();
  const [cursor, setCursor] = useState(() => new Date(initialMonth.getFullYear(), initialMonth.getMonth(), 1));

  useEffect(() => {
    if (props.startDate) {
      const next = parseIsoDate(props.startDate);
      setCursor(new Date(next.getFullYear(), next.getMonth(), 1));
    }
  }, [props.startDate]);

  const cells = useMemo(() => buildCalendarCells(cursor), [cursor]);

  function moveMonth(offset: number) {
    setCursor((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

  function selectDate(iso: string) {
    if (!props.startDate || props.endDate || iso < props.startDate) {
      props.onChange(iso, "");
      return;
    }
    props.onChange(props.startDate, iso);
  }

  return (
    <div className="calendar-card">
      <div className="calendar-header">
        <button className="icon-button small" type="button" aria-label="이전 달" onClick={() => moveMonth(-1)}>
          <ChevronLeft size={15} />
        </button>
        <strong>
          {cursor.getFullYear()}년 {cursor.getMonth() + 1}월
        </strong>
        <button className="icon-button small" type="button" aria-label="다음 달" onClick={() => moveMonth(1)}>
          <ChevronRight size={15} />
        </button>
      </div>
      <div className="weekday-grid">
        {weekdayLabels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div className="calendar-grid">
        {cells.map((cell) => {
          const isSelected = cell.iso === props.startDate || cell.iso === props.endDate;
          const inRange = Boolean(props.startDate && props.endDate && cell.iso > props.startDate && cell.iso < props.endDate);
          const className = [
            "calendar-day",
            cell.currentMonth ? "" : "outside",
            isSelected ? "selected" : "",
            inRange ? "in-range" : ""
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <button className={className} key={cell.iso} type="button" onClick={() => selectDate(cell.iso)}>
              {cell.day}
            </button>
          );
        })}
      </div>
      <div className="calendar-summary">
        <span>{props.startDate || "시작일"}</span>
        <span>{props.endDate || "종료일"}</span>
      </div>
    </div>
  );
}

function EditorScreen(props: {
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
  onUsePlace: (place: Place) => void;
  placeForm: UpsertPlaceRequest;
  editingPlaceId: string | null;
  onPlaceFormChange: (form: UpsertPlaceRequest) => void;
  onSubmitPlace: (event: FormEvent) => void;
  onEditPlace: (place: Place) => void;
  onCancelEditPlace: () => void;
  onDeletePlace: (place: Place) => void;
  onFocusItem: (itemId: string) => void;
  onDeleteItem: (itemId: string) => void;
  onBack: () => void;
  chatSessions: ChatSession[];
  chatSessionId: string;
  activeChatId: string | null;
  isChatSessionCreating: boolean;
  checkpoints: CheckpointSummary[];
  isRollingBack: boolean;
  messages: ChatMessage[];
  editRuns: AiEditRunSummary[];
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
  onSubmitChat: (event: FormEvent) => void;
  onStopChat: () => void;
  onDeleteTrip: () => void;
  onRenameChatSession: (session: ChatSession) => void;
  onUpdateChatSessionTitle: (session: ChatSession, title: string) => Promise<void>;
  onCopyChatSession: (session: ChatSession) => Promise<void>;
  onDeleteChatSession: (session: ChatSession) => void;
}) {
  const routeNumbers = new Map<string, number>();
  props.dayItems.filter(hasCoordinates).forEach((item, index) => routeNumbers.set(item.id, index + 1));
  const visiblePlaces = dedupePlaces(props.tripState.places);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(() => new Set());
  const [expandedPlaces, setExpandedPlaces] = useState<Set<string>>(() => new Set());
  const activeChatSession = props.chatSessions.find((session) => session.id === props.activeChatId) ?? null;
  const [chatTitleDraft, setChatTitleDraft] = useState(activeChatSession?.title ?? "");
  const [isChatTitleSaving, setIsChatTitleSaving] = useState(false);
  const [isChatMarkdownCopied, setIsChatMarkdownCopied] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [showScrollToLatest, setShowScrollToLatest] = useState(false);
  const [mobileView, setMobileView] = useState<MobileEditorView>(() => (props.activeChatId ? "chat" : "planner"));
  const lineBreakModifier = isWindowsUserAgent() ? "Alt" : "Option";
  const chatLogRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoScrollChatRef = useRef(true);
  const editorClassName = [
    props.className,
    mobileView === "chat" ? "mobile-chat-open" : "mobile-planner-open",
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
    if (props.activeChatId) {
      setMobileView("chat");
    }
  }, [props.activeChatId]);

  useLayoutEffect(() => {
    setChatTitleDraft(activeChatSession?.title ?? "");
    setIsChatMarkdownCopied(false);
    shouldAutoScrollChatRef.current = true;
    setShowScrollToLatest(false);
    scrollChatToLatest("auto");
  }, [activeChatSession?.id, activeChatSession?.title]);

  useLayoutEffect(() => {
    const chatLog = chatLogRef.current;
    if (!chatLog) return;

    if (shouldAutoScrollChatRef.current || isChatLogNearBottom(chatLog)) {
      scrollChatToLatest("auto");
    } else if (props.isChatSending || props.chatStreamingText) {
      setShowScrollToLatest(true);
    }
  }, [
    props.messages.length,
    props.chatStreamingText,
    props.isChatSending,
    props.chatOperationPreview.length,
    props.chatActivity?.detail,
    props.chatActivity?.label
  ]);

  function scrollChatToLatest(behavior: ScrollBehavior = "smooth") {
    const chatLog = chatLogRef.current;
    if (!chatLog) return;
    chatLog.scrollTo({ top: chatLog.scrollHeight, behavior });
    shouldAutoScrollChatRef.current = true;
    setShowScrollToLatest(false);
  }

  function handleChatLogScroll() {
    const chatLog = chatLogRef.current;
    if (!chatLog) return;
    const nearBottom = isChatLogNearBottom(chatLog);
    shouldAutoScrollChatRef.current = nearBottom;
    if (nearBottom) {
      setShowScrollToLatest(false);
    } else if (props.isChatSending || props.chatStreamingText) {
      setShowScrollToLatest(true);
    }
  }

  function submitChatForm(event: FormEvent) {
    shouldAutoScrollChatRef.current = true;
    setShowScrollToLatest(false);
    props.onSubmitChat(event);
    window.requestAnimationFrame(() => scrollChatToLatest("auto"));
  }

  async function submitActiveChatTitle(event: FormEvent) {
    event.preventDefault();
    const title = chatTitleDraft.trim();
    if (!activeChatSession || !title || title === activeChatSession.title) return;

    setIsChatTitleSaving(true);
    try {
      await props.onUpdateChatSessionTitle(activeChatSession, title);
    } finally {
      setIsChatTitleSaving(false);
    }
  }

  async function copyActiveChatMarkdown() {
    if (!activeChatSession) return;
    await props.onCopyChatSession(activeChatSession);
    setIsChatMarkdownCopied(true);
    window.setTimeout(() => setIsChatMarkdownCopied(false), 1600);
  }

  async function copyChatMessageMarkdown(message: ChatMessage) {
    await writeClipboardText(buildChatMessageContentMarkdown(message));
    setCopiedMessageId(message.id);
    window.setTimeout(() => setCopiedMessageId(null), 1400);
  }

  function openMobileChatList() {
    if (props.chatCollapsed) {
      props.onToggleChat();
    }
    props.onOpenChatList();
    setMobileView("chat");
  }

  function closeMobileChat() {
    setMobileView("planner");
  }

  function openChatList() {
    props.onOpenChatList();
    setMobileView("chat");
  }

  function createChatSession() {
    if (props.chatCollapsed) {
      props.onToggleChat();
    }
    setMobileView("chat");
    props.onCreateChatSession();
  }

  function selectChatSession(sessionId: string) {
    setMobileView("chat");
    props.onSelectChatSession(sessionId);
  }

  function startPanelResize(event: ReactPointerEvent, panel: "planner" | "chat") {
    event.preventDefault();
    const startX = event.clientX;
    const startLayout = props.layout;
    setDocumentResizeState(panel === "planner" ? "col-resize" : "col-resize");

    const handleMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      props.onLayoutChange({
        ...startLayout,
        plannerWidth:
          panel === "planner"
            ? clampNumber(startLayout.plannerWidth + deltaX, 420, 580)
            : startLayout.plannerWidth,
        chatWidth:
          panel === "chat"
            ? clampNumber(startLayout.chatWidth - deltaX, 360, 560)
            : startLayout.chatWidth
      });
    };
    const handleUp = () => {
      clearDocumentResizeState();
      window.removeEventListener("pointermove", handleMove);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp, { once: true });
  }

  function toggleExpandedItem(itemId: string) {
    setExpandedItems((current) => {
      const next = new Set(current);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }

  function toggleExpandedPlace(placeId: string) {
    setExpandedPlaces((current) => {
      const next = new Set(current);
      if (next.has(placeId)) {
        next.delete(placeId);
      } else {
        next.add(placeId);
      }
      return next;
    });
  }

  function startPlacesResize(event: ReactPointerEvent) {
    event.preventDefault();
    const startY = event.clientY;
    const startLayout = props.layout;
    setDocumentResizeState("row-resize");

    const handleMove = (moveEvent: PointerEvent) => {
      const deltaY = moveEvent.clientY - startY;
      props.onLayoutChange({
        ...startLayout,
        placesHeight: clampNumber(startLayout.placesHeight - deltaY, 190, 520)
      });
    };
    const handleUp = () => {
      clearDocumentResizeState();
      window.removeEventListener("pointermove", handleMove);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp, { once: true });
  }

  return (
    <main className={editorClassName} style={layoutStyle}>
      {!props.plannerCollapsed ? (
        <aside className="planner-sidebar">
          <div className="panel-header">
            <button className="text-back-button" type="button" onClick={props.onBack}>
              <ChevronLeft size={16} />
              여행 목록
            </button>
            <div className="panel-header-actions">
              <button className="secondary-button mobile-chat-entry" type="button" onClick={openMobileChatList}>
                <Bot size={15} />
                대화
              </button>
              <button className="icon-button" type="button" aria-label="왼쪽 패널 접기" onClick={props.onTogglePlanner}>
                <PanelLeftClose size={17} />
              </button>
            </div>
          </div>

          <TripMetaForm
            form={props.metaForm}
            saving={props.isMetaSaving}
            onChange={props.onMetaFormChange}
            onSubmit={props.onSubmitMeta}
            onDelete={props.onDeleteTrip}
          />

          <div className="planner-sections">
            <section className={props.scheduleCollapsed ? "sidebar-section schedule-section collapsed" : "sidebar-section schedule-section"}>
              <button
                className="section-toggle"
                type="button"
                aria-expanded={!props.scheduleCollapsed}
                onClick={props.onToggleSchedule}
              >
                <span className="section-title">
                  <CalendarDays size={16} />
                  <span>일정</span>
                  <em>{props.dayItems.length}개</em>
                </span>
                <ChevronRight size={16} />
              </button>
              {!props.scheduleCollapsed ? (
                <div className="section-body">
                  <div className="day-rail">
                    {props.tripState.days.map((day) => (
                      <button
                        className={day.id === props.selectedDayId ? "day-card active" : "day-card"}
                        key={day.id}
                        type="button"
                        onClick={() => props.onSelectDay(day.id)}
                      >
                        <strong>Day {day.dayNumber}</strong>
                        <span>{day.dateText ?? "날짜 미정"}</span>
                        <em>{day.weekday ?? ""}</em>
                      </button>
                    ))}
                  </div>

                  <ItemForm
                    form={props.itemForm}
                    editing={Boolean(props.editingItemId)}
                    onChange={props.onItemFormChange}
                    onSubmit={props.onSubmitItem}
                  />

                  <div className="node-list">
                    {props.dayItems.length === 0 ? (
                      <div className="empty-state compact">
                        <strong>이 날의 일정이 비어 있습니다</strong>
                        <span>시간, 장소, 메모를 추가하면 지도에 순서대로 표시됩니다.</span>
                      </div>
                    ) : null}
                    {props.dayItems.map((item) => {
                      const routeNumber = routeNumbers.get(item.id);
                      const isMappable = routeNumber != null;
                      const memoText = itineraryMemoText(item);
                      const expanded = expandedItems.has(item.id) || item.id === props.editingItemId;
                      const previewText = previewItineraryMemo(memoText);
                      const expandable = previewText !== memoText || hasVisuallyLongItineraryLine(memoText);
                      return (
                        <article
                          className={[
                            item.id === props.focusedItemId ? "plan-node focused" : "plan-node",
                            isMappable ? "" : "memo-node",
                            expanded ? "expanded" : ""
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          key={item.id}
                        >
                          <button
                            className={isMappable ? "node-sequence" : "node-sequence memo"}
                            type="button"
                            aria-label={isMappable ? `${item.title} 지도에서 보기` : `${item.title} 메모 노드`}
                            disabled={!isMappable}
                            onClick={() => props.onFocusItem(item.id)}
                          >
                            {isMappable ? routeNumber : "메모"}
                          </button>
                          <div className="node-content">
                            <div className="node-title-row">
                              <strong>{item.title}</strong>
                              <span>{item.timeText || "시간 미정"}</span>
                            </div>
                            <div className={expanded ? "node-memo expanded" : "node-memo"}>
                              {expandable && !expanded ? previewText : memoText}
                            </div>
                            {expandable ? (
                              <button
                                className="memo-toggle"
                                type="button"
                                aria-expanded={expanded}
                                onClick={() => toggleExpandedItem(item.id)}
                              >
                                <span>{expanded ? "접기" : "전체 보기"}</span>
                                <em>{expanded ? "요약" : itineraryMemoCountLabel(memoText)}</em>
                                {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </button>
                            ) : null}
                            <div className="node-actions">
                              <button type="button" disabled={!isMappable} onClick={() => props.onFocusItem(item.id)}>
                                <Navigation size={14} />
                                {isMappable ? "지도" : "좌표 없음"}
                              </button>
                              <button type="button" onClick={() => props.onEditItem(item)}>
                                <Edit3 size={14} />
                                수정
                              </button>
                              <button className="danger-action" type="button" onClick={() => props.onDeleteItem(item.id)}>
                                <Trash2 size={14} />
                                삭제
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </section>

            {!props.scheduleCollapsed && !props.placesCollapsed ? (
              <div
                className="sidebar-splitter"
                role="separator"
                aria-label="일정과 조사 장소 높이 조절"
                aria-orientation="horizontal"
                onPointerDown={startPlacesResize}
              />
            ) : null}

            <section className={props.placesCollapsed ? "sidebar-section places-section collapsed" : "sidebar-section places-section"}>
              <button
                className="section-toggle"
                type="button"
                aria-expanded={!props.placesCollapsed}
                onClick={props.onTogglePlaces}
              >
                <span className="section-title">
                  <MapPinned size={16} />
                  <span>조사 장소</span>
                  <em>{visiblePlaces.length}곳</em>
                </span>
                <ChevronRight size={16} />
              </button>
              {!props.placesCollapsed ? (
                <div className="section-body">
                  {visiblePlaces.length === 0 ? (
                    <div className="empty-state compact">
                      <strong>후보 장소가 없습니다</strong>
                      <span>장소를 추가하면 일정 노드로 바로 가져올 수 있습니다.</span>
                    </div>
                  ) : null}
                  {visiblePlaces.map((place) => {
                    const localName = localizedPlaceName(place);
                    const detailText = placeDetailText(place);
                    const expanded = expandedPlaces.has(place.id) || props.editingPlaceId === place.id;
                    const previewText = previewPlaceDetail(detailText);
                    const expandable = previewText !== detailText || hasVisuallyLongPlaceLine(detailText);
                    return (
                      <article
                        className={[
                          "place-card",
                          expanded ? "expanded" : "",
                          props.editingPlaceId === place.id ? "editing" : ""
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        key={place.id}
                      >
                        {props.editingPlaceId === place.id ? (
                          <PlaceForm
                            form={props.placeForm}
                            onChange={props.onPlaceFormChange}
                            onSubmit={props.onSubmitPlace}
                            onCancel={props.onCancelEditPlace}
                          />
                        ) : (
                          <>
                            <div className="place-card-main">
                              <strong>{localName}</strong>
                              {localName !== place.name ? <em>{place.name}</em> : null}
                              <span className={expanded ? "place-detail expanded" : "place-detail"}>
                                {expandable && !expanded ? previewText : detailText || "설명 없음"}
                              </span>
                              {expandable ? (
                                <button
                                  className="memo-toggle place-toggle"
                                  type="button"
                                  aria-expanded={expanded}
                                  onClick={() => toggleExpandedPlace(place.id)}
                                >
                                  <span>{expanded ? "접기" : "전체 보기"}</span>
                                  <em>{expanded ? "요약" : placeDetailCountLabel(detailText)}</em>
                                  {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </button>
                              ) : null}
                            </div>
                            <div className="place-actions">
                              <button type="button" onClick={() => props.onUsePlace(place)}>
                                <Plus size={14} />
                                일정
                              </button>
                              <button type="button" onClick={() => props.onEditPlace(place)}>
                                <Edit3 size={14} />
                                수정
                              </button>
                              <button className="danger-action" type="button" onClick={() => props.onDeletePlace(place)}>
                                <Trash2 size={14} />
                                삭제
                              </button>
                            </div>
                          </>
                        )}
                      </article>
                    );
                  })}
                </div>
              ) : null}
            </section>
          </div>
        </aside>
      ) : (
        <button className="map-panel-button left" type="button" aria-label="일정과 장소 열기" onClick={props.onTogglePlanner}>
          <PanelLeftOpen size={18} />
        </button>
      )}

      {!props.plannerCollapsed ? (
        <div
          className="panel-resizer planner-resizer"
          role="separator"
          aria-label="왼쪽 패널 너비 조절"
          aria-orientation="vertical"
          onPointerDown={(event) => startPanelResize(event, "planner")}
        />
      ) : null}

      <section className="map-zone">
        <MapCanvas
          tripState={props.tripState}
          dayItems={props.dayItems}
          selectedDay={props.selectedDay}
          focusedItemId={props.focusedItemId}
          layoutKey={`${props.plannerCollapsed}-${props.chatCollapsed}-${props.layout.plannerWidth}-${props.layout.chatWidth}-${props.layout.placesHeight}`}
        />
      </section>

      {!props.chatCollapsed ? (
        <div
          className="panel-resizer chat-resizer"
          role="separator"
          aria-label="AI 대화 패널 너비 조절"
          aria-orientation="vertical"
          onPointerDown={(event) => startPanelResize(event, "chat")}
        />
      ) : null}

      {!props.chatCollapsed ? (
        <aside className="chat-panel">
          <div className="chat-header">
            <div className="chat-header-main">
              <button className="text-back-button compact mobile-planner-entry" type="button" onClick={closeMobileChat}>
                <ChevronLeft size={16} />
                여행
              </button>
              <div className="chat-heading">
                {props.activeChatId ? (
                  <>
                    <strong>AI 대화</strong>
                    <span>메시지별 복사와 변경 내역을 확인합니다</span>
                  </>
                ) : (
                  <>
                    <strong>AI 대화</strong>
                    <span>주제별로 나눠서 이어갑니다</span>
                  </>
                )}
              </div>
            </div>
            <div className="chat-header-actions">
              <button
                className="icon-button"
                type="button"
                aria-label="새 대화"
                disabled={props.isChatSessionCreating}
                onClick={createChatSession}
              >
                <Plus size={17} />
              </button>
              <button className="icon-button desktop-chat-collapse" type="button" aria-label="일정 조율 접기" onClick={props.onToggleChat}>
                <PanelRightClose size={17} />
              </button>
            </div>
          </div>
          {props.activeChatId ? (
            <>
              <div className="active-chat-title">
                {activeChatSession ? (
                  <form className="active-chat-toolbar" onSubmit={submitActiveChatTitle}>
                    <button className="text-back-button compact" type="button" onClick={openChatList}>
                      <ChevronLeft size={16} />
                      목록
                    </button>
                    <div className="active-chat-name-field">
                      <input
                        value={chatTitleDraft}
                        onChange={(event) => setChatTitleDraft(event.target.value)}
                        aria-label="현재 대화 이름"
                        placeholder="대화 이름"
                      />
                    </div>
                    <button
                      className="secondary-button compact-save"
                      type="submit"
                      disabled={isChatTitleSaving || !chatTitleDraft.trim() || chatTitleDraft.trim() === activeChatSession.title}
                    >
                      <Save size={14} />
                      저장
                    </button>
                    <button className="secondary-button compact-save" type="button" onClick={() => void copyActiveChatMarkdown()}>
                      <Copy size={14} />
                      {isChatMarkdownCopied ? "복사됨" : "전체 복사"}
                    </button>
                  </form>
                ) : null}
              </div>
              <div className="chat-log-frame">
                <div className="chat-log" ref={chatLogRef} onScroll={handleChatLogScroll}>
                  {props.messages.length === 0 ? (
                    <div className="assistant-message">
                      <p>전체 일정 조정, 날짜별 권역 변경, 장소 추가 요청을 이곳에서 이어갈 수 있습니다.</p>
                    </div>
                  ) : null}
                  {props.messages.map((message, index) => (
                    <ChatMessageBubble
                      copied={copiedMessageId === message.id}
                      editRuns={props.editRuns}
                      key={message.id}
                      message={message}
                      messageIndex={index + 1}
                      onCopyMessage={(targetMessage) => void copyChatMessageMarkdown(targetMessage)}
                      previousUserMessage={findPreviousUserMessage(props.messages, message.id)}
                    />
                  ))}
                  {props.isChatSending ? (
                    <div className={props.chatStreamingText ? "assistant-message streaming" : "assistant-message pending"}>
                      {props.chatStreamingText ? (
                        <>
                          {props.chatActivity ? (
                            <div className="chat-activity-strip">
                              <ChatPendingStatus
                                activity={props.chatActivity}
                                elapsedSeconds={props.chatElapsedSeconds}
                                label={props.chatStreamLabel}
                              />
                            </div>
                          ) : null}
                          <MarkdownContent content={props.chatStreamingText} />
                        </>
                      ) : (
                        <ChatPendingStatus
                          activity={props.chatActivity}
                          elapsedSeconds={props.chatElapsedSeconds}
                          label={props.chatStreamLabel}
                        />
                      )}
                      <OperationPreviewList items={props.chatOperationPreview} status="pending" defaultOpen />
                    </div>
                  ) : null}
                </div>
                {showScrollToLatest ? (
                  <button className="chat-scroll-latest" type="button" onClick={() => scrollChatToLatest()}>
                    <ChevronDown size={14} />
                    최신으로
                  </button>
                ) : null}
              </div>
              <form className="chat-form" onSubmit={submitChatForm}>
                <textarea
                  value={props.chatText}
                  onChange={(event) => props.onChatTextChange(event.target.value)}
                  onKeyDown={(event) => submitOnCommandEnter(event)}
                  placeholder={`Enter 전송, Shift/${lineBreakModifier}+Enter 줄바꿈`}
                  rows={3}
                />
                {props.isChatSending ? (
                  <button className="send-button stop" type="button" aria-label="응답 중지" onClick={props.onStopChat}>
                    <X size={16} />
                  </button>
                ) : (
                  <button className="send-button" type="submit" disabled={!props.chatText.trim()}>
                    <Send size={16} />
                  </button>
                )}
              </form>
            </>
          ) : (
            <ChatHome
              sessions={props.chatSessions}
              checkpoints={props.checkpoints}
              creating={props.isChatSessionCreating}
              rollingBack={props.isRollingBack}
              onCreateSession={createChatSession}
              onSelectSession={selectChatSession}
              onRenameSession={props.onRenameChatSession}
              onCopySession={props.onCopyChatSession}
              onDeleteSession={props.onDeleteChatSession}
              onRollbackCheckpoint={props.onRollbackCheckpoint}
            />
          )}
        </aside>
      ) : (
        <button className="map-panel-button right" type="button" aria-label="일정 조율 열기" onClick={props.onToggleChat}>
          <PanelRightOpen size={18} />
        </button>
      )}
    </main>
  );
}

function SetupMessageBubble(props: { message: SetupAssistantMessage }) {
  const isUser = props.message.role === "user";
  return (
    <div className={isUser ? "user-message" : "assistant-message"}>
      <MarkdownContent content={props.message.content} />
      {!isUser && props.message.appliedActions?.length ? (
        <div className="setup-action-summary">
          <CheckCircle2 size={13} />
          <span>폼에 반영됨: {props.message.appliedActions.join(", ")}</span>
        </div>
      ) : null}
      {!isUser && props.message.durationMs != null ? (
        <div className="message-meta">
          <Clock3 size={12} />
          <span>{formatDuration(props.message.durationMs)}</span>
        </div>
      ) : null}
    </div>
  );
}

function ChatMessageBubble(props: {
  copied: boolean;
  message: ChatMessage;
  messageIndex: number;
  editRuns: AiEditRunSummary[];
  onCopyMessage: (message: ChatMessage) => void;
  previousUserMessage: ChatMessage | null;
}) {
  const isUser = props.message.role === "user";
  const editRun = isUser ? null : props.editRuns.find((run) => run.assistantMessageId === props.message.id) ?? null;
  const durationMs = isUser ? null : messageDurationMs(props.message, props.editRuns, props.previousUserMessage);

  return (
    <div className={isUser ? "user-message" : "assistant-message"}>
      <MarkdownContent content={props.message.content} />
      {!isUser ? <OperationPreviewList items={editRun?.operationPreview ?? []} status={editRun?.status} /> : null}
      <div className="message-meta">
        <Clock3 size={12} />
        <span>{formatDateTime(props.message.createdAt)}</span>
        {durationMs != null ? <span>{formatDuration(durationMs)}</span> : null}
        {editRun ? <span>{editRun.operationCount > 0 ? `변경 ${editRun.operationCount}개` : "변경 없음"}</span> : null}
        <button
          type="button"
          aria-label="메시지를 Markdown으로 복사"
          title={`메시지 ${props.messageIndex} Markdown 복사`}
          onClick={() => props.onCopyMessage(props.message)}
        >
          <Copy size={12} />
          {props.copied ? "복사됨" : "복사"}
        </button>
      </div>
    </div>
  );
}

function OperationPreviewList(props: { items: string[]; status?: string | null; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(Boolean(props.defaultOpen));
  if (!props.items.length) return null;
  const label = props.status === "applied" || props.status === "completed" ? "변경 내역" : "변경 미리보기";
  return (
    <div className="operation-preview">
      <button className="operation-preview-toggle" type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <strong>{label}</strong>
        <span>{props.items.length}개</span>
        <ChevronRight size={14} />
      </button>
      {open ? (
        <ul>
          {props.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function MarkdownContent(props: { content: string }) {
  return (
    <div className="message-content">
      <ReactMarkdown remarkPlugins={markdownPlugins}>{normalizeMarkdownForRender(props.content)}</ReactMarkdown>
    </div>
  );
}

function normalizeMarkdownForRender(content: string) {
  return content
    .replace(/참고\s*स्रोत/g, "출처")
    .replace(/^Sources:\s*$/gm, "출처:")
    .replace(/([^\s\n])-\s+(?=\S)/g, "$1\n- ");
}

type MarkdownNode = {
  type?: string;
  value?: string;
  children?: MarkdownNode[];
  [key: string]: unknown;
};

function remarkLenientStrong() {
  return (tree: MarkdownNode) => {
    transformLenientStrong(tree);
  };
}

function transformLenientStrong(node: MarkdownNode) {
  if (!Array.isArray(node.children)) return;
  node.children = transformMarkdownChildren(node.children);
}

function transformMarkdownChildren(children: MarkdownNode[]): MarkdownNode[] {
  const output: MarkdownNode[] = [];
  let strongBuffer: MarkdownNode[] | null = null;

  const target = () => strongBuffer ?? output;
  const pushText = (value: string) => {
    if (value) target().push({ type: "text", value });
  };
  const closeStrong = () => {
    if (!strongBuffer) return;
    output.push({ type: "strong", children: strongBuffer });
    strongBuffer = null;
  };

  children.forEach((child) => {
    if (child.type !== "text" || typeof child.value !== "string") {
      transformLenientStrong(child);
      target().push(child);
      return;
    }

    let rest = child.value;
    while (rest.length > 0) {
      const markerIndex = rest.indexOf("**");
      if (markerIndex < 0) {
        pushText(rest);
        break;
      }

      pushText(rest.slice(0, markerIndex));
      if (strongBuffer) {
        closeStrong();
      } else {
        strongBuffer = [];
      }
      rest = rest.slice(markerIndex + 2);
    }
  });

  const danglingBuffer = strongBuffer as MarkdownNode[] | null;
  if (danglingBuffer) {
    output.push({ type: "text", value: "**" });
    danglingBuffer.forEach((node) => output.push(node));
  }

  return output;
}

function ChatPendingStatus(props: {
  activity: ChatRunActivityEvent | null;
  elapsedSeconds: number;
  label: string | null;
}) {
  const label = chatPendingLabel(props.label, props.activity, props.elapsedSeconds);
  const detail = chatActivityDetail(props.activity);
  return (
    <div className="chat-pending-status">
      <span>{label}</span>
      {props.elapsedSeconds > 0 ? <small>{formatElapsedSeconds(props.elapsedSeconds)} 경과</small> : null}
      {detail ? <em>{detail}</em> : null}
    </div>
  );
}

function ChatHome(props: {
  sessions: ChatSession[];
  checkpoints: CheckpointSummary[];
  creating: boolean;
  rollingBack: boolean;
  onCreateSession: () => void;
  onSelectSession: (sessionId: string) => void;
  onRenameSession: (session: ChatSession) => void;
  onCopySession: (session: ChatSession) => Promise<void>;
  onDeleteSession: (session: ChatSession) => void;
  onRollbackCheckpoint: (checkpointId: string) => void;
}) {
  const [copiedSessionId, setCopiedSessionId] = useState<string | null>(null);

  async function copySession(session: ChatSession) {
    await props.onCopySession(session);
    setCopiedSessionId(session.id);
    window.setTimeout(() => setCopiedSessionId(null), 1400);
  }

  return (
    <div className="chat-home">
      <section className="chat-home-section">
        <div className="chat-home-title">
          <strong>대화</strong>
          <div className="new-chat-controls">
            <button
              className="primary-button small-action"
              type="button"
              disabled={props.creating}
              onClick={props.onCreateSession}
            >
              <Plus size={15} />
              새 대화
            </button>
          </div>
        </div>
        <div className="chat-session-list">
          {props.sessions.length === 0 ? (
            <div className="empty-state compact">
              <strong>아직 대화가 없습니다</strong>
              <span>새 대화를 만들고 여행 계획을 조율하세요.</span>
            </div>
          ) : null}
          {props.sessions.map((session) => (
            <article className="chat-session-row" key={session.id}>
              <button className="chat-session-main" type="button" onClick={() => props.onSelectSession(session.id)}>
                <span>
                  <strong>{session.title}</strong>
                  <em>{formatDateTime(session.updatedAt)}</em>
                </span>
                <ChevronRight size={16} />
              </button>
              <span className="row-actions">
                <button type="button" aria-label="대화 Markdown 복사" onClick={() => void copySession(session)}>
                  {copiedSessionId === session.id ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                </button>
                <button type="button" aria-label="대화 이름 변경" onClick={() => props.onRenameSession(session)}>
                  <Edit3 size={14} />
                </button>
                <button type="button" aria-label="대화 삭제" onClick={() => props.onDeleteSession(session)}>
                  <Trash2 size={14} />
                </button>
              </span>
            </article>
          ))}
        </div>
      </section>

      <section className="chat-home-section">
        <div className="chat-home-title">
          <strong>변경 내역</strong>
          <History size={16} />
        </div>
        <div className="checkpoint-list">
          {props.checkpoints.length === 0 ? (
            <div className="empty-state compact">
              <strong>체크포인트가 없습니다</strong>
              <span>AI가 일정을 적용하면 변경 전후 상태가 이곳에 남습니다.</span>
            </div>
          ) : null}
          {props.checkpoints.map((checkpoint) => (
            <article className="checkpoint-row" key={checkpoint.id}>
              <div>
                <strong>{checkpoint.label || "변경"}</strong>
                <span>{checkpoint.reason || checkpoint.source}</span>
                <em>{formatDateTime(checkpoint.createdAt)}</em>
              </div>
              <button
                className="secondary-button checkpoint-rollback-button"
                type="button"
                disabled={props.rollingBack}
                onClick={() => props.onRollbackCheckpoint(checkpoint.id)}
              >
                되돌리기
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function TripMetaForm(props: {
  form: TripFormState;
  saving: boolean;
  onChange: (form: TripFormState) => void;
  onSubmit: (event: FormEvent) => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const setField = (field: TripTextField, value: string) => {
    props.onChange({
      ...props.form,
      [field]: value,
      ...(field === "destinationName" ? { destinationLat: null, destinationLng: null } : {})
    });
  };
  const dateText = [props.form.startDate, props.form.endDate].filter(Boolean).join(" - ") || "날짜 미정";

  return (
    <section className="trip-meta-section">
      <div className="trip-meta-summary">
        <div>
          <strong>{props.form.title || "여행 이름 미정"}</strong>
          <span>{[props.form.destinationName || "목적지 미정", dateText].join(" · ")}</span>
        </div>
        <button className="secondary-button small-action" type="button" onClick={() => setOpen((value) => !value)}>
          <Edit3 size={14} />
          정보
        </button>
      </div>
      {open ? (
        <form className="meta-form" onSubmit={props.onSubmit}>
          <label className="field">
            <span>여행 이름</span>
            <input value={props.form.title} onChange={(event) => setField("title", event.target.value)} />
          </label>
          <label className="field">
            <span>목적지</span>
            <input value={props.form.destinationName} onChange={(event) => setField("destinationName", event.target.value)} />
          </label>
          <div className="form-grid">
            <label className="field">
              <span>시작</span>
              <input type="date" value={props.form.startDate} onChange={(event) => setField("startDate", event.target.value)} />
            </label>
            <label className="field">
              <span>종료</span>
              <input type="date" value={props.form.endDate} onChange={(event) => setField("endDate", event.target.value)} />
            </label>
          </div>
          <div className="meta-actions">
            <button className="secondary-button meta-save-button" type="submit" disabled={props.saving}>
              <Save size={16} />
              저장
            </button>
            <button className="danger-button" type="button" onClick={props.onDelete}>
              <Trash2 size={15} />
              삭제
            </button>
          </div>
        </form>
      ) : null}
    </section>
  );
}

function ItemForm(props: {
  form: UpsertItineraryItemRequest;
  editing: boolean;
  onChange: (form: UpsertItineraryItemRequest) => void;
  onSubmit: (event: FormEvent) => void;
}) {
  const setField = (field: keyof UpsertItineraryItemRequest, value: string) => {
    props.onChange({ ...props.form, [field]: value });
  };
  const setNumberField = (field: "lat" | "lng", value: string) => {
    props.onChange({ ...props.form, [field]: value ? Number(value) : undefined });
  };

  return (
    <form className="item-form" onSubmit={props.onSubmit}>
      <div className="form-grid">
        <input
          value={props.form.timeText ?? ""}
          onChange={(event) => setField("timeText", event.target.value)}
          placeholder="시간"
        />
        <input
          value={props.form.category ?? ""}
          onChange={(event) => setField("category", event.target.value)}
          placeholder="분류"
        />
      </div>
      <input value={props.form.title} onChange={(event) => setField("title", event.target.value)} placeholder="일정 제목" />
      <textarea value={props.form.memo ?? ""} onChange={(event) => setField("memo", event.target.value)} placeholder="메모" rows={2} />
      <div className="form-grid">
        <input
          type="number"
          step="any"
          value={props.form.lat ?? ""}
          onChange={(event) => setNumberField("lat", event.target.value)}
          placeholder="위도"
        />
        <input
          type="number"
          step="any"
          value={props.form.lng ?? ""}
          onChange={(event) => setNumberField("lng", event.target.value)}
          placeholder="경도"
        />
      </div>
      <button className="primary-button" type="submit">
        {props.editing ? "일정 수정" : "일정 추가"}
      </button>
    </form>
  );
}

function PlaceForm(props: {
  form: UpsertPlaceRequest;
  onChange: (form: UpsertPlaceRequest) => void;
  onSubmit: (event: FormEvent) => void;
  onCancel: () => void;
}) {
  const setField = (field: keyof UpsertPlaceRequest, value: string) => {
    props.onChange({ ...props.form, [field]: value });
  };
  const setNumberField = (field: "lat" | "lng", value: string) => {
    props.onChange({ ...props.form, [field]: value ? Number(value) : undefined });
  };

  return (
    <form className="item-form place-form" onSubmit={props.onSubmit}>
      <input value={props.form.name} onChange={(event) => setField("name", event.target.value)} placeholder="장소 이름" />
      <div className="form-grid">
        <input
          value={props.form.category ?? ""}
          onChange={(event) => setField("category", event.target.value)}
          placeholder="분류"
        />
        <input value={props.form.source ?? ""} onChange={(event) => setField("source", event.target.value)} placeholder="출처" />
      </div>
      <textarea value={props.form.note ?? ""} onChange={(event) => setField("note", event.target.value)} placeholder="설명" rows={3} />
      <input value={props.form.address ?? ""} onChange={(event) => setField("address", event.target.value)} placeholder="주소" />
      <input value={props.form.sourceUrl ?? ""} onChange={(event) => setField("sourceUrl", event.target.value)} placeholder="참고 링크" />
      <div className="form-grid">
        <input
          type="number"
          step="any"
          value={props.form.lat ?? ""}
          onChange={(event) => setNumberField("lat", event.target.value)}
          placeholder="위도"
        />
        <input
          type="number"
          step="any"
          value={props.form.lng ?? ""}
          onChange={(event) => setNumberField("lng", event.target.value)}
          placeholder="경도"
        />
      </div>
      <div className="form-actions compact">
        <button className="primary-button" type="submit">
          장소 수정
        </button>
        <button type="button" onClick={props.onCancel}>
          취소
        </button>
      </div>
    </form>
  );
}

function MapCanvas(props: {
  tripState: TripState;
  selectedDay?: TripDay;
  dayItems: ItineraryItem[];
  focusedItemId: string | null;
  layoutKey: string;
}) {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const skipNextAutoFitRef = useRef(false);
  const [tileMode, setTileMode] = useState<MapTileMode>(() => readMapTileMode());
  const [showCoordinateNote, setShowCoordinateNote] = useState(true);

  useEffect(() => {
    if (!elementRef.current || mapRef.current) return;
    const restoredView = readMapViewFromHash(props.tripState.trip.id);
    skipNextAutoFitRef.current = Boolean(restoredView);

    const map = L.map(elementRef.current, {
      attributionControl: true,
      zoomControl: false
    }).setView(restoredView?.center ?? destinationCenter(props.tripState.trip), restoredView?.zoom ?? 11);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    const persistMapView = () => writeMapViewToHash(map, props.tripState.trip.id);
    map.on("moveend zoomend", persistMapView);

    return () => {
      map.off("moveend zoomend", persistMapView);
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
      tileLayerRef.current = null;
    };
  }, [props.tripState.trip.destinationName]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    tileLayerRef.current?.remove();
    const tileLayer = createMapTileLayer(tileMode).addTo(map);
    tileLayer.bringToBack();
    tileLayerRef.current = tileLayer;
    window.localStorage.setItem(mapTileModeStorageKey, tileMode);
  }, [tileMode]);

  useEffect(() => {
    const element = elementRef.current;
    const map = mapRef.current;
    if (!element || !map) return;

    const invalidate = () => map.invalidateSize({ animate: false });
    const resizeObserver = new ResizeObserver(() => {
      window.requestAnimationFrame(invalidate);
    });

    resizeObserver.observe(element);
    if (element.parentElement) {
      resizeObserver.observe(element.parentElement);
    }

    window.addEventListener("resize", invalidate);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", invalidate);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    window.requestAnimationFrame(() => {
      map.invalidateSize({ animate: false });
    });
    window.setTimeout(() => map.invalidateSize({ animate: false }), 180);
  }, [props.layoutKey]);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    const dayPoints: L.LatLngExpression[] = [];
    const allPoints: L.LatLngExpression[] = [];
    const selectedDayId = props.selectedDay?.id ?? "";
    const itemCoordinates = new Set(
      props.dayItems
        .filter(hasCoordinates)
        .map((item) => `${item.lat?.toFixed(6)},${item.lng?.toFixed(6)}`)
    );

    dedupePlaces(props.tripState.places).filter(hasCoordinates).forEach((place) => {
      const coordinateKey = `${place.lat?.toFixed(6)},${place.lng?.toFixed(6)}`;
      if (itemCoordinates.has(coordinateKey)) return;

      const point: L.LatLngExpression = [place.lat, place.lng];
      allPoints.push(point);
      const marker = L.circleMarker(point, {
        radius: 7,
        color: "#ffffff",
        weight: 2,
        fillColor: "#6b7280",
        fillOpacity: 0.78
      }).addTo(layer);
      marker.bindPopup(placePopupElement(place, itineraryUsagesForPlace(place, props.tripState, selectedDayId)));
    });

    props.dayItems.filter(hasCoordinates).forEach((item, index) => {
      const point: L.LatLngExpression = [item.lat, item.lng];
      dayPoints.push(point);
      allPoints.push(point);

      const marker = L.marker(point, {
        icon: L.divIcon({
          className: item.id === props.focusedItemId ? "route-marker-icon focused" : "route-marker-icon",
          html: `<span>${index + 1}</span>`,
          iconSize: [34, 34],
          iconAnchor: [17, 17]
        }),
        zIndexOffset: item.id === props.focusedItemId ? 1000 : index
      }).addTo(layer);
      marker.bindPopup(planPopupElement(item, itineraryUsagesAtCoordinate(props.tripState, item.lat, item.lng, selectedDayId)));
      if (item.id === props.focusedItemId) {
        marker.openPopup();
        map.setView(point, Math.max(map.getZoom(), 14), { animate: true });
      }
    });

    if (dayPoints.length > 1) {
      L.polyline(dayPoints, {
        color: "#1fc1b6",
        weight: 4,
        opacity: 0.82,
        lineCap: "round",
        lineJoin: "round"
      }).addTo(layer);
    }

    if (!props.focusedItemId) {
      if (skipNextAutoFitRef.current) {
        skipNextAutoFitRef.current = false;
      } else if (dayPoints.length > 0) {
        map.fitBounds(L.latLngBounds(dayPoints), { padding: [48, 48], maxZoom: 14 });
      } else if (allPoints.length > 0) {
        map.fitBounds(L.latLngBounds(allPoints), { padding: [48, 48], maxZoom: 13 });
      } else {
        map.setView(destinationCenter(props.tripState.trip), 11);
      }
    }

    window.setTimeout(() => map.invalidateSize(), 0);
  }, [props.dayItems, props.focusedItemId, props.selectedDay?.id, props.tripState]);

  return (
    <div className="map-canvas">
      <div ref={elementRef} className="leaflet-map" />
      <div className="map-top-card">
        <div>
          <strong>{props.tripState.trip.title}</strong>
          <span>{[props.tripState.trip.destinationName, formatDateRange(props.tripState.trip)].filter(Boolean).join(" · ")}</span>
        </div>
      </div>
      <div className="map-legend">
        <span>
          <i className="legend-line" />
          선택 날짜 동선
        </span>
        <span>
          <i className="legend-dot plan" />
          일정
        </span>
        <span>
          <i className="legend-dot place" />
          조사 장소
        </span>
      </div>
      {showCoordinateNote && props.dayItems.filter(hasCoordinates).length === 0 ? (
        <div className="map-empty-note">
          <Clock3 size={15} />
          <span>좌표가 있는 일정은 선택한 날짜 순서대로 지도에 표시됩니다.</span>
          <button type="button" aria-label="좌표 안내 닫기" onClick={() => setShowCoordinateNote(false)}>
            <X size={14} />
          </button>
        </div>
      ) : null}
    </div>
  );
}

function ErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <main className="app-page">
      <div className="error-card">
        <strong>앱을 열 수 없습니다</strong>
        <p>{message}</p>
        <button className="primary-button" type="button" onClick={onRetry}>
          다시 시도
        </button>
      </div>
    </main>
  );
}

function formatDateRange(trip: Trip): string {
  if (trip.startDate && trip.endDate) return `${trip.startDate} - ${trip.endDate}`;
  if (trip.startDate) return trip.startDate;
  return "";
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function formatDuration(durationMs: number): string {
  if (!Number.isFinite(durationMs) || durationMs < 0) return "";
  if (durationMs < 1000) return `${Math.max(1, Math.round(durationMs))}ms`;
  const seconds = durationMs / 1000;
  if (seconds < 60) return `${seconds.toFixed(seconds < 10 ? 1 : 0)}초`;
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.round(seconds % 60);
  return `${minutes}분 ${remainder}초`;
}

function providerStatusLabel(status: string): string {
  if (status === "ready") return "사용 가능";
  if (status === "offline") return "오프라인";
  if (status === "unavailable") return "확인 필요";
  if (status === "configurable") return "설정 필요";
  return status;
}

function providerCheckStatusLabel(status: string): string {
  if (status === "ok") return "정상";
  if (status === "warning") return "확인";
  if (status === "error") return "오류";
  return status;
}

function itineraryMemoText(item: ItineraryItem): string {
  return [item.category, item.memo].filter(Boolean).join(item.memo ? "\n" : " · ") || "메모 없음";
}

function previewItineraryMemo(memoText: string): string {
  const lines = memoText.split("\n");
  if (lines.length > 3) return `${lines.slice(0, 3).join("\n")}...`;
  return memoText.length > 150 ? `${memoText.slice(0, 150)}...` : memoText;
}

function hasVisuallyLongItineraryLine(memoText: string): boolean {
  return estimatedItineraryMemoLineCount(memoText) > itineraryMemoCollapsedLineCount;
}

function itineraryMemoCountLabel(memoText: string): string {
  const lines = memoText.split("\n");
  const estimatedLines = estimatedItineraryMemoLineCount(memoText);
  if (estimatedLines > lines.length) return `약 ${estimatedLines}줄`;
  return lines.length > 1 ? `${lines.length}줄` : `${memoText.length}자`;
}

function estimatedItineraryMemoLineCount(memoText: string): number {
  const lines = memoText.split("\n");
  if (lines.length === 0) return 1;
  return lines.reduce((sum, line) => {
    const compactLength = line.trim().length;
    if (compactLength === 0) return sum + 1;
    return sum + Math.ceil(compactLength / itineraryMemoCharsPerLine);
  }, 0);
}

const itineraryMemoCollapsedLineCount = 3;
const itineraryMemoCharsPerLine = 22;

function tripToForm(trip: Trip): TripFormState {
  return {
    title: trip.title,
    destinationName: trip.destinationName ?? "",
    destinationLat: trip.destinationLat,
    destinationLng: trip.destinationLng,
    startDate: trip.startDate ?? "",
    endDate: trip.endDate ?? ""
  };
}

function workspaceToSettingsForm(workspace: Workspace | null): WorkspaceSettingsForm {
  const settings = parseWorkspaceSettings(workspace);
  const provider = normalizeAiProvider(workspace?.aiProvider ?? settings.aiProvider);
  const providerOption = aiProviderOptions.find((option) => option.value === provider) ?? aiProviderOptions[0];
  return {
    name: workspace?.name ?? "",
    aiProvider: providerOption.value,
    aiModel: workspace?.aiModel ?? settings.aiModel ?? providerOption.defaultModel,
    aiEffort: workspace?.aiEffort ?? settings.aiEffort ?? "medium",
    openAiBaseUrl: workspace?.openAiBaseUrl ?? settings.openAiBaseUrl ?? "https://api.openai.com/v1/chat/completions",
    openAiApiKey: workspace?.openAiApiKey ?? settings.openAiApiKey ?? "",
    openRouterApiKey: workspace?.openRouterApiKey ?? settings.openRouterApiKey ?? "",
    openRouterReferer: workspace?.openRouterReferer ?? settings.openRouterReferer ?? "",
    openRouterTitle: workspace?.openRouterTitle ?? settings.openRouterTitle ?? "Trip Planner"
  };
}

function normalizeAiProvider(value: string | undefined): AiProviderId {
  if (value === "openai-compatible" || value === "openrouter" || value === "codex-app-server") {
    return value;
  }
  return "codex-app-server";
}

function parseWorkspaceSettings(workspace: Workspace | null): Partial<WorkspaceSettingsForm> {
  if (!workspace?.settingsJson) return {};
  try {
    return JSON.parse(workspace.settingsJson) as Partial<WorkspaceSettingsForm>;
  } catch (error) {
    console.debug("workspace settings parse failed", error);
    return {};
  }
}

function placeToForm(place: Place): UpsertPlaceRequest {
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

function normalizeTripForm(form: TripFormState): UpdateTripRequest {
  return {
    title: form.title.trim(),
    destinationName: form.destinationName.trim(),
    destinationLat: form.destinationLat,
    destinationLng: form.destinationLng,
    startDate: form.startDate,
    endDate: form.endDate
  };
}

function applySetupActions(
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

function readError(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

function findPreviousUserMessage(messages: ChatMessage[], messageId: string): ChatMessage | null {
  const messageIndex = messages.findIndex((message) => message.id === messageId);
  for (let index = messageIndex - 1; index >= 0; index -= 1) {
    if (messages[index]?.role === "user") {
      return messages[index];
    }
  }
  return null;
}

function messageDurationMs(
  message: ChatMessage,
  editRuns: AiEditRunSummary[],
  previousUserMessage: ChatMessage | null
): number | null {
  const metadataDuration = messageMetadataDurationMs(message);
  if (metadataDuration != null) return metadataDuration;

  const matchingRun = editRuns.find((run) => run.assistantMessageId === message.id);
  if (matchingRun?.durationMs != null) return matchingRun.durationMs;

  if (!previousUserMessage) return null;
  const startedAt = new Date(previousUserMessage.createdAt).getTime();
  const endedAt = new Date(message.createdAt).getTime();
  if (Number.isNaN(startedAt) || Number.isNaN(endedAt) || endedAt < startedAt) return null;
  return endedAt - startedAt;
}

function messageMetadataDurationMs(message: ChatMessage): number | null {
  try {
    const metadata = JSON.parse(message.metadataJson) as { durationMs?: unknown };
    return typeof metadata.durationMs === "number" ? metadata.durationMs : null;
  } catch {
    return null;
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function parseSseData<T>(event: MessageEvent): T | null {
  try {
    return JSON.parse(event.data) as T;
  } catch {
    return null;
  }
}

function parseEventTimeMs(value: string | null | undefined): number | null {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : null;
}

function isChatLogNearBottom(element: HTMLElement, threshold = 96): boolean {
  return element.scrollHeight - element.scrollTop - element.clientHeight <= threshold;
}

function chatPendingLabel(
  label: string | null,
  activity: ChatRunActivityEvent | null,
  elapsedSeconds: number
): string {
  if (activity?.label) return activity.label;
  if (elapsedSeconds >= 20) return "AI가 자료를 확인하거나 응답을 준비 중입니다.";
  return label ?? "응답을 기다리는 중입니다.";
}

function chatActivityDetail(activity: ChatRunActivityEvent | null): string | null {
  return activity?.detail?.trim() || activity?.rawType?.trim() || null;
}

function formatElapsedSeconds(seconds: number): string {
  if (seconds < 60) return `${seconds}초`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest === 0 ? `${minutes}분` : `${minutes}분 ${rest}초`;
}

function buildChatSessionMarkdown(props: {
  trip: Trip;
  session: ChatSession;
  messages: ChatMessage[];
  runs: AiEditRunSummary[];
}): string {
  const lines = [
    `# ${markdownLine(props.session.title)}`,
    "",
    `- 여행: ${markdownLine(props.trip.title)}`,
    props.trip.destinationName ? `- 목적지: ${markdownLine(props.trip.destinationName)}` : null,
    `- 대화 ID: ${props.session.id}`,
    `- 내보낸 시각: ${new Date().toISOString()}`,
    ""
  ].filter((line): line is string => line !== null);

  if (props.messages.length === 0) {
    lines.push("## 대화", "", "아직 메시지가 없습니다.", "");
  } else {
    lines.push("## 대화", "");
    props.messages.forEach((message, index) => {
      lines.push(buildChatMessageMarkdown(message, index + 1), "");
    });
  }

  const meaningfulRuns = props.runs.filter((run) => run.operationCount > 0 || run.status !== "no_ops");
  if (meaningfulRuns.length > 0) {
    lines.push("## 변경 내역", "");
    meaningfulRuns.forEach((run) => {
      const duration = run.durationMs == null ? "" : ` · ${formatElapsedSeconds(Math.round(run.durationMs / 1000))}`;
      lines.push(`- ${run.status} · 작업 ${run.operationCount}개${duration}`);
      run.operationPreview.slice(0, 3).forEach((preview) => {
        lines.push(`  - ${preview}`);
      });
    });
    lines.push("");
  }

  return lines.join("\n").trimEnd() + "\n";
}

function buildChatMessageMarkdown(message: ChatMessage, index: number): string {
  return [
    `### ${index}. ${chatRoleLabel(message.role)}`,
    "",
    message.content.trim() || "(빈 메시지)"
  ].join("\n");
}

function buildChatMessageContentMarkdown(message: ChatMessage): string {
  return `${message.content.trim() || "(빈 메시지)"}\n`;
}

function markdownLine(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function chatRoleLabel(role: ChatMessage["role"]): string {
  switch (role) {
    case "user":
      return "사용자";
    case "assistant":
      return "AI";
    case "system":
      return "시스템";
    case "tool":
      return "도구";
  }
}

function isWindowsUserAgent(): boolean {
  return typeof navigator !== "undefined" && /Windows/i.test(navigator.userAgent);
}

async function writeClipboardText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

function submitOnCommandEnter(event: KeyboardEvent<HTMLTextAreaElement>) {
  if (event.key === "Enter" && !event.shiftKey && !event.altKey && !event.nativeEvent.isComposing) {
    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  }
}

function parseIsoDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildCalendarCells(cursor: Date) {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const startOffset = first.getDay();
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(year, month, 1 - startOffset + index);
    return {
      iso: toIsoDate(date),
      day: date.getDate(),
      currentMonth: date.getMonth() === month
    };
  });
}

function readEditorLayout(): EditorLayout {
  try {
    const stored = window.localStorage.getItem(editorLayoutStorageKey);
    if (!stored) return defaultEditorLayout;
    const parsed = JSON.parse(stored) as Partial<EditorLayout>;
    return {
      plannerWidth: clampNumber(Number(parsed.plannerWidth), 420, 580, defaultEditorLayout.plannerWidth),
      chatWidth: clampNumber(Number(parsed.chatWidth), 360, 560, defaultEditorLayout.chatWidth),
      placesHeight: clampNumber(Number(parsed.placesHeight), 190, 520, defaultEditorLayout.placesHeight)
    };
  } catch {
    return defaultEditorLayout;
  }
}

function chatDraftStorageKey(tripId: string, chatSessionId: string): string {
  return `${chatDraftStoragePrefix}:${tripId}:${chatSessionId}`;
}

function readChatDraft(tripId: string, chatSessionId: string): string {
  try {
    return window.localStorage.getItem(chatDraftStorageKey(tripId, chatSessionId)) ?? "";
  } catch {
    return "";
  }
}

function writeChatDraft(tripId: string, chatSessionId: string, value: string) {
  try {
    const key = chatDraftStorageKey(tripId, chatSessionId);
    if (value.trim()) {
      window.localStorage.setItem(key, value);
      return;
    }
    window.localStorage.removeItem(key);
  } catch {
    // Draft persistence is a UX enhancement; storage failures should not block chat input.
  }
}

function removeChatDraft(tripId: string, chatSessionId: string) {
  try {
    window.localStorage.removeItem(chatDraftStorageKey(tripId, chatSessionId));
  } catch {
    // Ignore storage failures.
  }
}

function clampNumber(value: number, min: number, max: number, fallback = min): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(Math.max(value, min), max);
}

function setDocumentResizeState(cursor: string) {
  document.body.style.cursor = cursor;
  document.body.style.userSelect = "none";
}

function clearDocumentResizeState() {
  document.body.style.cursor = "";
  document.body.style.userSelect = "";
}

function hasCoordinates<T extends { lat: number | null | undefined; lng: number | null | undefined }>(
  value: T
): value is T & { lat: number; lng: number } {
  return typeof value.lat === "number" && Number.isFinite(value.lat) && typeof value.lng === "number" && Number.isFinite(value.lng);
}

function readMapTileMode(): MapTileMode {
  const stored = window.localStorage.getItem(mapTileModeStorageKey);
  return stored === "local" || stored === "english" ? stored : "local";
}

function createMapTileLayer(mode: MapTileMode): L.TileLayer {
  if (mode === "local") {
    return L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap"
    });
  }

  return L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
    maxZoom: 20,
    subdomains: "abcd",
    attribution: "&copy; OpenStreetMap &copy; CARTO"
  });
}

function localizedPlaceName(place: Place): string {
  if (containsHangul(place.name)) return place.name;
  return placeNameKo[normalizePlaceKey(place.name)] ?? place.name;
}

function placeSummary(place: Place): string {
  const parts = [categoryLabel(place.category), place.note, place.address].filter(Boolean);
  return parts.join(" · ");
}

function placeDetailText(place: Place): string {
  return [
    categoryLabel(place.category),
    place.note,
    place.address ? `주소: ${place.address}` : null,
    place.sourceUrl ? `참고: ${place.sourceUrl}` : null
  ]
    .filter(Boolean)
    .join("\n");
}

function previewPlaceDetail(detailText: string): string {
  const lines = detailText.split("\n");
  if (lines.length > 3) return `${lines.slice(0, 3).join("\n")}...`;
  return detailText.length > 140 ? `${detailText.slice(0, 140)}...` : detailText;
}

function hasVisuallyLongPlaceLine(detailText: string): boolean {
  return estimatedTextLineCount(detailText, 24) > 3;
}

function placeDetailCountLabel(detailText: string): string {
  const lines = detailText.split("\n");
  const estimatedLines = estimatedTextLineCount(detailText, 24);
  if (estimatedLines > lines.length) return `약 ${estimatedLines}줄`;
  return lines.length > 1 ? `${lines.length}줄` : `${detailText.length}자`;
}

function estimatedTextLineCount(text: string, charsPerLine: number): number {
  const lines = text.split("\n");
  if (lines.length === 0) return 1;
  return lines.reduce((sum, line) => {
    const compactLength = line.trim().length;
    if (compactLength === 0) return sum + 1;
    return sum + Math.ceil(compactLength / charsPerLine);
  }, 0);
}

function categoryLabel(category: string | null): string | null {
  if (!category) return null;
  return categoryLabels[category] ?? category;
}

function containsHangul(value: string): boolean {
  return /[가-힣]/.test(value);
}

function dedupePlaces(places: Place[]): Place[] {
  const seen = new Set<string>();
  return places.filter((place) => {
    const key = placeDedupeKey(place);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function placeDedupeKey(place: Place): string {
  if (hasCoordinates(place)) {
    return `coord:${place.lat.toFixed(4)},${place.lng.toFixed(4)}`;
  }
  return `name:${place.name.toLowerCase().replace(/[\s·・,._()[\]{}'"`-]+/g, "")}`;
}

function normalizePlaceKey(value: string): string {
  return value.toLowerCase().replace(/[\s·・,._()[\]{}'"`-]+/g, "");
}

const categoryLabels: Record<string, string> = {
  sight: "관광",
  restaurant: "식당",
  cafe: "카페",
  hotel: "숙소",
  transport: "교통",
  shopping: "쇼핑",
  activity: "액티비티",
  other: "기타"
};

const placeNameKo: Record<string, string> = {
  citygodtempleofshanghai: "상하이 성황묘",
  nanjingroad: "난징동루",
  orientalpearltower: "동방명주",
  peoplessquareshanghai: "인민광장",
  shanghaitower: "상하이 타워",
  shanghaiworldfinancialcenter: "상하이 월드 파이낸셜 센터",
  thebund: "와이탄",
  wukangroad: "우캉루",
  xintiandi: "신천지",
  yugarden: "예원"
};

type ItineraryMapUsage = {
  item: ItineraryItem;
  day: TripDay | null;
  sequence: number | null;
  selected: boolean;
};

function itineraryUsagesForPlace(place: Place, tripState: TripState, selectedDayId: string): ItineraryMapUsage[] {
  return itineraryUsages(tripState, selectedDayId).filter((usage) => {
    if (usage.item.placeId && usage.item.placeId === place.id) return true;
    if (hasCoordinates(place) && hasCoordinates(usage.item) && sameMapCoordinate(place, usage.item)) return true;
    return normalizePlaceKey(usage.item.title) === normalizePlaceKey(place.name);
  });
}

function itineraryUsagesAtCoordinate(
  tripState: TripState,
  lat: number,
  lng: number,
  selectedDayId: string
): ItineraryMapUsage[] {
  return itineraryUsages(tripState, selectedDayId).filter((usage) => {
    if (!hasCoordinates(usage.item)) return false;
    return sameMapCoordinate({ lat, lng }, usage.item);
  });
}

function itineraryUsages(tripState: TripState, selectedDayId: string): ItineraryMapUsage[] {
  const dayById = new Map(tripState.days.map((day) => [day.id, day]));
  const mappableItemsByDay = new Map<string, ItineraryItem[]>();
  tripState.days.forEach((day) => {
    mappableItemsByDay.set(
      day.id,
      tripState.itineraryItems
        .filter((item) => item.tripDayId === day.id)
        .filter(hasCoordinates)
        .sort((left, right) => left.sortOrder - right.sortOrder)
    );
  });

  return tripState.itineraryItems
    .filter(hasCoordinates)
    .map((item) => {
      const dayItems = mappableItemsByDay.get(item.tripDayId) ?? [];
      const sequenceIndex = dayItems.findIndex((candidate) => candidate.id === item.id);
      return {
        item,
        day: dayById.get(item.tripDayId) ?? null,
        sequence: sequenceIndex >= 0 ? sequenceIndex + 1 : null,
        selected: item.tripDayId === selectedDayId
      };
    })
    .sort(sortItineraryUsage);
}

function sortItineraryUsage(left: ItineraryMapUsage, right: ItineraryMapUsage): number {
  if (left.selected !== right.selected) return left.selected ? -1 : 1;
  const leftDay = left.day?.dayNumber ?? 999;
  const rightDay = right.day?.dayNumber ?? 999;
  if (leftDay !== rightDay) return leftDay - rightDay;
  return left.item.sortOrder - right.item.sortOrder;
}

function sameMapCoordinate(
  left: { lat: number | null | undefined; lng: number | null | undefined },
  right: { lat: number | null | undefined; lng: number | null | undefined }
): boolean {
  if (!hasCoordinates(left) || !hasCoordinates(right)) return false;
  return Math.abs(left.lat - right.lat) < 0.00005 && Math.abs(left.lng - right.lng) < 0.00005;
}

function placePopupElement(place: Place, usages: ItineraryMapUsage[]): HTMLElement {
  const rows: MapPopupRow[] = [
    {
      tag: "조사",
      title: localizedPlaceName(place),
      meta: placeSummary(place) || "조사 장소"
    },
    ...usages.map(usageToPopupRow)
  ];
  return richMapPopupElement(`📍 ${localizedPlaceName(place)}`, rows);
}

function planPopupElement(item: ItineraryItem, usages: ItineraryMapUsage[]): HTMLElement {
  const rows = usages.length ? usages.map(usageToPopupRow) : [usageToPopupRow({ item, day: null, sequence: null, selected: true })];
  const sameTitle = rows.every((row) => normalizePlaceKey(row.title) === normalizePlaceKey(item.title));
  return richMapPopupElement(`📅 ${sameTitle ? item.title : `${rows.length}개 일정`}`, rows);
}

type MapPopupRow = {
  tag: string;
  title: string;
  meta: string;
};

function usageToPopupRow(usage: ItineraryMapUsage): MapPopupRow {
  return {
    tag: usage.selected && usage.sequence ? `${usage.sequence}번째` : usage.day ? `Day ${usage.day.dayNumber}` : "일정",
    title: usage.item.title,
    meta: [usage.item.timeText, usage.item.category].filter(Boolean).join(" · ") || "일정"
  };
}

function richMapPopupElement(title: string, rows: MapPopupRow[]): HTMLElement {
  const element = document.createElement("div");
  element.className = "map-popup rich";

  const heading = document.createElement("div");
  heading.className = "map-popup-title";
  heading.textContent = title;
  element.appendChild(heading);

  const list = document.createElement("div");
  list.className = "map-popup-list";
  rows.forEach((row) => {
    const rowElement = document.createElement("div");
    rowElement.className = "map-popup-row";

    const tag = document.createElement("span");
    tag.className = "map-popup-tag";
    tag.textContent = row.tag;

    const body = document.createElement("div");
    const rowTitle = document.createElement("strong");
    rowTitle.textContent = row.title;
    const meta = document.createElement("span");
    meta.textContent = row.meta;
    body.append(rowTitle, meta);
    rowElement.append(tag, body);
    list.appendChild(rowElement);
  });
  element.appendChild(list);
  return element;
}

function destinationCenter(trip: Trip): L.LatLngExpression {
  if (typeof trip.destinationLat === "number" && typeof trip.destinationLng === "number") {
    return [trip.destinationLat, trip.destinationLng];
  }

  const destination = trip.destinationName?.toLowerCase() ?? "";
  if (destination.includes("오키나와") || destination.includes("okinawa")) return [26.2124, 127.6792];
  if (destination.includes("상하이") || destination.includes("상해") || destination.includes("shanghai")) return [31.2304, 121.4737];
  if (destination.includes("도쿄") || destination.includes("tokyo")) return [35.6812, 139.7671];
  if (destination.includes("서울") || destination.includes("seoul")) return [37.5665, 126.978];
  return [35, 135];
}

function readMapViewFromHash(tripId: string): MapView | null {
  const match = window.location.hash.match(/^#map=([^,]+),(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),(\d+(?:\.\d+)?)$/);
  if (!match) return null;
  if (decodeURIComponent(match[1]) !== tripId) return null;

  const lat = Number(match[2]);
  const lng = Number(match[3]);
  const zoom = Number(match[4]);
  if (![lat, lng, zoom].every(Number.isFinite)) return null;
  return {
    center: [lat, lng],
    zoom: Math.min(Math.max(Math.round(zoom), 2), 19)
  };
}

function writeMapViewToHash(map: L.Map, tripId: string) {
  const center = map.getCenter();
  const hash = `#map=${encodeURIComponent(tripId)},${center.lat.toFixed(5)},${center.lng.toFixed(5)},${map.getZoom()}`;
  const nextUrl = `${window.location.pathname}${window.location.search}${hash}`;
  window.history.replaceState(window.history.state, "", nextUrl);
}

function parseRoute(pathname = window.location.pathname): { screen: Screen; tripId?: string; chatSessionId?: string } {
  if (pathname === "/trips/new") {
    return { screen: "create" };
  }

  const chatMatch = pathname.match(/^\/trips\/([^/]+)\/chat\/([^/]+)$/);
  if (chatMatch?.[1] && chatMatch[2]) {
    return {
      screen: "edit",
      tripId: decodeURIComponent(chatMatch[1]),
      chatSessionId: decodeURIComponent(chatMatch[2])
    };
  }

  const match = pathname.match(/^\/trips\/([^/]+)$/);
  if (match?.[1]) {
    return { screen: "edit", tripId: decodeURIComponent(match[1]) };
  }

  return { screen: "select" };
}

function pushAppPath(pathname: string) {
  if (window.location.pathname !== pathname) {
    const mapHash = pathname.startsWith("/trips/") && window.location.hash.startsWith("#map=") ? window.location.hash : "";
    window.history.pushState({}, "", `${pathname}${mapHash}`);
  }
}

export default App;
