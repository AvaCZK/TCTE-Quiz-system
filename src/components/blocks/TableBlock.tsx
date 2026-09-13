import { TableBlock as TableBlockType } from "@/lib/types";

export default function TableBlock({ block }: { block: TableBlockType }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/15">
      <table className="min-w-full border-collapse text-xl">
        <thead>
          <tr className="bg-white/10">
            {block.headers.map((h, i) => (
              <th
                key={i}
                className="border-b border-white/15 px-4 py-3 text-left font-semibold text-sky-100"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row, r) => (
            <tr key={r} className="odd:bg-white/[0.03] even:bg-transparent">
              {row.map((cell, c) => (
                <td
                  key={c}
                  className="border-b border-white/10 px-4 py-3 text-slate-200 tabular-nums"
                >
                  {String(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
