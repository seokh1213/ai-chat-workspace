export function isChatLogNearBottom(element: HTMLElement, threshold = 96): boolean {
  return element.scrollHeight - element.scrollTop - element.clientHeight <= threshold;
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

export function scrollDetailNodeIntoView(selector: string) {
  window.setTimeout(() => {
    const element = document.querySelector<HTMLElement>(selector);
    element?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 80);
}

export function cssEscapeValue(value: string): string {
  return typeof CSS !== "undefined" && typeof CSS.escape === "function" ? CSS.escape(value) : value.replace(/["\\]/g, "\\$&");
}

export function setDocumentResizeState(cursor: string) {
  document.body.style.cursor = cursor;
  document.body.style.userSelect = "none";
}

export function clearDocumentResizeState() {
  document.body.style.cursor = "";
  document.body.style.userSelect = "";
}
