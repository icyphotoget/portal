import React from "react";

/**
 * Minimal (safe) types for Strapi Blocks.
 * Strapi can send more fields, but these cover what we render.
 */

type TextNode = {
  type: "text";
  text?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
};

type LinkNode = {
  type: "link";
  url?: string;
  children?: InlineNode[];
};

type InlineNode = TextNode | LinkNode;

type ParagraphBlock = {
  type: "paragraph";
  children?: InlineNode[];
};

type HeadingBlock = {
  type: "heading";
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  children?: InlineNode[];
};

type QuoteBlock = {
  type: "quote";
  children?: InlineNode[];
};

type ListBlock = {
  type: "list";
  format?: "ordered" | "unordered";
  children?: Array<{
    type: "list-item";
    children?: InlineNode[];
  }>;
};

type ImageBlock = {
  type: "image";
  image?: {
    url?: string;
    alternativeText?: string;
  };
};

export type StrapiBlock =
  | ParagraphBlock
  | HeadingBlock
  | QuoteBlock
  | ListBlock
  | ImageBlock
  | Record<string, any>;

function absolutizeStrapiUrl(maybeRelativeUrl: string | null | undefined) {
  if (!maybeRelativeUrl) return null;
  if (maybeRelativeUrl.startsWith("http")) return maybeRelativeUrl;
  const base = process.env.NEXT_PUBLIC_STRAPI_URL;
  return base ? `${base}${maybeRelativeUrl}` : maybeRelativeUrl;
}

function renderInline(node: InlineNode, key: number): React.ReactNode {
  if (node.type === "link") {
    const href = node.url ?? "#";
    const children: InlineNode[] = node.children ?? [];
    return (
      <a
        key={key}
        href={href}
        className="underline underline-offset-4 hover:opacity-90"
        target={href.startsWith("http") ? "_blank" : undefined}
        rel={href.startsWith("http") ? "noreferrer" : undefined}
      >
        {children.map((c: InlineNode, i: number) => renderInline(c, i))}
      </a>
    );
  }

  // text node
  const text = node.text ?? "";

  let el: React.ReactNode = text;

  if (node.code) {
    el = (
      <code className="rounded bg-zinc-900/70 px-1 py-0.5 text-[0.95em]">
        {el}
      </code>
    );
  }
  if (node.bold) el = <strong>{el}</strong>;
  if (node.italic) el = <em>{el}</em>;
  if (node.underline) el = <span className="underline">{el}</span>;
  if (node.strikethrough) el = <span className="line-through">{el}</span>;

  return <React.Fragment key={key}>{el}</React.Fragment>;
}

function renderInlineChildren(children?: InlineNode[]) {
  const safe: InlineNode[] = children ?? [];
  return safe.map((c: InlineNode, i: number) => renderInline(c, i));
}

export default function StrapiBlocks({ blocks }: { blocks: any[] }) {
  if (!Array.isArray(blocks) || blocks.length === 0) return null;

  return (
    <div className="space-y-5">
      {blocks.map((b: StrapiBlock, idx: number) => {
        if (!b || typeof b !== "object") return null;

        switch (b.type) {
          case "heading": {
            const level = (b as HeadingBlock).level ?? 2;
            const className =
              level === 1
                ? "text-3xl font-semibold tracking-tight"
                : level === 2
                ? "text-2xl font-semibold tracking-tight"
                : level === 3
                ? "text-xl font-semibold"
                : "text-lg font-semibold";

            const Tag = (`h${level}` as unknown) as React.ElementType;

            return (
              <Tag key={idx} className={className}>
                {renderInlineChildren((b as HeadingBlock).children)}
              </Tag>
            );
          }

          case "paragraph":
            return (
              <p key={idx} className="leading-7 text-zinc-100/90">
                {renderInlineChildren((b as ParagraphBlock).children)}
              </p>
            );

          case "quote":
            return (
              <blockquote
                key={idx}
                className="border-l border-zinc-800 pl-4 text-zinc-200/90"
              >
                {renderInlineChildren((b as QuoteBlock).children)}
              </blockquote>
            );

          case "list": {
            const format = (b as ListBlock).format ?? "unordered";
            const items = (b as ListBlock).children ?? [];
            const ListTag = (format === "ordered" ? "ol" : "ul") as
              | "ol"
              | "ul";

            return (
              <ListTag
                key={idx}
                className={
                  format === "ordered"
                    ? "list-decimal space-y-2 pl-6 text-zinc-100/90"
                    : "list-disc space-y-2 pl-6 text-zinc-100/90"
                }
              >
                {items.map((it, i) => (
                  <li key={i}>{renderInlineChildren(it.children)}</li>
                ))}
              </ListTag>
            );
          }

          case "image": {
            const url = absolutizeStrapiUrl((b as ImageBlock).image?.url);
            if (!url) return null;

            return (
              <figure key={idx} className="overflow-hidden rounded-2xl border border-zinc-800">
                {/* Use <img> to avoid Next/Image remote config issues */}
                <img
                  src={url}
                  alt={(b as ImageBlock).image?.alternativeText ?? "Image"}
                  className="h-auto w-full object-cover"
                  loading="lazy"
                />
              </figure>
            );
          }

          default:
            // Unknown block type -> ignore safely
            return null;
        }
      })}
    </div>
  );
}
