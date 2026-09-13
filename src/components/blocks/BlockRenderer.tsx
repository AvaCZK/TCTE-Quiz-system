import { Block } from "@/lib/types";
import TextBlock from "./TextBlock";
import TableBlock from "./TableBlock";
import LatexBlock from "./LatexBlock";
import EconGraphBlock from "./EconGraphBlock";

function renderBlock(block: Block, key: number) {
  switch (block.type) {
    case "text":
      return <TextBlock key={key} block={block} />;
    case "table":
      return <TableBlock key={key} block={block} />;
    case "latex":
      return <LatexBlock key={key} block={block} />;
    case "econ_graph":
      return <EconGraphBlock key={key} block={block} />;
    default:
      return null;
  }
}

export default function BlockRenderer({ blocks }: { blocks: Block[] }) {
  return (
    <div className="space-y-5">{blocks.map((b, i) => renderBlock(b, i))}</div>
  );
}
