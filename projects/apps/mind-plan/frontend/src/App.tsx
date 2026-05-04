import {
  Bot,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Edit3,
  GitBranch,
  LayoutDashboard,
  ListChecks,
  Map as MapIcon,
  MessageSquare,
  Plus,
  RefreshCw,
  Redo2,
  Save,
  Send,
  Settings2,
  Trash2,
  Undo2,
  ZoomIn,
  ZoomOut,
  X
} from "lucide-react";
import {
  FormEvent,
  KeyboardEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  ReactNode,
  WheelEvent as ReactWheelEvent,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { api, sendChatMessage } from "./api";
import type {
  ChatMessage,
  ChatSession,
  ChatSessionDetail,
  ChatStreamEvent,
  Plan,
  PlanDetail,
  ProviderStatus,
  TaskLink,
  TaskNode,
  TaskStatus,
  ViewMode,
  Workspace
} from "./types";

const statusColumns: Array<{ id: TaskStatus; label: string }> = [
  { id: "todo", label: "할 일" },
  { id: "in_progress", label: "진행 중" },
  { id: "done", label: "완료" }
];

const viewOptions: Array<{ id: ViewMode; label: string; icon: typeof MapIcon }> = [
  { id: "canvas", label: "캔버스", icon: MapIcon },
  { id: "kanban", label: "칸반", icon: LayoutDashboard },
  { id: "mindmap", label: "마인드맵", icon: GitBranch }
];

const aiProviderOptions: AiProviderOption[] = [
  {
    value: "codex-app-server",
    label: "Codex app-server",
    description: "로컬 Codex 세션을 사용합니다. 모델과 추론 강도를 선택할 수 있습니다.",
    defaultModel: "gpt-5.4-mini"
  },
  {
    value: "claude-cli",
    label: "Claude CLI",
    description: "로컬 Claude CLI를 사용합니다. 설치와 로그인 상태는 서버에서 확인합니다.",
    defaultModel: "sonnet"
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

const aiEffortOptions: AiEffortOption[] = [
  { value: "low", label: "낮음", description: "빠른 응답" },
  { value: "medium", label: "중간", description: "기본 균형값" },
  { value: "high", label: "높음", description: "복잡한 수정 검토" },
  { value: "xhigh", label: "매우 높음", description: "가장 깊은 추론" }
];

const canvasNodeWidth = 220;
const canvasNodeHeight = 98;
const minimapWidth = 180;
const minimapHeight = 120;
const minimapPadding = 10;
const historyLimit = 80;

type Screen = "select" | "editor";

type WorkspaceSettingsForm = {
  name: string;
  aiProvider: string;
  aiModel: string;
  aiEffort: string;
  claudeCommand: string;
  openAiBaseUrl: string;
  openAiApiKey: string;
  openRouterApiKey: string;
  openRouterReferer: string;
  openRouterTitle: string;
};

type AiProviderId = "codex-app-server" | "claude-cli" | "openai-compatible" | "openrouter";

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

type CanvasViewport = {
  x: number;
  y: number;
  scale: number;
};

type Rect = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
};

type HistorySnapshot = {
  tasks: TaskNode[];
  links: TaskLink[];
};

type HistoryEntry = {
  id: string;
  label: string;
  before: HistorySnapshot;
  after: HistorySnapshot;
  createdAt: string;
};

type TaskUpdateOptions = {
  label?: string;
  skipHistory?: boolean;
};

type NodeHandleSide = "top" | "right" | "bottom" | "left";

type CanvasPoint = {
  x: number;
  y: number;
};

type PendingConnection = {
  sourceTaskId: string;
  sourceSide: NodeHandleSide;
  from: CanvasPoint;
  to: CanvasPoint;
};

export default function App() {
  const [screen, setScreen] = useState<Screen>("select");
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspaceId, setWorkspaceId] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [planDetail, setPlanDetail] = useState<PlanDetail | null>(null);
  const [newPlanTitle, setNewPlanTitle] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);
  const [historyPast, setHistoryPast] = useState<HistoryEntry[]>([]);
  const [historyFuture, setHistoryFuture] = useState<HistoryEntry[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatDetail, setChatDetail] = useState<ChatSessionDetail | null>(null);
  const [chatText, setChatText] = useState("");
  const [isChatSending, setIsChatSending] = useState(false);
  const [chatStreamingText, setChatStreamingText] = useState("");
  const [chatStatusText, setChatStatusText] = useState("");
  const [chatStartedAtMs, setChatStartedAtMs] = useState<number | null>(null);
  const [showChatLatest, setShowChatLatest] = useState(false);
  const [settingsWorkspace, setSettingsWorkspace] = useState<Workspace | null>(null);
  const [workspaceSettingsForm, setWorkspaceSettingsForm] = useState<WorkspaceSettingsForm>(() =>
    workspaceToSettingsForm(null)
  );
  const [providerStatuses, setProviderStatuses] = useState<ProviderStatus[]>([]);
  const chatLogRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoScrollChatRef = useRef(true);
  const pendingAiSnapshotRef = useRef<HistorySnapshot | null>(null);

  const activeWorkspace = workspaces.find((workspace) => workspace.id === workspaceId) ?? null;
  const activePlan = planDetail?.plan ?? null;
  const selectedTask = planDetail?.tasks.find((task) => task.id === selectedTaskId) ?? null;
  const selectedLink = planDetail?.links.find((link) => link.id === selectedLinkId) ?? null;
  const messages = chatDetail?.messages ?? [];
  const chatElapsedSeconds = chatStartedAtMs == null ? 0 : Math.max(0, Math.floor((Date.now() - chatStartedAtMs) / 1000));

  useEffect(() => {
    void bootstrap();
  }, []);

  useEffect(() => {
    if (!workspaceId) return;
    void loadPlans(workspaceId);
    void loadProviderStatus(workspaceId);
  }, [workspaceId]);

  useEffect(() => {
    const chatLog = chatLogRef.current;
    if (!chatLog) return;

    if (shouldAutoScrollChatRef.current || isChatLogNearBottom(chatLog)) {
      scrollChatToLatest("auto");
    } else if (isChatSending || chatStreamingText) {
      setShowChatLatest(true);
    }
  }, [messages.length, chatStreamingText, isChatSending, chatStatusText]);

  useEffect(() => {
    function handleGlobalShortcut(event: globalThis.KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select")) return;
      const key = event.key.toLowerCase();
      const commandPressed = event.metaKey || event.ctrlKey;

      if (key === "delete" || (key === "backspace" && commandPressed)) {
        if (selectedTask) {
          event.preventDefault();
          void deleteTask(selectedTask);
          return;
        }
        if (selectedLink) {
          event.preventDefault();
          void deleteLink(selectedLink);
          return;
        }
      }

      if (!commandPressed) return;

      if (key === "y" || (key === "z" && event.shiftKey)) {
        event.preventDefault();
        void redoHistory();
        return;
      }

      if (key === "z") {
        event.preventDefault();
        void undoHistory();
      }
    }

    window.addEventListener("keydown", handleGlobalShortcut);
    return () => window.removeEventListener("keydown", handleGlobalShortcut);
  }, [historyPast, historyFuture, planDetail, selectedLink, selectedTask]);

  async function bootstrap() {
    const nextWorkspaces = await api.workspaces();
    setWorkspaces(nextWorkspaces);
    const firstWorkspace = nextWorkspaces[0];
    if (firstWorkspace) {
      setWorkspaceId(firstWorkspace.id);
    }
  }

  async function loadPlans(nextWorkspaceId: string) {
    const nextPlans = await api.plans(nextWorkspaceId);
    setPlans(nextPlans);
    setPlanDetail(null);
    setSelectedTaskId(null);
    setSelectedLinkId(null);
    setChatSessions([]);
    setActiveChatId(null);
    setChatDetail(null);
    setHistoryPast([]);
    setHistoryFuture([]);
  }

  async function loadProviderStatus(nextWorkspaceId: string) {
    const statuses = await api.providerStatus(nextWorkspaceId);
    setProviderStatuses(statuses);
  }

  async function openPlan(planId: string, refreshPlans = true) {
    const detail = await api.planDetail(planId);
    setScreen("editor");
    setPlanDetail(detail);
    setSelectedTaskId(detail.tasks[0]?.id ?? null);
    setSelectedLinkId(null);
    const storedHistory = readStoredHistory(planId);
    setHistoryPast(storedHistory.past);
    setHistoryFuture(storedHistory.future);
    const sessions = await api.chatSessions(planId);
    setChatSessions(sessions);
    if (refreshPlans && workspaceId) {
      setPlans(await api.plans(workspaceId));
    }
    if (sessions[0]) {
      await openChat(sessions[0].id);
    } else {
      setActiveChatId(null);
      setChatDetail(null);
    }
  }

  async function createWorkspace(event: FormEvent) {
    event.preventDefault();
    const name = workspaceName.trim();
    if (!name) return;
    const workspace = await api.createWorkspace(name);
    setWorkspaces((current) => [workspace, ...current]);
    setWorkspaceId(workspace.id);
    setWorkspaceName("");
    setScreen("select");
  }

  async function renameWorkspace(workspace: Workspace) {
    const name = window.prompt("워크스페이스 이름", workspace.name)?.trim();
    if (!name || name === workspace.name) return;
    const updated = await api.updateWorkspace({ ...workspace, name });
    setWorkspaces((current) => current.map((candidate) => (candidate.id === updated.id ? updated : candidate)));
  }

  function openWorkspaceSettings(workspace: Workspace) {
    setSettingsWorkspace(workspace);
    setWorkspaceSettingsForm(workspaceToSettingsForm(workspace));
    void loadProviderStatus(workspace.id);
  }

  async function submitWorkspaceSettings(event: FormEvent) {
    event.preventDefault();
    if (!settingsWorkspace) return;
    const settings = {
      aiProvider: workspaceSettingsForm.aiProvider,
      aiModel: workspaceSettingsForm.aiModel.trim(),
      aiEffort: workspaceSettingsForm.aiEffort,
      claudeCommand: workspaceSettingsForm.claudeCommand.trim(),
      openAiBaseUrl: workspaceSettingsForm.openAiBaseUrl.trim(),
      openAiApiKey: workspaceSettingsForm.openAiApiKey.trim(),
      openRouterApiKey: workspaceSettingsForm.openRouterApiKey.trim(),
      openRouterReferer: workspaceSettingsForm.openRouterReferer.trim(),
      openRouterTitle: workspaceSettingsForm.openRouterTitle.trim()
    };
    const updated = await api.updateWorkspace({
      ...settingsWorkspace,
      name: workspaceSettingsForm.name.trim() || settingsWorkspace.name,
      aiProvider: workspaceSettingsForm.aiProvider,
      aiSettingsJson: JSON.stringify(settings)
    });
    setWorkspaces((current) => current.map((candidate) => (candidate.id === updated.id ? updated : candidate)));
    setSettingsWorkspace(null);
    setWorkspaceSettingsForm(workspaceToSettingsForm(null));
  }

  async function deleteWorkspace(workspace: Workspace) {
    if (workspaces.length <= 1) {
      window.alert("마지막 워크스페이스는 삭제할 수 없습니다.");
      return;
    }
    if (!window.confirm(`'${workspace.name}' 워크스페이스와 포함된 계획을 삭제할까요?`)) return;
    await api.deleteWorkspace(workspace.id);
    const nextWorkspaces = workspaces.filter((candidate) => candidate.id !== workspace.id);
    setWorkspaces(nextWorkspaces);
    setWorkspaceId(nextWorkspaces[0]?.id ?? "");
    setSettingsWorkspace(null);
    setScreen("select");
  }

  async function createPlan(event: FormEvent) {
    event.preventDefault();
    if (!workspaceId || !newPlanTitle.trim()) return;
    const detail = await api.createPlan(workspaceId, { title: newPlanTitle.trim() });
    setNewPlanTitle("");
    setPlans((current) => [detail.plan, ...current]);
    await openPlan(detail.plan.id, false);
  }

  async function savePlan(nextPlan: Plan) {
    const updated = await api.updatePlan(nextPlan);
    setPlanDetail((current) => (current ? { ...current, plan: updated } : current));
    setPlans((current) => current.map((plan) => (plan.id === updated.id ? updated : plan)));
  }

  async function deletePlan(plan: Plan) {
    if (!window.confirm(`'${plan.title}' 계획을 삭제할까요? 작업과 대화도 함께 삭제됩니다.`)) return;
    await api.deletePlan(plan.id);
    removeStoredHistory(plan.id);
    const nextPlans = plans.filter((candidate) => candidate.id !== plan.id);
    setPlans(nextPlans);
    if (activePlan?.id === plan.id) {
      setPlanDetail(null);
      setScreen("select");
    }
  }

  async function renamePlan(plan: Plan) {
    const title = window.prompt("계획 이름", plan.title)?.trim();
    if (!title || title === plan.title) return;
    const updated = await api.updatePlan({ ...plan, title });
    setPlans((current) => current.map((candidate) => (candidate.id === updated.id ? updated : candidate)));
    setPlanDetail((current) => (current && current.plan.id === updated.id ? { ...current, plan: updated } : current));
  }

  async function createTask(event: FormEvent) {
    event.preventDefault();
    if (!activePlan || !planDetail || !newTaskTitle.trim()) return;
    const before = snapshotFromDetail(planDetail);
    const task = await api.createTask(activePlan.id, { title: newTaskTitle.trim() });
    setNewTaskTitle("");
    const afterDetail = await api.planDetail(activePlan.id);
    setPlanDetail(afterDetail);
    setSelectedTaskId(task.id);
    pushHistory("작업 추가", before, snapshotFromDetail(afterDetail));
  }

  function selectTask(taskId: string) {
    setSelectedTaskId(taskId);
    setSelectedLinkId(null);
  }

  function selectLink(linkId: string) {
    setSelectedLinkId(linkId);
    setSelectedTaskId(null);
  }

  function pushHistory(label: string, before: HistorySnapshot, after: HistorySnapshot) {
    if (snapshotsEqual(before, after)) return;
    setHistoryPast((current) => {
      const nextPast = [
        ...current,
        {
          id: `wal_${Date.now()}_${Math.random().toString(16).slice(2)}`,
          label,
          before,
          after,
          createdAt: new Date().toISOString()
        }
      ].slice(-historyLimit);
      if (activePlan) writeStoredHistory(activePlan.id, nextPast, []);
      return nextPast;
    });
    setHistoryFuture([]);
  }

  async function updateTask(task: TaskNode, options: TaskUpdateOptions = {}) {
    const beforeDetail = planDetail;
    const beforeTask = beforeDetail?.tasks.find((candidate) => candidate.id === task.id);
    const updated = await api.updateTask(task);
    const afterDetail = beforeDetail
      ? {
          ...beforeDetail,
          tasks: beforeDetail.tasks.map((candidate) => (candidate.id === updated.id ? updated : candidate))
        }
      : null;
    setPlanDetail((current) =>
      current
        ? {
            ...current,
            tasks: current.tasks.map((candidate) => (candidate.id === updated.id ? updated : candidate))
          }
        : current
    );

    if (beforeDetail && afterDetail && beforeTask && !options.skipHistory) {
      pushHistory(options.label ?? "작업 수정", snapshotFromDetail(beforeDetail), snapshotFromDetail(afterDetail));
    }
  }

  async function applyTaskLayout(nextTasks: TaskNode[], label = "노드 정렬") {
    if (!planDetail) return;
    const before = snapshotFromDetail(planDetail);
    const nextById = new Map(nextTasks.map((task) => [task.id, task]));
    const changedTasks = planDetail.tasks
      .map((task) => nextById.get(task.id) ?? task)
      .filter((task) => {
        const current = planDetail.tasks.find((candidate) => candidate.id === task.id);
        return current && (current.x !== task.x || current.y !== task.y || current.sortOrder !== task.sortOrder);
      });
    if (changedTasks.length === 0) return;

    const updatedTasks = await Promise.all(changedTasks.map((task) => api.updateTask(task)));
    const updatedById = new Map(updatedTasks.map((task) => [task.id, task]));
    const afterDetail = {
      ...planDetail,
      tasks: planDetail.tasks.map((task) => updatedById.get(task.id) ?? nextById.get(task.id) ?? task)
    };
    setPlanDetail(afterDetail);
    pushHistory(label, before, snapshotFromDetail(afterDetail));
  }

  async function applyHistorySnapshot(snapshot: HistorySnapshot) {
    if (!planDetail) return;
    const planId = planDetail.plan.id;
    const targetById = new Map(snapshot.tasks.map((task) => [task.id, task]));
    const currentTaskIds = new Set(planDetail.tasks.map((task) => task.id));
    const tasksToDelete = planDetail.tasks.filter((task) => !targetById.has(task.id));
    const tasksToCreate = snapshot.tasks.filter((task) => !currentTaskIds.has(task.id));

    const targetLinkIds = new Set(snapshot.links.map((link) => link.id));
    const linksToDeleteFirst = planDetail.links.filter((link) => !targetLinkIds.has(link.id));
    if (linksToDeleteFirst.length > 0) {
      await Promise.all(linksToDeleteFirst.map((link) => api.deleteLink(planId, link.id)));
    }

    if (tasksToDelete.length > 0) {
      await Promise.all(tasksToDelete.map((task) => api.deleteTask(task.id)));
    }

    if (tasksToCreate.length > 0) {
      await Promise.all(
        tasksToCreate.map((task) =>
          api.createTask(planId, {
            id: task.id,
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            dueDate: task.dueDate,
            parentId: null,
            x: task.x,
            y: task.y,
            sortOrder: task.sortOrder
          })
        )
      );
    }

    const afterTaskRestore = await api.planDetail(planId);
    const changedTasks = snapshot.tasks.filter((task) => {
      const current = afterTaskRestore.tasks.find((candidate) => candidate.id === task.id);
      return current && !tasksEqual(current, task);
    });

    if (changedTasks.length > 0) {
      await Promise.all(changedTasks.map((task) => api.updateTask(task)));
    }

    const afterTaskUpdate = await api.planDetail(planId);
    const currentLinkIds = new Set(afterTaskUpdate.links.map((link) => link.id));
    const linksToDelete = afterTaskUpdate.links.filter((link) => !targetLinkIds.has(link.id));
    const linksToCreate = snapshot.links.filter((link) => !currentLinkIds.has(link.id));

    if (linksToDelete.length > 0) {
      await Promise.all(linksToDelete.map((link) => api.deleteLink(planId, link.id)));
    }
    if (linksToCreate.length > 0) {
      await Promise.all(
        linksToCreate.map((link) =>
          api.createLink(planId, {
            id: link.id,
            sourceNodeId: link.sourceNodeId,
            targetNodeId: link.targetNodeId,
            label: link.label ?? undefined
          })
        )
      );
    }

    const refreshed = await api.planDetail(planId);
    setPlanDetail(refreshed);
  }

  async function undoHistory() {
    const entry = historyPast.at(-1);
    if (!entry) return;
    await applyHistorySnapshot(entry.before);
    const nextPast = historyPast.slice(0, -1);
    const nextFuture = [entry, ...historyFuture].slice(0, historyLimit);
    setHistoryPast(nextPast);
    setHistoryFuture(nextFuture);
    if (activePlan) writeStoredHistory(activePlan.id, nextPast, nextFuture);
  }

  async function redoHistory() {
    const entry = historyFuture[0];
    if (!entry) return;
    await applyHistorySnapshot(entry.after);
    const nextFuture = historyFuture.slice(1);
    const nextPast = [...historyPast, entry].slice(-historyLimit);
    setHistoryFuture(nextFuture);
    setHistoryPast(nextPast);
    if (activePlan) writeStoredHistory(activePlan.id, nextPast, nextFuture);
  }

  async function deleteTask(task: TaskNode) {
    if (!activePlan || !planDetail) return;
    if (!window.confirm(`'${task.title}' 작업을 삭제할까요?`)) return;
    const before = snapshotFromDetail(planDetail);
    await api.deleteTask(task.id);
    const afterDetail = await api.planDetail(activePlan.id);
    setPlanDetail(afterDetail);
    const nextSelectedTaskId =
      selectedTaskId === task.id ? afterDetail.tasks[0]?.id ?? null : selectedTaskId;
    setSelectedTaskId(nextSelectedTaskId);
    setSelectedLinkId(null);
    pushHistory("작업 삭제", before, snapshotFromDetail(afterDetail));
  }

  async function deleteLink(link: TaskLink) {
    if (!activePlan || !planDetail) return;
    const before = snapshotFromDetail(planDetail);
    const after: HistorySnapshot = {
      tasks: before.tasks,
      links: before.links.filter((candidate) => candidate.id !== link.id)
    };
    await api.deleteLink(activePlan.id, link.id);
    setSelectedLinkId(null);
    setPlanDetail((current) =>
      current ? { ...current, links: current.links.filter((candidate) => candidate.id !== link.id) } : current
    );
    pushHistory("간선 삭제", before, after);
  }

  async function createLink(sourceNodeId: string, targetNodeId: string) {
    if (!activePlan || !planDetail || sourceNodeId === targetNodeId) return;

    const existing = planDetail.links.find(
      (link) => link.sourceNodeId === sourceNodeId && link.targetNodeId === targetNodeId
    );
    if (existing) {
      selectLink(existing.id);
      return;
    }

    const link = await api.createLink(activePlan.id, { sourceNodeId, targetNodeId });
    const before = snapshotFromDetail(planDetail);
    const after: HistorySnapshot = {
      tasks: before.tasks,
      links: [...before.links, link]
    };
    setPlanDetail((current) => (current ? { ...current, links: [...current.links, link] } : current));
    setSelectedTaskId(null);
    setSelectedLinkId(link.id);
    pushHistory("간선 연결", before, after);
  }

  async function refreshPlan(nextSelectedTaskId?: string) {
    if (!activePlan) return;
    const detail = await api.planDetail(activePlan.id);
    setPlanDetail(detail);
    setSelectedTaskId(nextSelectedTaskId ?? detail.tasks[0]?.id ?? null);
  }

  async function openChat(sessionId: string) {
    setActiveChatId(sessionId);
    const detail = await api.chatDetail(sessionId);
    setChatDetail(detail);
    setChatText(readChatDraft(sessionId));
    setChatStreamingText("");
    setChatStatusText("");
    window.requestAnimationFrame(() => scrollChatToLatest("auto"));
  }

  async function createChatSession() {
    if (!activePlan) return;
    const workspaceSettings = workspaceToSettingsForm(activeWorkspace);
    const session = await api.createChatSession(activePlan.id, {
      title: `계획 상담 ${chatSessions.length + 1}`,
      provider: workspaceSettings.aiProvider,
      model: workspaceSettings.aiModel || undefined,
      settingsJson: JSON.stringify(workspaceSettings)
    });
    setChatSessions((current) => [session, ...current]);
    await openChat(session.id);
  }

  async function renameChatSession(session: ChatSession) {
    const title = window.prompt("대화 이름", session.title)?.trim();
    if (!title || title === session.title) return;
    const updated = await api.updateChatSession(session.id, title);
    setChatSessions((current) => current.map((candidate) => (candidate.id === updated.id ? updated : candidate)));
    if (activeChatId === updated.id) {
      setChatDetail((current) => (current ? { ...current, session: updated } : current));
    }
  }

  async function deleteChatSession(session: ChatSession) {
    if (!window.confirm(`'${session.title}' 대화를 삭제할까요?`)) return;
    await api.deleteChatSession(session.id);
    removeChatDraft(session.id);
    const nextSessions = chatSessions.filter((candidate) => candidate.id !== session.id);
    setChatSessions(nextSessions);
    if (activeChatId === session.id) {
      if (nextSessions[0]) {
        await openChat(nextSessions[0].id);
      } else {
        setActiveChatId(null);
        setChatDetail(null);
      }
    }
  }

  async function submitChat(event: FormEvent) {
    event.preventDefault();
    const content = chatText.trim();
    if (!activeChatId || !content || isChatSending) return;

    setIsChatSending(true);
    setChatStartedAtMs(Date.now());
    setChatStatusText("요청을 보내는 중입니다.");
    setChatStreamingText("");
    setChatText("");
    removeChatDraft(activeChatId);
    pendingAiSnapshotRef.current = planDetail ? snapshotFromDetail(planDetail) : null;
    const localUserMessage: ChatMessage = {
      id: `local_${Date.now()}`,
      chatSessionId: activeChatId,
      role: "user",
      content,
      status: "pending",
      metadataJson: "{}",
      createdAt: new Date().toISOString()
    };
    setChatDetail((current) =>
      current ? { ...current, messages: [...current.messages, localUserMessage] } : current
    );

    try {
      await sendChatMessage(activeChatId, content, handleChatEvent);
    } catch (error) {
      pendingAiSnapshotRef.current = null;
      window.alert(readError(error));
    } finally {
      setIsChatSending(false);
      setChatStartedAtMs(null);
      setChatStatusText("");
    }
  }

  function handleChatEvent(event: ChatStreamEvent) {
    if (event.type === "run_started") {
      setChatStatusText(event.message);
      return;
    }
    if (event.type === "assistant_delta") {
      setChatStatusText("");
      setChatStreamingText((current) => current + event.delta);
      return;
    }
    if (event.type === "run_completed") {
      setChatDetail(event.detail);
      setChatSessions((current) =>
        current.map((session) => (session.id === event.detail.session.id ? event.detail.session : session))
      );
      setChatStreamingText("");
      setChatStatusText("");
      if (activePlan) {
        void api.planDetail(activePlan.id).then((detail) => {
          setPlanDetail(detail);
          const before = pendingAiSnapshotRef.current;
          pendingAiSnapshotRef.current = null;
          if (before && event.operationCount > 0) {
            pushHistory("AI 변경", before, snapshotFromDetail(detail));
          }
        });
      } else {
        pendingAiSnapshotRef.current = null;
      }
      return;
    }
    if (event.type === "run_failed") {
      setChatStatusText("");
      pendingAiSnapshotRef.current = null;
      window.alert(event.error);
    }
  }

  function handleChatKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey || event.altKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    void submitChat(event as unknown as FormEvent);
  }

  function handleChatScroll() {
    const chatLog = chatLogRef.current;
    if (!chatLog) return;
    const nearBottom = isChatLogNearBottom(chatLog);
    shouldAutoScrollChatRef.current = nearBottom;
    setShowChatLatest(!nearBottom && (isChatSending || Boolean(chatStreamingText)));
  }

  function scrollChatToLatest(behavior: ScrollBehavior = "smooth") {
    const chatLog = chatLogRef.current;
    if (!chatLog) return;
    chatLog.scrollTo({ top: chatLog.scrollHeight, behavior });
    shouldAutoScrollChatRef.current = true;
    setShowChatLatest(false);
  }

  const content = activePlan && planDetail ? (
    <main className="editor-shell">
      <aside className="planner-panel">
        <PanelHeader title="계획" subtitle={activeWorkspace?.name ?? ""} />
        <section className="plan-meta">
          <input
            value={activePlan.title}
            onChange={(event) => setPlanDetail({ ...planDetail, plan: { ...activePlan, title: event.target.value } })}
            onBlur={() => void savePlan(activePlan)}
          />
          <textarea
            value={activePlan.summary ?? ""}
            placeholder="계획 요약"
            onChange={(event) => setPlanDetail({ ...planDetail, plan: { ...activePlan, summary: event.target.value } })}
            onBlur={() => void savePlan(activePlan)}
          />
          <div className="view-tabs">
            {viewOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.id}
                  className={activePlan.currentView === option.id ? "active" : ""}
                  onClick={() => void savePlan({ ...activePlan, currentView: option.id })}
                  type="button"
                >
                  <Icon size={16} />
                  {option.label}
                </button>
              );
            })}
          </div>
        </section>
        <section className="task-list-section">
          <div className="section-title-row">
            <strong>작업</strong>
            <span>{planDetail.tasks.length}</span>
          </div>
          <form className="inline-form" onSubmit={createTask}>
            <input
              value={newTaskTitle}
              onChange={(event) => setNewTaskTitle(event.target.value)}
              placeholder="작업 추가"
            />
            <button type="submit" aria-label="작업 추가">
              <Plus size={18} />
            </button>
          </form>
          <div className="task-list">
            {planDetail.tasks.map((task) => (
              <TaskListItem
                key={task.id}
                task={task}
                active={selectedTaskId === task.id}
                onSelect={() => selectTask(task.id)}
                onUpdate={updateTask}
                onDelete={deleteTask}
              />
            ))}
          </div>
        </section>
      </aside>
      <section className="visual-panel">
        <VisualBoard
          detail={planDetail}
          selectedTaskId={selectedTaskId}
          selectedLinkId={selectedLinkId}
          onSelectTask={selectTask}
          onSelectLink={selectLink}
          onUpdateTask={updateTask}
          onCreateLink={createLink}
          onApplyTaskLayout={applyTaskLayout}
          onUndo={undoHistory}
          onRedo={redoHistory}
          canUndo={historyPast.length > 0}
          canRedo={historyFuture.length > 0}
          latestHistoryLabel={historyPast.at(-1)?.label ?? null}
        />
        {selectedTask && (
          <TaskInspector
            task={selectedTask}
            onClose={() => setSelectedTaskId(null)}
            onUpdate={updateTask}
            onDelete={deleteTask}
          />
        )}
        {selectedLink && (
          <EdgeInspector
            link={selectedLink}
            tasks={planDetail.tasks}
            onClose={() => setSelectedLinkId(null)}
            onDelete={deleteLink}
          />
        )}
      </section>
      <aside className="chat-panel">
        <PanelHeader
          title={activeChatId ? chatDetail?.session.title ?? "AI 상담" : "AI 상담"}
          subtitle="계획을 말로 수정합니다"
          action={
            <button className="icon-button" type="button" onClick={createChatSession} aria-label="새 대화">
              <Plus size={18} />
            </button>
          }
        />
        {activeChatId && chatDetail ? (
          <>
            <div className="chat-toolbar">
              <button className="ghost-button" type="button" onClick={() => setActiveChatId(null)}>
                <ChevronLeft size={16} />
                목록
              </button>
              <button className="ghost-button" type="button" onClick={() => void renameChatSession(chatDetail.session)}>
                이름 변경
              </button>
              <button className="ghost-button" type="button" onClick={() => void copyChat(chatDetail.messages)}>
                <Copy size={15} />
                복사
              </button>
            </div>
            <div className="chat-log-frame">
              <div className="chat-log" ref={chatLogRef} onScroll={handleChatScroll}>
                {messages.map((message) => (
                  <ChatBubble key={message.id} message={message} />
                ))}
                {(isChatSending || chatStreamingText || chatStatusText) && (
                  <div className="assistant-message streaming">
                    {chatStreamingText ? (
                      <MarkdownContent content={chatStreamingText} />
                    ) : (
                      <div className="pending-row">
                        <RefreshCw size={16} />
                        <span>{chatStatusText || "응답을 기다리는 중입니다."}</span>
                        {chatElapsedSeconds > 0 && <em>{chatElapsedSeconds}초</em>}
                      </div>
                    )}
                  </div>
                )}
                {showChatLatest && (
                  <button className="chat-scroll-latest" type="button" onClick={() => scrollChatToLatest()}>
                    최신으로
                  </button>
                )}
              </div>
            </div>
            <form className="chat-form" onSubmit={submitChat}>
              <textarea
                value={chatText}
                onChange={(event) => {
                  setChatText(event.target.value);
                  if (activeChatId) writeChatDraft(activeChatId, event.target.value);
                }}
                onKeyDown={handleChatKeyDown}
                placeholder="Enter 전송, Shift/Alt+Enter 줄바꿈"
              />
              <button type="submit" disabled={isChatSending || !chatText.trim()} aria-label="전송">
                <Send size={18} />
              </button>
            </form>
          </>
        ) : (
          <ChatSessionList
            sessions={chatSessions}
            onOpen={openChat}
            onCreate={createChatSession}
            onRename={renameChatSession}
            onDelete={deleteChatSession}
          />
        )}
      </aside>
    </main>
  ) : (
    <main className="empty-state">
      <ListChecks size={34} />
      <h2>계획을 선택하거나 새로 만드세요</h2>
      <p>가운데 캔버스에서 전체 작업을 보고, 오른쪽 AI 상담으로 계획을 수정합니다.</p>
    </main>
  );

  if (screen !== "editor" || !activePlan || !planDetail) {
    return (
      <SelectScreen
        workspaces={workspaces}
        workspaceId={workspaceId}
        workspaceName={workspaceName}
        settingsWorkspace={settingsWorkspace}
        workspaceSettingsForm={workspaceSettingsForm}
        providerStatuses={providerStatuses}
        plans={plans}
        onWorkspaceChange={setWorkspaceId}
        onWorkspaceNameChange={setWorkspaceName}
        onCreateWorkspace={createWorkspace}
        onRenameWorkspace={(workspace) => void renameWorkspace(workspace)}
        onOpenWorkspaceSettings={openWorkspaceSettings}
        onWorkspaceSettingsFormChange={setWorkspaceSettingsForm}
        onSubmitWorkspaceSettings={submitWorkspaceSettings}
        onCloseWorkspaceSettings={() => {
          setSettingsWorkspace(null);
          setWorkspaceSettingsForm(workspaceToSettingsForm(null));
        }}
        onDeleteWorkspace={(workspace) => void deleteWorkspace(workspace)}
        onCreatePlan={createPlan}
        newPlanTitle={newPlanTitle}
        onNewPlanTitleChange={setNewPlanTitle}
        onEnterPlan={(planId) => void openPlan(planId)}
        onRenamePlan={(plan) => void renamePlan(plan)}
        onDeletePlan={(plan) => void deletePlan(plan)}
      />
    );
  }

  return (
    <div className="app-page editor-page">
      <header className="editor-top-bar">
        <button className="text-back-button" type="button" onClick={() => setScreen("select")}>
          <ChevronLeft size={16} />
          목록
        </button>
        <div>
          <p className="eyebrow">{activeWorkspace?.name ?? "Workspace"}</p>
          <h1>{activePlan.title}</h1>
        </div>
      </header>
      {content}
    </div>
  );
}

function SelectScreen(props: {
  workspaces: Workspace[];
  workspaceId: string;
  workspaceName: string;
  settingsWorkspace: Workspace | null;
  workspaceSettingsForm: WorkspaceSettingsForm;
  providerStatuses: ProviderStatus[];
  plans: Plan[];
  newPlanTitle: string;
  onWorkspaceChange: (workspaceId: string) => void;
  onWorkspaceNameChange: (name: string) => void;
  onCreateWorkspace: (event: FormEvent) => void;
  onRenameWorkspace: (workspace: Workspace) => void;
  onOpenWorkspaceSettings: (workspace: Workspace) => void;
  onWorkspaceSettingsFormChange: (form: WorkspaceSettingsForm) => void;
  onSubmitWorkspaceSettings: (event: FormEvent) => void;
  onCloseWorkspaceSettings: () => void;
  onDeleteWorkspace: (workspace: Workspace) => void;
  onCreatePlan: (event: FormEvent) => void;
  onNewPlanTitleChange: (title: string) => void;
  onEnterPlan: (planId: string) => void;
  onRenamePlan: (plan: Plan) => void;
  onDeletePlan: (plan: Plan) => void;
}) {
  return (
    <main className="app-page select-page">
      <section className="select-shell">
        <div className="select-main">
          <div className="select-header">
            <div>
              <p className="eyebrow">Mind workspace</p>
              <h1>계획 작업실</h1>
            </div>
            <form className="plan-create compact" onSubmit={props.onCreatePlan}>
              <input
                value={props.newPlanTitle}
                onChange={(event) => props.onNewPlanTitleChange(event.target.value)}
                placeholder="새 계획 이름"
              />
              <button type="submit" disabled={!props.workspaceId || !props.newPlanTitle.trim()}>
                <Plus size={16} />
                계획 생성
              </button>
            </form>
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

          <div className="plan-list">
            {props.plans.length === 0 ? (
              <div className="empty-state">
                <CalendarDays size={22} />
                <strong>아직 계획이 없습니다</strong>
                <span>작업 이름을 정하면 캔버스, 칸반, 마인드맵 편집 화면이 만들어집니다.</span>
              </div>
            ) : null}
            {props.plans.map((plan) => (
              <article className="plan-row" key={plan.id}>
                <button className="plan-row-main" type="button" onClick={() => props.onEnterPlan(plan.id)}>
                  <span className="plan-row-icon">
                    <ListChecks size={18} />
                  </span>
                  <span className="plan-row-body">
                    <strong>{plan.title}</strong>
                    <span>{[plan.status, plan.dueDate ? `마감 ${plan.dueDate}` : null].filter(Boolean).join(" · ")}</span>
                  </span>
                  <ChevronRight size={18} />
                </button>
                <span className="row-actions">
                  <button type="button" aria-label="계획 이름 변경" onClick={() => props.onRenamePlan(plan)}>
                    <Edit3 size={14} />
                  </button>
                  <button type="button" aria-label="계획 삭제" onClick={() => props.onDeletePlan(plan)}>
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

function PanelHeader(props: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="panel-header">
      <div>
        <strong>{props.title}</strong>
        {props.subtitle && <span>{props.subtitle}</span>}
      </div>
      {props.action}
    </div>
  );
}

function TaskListItem(props: {
  task: TaskNode;
  active: boolean;
  onSelect: () => void;
  onUpdate: (task: TaskNode) => Promise<void>;
  onDelete: (task: TaskNode) => Promise<void>;
}) {
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    props.onSelect();
  }

  return (
    <div
      className={props.active ? "task-row active" : "task-row"}
      role="button"
      tabIndex={0}
      onClick={props.onSelect}
      onKeyDown={handleKeyDown}
    >
      <span className={`status-dot ${props.task.status}`} />
      <div>
        <strong>{props.task.title}</strong>
        <em>{statusLabel(props.task.status)} · {priorityLabel(props.task.priority)}</em>
      </div>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          void props.onUpdate({ ...props.task, status: props.task.status === "done" ? "todo" : "done" });
        }}
        aria-label="완료 토글"
      >
        <Check size={15} />
      </button>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          void props.onDelete(props.task);
        }}
        aria-label="삭제"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}

function VisualBoard(props: {
  detail: PlanDetail;
  selectedTaskId: string | null;
  selectedLinkId: string | null;
  onSelectTask: (taskId: string) => void;
  onSelectLink: (linkId: string) => void;
  onUpdateTask: (task: TaskNode, options?: TaskUpdateOptions) => Promise<void>;
  onCreateLink: (sourceNodeId: string, targetNodeId: string) => Promise<void>;
  onApplyTaskLayout: (tasks: TaskNode[], label?: string) => Promise<void>;
  onUndo: () => Promise<void>;
  onRedo: () => Promise<void>;
  canUndo: boolean;
  canRedo: boolean;
  latestHistoryLabel: string | null;
}) {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const panRef = useRef<{ pointerId: number; startX: number; startY: number; viewport: CanvasViewport } | null>(null);
  const nodeDragRef = useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    task: TaskNode;
    moved: boolean;
  } | null>(null);
  const suppressNodeClickRef = useRef(false);
  const hasFitInitialCanvasRef = useRef(false);
  const [viewport, setViewport] = useState<CanvasViewport>({ x: 72, y: 72, scale: 1 });
  const [boardSize, setBoardSize] = useState({ width: 0, height: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [nodeDraftPositions, setNodeDraftPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [pendingConnection, setPendingConnection] = useState<PendingConnection | null>(null);
  const [connectionTargetId, setConnectionTargetId] = useState<string | null>(null);
  const visibleTasks = useMemo(
    () =>
      props.detail.tasks.map((task) => {
        const draft = nodeDraftPositions[task.id];
        return draft ? { ...task, x: draft.x, y: draft.y } : task;
      }),
    [nodeDraftPositions, props.detail.tasks]
  );
  const contentBounds = useMemo(() => canvasContentBounds(visibleTasks), [visibleTasks]);
  const svgBounds = useMemo(
    () =>
      pendingConnection
        ? expandRectWithPoints(contentBounds, [pendingConnection.from, pendingConnection.to])
        : contentBounds,
    [contentBounds, pendingConnection]
  );
  const minimapScale = Math.min(
    (minimapWidth - minimapPadding * 2) / contentBounds.width,
    (minimapHeight - minimapPadding * 2) / contentBounds.height
  );
  const visibleWorld = {
    x: -viewport.x / viewport.scale,
    y: -viewport.y / viewport.scale,
    width: boardSize.width / viewport.scale,
    height: boardSize.height / viewport.scale
  };
  const minimapViewport = {
    left: minimapPadding + (visibleWorld.x - contentBounds.minX) * minimapScale,
    top: minimapPadding + (visibleWorld.y - contentBounds.minY) * minimapScale,
    width: visibleWorld.width * minimapScale,
    height: visibleWorld.height * minimapScale
  };

  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (!rect) return;
      setBoardSize({ width: rect.width, height: rect.height });
    });
    resizeObserver.observe(board);
    return () => resizeObserver.disconnect();
  }, [props.detail.plan.currentView]);

  useEffect(() => {
    if (props.detail.plan.currentView !== "canvas" || hasFitInitialCanvasRef.current || boardSize.width <= 0) return;
    setViewport(fitViewport(contentBounds, boardSize));
    hasFitInitialCanvasRef.current = true;
  }, [boardSize, contentBounds, props.detail.plan.currentView]);

  function zoomAt(clientX: number, clientY: number, nextScale: number) {
    const board = boardRef.current;
    if (!board) return;
    const rect = board.getBoundingClientRect();
    const pointX = clientX - rect.left;
    const pointY = clientY - rect.top;
    setViewport((current) => {
      const scale = clamp(nextScale, 0.1, 2.4);
      const worldX = (pointX - current.x) / current.scale;
      const worldY = (pointY - current.y) / current.scale;
      return {
        x: pointX - worldX * scale,
        y: pointY - worldY * scale,
        scale
      };
    });
  }

  function zoomBy(multiplier: number) {
    const board = boardRef.current;
    if (!board) return;
    const rect = board.getBoundingClientRect();
    zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, viewport.scale * multiplier);
  }

  function fitCanvas() {
    setViewport(fitViewport(contentBounds, boardSize));
  }

  function autoLayoutCanvas() {
    const nextTasks = autoLayoutTasks(props.detail.tasks, props.detail.links);
    void props.onApplyTaskLayout(nextTasks, "노드 자동 정렬").then(() => {
      window.requestAnimationFrame(() => {
        setViewport(fitViewport(canvasContentBounds(nextTasks), boardSize));
      });
    });
  }

  function handleCanvasWheel(event: ReactWheelEvent<HTMLDivElement>) {
    event.preventDefault();
    const multiplier = event.deltaY > 0 ? 0.9 : 1.1;
    zoomAt(event.clientX, event.clientY, viewport.scale * multiplier);
  }

  function handleCanvasPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    if (target.closest(".canvas-node, .canvas-toolbar, .canvas-minimap")) return;
    panRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      viewport
    };
    setIsPanning(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleCanvasPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (pendingConnection) {
      const targetTaskId = connectionTargetFromPoint(event.clientX, event.clientY, pendingConnection.sourceTaskId);
      setConnectionTargetId(targetTaskId);
      const targetTask = targetTaskId ? visibleTasks.find((task) => task.id === targetTaskId) : null;
      setPendingConnection({
        ...pendingConnection,
        to: targetTask
          ? nearestHandlePointFromPoint(targetTask, pendingConnection.from)
          : clientPointToWorld(event.clientX, event.clientY, boardRef.current, viewport)
      });
      return;
    }

    const pan = panRef.current;
    if (!pan || pan.pointerId !== event.pointerId) return;
    setViewport({
      ...pan.viewport,
      x: pan.viewport.x + event.clientX - pan.startX,
      y: pan.viewport.y + event.clientY - pan.startY
    });
  }

  function handleCanvasPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (pendingConnection) {
      const targetTaskId = connectionTargetFromPoint(event.clientX, event.clientY, pendingConnection.sourceTaskId);
      const sourceTaskId = pendingConnection.sourceTaskId;
      setPendingConnection(null);
      setConnectionTargetId(null);
      boardRef.current?.releasePointerCapture(event.pointerId);
      if (targetTaskId && targetTaskId !== sourceTaskId) {
        void props.onCreateLink(sourceTaskId, targetTaskId).catch((error) => window.alert(readError(error)));
      }
      return;
    }

    const pan = panRef.current;
    if (!pan || pan.pointerId !== event.pointerId) return;
    panRef.current = null;
    setIsPanning(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function handleNodePointerDown(event: ReactPointerEvent<HTMLButtonElement>, task: TaskNode) {
    if (event.button !== 0) return;
    event.stopPropagation();
    props.onSelectTask(task.id);
    const draft = nodeDraftPositions[task.id] ?? { x: task.x, y: task.y };
    nodeDragRef.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: draft.x,
      startY: draft.y,
      currentX: draft.x,
      currentY: draft.y,
      task,
      moved: false
    };
    setDraggingNodeId(task.id);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function startConnection(event: ReactPointerEvent<HTMLElement>, task: TaskNode, side: NodeHandleSide) {
    event.preventDefault();
    event.stopPropagation();
    const from = nodeHandlePoint(task, side);
    setPendingConnection({
      sourceTaskId: task.id,
      sourceSide: side,
      from,
      to: clientPointToWorld(event.clientX, event.clientY, boardRef.current, viewport)
    });
    setConnectionTargetId(null);
    boardRef.current?.setPointerCapture(event.pointerId);
    props.onSelectTask(task.id);
  }

  function connectionTargetFromPoint(clientX: number, clientY: number, sourceTaskId: string): string | null {
    const element = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
    const node = element?.closest<HTMLElement>("[data-canvas-node='true']");
    const targetTaskId = node?.dataset.nodeId ?? null;
    return targetTaskId && targetTaskId !== sourceTaskId ? targetTaskId : null;
  }

  function handleNodePointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    const drag = nodeDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.stopPropagation();
    const deltaX = (event.clientX - drag.startClientX) / viewport.scale;
    const deltaY = (event.clientY - drag.startClientY) / viewport.scale;
    const nextX = drag.startX + deltaX;
    const nextY = drag.startY + deltaY;
    drag.currentX = nextX;
    drag.currentY = nextY;
    drag.moved = drag.moved || Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2;
    setNodeDraftPositions((current) => ({
      ...current,
      [drag.task.id]: { x: nextX, y: nextY }
    }));
  }

  function handleNodePointerUp(event: ReactPointerEvent<HTMLButtonElement>) {
    const drag = nodeDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.stopPropagation();
    event.currentTarget.releasePointerCapture(event.pointerId);
    nodeDragRef.current = null;
    setDraggingNodeId(null);
    suppressNodeClickRef.current = drag.moved;
    window.setTimeout(() => {
      suppressNodeClickRef.current = false;
    }, 0);

    if (!drag.moved) {
      setNodeDraftPositions((current) => removeDraftPosition(current, drag.task.id));
      return;
    }

    void props
      .onUpdateTask({
        ...drag.task,
        x: drag.currentX,
        y: drag.currentY
      }, { label: "노드 이동" })
      .then(() => {
        setNodeDraftPositions((current) => removeDraftPosition(current, drag.task.id));
      })
      .catch((error) => {
        window.alert(readError(error));
      });
  }

  function handleNodeClick(event: ReactMouseEvent<HTMLButtonElement>, taskId: string) {
    if (suppressNodeClickRef.current) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    props.onSelectTask(taskId);
  }

  function moveViewportFromMinimap(event: ReactPointerEvent<HTMLDivElement>) {
    const minimap = event.currentTarget;
    const rect = minimap.getBoundingClientRect();
    const worldX = contentBounds.minX + (event.clientX - rect.left - minimapPadding) / minimapScale;
    const worldY = contentBounds.minY + (event.clientY - rect.top - minimapPadding) / minimapScale;
    setViewport((current) => ({
      ...current,
      x: boardSize.width / 2 - worldX * current.scale,
      y: boardSize.height / 2 - worldY * current.scale
    }));
  }

  if (props.detail.plan.currentView === "kanban") {
    return (
      <div className="kanban-board">
        {statusColumns.map((column) => (
          <section key={column.id} className="kanban-column">
            <div className="kanban-title">
              <strong>{column.label}</strong>
              <span>{props.detail.tasks.filter((task) => task.status === column.id).length}</span>
            </div>
            <div className="kanban-items">
              {props.detail.tasks
                .filter((task) => task.status === column.id)
                .map((task) => (
                  <TaskCard key={task.id} task={task} active={props.selectedTaskId === task.id} onSelect={props.onSelectTask} />
                ))}
            </div>
          </section>
        ))}
      </div>
    );
  }

  if (props.detail.plan.currentView === "mindmap") {
    return (
      <div className="mindmap-board">
        <div className="mind-root">
          <strong>{props.detail.plan.title}</strong>
          <span>{props.detail.tasks.length}개 작업</span>
        </div>
        <div className="mind-branches">
          {props.detail.tasks.map((task) => (
            <button
              className={props.selectedTaskId === task.id ? "mind-node active" : "mind-node"}
              key={task.id}
              type="button"
              onClick={() => props.onSelectTask(task.id)}
            >
              <strong>{task.title}</strong>
              <span>{statusLabel(task.status)}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={["canvas-board", isPanning ? "is-panning" : "", pendingConnection ? "is-connecting" : ""]
        .filter(Boolean)
        .join(" ")}
      ref={boardRef}
      onPointerDown={handleCanvasPointerDown}
      onPointerMove={handleCanvasPointerMove}
      onPointerUp={handleCanvasPointerUp}
      onPointerCancel={handleCanvasPointerUp}
      onWheel={handleCanvasWheel}
    >
      <div className="canvas-toolbar">
        <button type="button" onClick={() => void props.onUndo()} disabled={!props.canUndo} title="실행 취소 (⌘Z)" aria-label="실행 취소">
          <Undo2 size={16} />
        </button>
        <button type="button" onClick={() => void props.onRedo()} disabled={!props.canRedo} title="다시 실행 (⇧⌘Z)" aria-label="다시 실행">
          <Redo2 size={16} />
        </button>
        <button type="button" onClick={() => zoomBy(0.88)} aria-label="축소">
          <ZoomOut size={16} />
        </button>
        <span>{Math.round(viewport.scale * 100)}%</span>
        <button type="button" onClick={() => zoomBy(1.14)} aria-label="확대">
          <ZoomIn size={16} />
        </button>
        <button type="button" onClick={fitCanvas}>
          전체보기
        </button>
        <button type="button" onClick={autoLayoutCanvas}>
          정렬
        </button>
        {props.latestHistoryLabel && <em>{props.latestHistoryLabel}</em>}
      </div>
      <div
        className="canvas-world"
        style={{ transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})` }}
      >
        <svg
          className="canvas-lines"
          style={{
            left: svgBounds.minX,
            top: svgBounds.minY,
            width: svgBounds.width,
            height: svgBounds.height
          }}
          viewBox={`${svgBounds.minX} ${svgBounds.minY} ${svgBounds.width} ${svgBounds.height}`}
        >
          {props.detail.links.map((link) => {
            const source = visibleTasks.find((task) => task.id === link.sourceNodeId);
            const target = visibleTasks.find((task) => task.id === link.targetNodeId);
            if (!source || !target) return null;
            const { from, to } = edgeAnchorPoints(source, target);
            return (
              <g
                key={link.id}
                className={props.selectedLinkId === link.id ? "canvas-edge selected" : "canvas-edge"}
              >
                <line className="canvas-edge-line" x1={from.x} y1={from.y} x2={to.x} y2={to.y} />
                <line
                  className="canvas-edge-hit"
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation();
                    props.onSelectLink(link.id);
                  }}
                />
              </g>
            );
          })}
          {pendingConnection && (
            <line
              className="canvas-edge-line pending"
              x1={pendingConnection.from.x}
              y1={pendingConnection.from.y}
              x2={pendingConnection.to.x}
              y2={pendingConnection.to.y}
            />
          )}
        </svg>
        {visibleTasks.map((task) => (
          <button
            key={task.id}
            className={[
              "canvas-node",
              props.selectedTaskId === task.id ? "active" : "",
              draggingNodeId === task.id ? "dragging" : "",
              connectionTargetId === task.id ? "connection-target" : ""
            ]
              .filter(Boolean)
              .join(" ")}
            style={{ left: task.x, top: task.y }}
            type="button"
            data-canvas-node="true"
            data-node-id={task.id}
            onClick={(event) => handleNodeClick(event, task.id)}
            onPointerDown={(event) => handleNodePointerDown(event, task)}
            onPointerMove={handleNodePointerMove}
            onPointerUp={handleNodePointerUp}
            onPointerCancel={handleNodePointerUp}
          >
            {(["top", "right", "bottom", "left"] as NodeHandleSide[]).map((side) => (
              <span
                key={side}
                className={`node-link-handle ${side}`}
                data-node-handle="true"
                data-node-id={task.id}
                data-side={side}
                title={`${side} 핸들에서 드래그해 간선 연결`}
                onPointerDown={(event) => startConnection(event, task, side)}
              />
            ))}
            <span className={`status-dot ${task.status}`} />
            <strong>{task.title}</strong>
            {task.description && <span>{task.description}</span>}
          </button>
        ))}
      </div>
      <div className="canvas-minimap">
        <strong>미니맵</strong>
        <div className="minimap-stage" onPointerDown={moveViewportFromMinimap}>
          {visibleTasks.map((task) => (
            <span
              key={task.id}
              className={props.selectedTaskId === task.id ? "minimap-node active" : "minimap-node"}
              style={{
                left: minimapPadding + (task.x - contentBounds.minX) * minimapScale,
                top: minimapPadding + (task.y - contentBounds.minY) * minimapScale,
                width: Math.max(4, canvasNodeWidth * minimapScale),
                height: Math.max(3, canvasNodeHeight * minimapScale)
              }}
            />
          ))}
          <span
            className="minimap-viewport"
            style={{
              left: clamp(minimapViewport.left, 0, minimapWidth),
              top: clamp(minimapViewport.top, 0, minimapHeight),
              width: clamp(minimapViewport.width, 8, minimapWidth),
              height: clamp(minimapViewport.height, 8, minimapHeight)
            }}
          />
        </div>
      </div>
    </div>
  );
}

function TaskCard(props: { task: TaskNode; active: boolean; onSelect: (taskId: string) => void }) {
  return (
    <button className={props.active ? "task-card active" : "task-card"} type="button" onClick={() => props.onSelect(props.task.id)}>
      <strong>{props.task.title}</strong>
      {props.task.description && <span>{props.task.description}</span>}
      <em>{priorityLabel(props.task.priority)}</em>
    </button>
  );
}

function TaskInspector(props: {
  task: TaskNode;
  onClose: () => void;
  onUpdate: (task: TaskNode) => Promise<void>;
  onDelete: (task: TaskNode) => Promise<void>;
}) {
  const [draft, setDraft] = useState(props.task);

  useEffect(() => {
    setDraft(props.task);
  }, [props.task]);

  useEffect(() => {
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        props.onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [props.onClose]);

  return (
    <aside className="inspector">
      <div className="inspector-header">
        <strong>작업 편집</strong>
        <button type="button" onClick={props.onClose} aria-label="닫기">
          <X size={18} />
        </button>
      </div>
      <label>
        제목
        <input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
      </label>
      <label>
        설명
        <textarea
          value={draft.description ?? ""}
          onChange={(event) => setDraft({ ...draft, description: event.target.value })}
        />
      </label>
      <label>
        상태
        <select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as TaskStatus })}>
          {statusColumns.map((column) => (
            <option key={column.id} value={column.id}>
              {column.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        우선순위
        <select value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value as TaskNode["priority"] })}>
          <option value="low">낮음</option>
          <option value="normal">보통</option>
          <option value="high">높음</option>
        </select>
      </label>
      <div className="inspector-actions">
        <button type="button" onClick={() => void props.onUpdate(draft)}>
          <Save size={16} />
          저장
        </button>
        <button className="danger-button" type="button" onClick={() => void props.onDelete(props.task)}>
          <Trash2 size={16} />
          삭제
        </button>
      </div>
    </aside>
  );
}

function EdgeInspector(props: {
  link: TaskLink;
  tasks: TaskNode[];
  onClose: () => void;
  onDelete: (link: TaskLink) => Promise<void>;
}) {
  const source = props.tasks.find((task) => task.id === props.link.sourceNodeId);
  const target = props.tasks.find((task) => task.id === props.link.targetNodeId);

  useEffect(() => {
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        props.onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [props.onClose]);

  return (
    <aside className="edge-inspector">
      <div className="inspector-header">
        <strong>간선 선택</strong>
        <button type="button" onClick={props.onClose} aria-label="닫기">
          <X size={18} />
        </button>
      </div>
      <div className="edge-summary">
        <span>{source?.title ?? "시작 노드"}</span>
        <em>→</em>
        <span>{target?.title ?? "도착 노드"}</span>
      </div>
      {props.link.label && <p>{props.link.label}</p>}
      <div className="inspector-actions">
        <button className="danger-button" type="button" onClick={() => void props.onDelete(props.link)}>
          <Trash2 size={16} />
          삭제
        </button>
      </div>
    </aside>
  );
}

function ChatSessionList(props: {
  sessions: ChatSession[];
  onOpen: (sessionId: string) => Promise<void>;
  onCreate: () => Promise<void>;
  onRename: (session: ChatSession) => Promise<void>;
  onDelete: (session: ChatSession) => Promise<void>;
}) {
  return (
    <div className="chat-home">
      <button className="new-chat-button" type="button" onClick={props.onCreate}>
        <MessageSquare size={17} />
        새 대화 시작
      </button>
      <div className="chat-session-list">
        {props.sessions.map((session) => (
          <div className="chat-session-row" key={session.id}>
            <button type="button" onClick={() => void props.onOpen(session.id)}>
              <strong>{session.title}</strong>
              <span>{formatDate(session.updatedAt)}</span>
            </button>
            <button type="button" onClick={() => void props.onRename(session)} aria-label="이름 변경">
              <Edit3 size={15} />
            </button>
            <button type="button" onClick={() => void props.onDelete(session)} aria-label="삭제">
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChatBubble(props: { message: ChatMessage }) {
  const isUser = props.message.role === "user";
  const metadata = parseMetadata(props.message.metadataJson);
  return (
    <div className={isUser ? "user-message" : "assistant-message"}>
      <div className="message-topline">
        <span>{isUser ? "나" : "AI"}</span>
        <em>{formatDate(props.message.createdAt)}</em>
        {typeof metadata.durationMs === "number" && <em>{Math.round(metadata.durationMs / 1000)}초</em>}
        <button type="button" onClick={() => void writeClipboardText(props.message.content)} aria-label="복사">
          <Copy size={14} />
        </button>
      </div>
      {isUser ? <p>{props.message.content}</p> : <MarkdownContent content={props.message.content} />}
    </div>
  );
}

function MarkdownContent(props: { content: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
      {props.content}
    </ReactMarkdown>
  );
}

function WorkspaceSettingsDialog(props: {
  workspace: Workspace;
  form: WorkspaceSettingsForm;
  providerStatuses: ProviderStatus[];
  onChange: (form: WorkspaceSettingsForm) => void;
  onSubmit: (event: FormEvent) => void;
  onClose: () => void;
}) {
  const providerOption = aiProviderOptions.find((option) => option.value === props.form.aiProvider) ?? aiProviderOptions[0];
  const isCodex = providerOption.value === "codex-app-server";
  const isClaude = providerOption.value === "claude-cli";
  const isOpenAiCompatible = providerOption.value === "openai-compatible";
  const isOpenRouter = providerOption.value === "openrouter";
  const providerStatus = props.providerStatuses.find((status) => (status.id ?? status.provider) === providerOption.value);
  const providerModels = providerStatus?.models?.length ? providerStatus.models : fallbackProviderModels(providerOption.value);
  const hasSelectedModel = providerModels.some((option) => option.value === props.form.aiModel);

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
                  {!hasSelectedModel && props.form.aiModel ? <option value={props.form.aiModel}>{props.form.aiModel}</option> : null}
                  {providerModels.map((model) => (
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
          {isClaude ? (
            <>
              <label>
                <span>Claude 명령어</span>
                <input
                  value={props.form.claudeCommand}
                  onChange={(event) => setField("claudeCommand", event.target.value)}
                  placeholder="claude"
                />
                <small>서버의 Claude CLI provider가 사용하는 명령어를 기록해 둡니다.</small>
              </label>
              <label>
                <span>모델</span>
                <select
                  value={props.form.aiModel}
                  onChange={(event) => setField("aiModel", event.target.value)}
                >
                  {!hasSelectedModel && props.form.aiModel ? <option value={props.form.aiModel}>{props.form.aiModel}</option> : null}
                  {providerModels.map((model) => (
                    <option key={model.value} value={model.value}>
                      {model.label} · {model.description}
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
                  {providerModels.map((model) => (
                    <option key={model.value} value={model.value} label={`${model.label} · ${model.description}`} />
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
                  {providerModels.map((model) => (
                    <option key={model.value} value={model.value} label={`${model.label} · ${model.description}`} />
                  ))}
                </datalist>
              </label>
              <label>
                <span>HTTP-Referer</span>
                <input
                  value={props.form.openRouterReferer}
                  onChange={(event) => setField("openRouterReferer", event.target.value)}
                  placeholder="http://localhost:5183"
                />
              </label>
              <label>
                <span>X-OpenRouter-Title</span>
                <input
                  value={props.form.openRouterTitle}
                  onChange={(event) => setField("openRouterTitle", event.target.value)}
                  placeholder="Mind Plan"
                />
              </label>
            </>
          ) : null}
          <div className="settings-summary">
            <strong>{props.workspace.name}</strong>
            <span>
              {providerOption.label}
              {props.form.aiModel ? ` · ${props.form.aiModel}` : ""}
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

function ProviderStatusCard(props: { status?: ProviderStatus }) {
  if (!props.status) {
    return (
      <div className="provider-status-card muted">
        <strong>상태 확인 중</strong>
        <span>설정 창을 열면 서버에서 공급자 상태를 확인합니다.</span>
      </div>
    );
  }

  const checks = props.status.checks ?? [];
  return (
    <div className={props.status.available ? "provider-status-card ready" : "provider-status-card"}>
      <div className="provider-status-head">
        <strong>{props.status.displayName ?? props.status.label}</strong>
        <span>{providerStatusLabel(props.status.status, props.status.available)}</span>
      </div>
      {props.status.detail ? <p>{props.status.detail}</p> : null}
      {checks.length > 0 ? (
        <div className="provider-check-list">
          {checks.map((check) => (
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

function statusLabel(status: TaskStatus): string {
  return statusColumns.find((column) => column.id === status)?.label ?? status;
}

function priorityLabel(priority: TaskNode["priority"]): string {
  if (priority === "high") return "높음";
  if (priority === "low") return "낮음";
  return "보통";
}

function fallbackProviderModels(provider: AiProviderId): AiModelOption[] {
  if (provider === "codex-app-server") return codexModelOptions;
  if (provider === "claude-cli") {
    return [
      { value: "default", label: "Default", description: "계정 유형에 따른 Claude Code 권장 모델" },
      { value: "sonnet", label: "Sonnet", description: "Claude Code 최신 Sonnet alias" },
      { value: "opus", label: "Opus", description: "Claude Code 최신 Opus alias" },
      { value: "haiku", label: "Haiku", description: "Claude Code 최신 Haiku alias" },
      { value: "sonnet[1m]", label: "Sonnet 1M", description: "긴 세션용 100만 토큰 컨텍스트 alias" },
      { value: "opusplan", label: "Opus Plan", description: "계획 모드에서는 Opus, 실행 시 Sonnet으로 전환" }
    ];
  }
  if (provider === "openrouter") {
    return [
      { value: "openai/gpt-5.2", label: "openai/gpt-5.2", description: "OpenRouter 기본 추천" },
      { value: "openai/gpt-4o", label: "openai/gpt-4o", description: "OpenRouter 호환 후보" }
    ];
  }
  return [
    { value: "gpt-5.4-mini", label: "GPT-5.4 Mini", description: "기본 추천" },
    { value: "gpt-5.4", label: "GPT-5.4", description: "일반 작업용" },
    { value: "gpt-5.2", label: "GPT-5.2", description: "안정적인 장문 작업용" },
    { value: "gpt-4.1", label: "GPT-4.1", description: "호환 엔드포인트 후보" }
  ];
}

function providerStatusLabel(status: string | undefined, available: boolean): string {
  if (status === "ready") return "준비됨";
  if (status === "configurable") return "설정 필요";
  if (status === "warning") return "확인 필요";
  if (status === "offline") return "오프라인";
  if (status === "unavailable") return "사용 불가";
  return available ? "사용 가능" : "확인 필요";
}

function providerCheckStatusLabel(status: string): string {
  if (status === "ok") return "정상";
  if (status === "warning") return "주의";
  if (status === "error") return "오류";
  return status;
}

function isChatLogNearBottom(element: HTMLElement, threshold = 80): boolean {
  return element.scrollHeight - element.scrollTop - element.clientHeight <= threshold;
}

function clientPointToWorld(
  clientX: number,
  clientY: number,
  board: HTMLDivElement | null,
  viewport: CanvasViewport
): CanvasPoint {
  if (!board) return { x: 0, y: 0 };
  const rect = board.getBoundingClientRect();
  return {
    x: (clientX - rect.left - viewport.x) / viewport.scale,
    y: (clientY - rect.top - viewport.y) / viewport.scale
  };
}

function nodeHandlePoint(task: TaskNode, side: NodeHandleSide): CanvasPoint {
  switch (side) {
    case "top":
      return { x: task.x + canvasNodeWidth / 2, y: task.y };
    case "right":
      return { x: task.x + canvasNodeWidth, y: task.y + canvasNodeHeight / 2 };
    case "bottom":
      return { x: task.x + canvasNodeWidth / 2, y: task.y + canvasNodeHeight };
    case "left":
      return { x: task.x, y: task.y + canvasNodeHeight / 2 };
  }
}

function edgeAnchorPoints(source: TaskNode, target: TaskNode): { from: CanvasPoint; to: CanvasPoint } {
  const sourceCenter = { x: source.x + canvasNodeWidth / 2, y: source.y + canvasNodeHeight / 2 };
  const targetCenter = { x: target.x + canvasNodeWidth / 2, y: target.y + canvasNodeHeight / 2 };
  const deltaX = targetCenter.x - sourceCenter.x;
  const deltaY = targetCenter.y - sourceCenter.y;

  if (Math.abs(deltaX) >= Math.abs(deltaY)) {
    return deltaX >= 0
      ? { from: nodeHandlePoint(source, "right"), to: nodeHandlePoint(target, "left") }
      : { from: nodeHandlePoint(source, "left"), to: nodeHandlePoint(target, "right") };
  }

  return deltaY >= 0
    ? { from: nodeHandlePoint(source, "bottom"), to: nodeHandlePoint(target, "top") }
    : { from: nodeHandlePoint(source, "top"), to: nodeHandlePoint(target, "bottom") };
}

function nearestHandlePointFromPoint(task: TaskNode, point: CanvasPoint): CanvasPoint {
  return (["top", "right", "bottom", "left"] as NodeHandleSide[])
    .map((side) => nodeHandlePoint(task, side))
    .sort((a, b) => distanceSquared(a, point) - distanceSquared(b, point))[0];
}

function distanceSquared(a: CanvasPoint, b: CanvasPoint): number {
  return (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
}

function canvasContentBounds(tasks: TaskNode[]): Rect {
  if (tasks.length === 0) {
    return { minX: 0, minY: 0, maxX: 1000, maxY: 700, width: 1000, height: 700 };
  }

  const minX = Math.min(...tasks.map((task) => task.x)) - 180;
  const minY = Math.min(...tasks.map((task) => task.y)) - 160;
  const maxX = Math.max(...tasks.map((task) => task.x + canvasNodeWidth)) + 180;
  const maxY = Math.max(...tasks.map((task) => task.y + canvasNodeHeight)) + 160;
  return {
    minX,
    minY,
    maxX,
    maxY,
    width: Math.max(420, maxX - minX),
    height: Math.max(320, maxY - minY)
  };
}

function expandRectWithPoints(rect: Rect, points: CanvasPoint[]): Rect {
  const minX = Math.min(rect.minX, ...points.map((point) => point.x)) - 40;
  const minY = Math.min(rect.minY, ...points.map((point) => point.y)) - 40;
  const maxX = Math.max(rect.maxX, ...points.map((point) => point.x)) + 40;
  const maxY = Math.max(rect.maxY, ...points.map((point) => point.y)) + 40;
  return {
    minX,
    minY,
    maxX,
    maxY,
    width: Math.max(420, maxX - minX),
    height: Math.max(320, maxY - minY)
  };
}

function fitViewport(bounds: Rect, boardSize: { width: number; height: number }): CanvasViewport {
  if (boardSize.width <= 0 || boardSize.height <= 0) {
    return { x: 72, y: 72, scale: 1 };
  }

  const scale = clamp(Math.min(boardSize.width / bounds.width, boardSize.height / bounds.height) * 0.88, 0.1, 1.4);
  return {
    x: (boardSize.width - bounds.width * scale) / 2 - bounds.minX * scale,
    y: (boardSize.height - bounds.height * scale) / 2 - bounds.minY * scale,
    scale
  };
}

function autoLayoutTasks(tasks: TaskNode[], links: TaskLink[]): TaskNode[] {
  if (tasks.length === 0) return [];

  const incoming = new Map<string, number>();
  const outgoing = new Map<string, string[]>();
  tasks.forEach((task) => {
    incoming.set(task.id, 0);
    outgoing.set(task.id, []);
  });
  links.forEach((link) => {
    if (!incoming.has(link.sourceNodeId) || !incoming.has(link.targetNodeId)) return;
    incoming.set(link.targetNodeId, (incoming.get(link.targetNodeId) ?? 0) + 1);
    outgoing.set(link.sourceNodeId, [...(outgoing.get(link.sourceNodeId) ?? []), link.targetNodeId]);
  });

  const orderById = new Map(tasks.map((task, index) => [task.id, index]));
  const roots = tasks
    .filter((task) => (incoming.get(task.id) ?? 0) === 0)
    .sort((a, b) => a.sortOrder - b.sortOrder || (orderById.get(a.id) ?? 0) - (orderById.get(b.id) ?? 0));
  const queue = roots.length > 0 ? roots.map((task) => ({ task, depth: 0 })) : [{ task: tasks[0], depth: 0 }];
  const depthById = new Map<string, number>();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;
    const previousDepth = depthById.get(current.task.id);
    if (previousDepth != null && previousDepth <= current.depth) continue;
    depthById.set(current.task.id, current.depth);
    (outgoing.get(current.task.id) ?? []).forEach((targetId) => {
      const target = tasks.find((task) => task.id === targetId);
      if (target) queue.push({ task: target, depth: current.depth + 1 });
    });
  }

  tasks.forEach((task) => {
    if (!depthById.has(task.id)) {
      depthById.set(task.id, 0);
    }
  });

  const lanes = new Map<number, TaskNode[]>();
  tasks
    .slice()
    .sort((a, b) => (depthById.get(a.id) ?? 0) - (depthById.get(b.id) ?? 0) || a.sortOrder - b.sortOrder)
    .forEach((task) => {
      const depth = depthById.get(task.id) ?? 0;
      lanes.set(depth, [...(lanes.get(depth) ?? []), task]);
    });

  return tasks.map((task) => {
    const depth = depthById.get(task.id) ?? 0;
    const lane = lanes.get(depth) ?? [];
    const row = lane.findIndex((candidate) => candidate.id === task.id);
    return {
      ...task,
      x: 120 + depth * 300,
      y: 120 + Math.max(0, row) * 148,
      sortOrder: (depth + 1) * 1000 + Math.max(0, row)
    };
  });
}

function snapshotFromDetail(detail: PlanDetail): HistorySnapshot {
  return {
    tasks: detail.tasks.map((task) => ({ ...task })),
    links: detail.links.map((link) => ({ ...link }))
  };
}

function snapshotsEqual(a: HistorySnapshot, b: HistorySnapshot): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function tasksEqual(a: TaskNode, b: TaskNode): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function removeDraftPosition(
  positions: Record<string, { x: number; y: number }>,
  taskId: string
): Record<string, { x: number; y: number }> {
  const next = { ...positions };
  delete next[taskId];
  return next;
}

function historyStorageKey(planId: string): string {
  return `mind-plan.history.v1.${planId}`;
}

function readStoredHistory(planId: string): { past: HistoryEntry[]; future: HistoryEntry[] } {
  try {
    const raw = localStorage.getItem(historyStorageKey(planId));
    if (!raw) return { past: [], future: [] };
    const parsed = JSON.parse(raw) as { past?: unknown; future?: unknown };
    return {
      past: Array.isArray(parsed.past) ? parsed.past.filter(isHistoryEntry).slice(-historyLimit) : [],
      future: Array.isArray(parsed.future) ? parsed.future.filter(isHistoryEntry).slice(0, historyLimit) : []
    };
  } catch {
    return { past: [], future: [] };
  }
}

function writeStoredHistory(planId: string, past: HistoryEntry[], future: HistoryEntry[]) {
  try {
    localStorage.setItem(
      historyStorageKey(planId),
      JSON.stringify({
        past: past.slice(-historyLimit),
        future: future.slice(0, historyLimit)
      })
    );
  } catch {
    // History persistence is best-effort; the in-memory undo stack still works.
  }
}

function removeStoredHistory(planId: string) {
  try {
    localStorage.removeItem(historyStorageKey(planId));
  } catch {
    // Ignore storage failures.
  }
}

function workspaceToSettingsForm(workspace: Workspace | null): WorkspaceSettingsForm {
  const settings = parseWorkspaceSettings(workspace);
  const provider = normalizeAiProvider(workspace?.aiProvider ?? settings.aiProvider);
  const providerOption = aiProviderOptions.find((option) => option.value === provider) ?? aiProviderOptions[0];
  return {
    name: workspace?.name ?? "",
    aiProvider: providerOption.value,
    aiModel: settings.aiModel ?? providerOption.defaultModel,
    aiEffort: settings.aiEffort ?? "medium",
    claudeCommand: settings.claudeCommand ?? "claude",
    openAiBaseUrl: settings.openAiBaseUrl ?? "https://api.openai.com/v1/chat/completions",
    openAiApiKey: settings.openAiApiKey ?? "",
    openRouterApiKey: settings.openRouterApiKey ?? "",
    openRouterReferer: settings.openRouterReferer ?? "",
    openRouterTitle: settings.openRouterTitle ?? "Mind Plan"
  };
}

function normalizeAiProvider(value: unknown): AiProviderId {
  if (typeof value === "string" && aiProviderOptions.some((option) => option.value === value)) {
    return value as AiProviderId;
  }
  return "codex-app-server";
}

function parseWorkspaceSettings(workspace: Workspace | null): Partial<WorkspaceSettingsForm> {
  if (!workspace?.aiSettingsJson) return {};
  try {
    return JSON.parse(workspace.aiSettingsJson) as Partial<WorkspaceSettingsForm>;
  } catch (error) {
    console.debug("workspace settings parse failed", error);
    return {};
  }
}

function isHistoryEntry(value: unknown): value is HistoryEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as HistoryEntry;
  return (
    typeof entry.id === "string" &&
    typeof entry.label === "string" &&
    typeof entry.createdAt === "string" &&
    isHistorySnapshot(entry.before) &&
    isHistorySnapshot(entry.after)
  );
}

function isHistorySnapshot(value: unknown): value is HistorySnapshot {
  if (!value || typeof value !== "object") return false;
  const snapshot = value as HistorySnapshot;
  return Array.isArray(snapshot.tasks) && Array.isArray(snapshot.links);
}

function readError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function parseMetadata(json: string): Record<string, unknown> {
  try {
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function copyChat(messages: ChatMessage[]): Promise<void> {
  return writeClipboardText(
    messages
      .map((message) => `${message.role === "user" ? "나" : "AI"}\n\n${message.content.trim()}`)
      .join("\n\n---\n\n")
  );
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

const chatDraftStoragePrefix = "mind-plan-chat-draft";

function readChatDraft(sessionId: string): string {
  return window.localStorage.getItem(`${chatDraftStoragePrefix}:${sessionId}`) ?? "";
}

function writeChatDraft(sessionId: string, value: string) {
  window.localStorage.setItem(`${chatDraftStoragePrefix}:${sessionId}`, value);
}

function removeChatDraft(sessionId: string) {
  window.localStorage.removeItem(`${chatDraftStoragePrefix}:${sessionId}`);
}
