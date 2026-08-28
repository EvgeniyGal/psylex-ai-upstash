"use client";

import type { AnchorHTMLAttributes, MouseEvent } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { helpSlugFromHref } from "@/lib/help/links";
import type { HelpSlug } from "@/lib/help/types";
import { cn } from "@/lib/utils";

type HelpMarkdownProps = {
  markdown: string;
  className?: string;
  onDocLink?: (slug: HelpSlug) => void;
};

export function HelpMarkdown({ markdown, className, onDocLink }: HelpMarkdownProps) {
  return (
    <div className={cn("help-markdown", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSlug]}
        components={{
          a: ({ href, children, ...props }) => (
            <HelpMarkdownLink href={href} onDocLink={onDocLink} {...props}>
              {children}
            </HelpMarkdownLink>
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}

function scrollToHelpAnchor(event: MouseEvent<HTMLAnchorElement>, href: string) {
  event.preventDefault();
  const root = event.currentTarget.closest(".help-markdown");
  if (!root) return;

  const id = decodeURIComponent(href.slice(1));
  let target: Element | null | undefined = id ? root.querySelector(`[id="${CSS.escape(id)}"]`) : null;

  if (!target) {
    const label = event.currentTarget.textContent?.replace(/\s+/g, " ").trim();
    if (label) {
      const headings = Array.from(root.querySelectorAll("h1, h2, h3"));
      target = headings.find((heading) => {
        const text = heading.textContent?.replace(/\s+/g, " ").trim() ?? "";
        return text === label || text.endsWith(label);
      });
    }
  }

  target?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function HelpMarkdownLink({
  href,
  children,
  onDocLink,
  node: _node,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  onDocLink?: (slug: HelpSlug) => void;
  node?: unknown;
}) {
  const slug = helpSlugFromHref(href);

  if (slug && onDocLink) {
    return (
      <a
        {...props}
        href={href}
        onClick={(event) => {
          event.preventDefault();
          onDocLink(slug);
        }}
      >
        {children}
      </a>
    );
  }

  if (href?.startsWith("#")) {
    return (
      <a {...props} href={href} onClick={(event) => scrollToHelpAnchor(event, href)}>
        {children}
      </a>
    );
  }

  if (href?.startsWith("http://") || href?.startsWith("https://")) {
    return (
      <a {...props} href={href} rel="noreferrer" target="_blank">
        {children}
      </a>
    );
  }

  return <span>{children}</span>;
}
