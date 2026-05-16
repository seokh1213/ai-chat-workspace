import { useEffect, useRef, useState } from "react";

import { deleteChatAttachment, uploadChatAttachment } from "../api";
import type { PendingChatAttachment } from "../components/chat/types";
import { readError } from "./format";

export function usePendingChatAttachments(activeChatId: string | null) {
  const [pendingChatAttachments, setPendingChatAttachments] = useState<PendingChatAttachment[]>([]);
  const pendingChatAttachmentsRef = useRef<PendingChatAttachment[]>([]);

  useEffect(() => {
    pendingChatAttachmentsRef.current = pendingChatAttachments;
  }, [pendingChatAttachments]);

  useEffect(() => {
    return () => {
      pendingChatAttachmentsRef.current.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, []);

  function clearPendingChatAttachments(deleteRemote = true) {
    setPendingChatAttachments((current) => {
      current.forEach((item) => {
        if (item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }
        if (deleteRemote && item.attachment) {
          void deleteChatAttachment(item.attachment.chatSessionId, item.attachment.id).catch((nextError) => {
            console.debug("chat attachment cleanup failed", nextError);
          });
        }
      });
      pendingChatAttachmentsRef.current = [];
      return [];
    });
  }

  async function removePendingChatAttachment(localId: string) {
    const target = pendingChatAttachmentsRef.current.find((item) => item.localId === localId);
    if (target?.attachment) {
      try {
        await deleteChatAttachment(target.attachment.chatSessionId, target.attachment.id);
      } catch (nextError) {
        console.debug("chat attachment delete failed", nextError);
      }
    }
    if (target?.previewUrl) {
      URL.revokeObjectURL(target.previewUrl);
    }
    setPendingChatAttachments((current) => {
      const next = current.filter((item) => item.localId !== localId);
      pendingChatAttachmentsRef.current = next;
      return next;
    });
  }

  async function addPendingChatFiles(files: FileList | File[] | null) {
    if (!activeChatId || !files) return;
    const nextFiles = Array.from(files).filter((file) => file.size > 0);
    if (!nextFiles.length) return;
    const availableSlots = Math.max(0, 8 - pendingChatAttachmentsRef.current.length);
    const acceptedFiles = nextFiles.slice(0, availableSlots);
    if (!acceptedFiles.length) return;

    const pendingItems: PendingChatAttachment[] = acceptedFiles.map((file) => {
      const localId = `local_att_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : null;
      return {
        localId,
        fileName: file.name || "pasted-image.png",
        contentType: file.type || "application/octet-stream",
        byteSize: file.size,
        previewUrl,
        status: "queued",
        error: null,
        attachment: null,
        file
      };
    });

    pendingChatAttachmentsRef.current = [...pendingChatAttachmentsRef.current, ...pendingItems];
    setPendingChatAttachments(pendingChatAttachmentsRef.current);

    for (const pending of pendingItems) {
      if (!pendingChatAttachmentsRef.current.some((item) => item.localId === pending.localId)) continue;
      setPendingChatAttachments((current) => {
        const next = current.map((item) =>
          item.localId === pending.localId ? { ...item, status: "uploading" as const } : item
        );
        pendingChatAttachmentsRef.current = next;
        return next;
      });
      try {
        const attachment = await uploadChatAttachment(activeChatId, pending.file);
        setPendingChatAttachments((current) => {
          const next = current.map((item) =>
            item.localId === pending.localId
              ? {
                  ...item,
                  fileName: attachment.fileName,
                  contentType: attachment.contentType,
                  byteSize: attachment.byteSize,
                  status: "ready" as const,
                  attachment
                }
              : item
          );
          pendingChatAttachmentsRef.current = next;
          return next;
        });
      } catch (nextError) {
        setPendingChatAttachments((current) => {
          const next = current.map((item) =>
            item.localId === pending.localId
              ? { ...item, status: "failed" as const, error: readError(nextError) }
              : item
          );
          pendingChatAttachmentsRef.current = next;
          return next;
        });
      }
    }
  }

  return {
    pendingChatAttachments,
    clearPendingChatAttachments,
    removePendingChatAttachment,
    addPendingChatFiles
  };
}
