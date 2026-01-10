type InlineNode = {
  type?: string;
  text?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
  url?: string;
  children?: InlineNode[];
};

type BlockNode = {
  type: string;
  level?: number;
  format?: "ordered" | "unordered";
  children?: (BlockNode | InlineNode)[];
};

function renderInline(node: InlineNode, key: number): JSX.Element {
  if (node.type === "link") {
    const href = node.url ?? "#";
    return (
      <a
        key={key}
        href={href}
        target="_blank"
        rel="noreferrer"
        className="underline underline-offset-4 decoration-zinc-500 hover:decoration-zinc-200"
      >
        {node.children?.map((c, i) => renderInline(c, i))}
      </a>
    );
  }

  const raw = node.text ?? "";
  let el: JSX.Element = <span key={key}>{raw}</span>;

  if (node.code) el = <code key={key} className="rounded bg-zinc-900/70 px-1 py-0.5 text-sm">{raw}</code>;
  if (node.bold) el = <strong key={key}>{el}</strong>;
  if (node.italic) el = <em key={key}>{el}</em>;
  if (node.underline) el = <u key={key}>{el}</u>;
  if (node.strikethrough) el = <s key={key}>{el}</s>;

  return el;
}

function renderChildren(children: any[] | undefined): JSX.Element[] {
  if (!Array.isArray(children)) return [];
  return children.map((child, idx) => {
    if (child && typeof child === "object" && typeof child.type === "string" && !("text" in child)) {
      return <span key={idx}>{renderBlock(child as BlockNode, idx)}</span>;
    }
    return renderInline(child as InlineNode, idx);
  });
}

function renderBlock(block: BlockNode, key: number): JSX.Element | null {
  const children = renderChildren(block.children as any[]);

  switch (block.type) {
    case "paragraph":
      return <p key={key} className="my-4 text-zinc-200">{children}</p>;

    case "heading": {
      const level = block.level ?? 2;
      if (level === 1) return <h1 key={key} className="mt-10 mb-4 text-3xl font-semibold">{children}</h1>;
      if (level === 2) return <h2 key={key} className="mt-10 mb-3 text-2xl font-semibold">{children}</h2>;
      if (level === 3) return <h3 key={key} className="mt-8 mb-3 text-xl font-semibold">{children}</h3>;
      return <h4 key={key} className="mt-6 mb-2 text-lg font-semibold">{children}</h4>;
    }

    case "quote":
      return (
        <blockquote key={key} className="my-6 border-l-2 border-zinc-700 pl-4 text-zinc-200 italic">
          {children}
        </blockquote>
      );

    case "list": {
      const format = block.format ?? "unordered";
      const items = (block.children ?? []).filter(Boolean) as any[];

      if (format === "ordered") {
        return (
          <ol key={key} className="my-4 list-decimal space-y-2 pl-6 text-zinc-200">
            {items.map((it, i) => renderBlock(it as BlockNode, i))}
          </ol>
        );
      }

      return (
        <ul key={key} className="my-4 list-disc space-y-2 pl-6 text-zinc-200">
          {items.map((it, i) => renderBlock(it as BlockNode, i))}
        </ul>
      );
    }

    case "list-item":
      return <li key={key}>{children}</li>;

    case "hr":
      return <hr key={key} className="my-8 border-zinc-800" />;

    default:
      if (children.length > 0) return <div key={key}>{children}</div>;
      return null;
  }
}

export default function StrapiBlocks({ blocks }: { blocks: BlockNode[] }) {
  if (!Array.isArray(blocks)) return null;

  return (
    <div className="text-[16px] leading-7">
      {blocks.map((block, i) => renderBlock(block, i))}
    </div>
  );
}
