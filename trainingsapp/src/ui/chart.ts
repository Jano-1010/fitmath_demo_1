const NS = "http://www.w3.org/2000/svg";

function s<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number> = {},
  text?: string,
): SVGElementTagNameMap[K] {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  if (text !== undefined) el.textContent = text;
  return el;
}

export interface ChartPoint {
  /** Short label for the x axis. */
  label: string;
  value: number;
}

export interface LineChartOptions {
  points: ChartPoint[];
  /** Text read out for accessibility and used for the point's aria-label. */
  describe: (p: ChartPoint) => string;
  formatY: (v: number) => string;
  /** Force the y axis to start at 0 (counts). */
  zeroBased?: boolean;
  integerTicks?: boolean;
  selected?: number;
  onSelect: (index: number) => void;
}

const W = 320;
const H = 170;
const PAD = { l: 34, r: 12, t: 12, b: 24 };

function niceTicks(min: number, max: number, integer: boolean): number[] {
  if (max === min) {
    min -= 1;
    max += 1;
  }
  const span = max - min;
  const rough = span / 3;
  const pow = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((st) => st >= rough) ?? rough;
  const stepFinal = integer ? Math.max(1, Math.ceil(step)) : step;
  const ticks: number[] = [];
  for (let v = Math.floor(min / stepFinal) * stepFinal; v < max + stepFinal; v += stepFinal) {
    ticks.push(Math.round(v * 1000) / 1000);
    if (v >= max) break;
  }
  return ticks;
}

/** Single-series line chart. Every point is a tap target (44 px) that reports its index. */
export function lineChart(opts: LineChartOptions): SVGElement {
  const { points } = opts;
  const values = points.map((p) => p.value);
  const lo = opts.zeroBased ? 0 : Math.min(...values);
  const hi = Math.max(...values, opts.zeroBased ? 1 : -Infinity);
  const ticks = niceTicks(lo, hi, opts.integerTicks ?? false);
  const yMin = ticks[0];
  const yMax = ticks[ticks.length - 1];

  const x = (i: number) =>
    points.length === 1 ? (PAD.l + W - PAD.r) / 2 : PAD.l + (i * (W - PAD.l - PAD.r)) / (points.length - 1);
  const y = (v: number) => PAD.t + (1 - (v - yMin) / (yMax - yMin)) * (H - PAD.t - PAD.b);

  const svg = s("svg", { viewBox: `0 0 ${W} ${H}`, class: "chart", role: "group" });

  for (const t of ticks) {
    svg.append(
      s("line", { x1: PAD.l, x2: W - PAD.r, y1: y(t), y2: y(t), class: "chart-grid" }),
      s("text", { x: PAD.l - 6, y: y(t) + 4, class: "chart-label", "text-anchor": "end" }, opts.formatY(t)),
    );
  }

  const labelEvery = Math.max(1, Math.ceil(points.length / 5));
  points.forEach((p, i) => {
    if (i % labelEvery === 0 || i === points.length - 1) {
      if (i !== points.length - 1 && points.length - 1 - i < labelEvery) return;
      const anchor = i === points.length - 1 && points.length > 1 ? "end" : i === 0 && points.length > 1 ? "start" : "middle";
      svg.append(s("text", { x: x(i), y: H - 6, class: "chart-label", "text-anchor": anchor }, p.label));
    }
  });

  if (points.length > 1) {
    const d = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`).join(" ");
    svg.append(s("path", { d, class: "chart-line" }));
  }

  points.forEach((p, i) => {
    const g = s("g", {
      class: `chart-point${opts.selected === i ? " selected" : ""}`,
      tabindex: 0,
      role: "button",
      "aria-label": opts.describe(p),
    });
    g.append(
      s("circle", { cx: x(i), cy: y(p.value), r: opts.selected === i ? 7 : 5, class: "chart-dot" }),
      s("circle", { cx: x(i), cy: y(p.value), r: 22, class: "chart-hit" }),
    );
    g.addEventListener("click", () => opts.onSelect(i));
    g.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        opts.onSelect(i);
      }
    });
    svg.append(g);
  });
  return svg;
}
