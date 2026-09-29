import { Fragment, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";

/**
 * Renders database text as content, converting simple markdown-style
 * internal links `[label](/path)` into router <Link> elements so SPA
 * navigation works. All other text is preserved as-is.
 *
 * Reusable for any long-form text from the database (category seo_text,
 * home_content paragraphs, etc.). Only `[label](path)` is parsed — no
 * other markdown.
 */
const LINK_PATTERN = /\[([^\]]+)\]\(([^)\s]+)\)/g;

function parseText(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(LINK_PATTERN)) {
    const [full, label, href] = match;
    const index = match.index ?? 0;
    if (index > last) nodes.push(text.slice(last, index));
    nodes.push(
      <Link
        key={`${href}-${index}`}
        to={href}
        className="underline underline-offset-2 transition-colors hover:text-foreground"
      >
        {label}
      </Link>,
    );
    last = index + full.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function LinkedText({ text }: { text: string }) {
  const parts = text.split(/\n{2,}/);
  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {parseText(part)}
        </Fragment>
      ))}
    </>
  );
}
