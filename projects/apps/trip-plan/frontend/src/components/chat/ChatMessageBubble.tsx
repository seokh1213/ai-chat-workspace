import { Clock3, Copy, FileText } from "lucide-react";

import { messageDurationMs } from "../../lib/chat";
import { formatDateTime, formatDuration, formatFileSize } from "../../lib/format";
import type { AiEditRunSummary, ChatAttachment, ChatMessage } from "../../types";
import { MarkdownContent } from "../common/MarkdownContent";
import { OperationPreviewList } from "./OperationPreviewList";

export function ChatMessageBubble(props: {
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
      {props.message.attachments.length ? <ChatAttachmentList attachments={props.message.attachments} /> : null}
      {props.message.content.trim() ? <MarkdownContent content={props.message.content} /> : null}
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

function ChatAttachmentList(props: { attachments: ChatAttachment[] }) {
  if (!props.attachments.length) return null;
  return (
    <div className="chat-attachment-list">
      {props.attachments.map((attachment) => (
        <a
          className={attachment.kind === "image" ? "chat-attachment image" : "chat-attachment file"}
          href={attachment.downloadUrl}
          key={attachment.id}
          target="_blank"
          rel="noreferrer"
        >
          {attachment.kind === "image" ? (
            <img src={attachment.downloadUrl} alt="" loading="lazy" />
          ) : (
            <span className="attachment-file-icon">
              <FileText size={16} />
            </span>
          )}
          <span>
            <strong>{attachment.fileName}</strong>
            <em>{formatFileSize(attachment.byteSize)}</em>
          </span>
        </a>
      ))}
    </div>
  );
}
