import { FileText, ImageIcon, X } from "lucide-react";

import { formatFileSize } from "../../lib/format";
import type { PendingChatAttachment } from "./types";

export function PendingChatAttachmentTray(props: {
  attachments: PendingChatAttachment[];
  onRemove: (localId: string) => void;
}) {
  if (!props.attachments.length) return null;
  return (
    <div className="pending-attachment-tray">
      {props.attachments.map((attachment) => (
        <div className={`pending-attachment ${attachment.status}`} key={attachment.localId}>
          {attachment.previewUrl ? (
            <img src={attachment.previewUrl} alt="" />
          ) : (
            <span className="attachment-file-icon">
              {attachment.contentType.startsWith("image/") ? <ImageIcon size={16} /> : <FileText size={16} />}
            </span>
          )}
          <span>
            <strong>{attachment.fileName}</strong>
            <em>
              {attachment.status === "uploading"
                ? "업로드 중"
                : attachment.status === "failed"
                  ? attachment.error ?? "업로드 실패"
                  : attachment.status === "queued"
                    ? "대기 중"
                    : `준비됨 · ${formatFileSize(attachment.byteSize)}`}
            </em>
          </span>
          <button type="button" aria-label="첨부 제거" onClick={() => props.onRemove(attachment.localId)}>
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}
