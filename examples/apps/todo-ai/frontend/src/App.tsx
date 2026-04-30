import { ArrowLeft, Bot, CheckCircle2, Clipboard, Loader2, Plus, RotateCcw, Save, Send, Settings, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import {
  createTodo,
  createWorkspace,
  deleteTodo,
  deleteWorkspace,
  fetchWorkspaceState,
  fetchWorkspaces,
  resetWorkspace,
  sendMessage,
  updateTodo,
  updateWorkspace
} from "./api";
import type { ChatMessage, ChatRunEvent, TodoItem, TodoOperation, TodoPriority, TodoStatus, Workspace, WorkspaceForm, WorkspaceState } from "./types";

const statusLabels: Record<TodoStatus, string> = {
  TODO: "대기",
  DOING: "진행",
  DONE: "완료"
};

const priorityLabels: Record<TodoPriority, string> = {
  LOW: "낮음",
  MEDIUM: "보통",
  HIGH: "높음"
};

const statusOrder: TodoStatus[] = ["TODO", "DOING", "DONE"];
const markdownPlugins = [remarkGfm, remarkBreaks, remarkLenientStrong];
const workspaceStorageKey = "todo-ai:workspace-id";
const modelOptions = ["gpt-5.4-mini", "gpt-5.4", "gpt-5.3-codex-spark", "gpt-5.3-codex", "gpt-5.2", "gpt-5.5"];
const effortOptions = ["low", "medium", "high", "xhigh"];

export default function App() {
  const [screen, setScreen] = useState<"workspaces" | "editor">("workspaces");
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(() => localStorage.getItem(workspaceStorageKey));
  const [state, setState] = useState<WorkspaceState | null>(null);
  const [input, setInput] = useState(() => localStorage.getItem("todo-ai:draft") ?? "");
  const [quickTitle, setQuickTitle] = useState("");
  const [runningRunId, setRunningRunId] = useState<string | null>(null);
  const [streamContent, setStreamContent] = useState("");
  const [streamOperations, setStreamOperations] = useState<TodoOperation[]>([]);
  const [activityText, setActivityText] = useState<string | null>(null);
  const [runStartedAt, setRunStartedAt] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showScrollToLatest, setShowScrollToLatest] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messageListRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchWorkspaces()
      .then((items) => {
        setWorkspaces(items);
        const stored = localStorage.getItem(workspaceStorageKey);
        const nextId = items.find((workspace) => workspace.id === stored)?.id ?? items[0]?.id ?? null;
        setActiveWorkspaceId(nextId);
      })
      .catch((cause: Error) => setError(cause.message));
  }, []);

  useEffect(() => {
    if (!activeWorkspaceId || screen !== "editor") return;
    localStorage.setItem(workspaceStorageKey, activeWorkspaceId);
    fetchWorkspaceState(activeWorkspaceId)
      .then(setState)
      .catch((cause: Error) => setError(cause.message));
  }, [activeWorkspaceId, screen]);

  useEffect(() => {
    if (!activeWorkspaceId) return;
    localStorage.setItem(`todo-ai:draft:${activeWorkspaceId}`, input);
  }, [activeWorkspaceId, input]);

  useEffect(() => {
    const source = new EventSource("/api/chat/events");
    const eventTypes = [
      "stream.connected",
      "run.started",
      "run.activity",
      "assistant.message.delta",
      "assistant.message.completed",
      "operations.proposed",
      "run.completed",
      "run.failed"
    ];
    const listeners = eventTypes.map((type) => {
      const listener = (message: MessageEvent) => {
        const event = JSON.parse(message.data) as ChatRunEvent;
        if (event.workspaceId && event.workspaceId !== activeWorkspaceId) return;
        if (event.type === "run.started") {
          setRunningRunId(event.runId);
          setStreamContent("");
          setStreamOperations([]);
          setActivityText("Codex app-server에 요청을 보내는 중입니다.");
          setRunStartedAt(Date.now());
          setElapsedSeconds(0);
          return;
        }
        if (event.type === "run.activity" && event.activity) {
          setRunningRunId(event.runId);
          setActivityText([event.activity.label, event.activity.detail].filter(Boolean).join(" · "));
          return;
        }
        if (event.type === "assistant.message.delta" && event.delta) {
          setRunningRunId(event.runId);
          setActivityText(null);
          setStreamContent((current) => current + event.delta);
          return;
        }
        if (event.type === "assistant.message.completed" && event.content) {
          setRunningRunId(event.runId);
          setActivityText(null);
          setStreamContent(event.content);
          return;
        }
        if (event.type === "operations.proposed") {
          setStreamOperations(event.operations ?? []);
          return;
        }
        if (event.type === "run.completed" && event.state) {
          setState(event.state);
          setRunningRunId(null);
          setStreamContent("");
          setStreamOperations([]);
          setActivityText(null);
          setRunStartedAt(null);
          return;
        }
        if (event.type === "run.failed") {
          setRunningRunId(null);
          setActivityText(null);
          setRunStartedAt(null);
          setError(event.error ?? "AI 응답 처리에 실패했습니다.");
        }
      };
      source.addEventListener(type, listener as EventListener);
      return { type, listener };
    });

    source.onerror = () => setError("SSE 연결을 다시 확인하는 중입니다.");

    return () => {
      listeners.forEach(({ type, listener }) => source.removeEventListener(type, listener as EventListener));
      source.close();
    };
  }, [activeWorkspaceId]);

  useEffect(() => {
    if (!runStartedAt) return;
    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - runStartedAt) / 1000)));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [runStartedAt]);

  useEffect(() => {
    const list = messageListRef.current;
    if (!list) return;

    if (isMessageListNearBottom(list)) {
      scrollMessagesToLatest("auto");
    } else if (runningRunId || streamContent) {
      setShowScrollToLatest(true);
    }
  }, [state?.messages.length, runningRunId, streamContent, streamOperations.length, activityText]);

  const messages = state?.messages ?? [];
  const activeWorkspace = workspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? state?.workspace ?? null;

  const groupedTodos = useMemo(() => {
    const initial: Record<TodoStatus, TodoItem[]> = { TODO: [], DOING: [], DONE: [] };
    for (const todo of state?.todos ?? []) {
      initial[todo.status].push(todo);
    }
    return initial;
  }, [state?.todos]);

  async function refresh() {
    if (!activeWorkspaceId) return;
    const nextState = await fetchWorkspaceState(activeWorkspaceId);
    setState(nextState);
    setWorkspaces((current) => current.map((workspace) => (workspace.id === nextState.workspace.id ? nextState.workspace : workspace)));
  }

  async function handleSend() {
    const content = input.trim();
    if (!content || runningRunId || !activeWorkspaceId) return;
    setError(null);
    setInput("");
    scrollMessagesToLatest("auto");
    const response = await sendMessage(activeWorkspaceId, content);
    setRunningRunId(response.runId);
    setRunStartedAt(Date.now());
    setElapsedSeconds(0);
    setState((current) => current && { ...current, messages: [...current.messages, response.userMessage] });
  }

  async function handleQuickAdd() {
    const title = quickTitle.trim();
    if (!title || !activeWorkspaceId) return;
    await createTodo(activeWorkspaceId, title);
    setQuickTitle("");
    await refresh();
  }

  async function handleReset() {
    if (!activeWorkspaceId) return;
    setState(await resetWorkspace(activeWorkspaceId));
  }

  async function handleStatus(todo: TodoItem, status: TodoStatus) {
    if (!activeWorkspaceId) return;
    await updateTodo(activeWorkspaceId, todo.id, { status });
    await refresh();
  }

  async function handlePriority(todo: TodoItem, priority: TodoPriority) {
    if (!activeWorkspaceId) return;
    await updateTodo(activeWorkspaceId, todo.id, { priority });
    await refresh();
  }

  async function copyAllMessages() {
    const markdown = messages
      .map((message) => `${message.role === "USER" ? "사용자" : "AI"}\n\n${message.content}`)
      .join("\n\n---\n\n");
    await navigator.clipboard.writeText(markdown);
  }

  function scrollMessagesToLatest(behavior: ScrollBehavior = "smooth") {
    messagesEndRef.current?.scrollIntoView({ behavior, block: "end" });
    setShowScrollToLatest(false);
  }

  function handleMessageListScroll() {
    const list = messageListRef.current;
    if (!list) return;
    if (isMessageListNearBottom(list)) {
      setShowScrollToLatest(false);
    } else if (runningRunId || streamContent) {
      setShowScrollToLatest(true);
    }
  }

  async function reloadWorkspaces(nextActiveId?: string) {
    const items = await fetchWorkspaces();
    setWorkspaces(items);
    const nextId = nextActiveId ?? activeWorkspaceId ?? items[0]?.id ?? null;
    setActiveWorkspaceId(items.find((workspace) => workspace.id === nextId)?.id ?? items[0]?.id ?? null);
  }

  async function handleCreateWorkspace(form: WorkspaceForm) {
    const workspace = await createWorkspace(form);
    await reloadWorkspaces(workspace.id);
    setScreen("editor");
  }

  async function handleUpdateWorkspace(workspaceId: string, form: Partial<WorkspaceForm>) {
    const workspace = await updateWorkspace(workspaceId, form);
    setWorkspaces((current) => current.map((item) => (item.id === workspace.id ? workspace : item)));
    if (workspace.id === activeWorkspaceId && state) {
      setState({ ...state, workspace });
    }
  }

  async function handleDeleteWorkspace(workspaceId: string) {
    await deleteWorkspace(workspaceId);
    await reloadWorkspaces();
    if (workspaceId === activeWorkspaceId) {
      setScreen("workspaces");
      setState(null);
    }
  }

  function openWorkspace(workspaceId: string) {
    setActiveWorkspaceId(workspaceId);
    setInput(localStorage.getItem(`todo-ai:draft:${workspaceId}`) ?? "");
    setScreen("editor");
  }

  if (screen === "workspaces") {
    return (
      <WorkspaceScreen
        activeWorkspaceId={activeWorkspaceId}
        error={error}
        onCreateWorkspace={(form) => void handleCreateWorkspace(form)}
        onDeleteWorkspace={(workspaceId) => void handleDeleteWorkspace(workspaceId)}
        onOpenWorkspace={openWorkspace}
        onUpdateWorkspace={(workspaceId, form) => void handleUpdateWorkspace(workspaceId, form)}
        workspaces={workspaces}
      />
    );
  }

  return (
    <main className="app-shell">
      <section className="workspace-panel">
        <header className="workspace-header">
          <div>
            <p className="eyebrow">Workspace Editor</p>
            <h1>{activeWorkspace?.name ?? "Todo AI Workspace"}</h1>
            {activeWorkspace ? (
              <span className="workspace-provider-line">
                {activeWorkspace.aiProvider} · {activeWorkspace.aiModel} · {activeWorkspace.aiEffort}
              </span>
            ) : null}
          </div>
          <div className="header-actions">
            <button className="icon-button" type="button" onClick={() => setScreen("workspaces")} title="워크스페이스 목록">
              <ArrowLeft size={18} />
            </button>
            <button className="icon-button" type="button" onClick={handleReset} title="초기화">
              <RotateCcw size={18} />
            </button>
          </div>
        </header>

        <div className="quick-add">
          <input
            value={quickTitle}
            onChange={(event) => setQuickTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void handleQuickAdd();
            }}
            placeholder="직접 추가할 할일"
          />
          <button className="primary-button" type="button" onClick={handleQuickAdd}>
            <Plus size={17} />
            추가
          </button>
        </div>

        <div className="board-grid">
          {statusOrder.map((status) => (
            <section className="todo-column" key={status}>
              <div className="column-title">
                <span>{statusLabels[status]}</span>
                <strong>{groupedTodos[status].length}</strong>
              </div>
              <div className="todo-list">
                {groupedTodos[status].map((todo) => (
                  <article className={`todo-card priority-${todo.priority.toLowerCase()}`} key={todo.id}>
                    <div className="todo-card-top">
                      <div>
                        <h2>{todo.title}</h2>
                        <p>{todo.description}</p>
                      </div>
                      <button className="ghost-icon" type="button" onClick={() => activeWorkspaceId && void deleteTodo(activeWorkspaceId, todo.id).then(refresh)} title="삭제">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="todo-controls">
                      <select value={todo.status} onChange={(event) => void handleStatus(todo, event.target.value as TodoStatus)}>
                        {statusOrder.map((item) => (
                          <option key={item} value={item}>
                            {statusLabels[item]}
                          </option>
                        ))}
                      </select>
                      <select value={todo.priority} onChange={(event) => void handlePriority(todo, event.target.value as TodoPriority)}>
                        {(["LOW", "MEDIUM", "HIGH"] as TodoPriority[]).map((item) => (
                          <option key={item} value={item}>
                            {priorityLabels[item]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>

        <section className="checkpoint-strip">
          <p>체크포인트</p>
          <div>
            {(state?.checkpoints ?? []).slice(-4).map((checkpoint) => (
              <span key={checkpoint.id}>
                <CheckCircle2 size={14} />
                {checkpoint.label}
              </span>
            ))}
          </div>
        </section>
      </section>

      <section className="chat-panel">
        <header className="chat-header">
          <div className="chat-title">
            <span className="bot-icon">
              <Bot size={20} />
            </span>
            <div>
              <p className="eyebrow">AI Editing Session</p>
              <h2>할일 편집 상담</h2>
            </div>
          </div>
          <button className="secondary-button" type="button" onClick={() => void copyAllMessages()}>
            <Clipboard size={16} />
            전체 복사
          </button>
        </header>

        {error && <div className="error-banner">{error}</div>}

        <div className="message-list" ref={messageListRef} onScroll={handleMessageListScroll}>
          {messages.map((message) => (
            <ChatBubble message={message} key={message.id} />
          ))}
          {runningRunId && (
            <StreamingBubble
              activityText={activityText}
              content={streamContent}
              elapsedSeconds={elapsedSeconds}
              operations={streamOperations}
            />
          )}
          <div ref={messagesEndRef} />
        </div>
        {showScrollToLatest && (
          <button className="scroll-latest-button" type="button" onClick={() => scrollMessagesToLatest()}>
            최신으로
          </button>
        )}

        <footer className="chat-composer">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey && !event.altKey) {
                event.preventDefault();
                void handleSend();
              }
            }}
            placeholder="Enter 전송, Shift/Alt+Enter 줄바꿈"
            rows={2}
          />
          <button className="send-button" type="button" disabled={!input.trim() || Boolean(runningRunId)} onClick={() => void handleSend()}>
            {runningRunId ? <Loader2 className="spinner-icon" size={19} /> : <Send size={19} />}
          </button>
        </footer>
      </section>
    </main>
  );
}

function WorkspaceScreen(props: {
  activeWorkspaceId: string | null;
  error: string | null;
  onCreateWorkspace: (form: WorkspaceForm) => void;
  onDeleteWorkspace: (workspaceId: string) => void;
  onOpenWorkspace: (workspaceId: string) => void;
  onUpdateWorkspace: (workspaceId: string, form: Partial<WorkspaceForm>) => void;
  workspaces: Workspace[];
}) {
  const selectedWorkspace = props.workspaces.find((workspace) => workspace.id === props.activeWorkspaceId) ?? props.workspaces[0] ?? null;
  const [newWorkspaceName, setNewWorkspaceName] = useState("");

  return (
    <main className="workspace-shell">
      <section className="workspace-list-panel">
        <header className="workspace-header standalone">
          <div>
            <p className="eyebrow">Todo AI Workspace</p>
            <h1>작업공간</h1>
          </div>
        </header>
        {props.error ? <div className="error-banner">{props.error}</div> : null}
        <div className="workspace-create-row">
          <input
            value={newWorkspaceName}
            onChange={(event) => setNewWorkspaceName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && newWorkspaceName.trim()) {
                props.onCreateWorkspace({ name: newWorkspaceName.trim() });
                setNewWorkspaceName("");
              }
            }}
            placeholder="워크스페이스 이름"
          />
          <button
            className="primary-button"
            type="button"
            disabled={!newWorkspaceName.trim()}
            onClick={() => {
              props.onCreateWorkspace({ name: newWorkspaceName.trim() });
              setNewWorkspaceName("");
            }}
          >
            <Plus size={17} />
            생성
          </button>
        </div>
        <div className="workspace-card-list">
          {props.workspaces.map((workspace) => (
            <article className={`workspace-card ${workspace.id === selectedWorkspace?.id ? "selected" : ""}`} key={workspace.id}>
              <button type="button" onClick={() => props.onOpenWorkspace(workspace.id)}>
                <strong>{workspace.name}</strong>
                <span>
                  {workspace.aiProvider} · {workspace.aiModel} · {workspace.aiEffort}
                </span>
              </button>
              <button className="ghost-icon" type="button" onClick={() => props.onDeleteWorkspace(workspace.id)} title="삭제">
                <Trash2 size={16} />
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="workspace-settings-panel">
        {selectedWorkspace ? (
          <WorkspaceSettingsForm
            key={selectedWorkspace.id}
            onOpen={() => props.onOpenWorkspace(selectedWorkspace.id)}
            onSubmit={(form) => props.onUpdateWorkspace(selectedWorkspace.id, form)}
            workspace={selectedWorkspace}
          />
        ) : (
          <div className="empty-settings">워크스페이스를 생성하세요.</div>
        )}
      </section>
    </main>
  );
}

function WorkspaceSettingsForm(props: {
  onOpen: () => void;
  onSubmit: (form: Partial<WorkspaceForm>) => void;
  workspace: Workspace;
}) {
  const [form, setForm] = useState<WorkspaceForm>({
    name: props.workspace.name,
    aiProvider: props.workspace.aiProvider,
    aiModel: props.workspace.aiModel,
    aiEffort: props.workspace.aiEffort,
    codexUrl: props.workspace.codexUrl,
    codexCwd: props.workspace.codexCwd ?? ""
  });

  function update<K extends keyof WorkspaceForm>(key: K, value: WorkspaceForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <form
      className="workspace-settings-form"
      onSubmit={(event) => {
        event.preventDefault();
        props.onSubmit(form);
      }}
    >
      <div className="settings-heading">
        <span className="settings-icon">
          <Settings size={19} />
        </span>
        <div>
          <p className="eyebrow">LLM Provider Settings</p>
          <h2>워크스페이스 설정</h2>
        </div>
      </div>

      <label>
        <span>이름</span>
        <input value={form.name} onChange={(event) => update("name", event.target.value)} />
      </label>

      <label>
        <span>공급자</span>
        <select value={form.aiProvider} onChange={(event) => update("aiProvider", event.target.value)}>
          <option value="codex-app-server">Codex app-server</option>
        </select>
      </label>

      <label>
        <span>모델</span>
        <select value={form.aiModel} onChange={(event) => update("aiModel", event.target.value)}>
          {modelOptions.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>추론 강도</span>
        <select value={form.aiEffort} onChange={(event) => update("aiEffort", event.target.value)}>
          {effortOptions.map((effort) => (
            <option key={effort} value={effort}>
              {effort}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>Codex URL</span>
        <input value={form.codexUrl} onChange={(event) => update("codexUrl", event.target.value)} />
      </label>

      <label>
        <span>작업 디렉터리</span>
        <input value={form.codexCwd ?? ""} onChange={(event) => update("codexCwd", event.target.value)} placeholder="/tmp" />
      </label>

      <div className="settings-actions">
        <button className="secondary-button" type="submit">
          <Save size={15} />
          저장
        </button>
        <button className="primary-button" type="button" onClick={props.onOpen}>
          편집화면
        </button>
      </div>
    </form>
  );
}

function StreamingBubble(props: {
  activityText: string | null;
  content: string;
  elapsedSeconds: number;
  operations: TodoOperation[];
}) {
  return (
    <article className={`chat-bubble assistant ${props.content ? "streaming" : "pending"}`}>
      <div className="message-body markdown-body">
        {props.activityText && props.content ? <ActivityStrip text={props.activityText} elapsedSeconds={props.elapsedSeconds} /> : null}
        {props.content ? (
          <ReactMarkdown remarkPlugins={markdownPlugins}>{normalizeMarkdownForRender(props.content)}</ReactMarkdown>
        ) : (
          <PendingStatus text={props.activityText ?? "Codex가 응답을 준비하는 중입니다."} elapsedSeconds={props.elapsedSeconds} />
        )}
        {props.operations.length > 0 && <OperationPreview operations={props.operations} />}
      </div>
    </article>
  );
}

function ActivityStrip(props: { text: string; elapsedSeconds: number }) {
  return (
    <div className="activity-strip">
      <Loader2 size={14} />
      <span>{props.text}</span>
      <strong>{props.elapsedSeconds}초</strong>
    </div>
  );
}

function PendingStatus(props: { text: string; elapsedSeconds: number }) {
  return (
    <div className="pending-status">
      <Loader2 size={17} />
      <span>{props.text}</span>
      <strong>{props.elapsedSeconds}초</strong>
    </div>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "USER";
  const time = new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit" }).format(new Date(message.createdAt));

  async function copyMessage() {
    await navigator.clipboard.writeText(message.content);
  }

  return (
    <article className={`chat-bubble ${isUser ? "user" : "assistant"}`}>
      <div className="message-body markdown-body">
        <ReactMarkdown remarkPlugins={markdownPlugins}>{normalizeMarkdownForRender(message.content)}</ReactMarkdown>
      </div>
      <div className="message-meta">
        <span>{isUser ? "사용자" : "AI"}</span>
        <span>{time}</span>
        {message.durationMs != null && <span>{Math.max(1, Math.round(message.durationMs / 1000))}초</span>}
        {message.operations.length > 0 && <span>변경 {message.operations.length}건</span>}
        <button type="button" onClick={() => void copyMessage()}>
          <Clipboard size={14} />
          복사
        </button>
      </div>
    </article>
  );
}

function OperationPreview({ operations }: { operations: TodoOperation[] }) {
  return (
    <aside className="operation-preview">
      <div>
        <Sparkles size={16} />
        <strong>적용 예정 변경</strong>
      </div>
      <ul>
        {operations.map((operation, index) => (
          <li key={`${operation.type}-${index}`}>
            <span>{operationLabel(operation.type)}</span>
            <p>{operation.title ?? operation.todoId ?? operation.patch?.title ?? "선택된 할일"}</p>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function operationLabel(type: TodoOperation["type"]) {
  switch (type) {
    case "ADD_TODO":
      return "추가";
    case "UPDATE_TODO":
      return "수정";
    case "COMPLETE_TODO":
      return "완료";
    case "DELETE_TODO":
      return "삭제";
  }
}

function isMessageListNearBottom(element: HTMLElement) {
  return element.scrollHeight - element.scrollTop - element.clientHeight < 72;
}

function normalizeMarkdownForRender(content: string) {
  return content
    .replace(/참고\s*स्रोत/g, "출처")
    .replace(/^Sources:\s*$/gm, "출처:")
    .replace(/([^\s\n])-\s+(?=\S)/g, "$1\n- ")
    .replace(/([^\s\n])(\d+\.\s+)(?=\S)/g, "$1\n$2");
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
