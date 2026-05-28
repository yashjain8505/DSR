import { cn } from "@/lib/utils";

export type MarkdownRendererProps = {
  content: string;
  className?: string;
};

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

/**
 * Convert a markdown string to HTML using regex-based replacements.
 *
 * Supported syntax:
 * - Headings (# ## ###)
 * - Bold (**text**)
 * - Italic (*text*)
 * - Links [text](url)
 * - Unordered lists (- item)
 * - Ordered lists (1. item)
 * - Line breaks
 * - Paragraphs
 */
function markdownToHtml(md: string): string {
  let html = md;

  // Escape HTML entities in source to prevent injection via markdown content.
  html = html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Headings (process before paragraphs). Match from h3 down to h1 so ### isn't
  // consumed by the # rule first.
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");

  // Bold — match **text** (non-greedy)
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  // Italic — match *text* (non-greedy, but not inside <strong>)
  html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "<em>$1</em>");

  // Links — [text](url)
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
  );

  // Unordered lists: consecutive lines starting with "- "
  html = html.replace(/(?:^- .+$\n?)+/gm, (block) => {
    const items = block
      .trim()
      .split("\n")
      .map((line) => `<li>${line.replace(/^- /, "")}</li>`)
      .join("");
    return `<ul>${items}</ul>`;
  });

  // Ordered lists: consecutive lines starting with "N. "
  html = html.replace(/(?:^\d+\. .+$\n?)+/gm, (block) => {
    const items = block
      .trim()
      .split("\n")
      .map((line) => `<li>${line.replace(/^\d+\. /, "")}</li>`)
      .join("");
    return `<ol>${items}</ol>`;
  });

  // Paragraphs: wrap remaining bare text lines. Split on double newlines to
  // form paragraph groups, then wrap non-block content in <p> tags.
  html = html
    .split(/\n{2,}/)
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      // Don't wrap blocks that are already HTML block elements
      if (/^<(h[1-3]|ul|ol|li|p|div|blockquote)[\s>]/i.test(trimmed)) {
        return trimmed;
      }
      return `<p>${trimmed}</p>`;
    })
    .join("\n");

  // Single line breaks within paragraphs -> <br>
  html = html.replace(/<p>([\s\S]*?)<\/p>/g, (_match, inner: string) => {
    return `<p>${inner.replace(/\n/g, "<br>")}</p>`;
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
        "[&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-gray-900",
        "[&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-gray-900",
        "[&_p]:mb-4 [&_p]:leading-7 [&_p]:text-gray-700",
        "[&_a]:text-[var(--brand-primary)] [&_a]:underline [&_a]:hover:text-[var(--brand-primary-dark)]",
        "[&_strong]:font-semibold [&_strong]:text-gray-900",
        "[&_em]:italic",
        "[&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6",
        "[&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6",
        "[&_li]:mb-1 [&_li]:text-gray-700",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
