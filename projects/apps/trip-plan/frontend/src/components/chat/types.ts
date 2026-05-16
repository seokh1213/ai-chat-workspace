import type { ChatAttachment } from "../../types";

export type PendingChatAttachment = {
  localId: string;
  fileName: string;
  contentType: string;
  byteSize: number;
  previewUrl: string | null;
  status: "queued" | "uploading" | "ready" | "failed";
  error: string | null;
  attachment: ChatAttachment | null;
  file: File;
};
