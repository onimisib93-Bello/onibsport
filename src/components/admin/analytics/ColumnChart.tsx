"use client";

import { useId, useState } from "react";

export interface ColumnDatum {
  /** Axis label, e.g. "Mon 14" or "18:00". */
  label: string;
  value: number;
  /** Extra line in the tooltip, e.g. "212 visitors". */
  detail?: string;
}

const BAR = "#5b43c4"; // brand indigo step, validated against the white chart surface
const H = 220;
const PAD = { top: 12, right: 8, bottom: 26, left: 40 };

function niceMax(v: number) {
  if (v <= 4) return 4;
  const pow = 10 ** Math.floor(Math.log10(v));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => v / s <= 4) ?? 10 * pow;
  return Math.ceil(v / step) * step;
}

const compact = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(v >= 10_000 ? 0 : 1).replace(/\.0$/, "")}K` : String(v));

/** Bar path with a 4px rounded top and a square base. */
function barPath(x: number, y: number, w: number, h: number) {
  const r = Math.min(4, w / 2, h);
  return `M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h} Z`;
}

/**
 * Single-series column chart with a hover/focus tooltip and a table view.
 * One colour, so no legend: the section title says what is plotted.
 */
export default function ColumnChart({
  data,
  valueName,
  ariaLabel,
  labelEvery = 1,
  width = 720,
}: {
  data: ColumnDatum[];
  /** Noun for the value, e.g. "views". */
  valueName: string;
  ariaLabel: string;
  /** Show every Nth axis label. */
  labelEvery?: number;
  /** Drawing width; use a smaller one in narrow cards so text keeps its size. */
  width?: number;
}) {
  const W = width;
  const id = useId();
  const [active, setActive] = useState<number | null>(null);
  const max = niceMax(Math.max(0, ...data.map((d) => d.value)));
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const slot = innerW / Math.max(1, data.length);
  const barW = Math.max(2, Math.min(24, slot - 2));
  const y = (v: number) => PAD.top + innerH - (v / max) * innerH;
  const ticks = [0, max / 2, max];
  const current = active != null ? data[active] : null;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={ariaLabel} onMouseLeave={() => setActive(null)}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="#e2e3ec" strokeWidth={1} />
            <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-[#5e5d74] text-[11px] tabular-nums">
              {compact(Math.round(t))}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = PAD.left + i * slot + (slot - barW) / 2;
          const h = Math.max(0, PAD.top + innerH - y(d.value));
          return (
            <g key={d.label}>
              {h > 0 && <path d={barPath(x, y(d.value), barW, h)} fill={BAR} opacity={active == null || active === i ? 1 : 0.45} />}
              {i % labelEvery === 0 && (
                <text x={x + barW / 2} y={H - 8} textAnchor="middle" className="fill-[#5e5d74] text-[11px]">
                  {d.label}
                </text>
              )}
              {/* Hit target: the whole slot, wider and taller than the bar. */}
              <rect
                x={PAD.left + i * slot}
                y={PAD.top}
                width={slot}
                height={innerH}
                fill="transparent"
                tabIndex={0}
                role="button"
                aria-label={`${d.label}: ${d.value.toLocaleString()} ${valueName}${d.detail ? `, ${d.detail}` : ""}`}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                className="cursor-default outline-none focus-visible:stroke-[#1576a6] focus-visible:stroke-2"
              />
            </g>
          );
        })}
      </svg>

      {current && active != null && (
        <div
          role="status"
          className="pointer-events-none absolute top-1 z-10 -translate-x-1/2 rounded-xl bg-white px-3 py-2 text-xs shadow-[0_8px_30px_-10px_rgb(18_10_51/0.35)] ring-1 ring-line"
          style={{ left: `${((PAD.left + active * slot + slot / 2) / W) * 100}%` }}
        >
          <p className="font-display text-xl font-black leading-none tabular-nums text-ink">{current.value.toLocaleString()}</p>
          <p className="mt-0.5 text-muted">
            {valueName}, {current.label}
          </p>
          {current.detail && <p className="text-muted">{current.detail}</p>}
        </div>
      )}

      <details className="mt-2 text-xs text-muted">
        <summary className="cursor-pointer font-semibold hover:text-ink">Show as a table</summary>
        <table className="mt-2 w-full max-w-md text-left" aria-describedby={id}>
          <caption id={id} className="sr-only">
            {ariaLabel}
          </caption>
          <thead>
            <tr>
              <th scope="col" className="py-1 font-semibold">
                When
              </th>
              <th scope="col" className="py-1 text-right font-semibold">
                {valueName}
              </th>
              {data.some((d) => d.detail) && (
                <th scope="col" className="py-1 text-right font-semibold">
                  Detail
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.label} className="border-t border-line">
                <td className="py-1">{d.label}</td>
                <td className="py-1 text-right tabular-nums text-ink">{d.value.toLocaleString()}</td>
                {data.some((x) => x.detail) && <td className="py-1 text-right">{d.detail}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
