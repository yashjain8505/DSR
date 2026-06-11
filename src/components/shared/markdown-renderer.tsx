import { cn } from "@/lib/utils";

export type MarkdownRendererProps = {
  content: string;
  className?: string;
};

/** Escape HTML-significant characters. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Sanitize HTML by stripping script tags and dangerous attributes.
 */
function sanitize(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<script[\s\S]*?>/gi, "")
    .replace(/on\w+="[^"]*"/gi, "")
    .replace(/on\w+='[^']*'/gi, "");
}

/** Convert GitHub-style pipe tables into HTML <table> blocks. */
function renderTables(html: string): string {
  return html.replace(
    /^(\|.+\|)[ \t]*\n(\|[ :|\-]+\|)[ \t]*\n((?:\|.*\|[ \t]*\n?)+)/gm,
    (_match, headerRow: string, _sep: string, bodyRows: string) => {
      const parseCells = (row: string) =>
        row
          .trim()
          .replace(/^\|/, "")
          .replace(/\|$/, "")
          .split("|")
          .map((c) => c.trim());
      const headers = parseCells(headerRow);
      const rows = bodyRows
        .trim()
        .split("\n")
        .filter((l) => l.trim())
        .map(parseCells);
      const thead = `<thead><tr>${headers
        .map((h) => `<th>${h}</th>`)
        .join("")}</tr></thead>`;
      const tbody = `<tbody>${rows
        .map((cells) => `<tr>${cells.map((c) => `<td>${c}</td>`).join("")}</tr>`)
        .join("")}</tbody>`;
      return `<table>${thead}${tbody}</table>`;
    },
  );
}

/**
 * Convert a markdown string to HTML using regex-based replacements.
 *
 * Supported syntax:
 * - Headings (# ## ###)
 * - Bold (**text**), Italic (*text*)
 * - Links [text](url)
 * - Fenced code blocks (```lang ... ```) and inline code (`code`)
 * - GitHub-style pipe tables
 * - Horizontal rules (---)
 * - Unordered lists (- item) and ordered lists (1. item)
 * - Paragraphs and line breaks
 *
 * Code spans are pulled out into placeholders before any inline rule runs, so
 * symbols inside code (*, _, [], 1.) are never mangled, then re-inserted last.
 * Placeholders are plain alphanumeric tokens: whitespace-free (survive trim),
 * collision-proof against real content, and untouched by escaping.
 */
function markdownToHtml(md: string): string {
  const codeBlocks: string[] = [];
  const inlineCodes: string[] = [];

  let html = md;

  // 1. Extract fenced code blocks first (before escaping or any inline rule).
  html = html.replace(
    /```[a-zA-Z0-9+#.-]*\n?([\s\S]*?)```/g,
    (_m, code: string) => {
      const idx = codeBlocks.length;
      codeBlocks.push(code.replace(/\n$/, ""));
      return `XCODEBLOCKX${idx}XEND`;
    },
  );

  // 2. Extract inline code spans next.
  html = html.replace(/`([^`\n]+)`/g, (_m, code: string) => {
    const idx = inlineCodes.length;
    inlineCodes.push(code);
    return `XINLINEX${idx}XEND`;
  });

  // 3. Escape HTML entities now that raw code is safely set aside.
  html = escapeHtml(html);

  // 4. Tables (before paragraphs; cell text still flows through inline rules).
  html = renderTables(html);

  // 5. Horizontal rules.
  html = html.replace(/^---+[ \t]*$/gm, "<hr>");

  // 6. Headings (h3 -> h1 so ### isn't consumed by the # rule first).
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");

  // 7. Bold, italic, links.
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "<em>$1</em>");
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
  );

  // 8. Unordered lists: consecutive lines starting with "- ".
  html = html.replace(/(?:^- .+$\n?)+/gm, (block) => {
    const items = block
      .trim()
      .split("\n")
      .map((line) => `<li>${line.replace(/^- /, "")}</li>`)
      .join("");
    return `<ul>${items}</ul>`;
  });

  // 9. Ordered lists: consecutive lines starting with "N. ".
  html = html.replace(/(?:^\d+\. .+$\n?)+/gm, (block) => {
    const items = block
      .trim()
      .split("\n")
      .map((line) => `<li>${line.replace(/^\d+\. /, "")}</li>`)
      .join("");
    return `<ol>${items}</ol>`;
  });

  // 10. Paragraphs. Skip already-block-level HTML and code-block placeholders
  //     (the latter are re-inserted as <pre> below, never wrapped in <p>).
  html = html
    .split(/\n{2,}/)
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      if (/^XCODEBLOCKX\d+XEND$/.test(trimmed)) return trimmed;
      if (
        /^<(h[1-3]|ul|ol|li|p|div|blockquote|table|pre|hr)[\s>]/i.test(trimmed)
      ) {
        return trimmed;
      }
      return `<p>${trimmed}</p>`;
    })
    .join("\n");

  // 11. Single line breaks within paragraphs -> <br>.
  html = html.replace(/<p>([\s\S]*?)<\/p>/g, (_match, inner: string) => {
    return `<p>${inner.replace(/\n/g, "<br>")}</p>`;
  });

  // 12. Re-insert inline code, then fenced code blocks (contents escaped).
  html = html.replace(/XINLINEX(\d+)XEND/g, (_m, i: string) => {
    return `<code>${escapeHtml(inlineCodes[Number(i)])}</code>`;
  });
  html = html.replace(/XCODEBLOCKX(\d+)XEND/g, (_m, i: string) => {
    return `<pre><code>${escapeHtml(codeBlocks[Number(i)])}</code></pre>`;
  });

  return sanitize(html);
}

export function MarkdownRenderer({
  content,
  className,
}: MarkdownRendererProps) {
  const html = markdownToHtml(content);

  return (
    <div
      className={cn(
        // Prose-like typography styles
        "[&_h1]:mb-4 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-gray-900",
        "[&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-gray-900",
        "[&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-gray-900",
        "[&_p]:mb-4 [&_p]:leading-7 [&_p]:text-gray-700",
        "[&_a]:text-[var(--brand-primary)] [&_a]:underline [&_a]:hover:text-[var(--brand-primary-dark)]",
        "[&_strong]:font-semibold [&_strong]:text-gray-900",
        "[&_em]:italic",
        "[&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6",
        "[&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6",
        "[&_li]:mb-1 [&_li]:text-gray-700",
        "[&_hr]:my-6 [&_hr]:border-gray-100",
        // Inline code
        "[&_code]:rounded [&_code]:bg-gray-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em] [&_code]:text-gray-800",
        // Fenced code blocks (higher specificity overrides inline code styles)
        "[&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-gray-900 [&_pre]:p-4",
        "[&_pre_code]:block [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:font-mono [&_pre_code]:text-[13px] [&_pre_code]:leading-relaxed [&_pre_code]:text-gray-100",
        // Tables — borderless, zebra rows for structure
        "[&_table]:my-4 [&_table]:w-full [&_table]:border-collapse [&_table]:overflow-hidden [&_table]:rounded-lg [&_table]:text-sm",
        "[&_th]:bg-gray-100 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_th]:text-gray-900",
        "[&_td]:px-3 [&_td]:py-2 [&_td]:align-top [&_td]:text-gray-700",
        "[&_tbody_tr:nth-child(even)]:bg-gray-50",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
