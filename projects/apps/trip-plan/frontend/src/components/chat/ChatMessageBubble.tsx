import { Clock3, Copy, FileText } from "lucide-react";
import { memo } from "react";

import { formatDateTime, formatDuration, formatFileSize } from "../../lib/format";
import type { AiEditRunSummary, ChatAttachment, ChatMessage } from "../../types";
import { MarkdownContent } from "../common/MarkdownContent";
import { OperationPreviewList } from "./OperationPreviewList";

export const ChatMessageBubble = memo(function ChatMessageBubble(props: {
  copied: boolean;
  durationMs: number | null;
  editRun: AiEditRunSummary | null;
  message: ChatMessage;
  messageIndex: number;
  onCopyMessage: (message: ChatMessage) => void;
}) {
  const isUser = props.message.role === "user";

  return (
    <div className={isUser ? "user-message" : "assistant-message"}>
      {props.message.attachments.length ? <ChatAttachmentList attachments={props.message.attachments} /> : null}
      {props.message.content.trim() ? <MarkdownContent content={props.message.content} /> : null}
      {!isUser ? <OperationPreviewList items={props.editRun?.operationPreview ?? []} status={props.editRun?.status} /> : null}
      <div className="message-meta">
        <Clock3 size={12} />
        <span>{formatDateTime(props.message.createdAt)}</span>
        {props.durationMs != null ? <span>{formatDuration(props.durationMs)}</span> : null}
        {props.editRun ? <span>{props.editRun.operationCount > 0 ? `변경 ${props.editRun.operationCount}개` : "변경 없음"}</span> : null}
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
});

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
