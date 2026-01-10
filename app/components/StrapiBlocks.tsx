import type React from "react";

type InlineNode =
  | { type: "text"; text: string }
  | { type: "link"; url?: string; children?: InlineNode[] }
  | { type: string; [key: string]: any };

type BlockNode =
  | { type: "paragraph"; children?: InlineNode[] }
  | { type: "heading"; level?: number; children?: InlineNode[] }
  | { type: "quote"; children?: InlineNode[] }
  | { type: "list"; format?: "ordered" | "unordered"; children?: any[] }
  | { type: "list-item"; children?: InlineNode[] }
  | { type: string; [key: string]: any };

function renderInline(node: InlineNode, key: number): React.ReactNode {
  if (node.type === "text") return node.text;

  if (node.type === "link") {
    const href = node.url ?? "#";
    return (
      <a
        key={key}
        href={href}
        className="underline underline-offset-4 decoration-zinc-600 hover:decoration-zinc-200"
        target={href.startsWith("http") ? "_blank" : undefined}
        rel={href.startsWith("http") ? "noreferrer" : undefined}
      >
        {(node.children ?? []).map((c, i) => renderInline(c, i))}
      </a>
    );
  }

  // fallback
  if (Array.isArray((node as any).children)) {
    return (node as any).children.map((c: InlineNode, i: number) => (
      <span key={i}>{renderInline(c, i)}</span>
    ));
  }

  return null;
}

function renderParagraph(children?: InlineNode[]) {
  return <p className="mt-4 text-zinc-200 leading-7">{(children ?? []).map(renderInline)}</p>;
}

function renderHeading(level: number, children?: InlineNode[]) {
  const text = <>{(children ?? []).map(renderInline)}</>;
  if (level <= 2) return <h2 className="mt-8 text-2xl font-semibold">{text}</h2>;
  if (level === 3) return <h3 className="mt-6 text-xl font-semibold">{text}</h3>;
  return <h4 className="mt-6 text-lg font-semibold">{text}</h4>;
}

function renderList(block: any) {
  const items = Array.isArray(block.children) ? block.children : [];
  const isOrdered = block.format === "ordered";

  const ListTag = isOrdered ? "ol" : "ul";
  return (
    <ListTag className={`mt-4 pl-6 ${isOrdered ? "list-decimal" : "list-disc"}`}>
      {items.map((it: any, idx: number) => (
        <li key={idx} className="mt-2 text-zinc-200 leading-7">
          {(it?.children ?? []).map(renderInline)}
        </li>
      ))}
    </ListTag>
  );
}

export default function StrapiBlocks({ blocks }: { blocks: any }) {
  const arr: BlockNode[] = Array.isArray(blocks) ? blocks : [];

  return (
    <div>
      {arr.map((b, idx) => {
        if (!b || typeof b !== "object") return null;

        if (b.type === "paragraph") {
          return <div key={idx}>{renderParagraph(b.children)}</div>;
        }

        if (b.type === "heading") {
          return <div key={idx}>{renderHeading(b.level ?? 2, b.children)}</div>;
        }

        if (b.type === "quote") {
          return (
            <blockquote
              key={idx}
              className="mt-6 border-l-2 border-zinc-700 pl-4 text-zinc-200 italic"
            >
              {(b.children ?? []).map(renderInline)}
            </blockquote>
          );
        }

        if (b.type === "list") {
          return <div key={idx}>{renderList(b)}</div>;
        }

        // unknown block -> ignore safely
        return null;
      })}
    </div>
  );
}
