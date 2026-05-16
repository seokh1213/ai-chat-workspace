import { Paperclip, Send, X } from "lucide-react";
import {
  type ChangeEvent,
  type ClipboardEvent as ReactClipboardEvent,
  type DragEvent as ReactDragEvent,
  type FormEvent,
  useRef
} from "react";

import { normalizePastedImageFile } from "../../lib/chat";
import { isMobileUserAgent, isWindowsUserAgent, submitOnCommandEnter } from "../../lib/device";
import { PendingChatAttachmentTray } from "./PendingChatAttachmentTray";
import type { PendingChatAttachment } from "./types";

interface ChatComposerProps {
  pendingChatAttachments: PendingChatAttachment[];
  chatText: string;
  isChatDetailLoading: boolean;
  isChatSending: boolean;
  onAddChatFiles: (files: FileList | File[] | null) => void;
  onRemovePendingChatAttachment: (localId: string) => void;
  onChatTextChange: (text: string) => void;
  onSubmitChat: (event: FormEvent) => void;
  onStopChat: () => void;
}

export function ChatComposer(props: ChatComposerProps) {
  const chatFileInputRef = useRef<HTMLInputElement | null>(null);
  const isMobileInput = isMobileUserAgent();
  const lineBreakModifier = isWindowsUserAgent() ? "Alt" : "Option";
  const chatAttachmentsUploading = props.pendingChatAttachments.some((attachment) => attachment.status === "queued" || attachment.status === "uploading");
  const chatAttachmentsFailed = props.pendingChatAttachments.some((attachment) => attachment.status === "failed");
  const canSubmitChat =
    !props.isChatDetailLoading &&
    !chatAttachmentsUploading &&
    !chatAttachmentsFailed &&
    (props.chatText.trim().length > 0 || props.pendingChatAttachments.some((attachment) => attachment.status === "ready"));

  function openChatFilePicker() {
    chatFileInputRef.current?.click();
  }

  function handleChatFileInputChange(event: ChangeEvent<HTMLInputElement>) {
    props.onAddChatFiles(event.target.files);
    event.target.value = "";
  }

  function handleChatPaste(event: ReactClipboardEvent<HTMLTextAreaElement>) {
    const itemFiles = Array.from(event.clipboardData.items)
      .filter((item) => item.kind === "file")
      .map((item) => item.getAsFile())
      .filter((file): file is File => file != null);
    const files = itemFiles.length ? itemFiles : Array.from(event.clipboardData.files);
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    if (!imageFiles.length) return;
    event.preventDefault();
    props.onAddChatFiles(imageFiles.map((file, index) => normalizePastedImageFile(file, index)));
  }

  function handleChatDrop(event: ReactDragEvent<HTMLDivElement>) {
    const files = Array.from(event.dataTransfer.files);
    if (!files.length) return;
    event.preventDefault();
    props.onAddChatFiles(files);
  }

  function handleChatDragOver(event: ReactDragEvent<HTMLDivElement>) {
    if (event.dataTransfer.types.includes("Files")) {
      event.preventDefault();
    }
  }

  return (
    <div className="chat-composer" onDragOver={handleChatDragOver} onDrop={handleChatDrop}>
      <PendingChatAttachmentTray
        attachments={props.pendingChatAttachments}
        onRemove={props.onRemovePendingChatAttachment}
      />
      <form className="chat-form" onSubmit={props.onSubmitChat}>
        <input
          ref={chatFileInputRef}
          className="visually-hidden"
          type="file"
          multiple
          onChange={handleChatFileInputChange}
        />
        <button
          className="attach-button"
          type="button"
          aria-label="파일 첨부"
          disabled={props.isChatDetailLoading || props.isChatSending}
          onClick={openChatFilePicker}
        >
          <Paperclip size={17} />
        </button>
        <textarea
          value={props.chatText}
          onChange={(event) => props.onChatTextChange(event.target.value)}
          onKeyDown={(event) => submitOnCommandEnter(event)}
          onPaste={handleChatPaste}
          placeholder={isMobileInput ? "메시지를 입력하세요. 사진은 붙여넣기 가능" : `Enter 전송, Shift/${lineBreakModifier}+Enter 줄바꿈, 사진 붙여넣기 가능`}
          disabled={props.isChatDetailLoading}
          rows={3}
        />
        {props.isChatSending ? (
          <button className="send-button stop" type="button" aria-label="응답 중지" onClick={props.onStopChat}>
            <X size={16} />
          </button>
        ) : (
          <button className="send-button" type="submit" disabled={!canSubmitChat}>
            <Send size={16} />
          </button>
        )}
      </form>
    </div>
  );
}
