/**
 * A photo's focal point: where it stays anchored when a card or banner crops
 * it. Stored on the article as "x,y" percentages (see the focal-point picker in
 * the editor); blank means the default, a little above centre.
 */

export interface FocusPoint {
  x: number;
  y: number;
}

export function parseFocus(value?: string | null): FocusPoint | null {
  const m = value?.match(/^\s*(\d{1,3}(?:\.\d+)?)\s*,\s*(\d{1,3}(?:\.\d+)?)\s*$/);
  if (!m) return null;
  const clamp = (n: number) => Math.min(100, Math.max(0, Math.round(n)));
  return { x: clamp(Number(m[1])), y: clamp(Number(m[2])) };
}

export function formatFocus(point: FocusPoint): string {
  return `${Math.round(point.x)},${Math.round(point.y)}`;
}

/** CSS object-position for an image, or undefined to keep the component's default. */
export function objectPosition(value?: string | null): string | undefined {
  const p = parseFocus(value);
  return p ? `${p.x}% ${p.y}%` : undefined;
}
