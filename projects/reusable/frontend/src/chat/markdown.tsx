import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

const markdownPlugins = [remarkGfm, remarkBreaks];

export function MarkdownContent(props: { content: string }) {
  return (
    <div className="message-content">
      <ReactMarkdown remarkPlugins={markdownPlugins}>{normalizeMarkdownForRender(props.content)}</ReactMarkdown>
    </div>
  );
}

export function normalizeMarkdownForRender(content: string): string {
  return content
    .replace(/참고\s*स्रोत/g, "출처")
    .replace(/^Sources:\s*$/gm, "출처:")
    .replace(/([^\s\n])-\s+(?=\S)/g, "$1\n- ");
}

export function buildChatSessionMarkdown(props: {
  title: string;
  messages: Array<{ role: string; content: string }>;
}): string {
  const lines = [`# ${props.title}`, "", "## 대화", ""];
  props.messages.forEach((message, index) => {
    lines.push(`### ${index + 1}. ${chatRoleLabel(message.role)}`, "", message.content.trim() || "(빈 메시지)", "");
  });
  return lines.join("\n").trimEnd() + "\n";
}

export function chatRoleLabel(role: string): string {
  if (role === "user") return "사용자";
  if (role === "assistant") return "AI";
  if (role === "system") return "시스템";
  if (role === "tool") return "도구";
  return role;
}

export async function writeClipboardText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}
