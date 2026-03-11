import { useMemo } from "react";
import { markdownToHtml } from "../utils/markdown";

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export default function MarkdownContent({
  content,
  className = "",
}: MarkdownContentProps) {
  const html = useMemo(() => markdownToHtml(content), [content]);
  return (
    <div
      className={`docs-content ${className}`}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: Admin-controlled documentation content
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
