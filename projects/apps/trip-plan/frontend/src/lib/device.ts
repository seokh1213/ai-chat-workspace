import type { KeyboardEvent } from "react";

export function isWindowsUserAgent(): boolean {
  return typeof navigator !== "undefined" && /Windows/i.test(navigator.userAgent);
}

export function isMobileUserAgent(): boolean {
  return typeof navigator !== "undefined" && /iPhone|iPad|iPod|Android|Mobile/i.test(navigator.userAgent);
}

export function submitOnCommandEnter(event: KeyboardEvent<HTMLTextAreaElement>) {
  if (isMobileUserAgent()) return;
  if (event.key === "Enter" && !event.shiftKey && !event.altKey && !event.nativeEvent.isComposing) {
    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  }
}
