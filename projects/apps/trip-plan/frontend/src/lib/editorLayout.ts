import { clampNumber } from "./format";

export type EditorLayout = {
  plannerWidth: number;
  chatWidth: number;
  placesHeight: number;
};

const editorLayoutStorageKey = "trip-planner-editor-layout";
const defaultEditorLayout: EditorLayout = {
  plannerWidth: 440,
  chatWidth: 420,
  placesHeight: 260
};

export function readEditorLayout(): EditorLayout {
  try {
    const stored = window.localStorage.getItem(editorLayoutStorageKey);
    if (!stored) return defaultEditorLayout;
    const parsed = JSON.parse(stored) as Partial<EditorLayout>;
    return {
      plannerWidth: clampNumber(Number(parsed.plannerWidth), 420, 580, defaultEditorLayout.plannerWidth),
      chatWidth: clampNumber(Number(parsed.chatWidth), 360, 560, defaultEditorLayout.chatWidth),
      placesHeight: clampNumber(Number(parsed.placesHeight), 190, 520, defaultEditorLayout.placesHeight)
    };
  } catch {
    return defaultEditorLayout;
  }
}

export function writeEditorLayout(layout: EditorLayout) {
  window.localStorage.setItem(editorLayoutStorageKey, JSON.stringify(layout));
}
