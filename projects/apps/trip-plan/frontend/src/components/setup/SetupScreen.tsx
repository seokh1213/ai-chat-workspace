import { Bot, CheckCircle2, ChevronLeft, Clock3, Send } from "lucide-react";
import type { FormEvent } from "react";

import { submitOnCommandEnter } from "../../lib/device";
import { formatDuration } from "../../lib/format";
import type { SetupAssistantMessage, TripFormState, TripTextField } from "../../types";
import { MarkdownContent } from "../common/MarkdownContent";
import { DateRangeCalendar } from "./DateRangeCalendar";

export function SetupScreen(props: {
  workspaceName: string;
  tripForm: TripFormState;
  setupMessages: SetupAssistantMessage[];
  setupChatText: string;
  isSetupSending: boolean;
  isTripSubmitting: boolean;
  onTripFormChange: (form: TripFormState) => void;
  onSetupChatTextChange: (text: string) => void;
  onSubmitSetupChat: (event: FormEvent) => void;
  onSubmit: (event: FormEvent) => void;
  onCancel: () => void;
}) {
  const setField = (field: TripTextField, value: string) => {
    props.onTripFormChange({
      ...props.tripForm,
      [field]: value,
      ...(field === "destinationName" ? { destinationLat: null, destinationLng: null } : {})
    });
  };

  return (
    <main className="app-page setup-page">
      <section className="setup-shell">
        <div className="setup-column">
          <div className="form-heading">
            <div>
              <p className="eyebrow">{props.workspaceName || "Workspace"}</p>
              <h1>새 여행 만들기</h1>
            </div>
            <button className="text-back-button" type="button" onClick={props.onCancel}>
              <ChevronLeft size={16} />
              목록
            </button>
          </div>

          <form className="setup-form" onSubmit={props.onSubmit}>
            <label className="field">
              <span>여행 이름</span>
              <input value={props.tripForm.title} onChange={(event) => setField("title", event.target.value)} autoFocus />
            </label>
            <label className="field">
              <span>목적지</span>
              <input
                value={props.tripForm.destinationName}
                onChange={(event) => setField("destinationName", event.target.value)}
                placeholder="예: 오키나와"
              />
            </label>
            <DateRangeCalendar
              startDate={props.tripForm.startDate}
              endDate={props.tripForm.endDate}
              onChange={(startDate, endDate) => props.onTripFormChange({ ...props.tripForm, startDate, endDate })}
            />
            <div className="form-actions">
              <button className="secondary-button" type="button" onClick={props.onCancel}>
                취소
              </button>
              <button className="primary-button" type="submit" disabled={!props.tripForm.title.trim() || props.isTripSubmitting}>
                {props.isTripSubmitting ? "편집 준비 중" : "편집 시작"}
              </button>
            </div>
          </form>
        </div>

        <aside className="setup-chat-panel">
          <div className="chat-header">
            <div>
              <strong>초안 설계</strong>
              <span>날짜와 취향 정리</span>
            </div>
            <span className="header-icon" aria-hidden="true">
              <Bot size={20} />
            </span>
          </div>
          <div className="setup-chat-log">
            {props.setupMessages.map((message, index) => (
              <SetupMessageBubble message={message} key={`${message.role}-${index}`} />
            ))}
            {props.isSetupSending ? <div className="assistant-message pending">정리 중입니다.</div> : null}
          </div>
          <div className="quick-prompts">
            {["렌터카 기준으로 권역을 나눠줘", "가족 여행이라 무리 없는 일정이 좋아", "맛집과 카페를 일정 중간에 넣고 싶어"].map(
              (prompt) => (
                <button key={prompt} type="button" onClick={() => props.onSetupChatTextChange(prompt)}>
                  {prompt}
                </button>
              )
            )}
          </div>
          <form className="chat-form" onSubmit={props.onSubmitSetupChat}>
            <textarea
              value={props.setupChatText}
              onChange={(event) => props.onSetupChatTextChange(event.target.value)}
              onKeyDown={(event) => submitOnCommandEnter(event)}
              placeholder="동행, 이동 방식, 꼭 가고 싶은 곳을 입력하세요. Enter 전송, Shift/Option+Enter 줄바꿈"
              rows={3}
            />
            <button className="send-button" type="submit" disabled={!props.setupChatText.trim() || props.isSetupSending}>
              <Send size={16} />
            </button>
          </form>
        </aside>
      </section>
    </main>
  );
}

function SetupMessageBubble(props: { message: SetupAssistantMessage }) {
  const isUser = props.message.role === "user";
  return (
    <div className={isUser ? "user-message" : "assistant-message"}>
      <MarkdownContent content={props.message.content} />
      {!isUser && props.message.appliedActions?.length ? (
        <div className="setup-action-summary">
          <CheckCircle2 size={13} />
          <span>폼에 반영됨: {props.message.appliedActions.join(", ")}</span>
        </div>
      ) : null}
      {!isUser && props.message.durationMs != null ? (
        <div className="message-meta">
          <Clock3 size={12} />
          <span>{formatDuration(props.message.durationMs)}</span>
        </div>
      ) : null}
    </div>
  );
}
