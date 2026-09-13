import { TextBlock as TextBlockType } from "@/lib/types";

export default function TextBlock({ block }: { block: TextBlockType }) {
  return (
    <p className="whitespace-pre-wrap text-2xl leading-relaxed text-slate-100">
      {block.text}
    </p>
  );
}
