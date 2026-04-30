import { FormEvent, useEffect, useRef, useState } from "react";
import { cancelChatRun, sendChatMessage } from "./chatApi";
import { ChatMessageBubble } from "./ChatMessageBubble";
import type { ChatMessage } from "./chatTypes";
import { MarkdownContent } from "./markdown";
import { OperationPreviewList } from "./OperationPreviewList";
import { useChatStream } from "./useChatStream";

export function ChatPanel(props: { chatSessionId: string }) {
  const stream = useChatStream(props.chatSessionId);
  const [chatText, setChatText] = useState("");
  const [showScrollToLatest, setShowScrollToLatest] = useState(false);
  const chatLogRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoScrollRef = useRef(true);

  useEffect(() => {
    const chatLog = chatLogRef.current;
    if (!chatLog) return;
    if (shouldAutoScrollRef.current || isNearBottom(chatLog)) {
      scrollToLatest("auto");
    } else if (stream.isSending || stream.streamingText) {
      setShowScrollToLatest(true);
    }
  }, [stream.messages.length, stream.streamingText, stream.isSending, stream.operationPreview.length]);

  async function submitChat(event: FormEvent) {
    event.preventDefault();
    const content = chatText.trim();
    if (!content) return;

    setChatText("");
    shouldAutoScrollRef.current = true;
    setShowScrollToLatest(false);

    const localUserMessage: ChatMessage = {
      id: `local_user_${Date.now()}`,
      chatSessionId: props.chatSessionId,
      role: "user",
      content,
      status: "pending",
      metadataJson: "{}",
      createdAt: new Date().toISOString()
    };
    stream.setMessages((current) => [...current, localUserMessage]);

    try {
      const run = await sendChatMessage(props.chatSessionId, content);
      stream.setMessages((current) => [
        ...current.filter((message) => message.id !== localUserMessage.id),
        run.userMessage
      ]);
    } catch (error) {
      stream.setMessages((current) => [
        ...current,
        {
          id: `local_assistant_${Date.now()}`,
          chatSessionId: props.chatSessionId,
          role: "assistant",
          content: `요청을 처리하지 못했습니다. ${error instanceof Error ? error.message : "Unknown error"}`,
          status: "failed",
          metadataJson: "{}",
          createdAt: new Date().toISOString()
        }
      ]);
    }
  }

  function handleScroll() {
    const chatLog = chatLogRef.current;
    if (!chatLog) return;
    const nearBottom = isNearBottom(chatLog);
    shouldAutoScrollRef.current = nearBottom;
    setShowScrollToLatest(!nearBottom && (stream.isSending || Boolean(stream.streamingText)));
  }

  function scrollToLatest(behavior: ScrollBehavior = "smooth") {
    const chatLog = chatLogRef.current;
    if (!chatLog) return;
    chatLog.scrollTo({ top: chatLog.scrollHeight, behavior });
    shouldAutoScrollRef.current = true;
    setShowScrollToLatest(false);
  }

  return (
    <section className="chat-panel">
      <div className="chat-log-frame">
        <div className="chat-log" ref={chatLogRef} onScroll={handleScroll}>
          {stream.messages.map((message) => (
            <ChatMessageBubble
              key={message.id}
              message={message}
              editRuns={stream.editRuns}
              previousUserMessage={findPreviousUserMessage(stream.messages, message.id)}
            />
          ))}
          {stream.isSending ? (
            <div className={stream.streamingText ? "assistant-message streaming" : "assistant-message pending"}>
              {stream.streamingText ? (
                <MarkdownContent content={stream.streamingText} />
              ) : (
                <span>{stream.activity?.label ?? stream.streamLabel ?? "응답을 기다리는 중입니다."}</span>
              )}
              <OperationPreviewList items={stream.operationPreview} status="pending" defaultOpen />
            </div>
          ) : null}
        </div>
        {showScrollToLatest ? (
          <button className="chat-scroll-latest" type="button" onClick={() => scrollToLatest()}>
            최신으로
          </button>
        ) : null}
      </div>

      <form className="chat-form" onSubmit={submitChat}>
        <textarea
          value={chatText}
          onChange={(event) => setChatText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey && !event.altKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
          placeholder="Enter 전송, Shift/Option+Enter 줄바꿈"
          rows={3}
        />
        {stream.isSending ? (
          <button type="button" onClick={() => void cancelChatRun(props.chatSessionId)}>
            중지
          </button>
        ) : (
          <button type="submit" disabled={!chatText.trim()}>
            전송
          </button>
        )}
      </form>
    </section>
  );
}

function findPreviousUserMessage(messages: ChatMessage[], messageId: string): ChatMessage | null {
  const messageIndex = messages.findIndex((message) => message.id === messageId);
  for (let index = messageIndex - 1; index >= 0; index -= 1) {
    if (messages[index]?.role === "user") return messages[index];
  }
  return null;
}

function isNearBottom(element: HTMLElement, threshold = 96): boolean {
  return element.scrollHeight - element.scrollTop - element.clientHeight <= threshold;
}

