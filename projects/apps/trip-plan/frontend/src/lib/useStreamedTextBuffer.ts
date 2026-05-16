import { type Dispatch, type SetStateAction, useRef } from "react";

export function useStreamedTextBuffer(setText: Dispatch<SetStateAction<string>>) {
  const queueRef = useRef("");
  const pumpRef = useRef<number | null>(null);
  const deltaSeenRef = useRef(false);

  function clear() {
    if (pumpRef.current != null) {
      window.clearInterval(pumpRef.current);
      pumpRef.current = null;
    }
    queueRef.current = "";
    deltaSeenRef.current = false;
  }

  function enqueue(delta: string) {
    if (!delta) return;
    deltaSeenRef.current = true;
    queueRef.current += delta;
    if (pumpRef.current != null) return;

    pumpRef.current = window.setInterval(() => {
      const queued = queueRef.current;
      if (!queued) {
        if (pumpRef.current != null) {
          window.clearInterval(pumpRef.current);
          pumpRef.current = null;
        }
        return;
      }

      const chunkSize = queued.length > 600 ? 28 : queued.length > 180 ? 14 : 7;
      const chunk = queued.slice(0, chunkSize);
      queueRef.current = queued.slice(chunk.length);
      setText((current) => `${current}${chunk}`);
    }, 24);
  }

  function hasSeenDelta() {
    return deltaSeenRef.current;
  }

  function waitForDrain(timeoutMs = 5_000): Promise<void> {
    const startedAt = window.performance.now();
    return new Promise((resolve) => {
      const poll = () => {
        const elapsed = window.performance.now() - startedAt;
        if ((!queueRef.current && pumpRef.current == null) || elapsed >= timeoutMs) {
          resolve();
          return;
        }
        window.setTimeout(poll, 40);
      };
      poll();
    });
  }

  return {
    clear,
    enqueue,
    hasSeenDelta,
    waitForDrain
  };
}
