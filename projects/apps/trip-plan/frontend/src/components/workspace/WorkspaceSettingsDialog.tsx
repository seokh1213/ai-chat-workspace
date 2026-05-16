import { X } from "lucide-react";
import { useEffect, useRef, type FormEvent, type KeyboardEvent } from "react";

import {
  aiEffortOptions,
  aiProviderOptions,
  codexModelOptions,
  openAiModelSuggestions,
  openRouterModelSuggestions,
  type AiProviderId,
  type WorkspaceSettingsForm
} from "../../lib/workspaceSettings";
import type { AiProviderStatus, Workspace } from "../../types";
import { ProviderStatusCard } from "./ProviderStatusCard";

const focusableSelector = [
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[href]",
  '[tabindex]:not([tabindex="-1"])'
].join(",");

export function WorkspaceSettingsDialog(props: {
  workspace: Workspace;
  form: WorkspaceSettingsForm;
  providerStatuses: AiProviderStatus[];
  onChange: (form: WorkspaceSettingsForm) => void;
  onSubmit: (event: FormEvent) => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLElement | null>(null);
  const providerOption = aiProviderOptions.find((option) => option.value === props.form.aiProvider) ?? aiProviderOptions[0];
  const isCodex = providerOption.value === "codex-app-server";
  const isOpenAiCompatible = providerOption.value === "openai-compatible";
  const isOpenRouter = providerOption.value === "openrouter";
  const hasSelectedCodexModel = codexModelOptions.some((option) => option.value === props.form.aiModel);
  const providerStatus = props.providerStatuses.find((status) => status.id === providerOption.value);

  const setField = (field: keyof WorkspaceSettingsForm, value: string) => {
    props.onChange({ ...props.form, [field]: value });
  };
  const setProvider = (value: AiProviderId) => {
    const nextProvider = aiProviderOptions.find((option) => option.value === value) ?? aiProviderOptions[0];
    props.onChange({
      ...props.form,
      aiProvider: nextProvider.value,
      aiModel: nextProvider.defaultModel,
      aiEffort: "medium"
    });
  };

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const firstField = dialogRef.current?.querySelector<HTMLElement>(focusableSelector);
    firstField?.focus();
    return () => previousFocus?.focus();
  }, []);

  function handleDialogKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      props.onClose();
      return;
    }
    if (event.key !== "Tab") return;

    const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? [])
      .filter((element) => element.offsetParent !== null || element === document.activeElement);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div className="settings-overlay" role="presentation">
      <section
        ref={dialogRef}
        className="settings-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="workspace-settings-title"
        tabIndex={-1}
        onKeyDown={handleDialogKeyDown}
      >
        <div className="settings-header">
          <div>
            <p className="eyebrow">Workspace settings</p>
            <h2 id="workspace-settings-title">워크스페이스 설정</h2>
          </div>
          <button className="icon-button" type="button" aria-label="설정 닫기" onClick={props.onClose}>
            <X size={16} />
          </button>
        </div>
        <form className="settings-form" onSubmit={props.onSubmit}>
          <label>
            <span>이름</span>
            <input value={props.form.name} onChange={(event) => setField("name", event.target.value)} />
          </label>
          <label>
            <span>AI Provider</span>
            <select value={providerOption.value} onChange={(event) => setProvider(event.target.value as AiProviderId)}>
              {aiProviderOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <small>{providerOption.description}</small>
          </label>
          <ProviderStatusCard status={providerStatus} />
          {isCodex ? (
            <>
              <label>
                <span>모델</span>
                <select value={props.form.aiModel} onChange={(event) => setField("aiModel", event.target.value)}>
                  {!hasSelectedCodexModel && props.form.aiModel ? <option value={props.form.aiModel}>{props.form.aiModel}</option> : null}
                  {codexModelOptions.map((model) => (
                    <option key={model.value} value={model.value}>
                      {model.label} · {model.description}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>추론 강도</span>
                <select value={props.form.aiEffort} onChange={(event) => setField("aiEffort", event.target.value)}>
                  {aiEffortOptions.map((effort) => (
                    <option key={effort.value} value={effort.value}>
                      {effort.label} · {effort.value} · {effort.description}
                    </option>
                  ))}
                </select>
              </label>
            </>
          ) : null}
          {isOpenAiCompatible ? (
            <>
              <label>
                <span>Base URL</span>
                <input
                  value={props.form.openAiBaseUrl}
                  onChange={(event) => setField("openAiBaseUrl", event.target.value)}
                  placeholder="https://api.openai.com/v1/chat/completions"
                />
              </label>
              <label>
                <span>API key</span>
                <input
                  value={props.form.openAiApiKey}
                  onChange={(event) => setField("openAiApiKey", event.target.value)}
                  placeholder="sk-..."
                  type="password"
                />
              </label>
              <label>
                <span>모델</span>
                <input
                  value={props.form.aiModel}
                  onChange={(event) => setField("aiModel", event.target.value)}
                  list="openai-compatible-models"
                  placeholder="gpt-5.4-mini"
                />
                <datalist id="openai-compatible-models">
                  {openAiModelSuggestions.map((model) => (
                    <option key={model} value={model} />
                  ))}
                </datalist>
              </label>
            </>
          ) : null}
          {isOpenRouter ? (
            <>
              <label>
                <span>OpenRouter API key</span>
                <input
                  value={props.form.openRouterApiKey}
                  onChange={(event) => setField("openRouterApiKey", event.target.value)}
                  placeholder="sk-or-..."
                  type="password"
                />
              </label>
              <label>
                <span>모델</span>
                <input
                  value={props.form.aiModel}
                  onChange={(event) => setField("aiModel", event.target.value)}
                  list="openrouter-models"
                  placeholder="openai/gpt-5.2"
                />
                <datalist id="openrouter-models">
                  {openRouterModelSuggestions.map((model) => (
                    <option key={model} value={model} />
                  ))}
                </datalist>
              </label>
              <label>
                <span>HTTP-Referer</span>
                <input
                  value={props.form.openRouterReferer}
                  onChange={(event) => setField("openRouterReferer", event.target.value)}
                  placeholder="http://localhost:5173"
                />
              </label>
              <label>
                <span>X-OpenRouter-Title</span>
                <input
                  value={props.form.openRouterTitle}
                  onChange={(event) => setField("openRouterTitle", event.target.value)}
                  placeholder="Trip Planner"
                />
              </label>
            </>
          ) : null}
          <div className="settings-summary">
            <strong>{props.workspace.name}</strong>
            <span>
              {providerOption.label} · {props.form.aiModel || "모델 미입력"}
              {isCodex ? ` · ${props.form.aiEffort}` : ""}
            </span>
          </div>
          <div className="form-actions">
            <button type="button" className="secondary-button" onClick={props.onClose}>
              취소
            </button>
            <button type="submit" className="primary-button">
              저장
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
