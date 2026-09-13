import { EconGraphBlock as EconGraphBlockType } from "@/lib/types";

const DEFAULT_COLORS = ["#7dd3fc", "#fca5a5", "#6ee7b7", "#fcd34d", "#c4b5fd", "#f0abfc"];

const AXIS = "#cbd5e1";
const INK = "#e2e8f0";
const GUIDE = "rgba(148,163,184,0.5)";

// SVG 版面設定
const W = 640;
const H = 460;
const PAD_LEFT = 70;
const PAD_RIGHT = 80;
const PAD_TOP = 50;
const PAD_BOTTOM = 70;

export default function EconGraphBlock({ block }: { block: EconGraphBlockType }) {
  const allPoints = [...block.curves.flatMap((c) => c.points), ...(block.points ?? [])];

  const xs = allPoints.map((p) => p.x);
  const ys = allPoints.map((p) => p.y);

  const rawMaxX = xs.length ? Math.max(...xs) : 10;
  const rawMaxY = ys.length ? Math.max(...ys) : 10;
  const rawMinX = xs.length ? Math.min(...xs) : 0;
  const rawMinY = ys.length ? Math.min(...ys) : 0;

  // 經濟學圖形通常從原點開始
  const minX = Math.min(0, rawMinX);
  const minY = Math.min(0, rawMinY);
  const maxX = rawMaxX > minX ? rawMaxX + (rawMaxX - minX) * 0.12 : minX + 10;
  const maxY = rawMaxY > minY ? rawMaxY + (rawMaxY - minY) * 0.12 : minY + 10;

  const plotW = W - PAD_LEFT - PAD_RIGHT;
  const plotH = H - PAD_TOP - PAD_BOTTOM;

  const sx = (x: number) => PAD_LEFT + ((x - minX) / (maxX - minX)) * plotW;
  const sy = (y: number) => PAD_TOP + plotH - ((y - minY) / (maxY - minY)) * plotH;

  const originX = sx(minX);
  const originY = sy(minY);

  return (
    <figure className="my-2 overflow-hidden rounded-xl border border-white/10 bg-slate-950/40">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mx-auto h-auto w-full max-w-3xl"
        role="img"
        aria-label={block.title ?? "經濟學圖形"}
      >
        <defs>
          <marker
            id="econ-arrow"
            markerWidth="10"
            markerHeight="10"
            refX="8"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,6 L9,3 z" fill={AXIS} />
          </marker>
        </defs>

        {/* 標題 */}
        {block.title && (
          <text x={W / 2} y={26} textAnchor="middle" fontSize={22} fontWeight={600} fill={INK}>
            {block.title}
          </text>
        )}

        {/* Y 軸 */}
        <line
          x1={originX}
          y1={originY}
          x2={originX}
          y2={PAD_TOP - 10}
          stroke={AXIS}
          strokeWidth={2}
          markerEnd="url(#econ-arrow)"
        />
        {/* X 軸 */}
        <line
          x1={originX}
          y1={originY}
          x2={W - PAD_RIGHT + 20}
          y2={originY}
          stroke={AXIS}
          strokeWidth={2}
          markerEnd="url(#econ-arrow)"
        />

        {/* 軸名稱 */}
        <text x={W - 10} y={originY + 34} textAnchor="end" fontSize={20} fill={INK}>
          {block.xLabel}
        </text>
        <text x={10} y={PAD_TOP - 12} textAnchor="start" fontSize={20} fill={INK}>
          {block.yLabel}
        </text>

        {/* 曲線 */}
        {block.curves.map((curve, i) => {
          const color = curve.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length];
          const d = curve.points
            .map((p, j) => `${j === 0 ? "M" : "L"} ${sx(p.x)} ${sy(p.y)}`)
            .join(" ");
          const last = curve.points[curve.points.length - 1];
          return (
            <g key={i}>
              <path
                d={d}
                fill="none"
                stroke={color}
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.95}
              />
              <text
                x={sx(last.x) + 10}
                y={sy(last.y) + 6}
                fontSize={20}
                fontWeight={700}
                fill={color}
              >
                {curve.name}
              </text>
            </g>
          );
        })}

        {/* 標記點（含虛線輔助線） */}
        {(block.points ?? []).map((p, i) => (
          <g key={i}>
            <line
              x1={originX}
              y1={sy(p.y)}
              x2={sx(p.x)}
              y2={sy(p.y)}
              stroke={GUIDE}
              strokeWidth={1.5}
              strokeDasharray="6 4"
            />
            <line
              x1={sx(p.x)}
              y1={originY}
              x2={sx(p.x)}
              y2={sy(p.y)}
              stroke={GUIDE}
              strokeWidth={1.5}
              strokeDasharray="6 4"
            />
            <circle cx={sx(p.x)} cy={sy(p.y)} r={7} fill="#fde68a" opacity={0.25} />
            <circle cx={sx(p.x)} cy={sy(p.y)} r={5} fill="#fbbf24" />
            {p.name && (
              <text
                x={sx(p.x) + 10}
                y={sy(p.y) - 10}
                fontSize={20}
                fontWeight={700}
                fill="#fde68a"
              >
                {p.name}
              </text>
            )}
          </g>
        ))}
      </svg>
    </figure>
  );
}
