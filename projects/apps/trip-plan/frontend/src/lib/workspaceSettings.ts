import type { Workspace } from "../types";

export type WorkspaceSettingsForm = {
  name: string;
  aiProvider: string;
  aiModel: string;
  aiEffort: string;
  openAiBaseUrl: string;
  openAiApiKey: string;
  openRouterApiKey: string;
  openRouterReferer: string;
  openRouterTitle: string;
};

export type AiProviderId = "codex-app-server" | "openai-compatible" | "openrouter";

export type AiProviderOption = {
  value: AiProviderId;
  label: string;
  description: string;
  defaultModel: string;
};

export type AiModelOption = {
  value: string;
  label: string;
  description: string;
};

export type AiEffortOption = {
  value: string;
  label: string;
  description: string;
};

export const aiProviderOptions: AiProviderOption[] = [
  {
    value: "codex-app-server",
    label: "Codex app-server",
    description: "로컬 Codex 세션을 사용합니다. 모델과 추론 강도를 선택할 수 있습니다.",
    defaultModel: "gpt-5.4-mini"
  },
  {
    value: "openai-compatible",
    label: "OpenAI 호환",
    description: "OpenAI Chat Completions 형식의 Base URL과 API key를 사용합니다.",
    defaultModel: "gpt-5.4-mini"
  },
  {
    value: "openrouter",
    label: "OpenRouter",
    description: "OpenRouter 통합 엔드포인트와 API key를 사용합니다.",
    defaultModel: "openai/gpt-5.2"
  }
];

export const codexModelOptions: AiModelOption[] = [
  { value: "gpt-5.4-mini", label: "GPT-5.4 Mini", description: "빠른 응답과 비용 균형" },
  { value: "gpt-5.4", label: "GPT-5.4", description: "일반 작업용 균형 모델" },
  { value: "gpt-5.3-codex-spark", label: "GPT-5.3 Codex Spark", description: "가벼운 코딩 작업에 빠른 모델" },
  { value: "gpt-5.3-codex", label: "GPT-5.3 Codex", description: "코딩 작업 특화 모델" },
  { value: "gpt-5.2", label: "GPT-5.2", description: "안정적인 장문 작업용 모델" },
  { value: "gpt-5.5", label: "GPT-5.5", description: "복잡한 작업용 고성능 모델" }
];

export const openAiModelSuggestions = ["gpt-5.4-mini", "gpt-5.4", "gpt-5.2", "gpt-4.1"];
export const openRouterModelSuggestions = ["openai/gpt-5.2", "openai/gpt-4o"];

export const aiEffortOptions: AiEffortOption[] = [
  { value: "low", label: "낮음", description: "빠른 응답" },
  { value: "medium", label: "중간", description: "기본 균형값" },
  { value: "high", label: "높음", description: "복잡한 수정 검토" },
  { value: "xhigh", label: "매우 높음", description: "가장 깊은 추론" }
];

export function workspaceToSettingsForm(workspace: Workspace | null): WorkspaceSettingsForm {
  const settings = parseWorkspaceSettings(workspace);
  const provider = normalizeAiProvider(workspace?.aiProvider ?? settings.aiProvider);
  const providerOption = aiProviderOptions.find((option) => option.value === provider) ?? aiProviderOptions[0];
  return {
    name: workspace?.name ?? "",
    aiProvider: providerOption.value,
    aiModel: workspace?.aiModel ?? settings.aiModel ?? providerOption.defaultModel,
    aiEffort: workspace?.aiEffort ?? settings.aiEffort ?? "medium",
    openAiBaseUrl: workspace?.openAiBaseUrl ?? settings.openAiBaseUrl ?? "https://api.openai.com/v1/chat/completions",
    openAiApiKey: workspace?.openAiApiKey ?? settings.openAiApiKey ?? "",
    openRouterApiKey: workspace?.openRouterApiKey ?? settings.openRouterApiKey ?? "",
    openRouterReferer: workspace?.openRouterReferer ?? settings.openRouterReferer ?? "",
    openRouterTitle: workspace?.openRouterTitle ?? settings.openRouterTitle ?? "Trip Planner"
  };
}

export function normalizeAiProvider(value: string | undefined): AiProviderId {
  if (value === "openai-compatible" || value === "openrouter" || value === "codex-app-server") {
    return value;
  }
  return "codex-app-server";
}

function parseWorkspaceSettings(workspace: Workspace | null): Partial<WorkspaceSettingsForm> {
  if (!workspace?.settingsJson) return {};
  try {
    return JSON.parse(workspace.settingsJson) as Partial<WorkspaceSettingsForm>;
  } catch (error) {
    console.debug("workspace settings parse failed", error);
    return {};
  }
}
