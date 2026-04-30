import type { AiEditRunSummary, ChatMessage } from "./chatTypes";
import { MarkdownContent, writeClipboardText } from "./markdown";
import { OperationPreviewList } from "./OperationPreviewList";

export function ChatMessageBubble(props: {
  message: ChatMessage;
  editRuns: AiEditRunSummary[];
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
        <span>{formatDateTime(props.message.createdAt)}</span>
        {durationMs != null ? <span>{formatDuration(durationMs)}</span> : null}
        {editRun ? <span>{editRun.operationCount > 0 ? `변경 ${editRun.operationCount}개` : "변경 없음"}</span> : null}
        <button type="button" onClick={() => void writeClipboardText(`${props.message.content.trim()}\n`)}>
          복사
        </button>
      </div>
    </div>
  );
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

