"use client";

import {
  PromptInput,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  type PromptInputMessage
} from "@/components/ai-elements/prompt-input";
import { Grid2X2, MessageCircle, Mic, Paperclip, Send } from "lucide-react";
import type { FormEvent } from "react";

export function ChatComposer({
  placeholder,
  variant = "fidelity"
}: {
  placeholder: string;
  variant?: "fidelity" | "refined";
}) {
  const submitMessage = (_message: PromptInputMessage, event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <PromptInput className={variant === "refined" ? "ai-composer refined-ai-composer" : "ai-composer"} onSubmit={submitMessage}>
      <PromptInputBody>
        <PromptInputTextarea className="ai-composer-textarea" placeholder={placeholder} />
      </PromptInputBody>
      <PromptInputFooter className="ai-composer-footer">
        <PromptInputTools className="ai-composer-tools">
          <PromptInputButton className="ai-composer-tool-button" tooltip="파일 첨부">
            <Paperclip size={20} />
          </PromptInputButton>
          <PromptInputButton className="ai-composer-tool-button" tooltip="작업면 선택">
            <Grid2X2 size={20} />
          </PromptInputButton>
          {variant === "fidelity" ? (
            <PromptInputButton className="ai-composer-tool-button" tooltip="채팅 모드">
              <MessageCircle size={20} />
            </PromptInputButton>
          ) : null}
        </PromptInputTools>
        <PromptInputTools className="ai-composer-tools ai-composer-send-tools">
          <PromptInputButton className="ai-composer-tool-button" tooltip="음성 입력">
            <Mic size={19} />
          </PromptInputButton>
          <PromptInputSubmit aria-label="메시지 전송" className="ai-composer-submit">
            <Send size={20} />
          </PromptInputSubmit>
        </PromptInputTools>
      </PromptInputFooter>
    </PromptInput>
  );
}
