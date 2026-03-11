// Simple markdown-to-HTML parser for documentation content
// Handles: headers, paragraphs, code blocks, inline code, bold, italic,
// links, images, lists, blockquotes, horizontal rules, tables, strikethrough

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function inlineMarkdown(text: string): string {
  let s = text;

  // Inline code (do first to protect from further processing)
  const codeMap: Record<string, string> = {};
  let codeIdx = 0;
  s = s.replace(/`([^`\n]+)`/g, (_, code) => {
    const key = `__CODE_${codeIdx++}__`;
    codeMap[key] = `<code>${escapeHtml(code)}</code>`;
    return key;
  });

  // Escape HTML
  s = escapeHtml(s);

  // Bold + italic
  s = s.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  s = s.replace(/___(.+?)___/g, "<strong><em>$1</em></strong>");

  // Bold
  s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/__(.+?)__/g, "<strong>$1</strong>");

  // Italic
  s = s.replace(/\*([^*\n]+)\*/g, "<em>$1</em>");
  s = s.replace(/_([^_\n]+)_/g, "<em>$1</em>");

  // Strikethrough
  s = s.replace(/~~(.+?)~~/g, "<del>$1</del>");

  // Images (before links)
  s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2" />');

  // Links
  s = s.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
  );

  // Restore inline code
  for (const [key, val] of Object.entries(codeMap)) {
    s = s.replace(key, val);
  }

  return s;
}

function parseTable(lines: string[]): string {
  if (lines.length < 2)
    return lines.map((l) => `<p>${inlineMarkdown(l)}</p>`).join("\n");
  const header = lines[0]
    .split("|")
    .filter((_, i, a) => i > 0 && i < a.length - 1)
    .map((cell) => `<th>${inlineMarkdown(cell.trim())}</th>`)
    .join("");
  const body = lines
    .slice(2)
    .map((row) => {
      const cells = row
        .split("|")
        .filter((_, i, a) => i > 0 && i < a.length - 1)
        .map((cell) => `<td>${inlineMarkdown(cell.trim())}</td>`)
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");
  return `<table><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table>`;
}

export function markdownToHtml(markdown: string): string {
  const lines = markdown.split("\n");
  const output: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    const fenceMatch = line.match(/^```(\w*)$/);
    if (fenceMatch) {
      const lang = fenceMatch[1];
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      const code = escapeHtml(codeLines.join("\n"));
      output.push(
        `<pre><code${lang ? ` class="language-${lang}"` : ""}>${code}</code></pre>`,
      );
      i++; // skip closing ```
      continue;
    }

    // Headers
    const hMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (hMatch) {
      const level = hMatch[1].length;
      const id = hMatch[2]
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      output.push(
        `<h${level} id="${id}">${inlineMarkdown(hMatch[2])}</h${level}>`,
      );
      i++;
      continue;
    }

    // Horizontal rule
    if (line.match(/^[-*_]{3,}\s*$/)) {
      output.push("<hr>");
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) {
        quoteLines.push(lines[i].slice(2));
        i++;
      }
      output.push(
        `<blockquote><p>${inlineMarkdown(quoteLines.join(" "))}</p></blockquote>`,
      );
      continue;
    }

    // Unordered list
    if (line.match(/^[-*+]\s+/)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^[-*+]\s+/)) {
        items.push(
          `<li>${inlineMarkdown(lines[i].replace(/^[-*+]\s+/, ""))}</li>`,
        );
        i++;
      }
      output.push(`<ul>${items.join("")}</ul>`);
      continue;
    }

    // Ordered list
    if (line.match(/^\d+\.\s+/)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^\d+\.\s+/)) {
        items.push(
          `<li>${inlineMarkdown(lines[i].replace(/^\d+\.\s+/, ""))}</li>`,
        );
        i++;
      }
      output.push(`<ol>${items.join("")}</ol>`);
      continue;
    }

    // Table detection (has | separator line)
    if (
      line.includes("|") &&
      i + 1 < lines.length &&
      lines[i + 1].match(/^[|:\-\s]+$/)
    ) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].includes("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      output.push(parseTable(tableLines));
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Regular paragraph — collect consecutive non-block lines
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].match(/^#{1,6}\s/) &&
      !lines[i].startsWith("```") &&
      !lines[i].startsWith("> ") &&
      !lines[i].match(/^[-*+]\s/) &&
      !lines[i].match(/^\d+\.\s/) &&
      !lines[i].match(/^[-*_]{3,}\s*$/)
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      output.push(`<p>${inlineMarkdown(paraLines.join(" "))}</p>`);
    }
  }

  return output.join("\n");
}
