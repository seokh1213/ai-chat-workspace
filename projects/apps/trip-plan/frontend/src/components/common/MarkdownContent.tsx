import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

const markdownPlugins = [remarkGfm, remarkBreaks, remarkLenientStrong];

export function MarkdownContent(props: { content: string; className?: string }) {
  return (
    <div className={["message-content", props.className].filter(Boolean).join(" ")}>
      <ReactMarkdown remarkPlugins={markdownPlugins}>{normalizeMarkdownForRender(props.content)}</ReactMarkdown>
    </div>
  );
}

function normalizeMarkdownForRender(content: string) {
  return content
    .replace(/참고\s*स्रोत/g, "출처")
    .replace(/^Sources:\s*$/gm, "출처:")
    .replace(/([^\s\n])-\s+(?=\S)/g, "$1\n- ");
}

type MarkdownNode = {
  type?: string;
  value?: string;
  children?: MarkdownNode[];
  [key: string]: unknown;
};

function remarkLenientStrong() {
  return (tree: MarkdownNode) => {
    transformLenientStrong(tree);
  };
}

function transformLenientStrong(node: MarkdownNode) {
  if (!Array.isArray(node.children)) return;
  node.children = transformMarkdownChildren(node.children);
}

function transformMarkdownChildren(children: MarkdownNode[]): MarkdownNode[] {
  const output: MarkdownNode[] = [];
  let strongBuffer: MarkdownNode[] | null = null;

  const target = () => strongBuffer ?? output;
  const pushText = (value: string) => {
    if (value) target().push({ type: "text", value });
  };
  const closeStrong = () => {
    if (!strongBuffer) return;
    output.push({ type: "strong", children: strongBuffer });
    strongBuffer = null;
  };

  children.forEach((child) => {
    if (child.type !== "text" || typeof child.value !== "string") {
      transformLenientStrong(child);
      target().push(child);
      return;
    }

    let rest = child.value;
    while (rest.length > 0) {
      const markerIndex = rest.indexOf("**");
      if (markerIndex < 0) {
        pushText(rest);
        break;
      }

      pushText(rest.slice(0, markerIndex));
      if (strongBuffer) {
        closeStrong();
      } else {
        strongBuffer = [];
      }
      rest = rest.slice(markerIndex + 2);
    }
  });

  const danglingBuffer = strongBuffer as MarkdownNode[] | null;
  if (danglingBuffer) {
    output.push({ type: "text", value: "**" });
    danglingBuffer.forEach((node) => output.push(node));
  }

  return output;
}
