import { fmtNum, fmtShortDate } from "../domain/format";
import { averageChange, strengthRows } from "../domain/strength";
import type { AppContext } from "./context";
import { h } from "./dom";

const kg = (v: number) => `${fmtNum(Math.round(v * 10) / 10)} kg`;
const pct = (v: number) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${fmtNum(Math.round(Math.abs(v) * 10) / 10)} %`;

export function renderStrength(ctx: AppContext): HTMLElement {
  const rows = strengthRows(ctx.state.sessions);
  const root = h("section", { class: "view" }, h("h1", {}, "Statistik"));

  if (rows.length === 0) {
    root.append(
      h("div", { class: "card hint" }, "Noch keine Kraftwerte. Sobald du Übungen mit Gewicht gespeichert hast, siehst du hier deine Maximalkraft pro Übung und den Vergleich zum Start."),
    );
    return root;
  }

  const top = rows.reduce((a, b) => (b.best > a.best ? b : a));
  const avg = averageChange(rows);

  root.append(
    h("p", { class: "muted small" }, "Kraftwert = geschätztes 1RM nach Epley (kg × (1 + Wdh. / 30)). Start = erste Einheit, Aktuell = letzte Einheit."),
    h(
      "div",
      { class: "tiles" },
      h("div", { class: "tile" }, h("span", { class: "tile-value" }, kg(top.best)), h("span", { class: "tile-label" }, `Maximalkraft · ${top.name}`)),
      h("div", { class: "tile" }, h("span", { class: "tile-value" }, avg === null ? "–" : pct(avg)), h("span", { class: "tile-label" }, "Ø seit Start")),
    ),
    h(
      "div",
      { class: "strength-list" },
      ...rows.map((r) =>
        h(
          "article",
          { class: "card strength-row" },
          h("h3", {}, r.name),
          h(
            "div",
            { class: "strength-main" },
            h("span", { class: "strength-now" }, kg(r.current)),
            r.changePct === null
              ? h("span", { class: "delta muted" }, "noch kein Vergleich")
              : h("span", { class: `delta ${r.changePct > 0 ? "up" : r.changePct < 0 ? "down" : ""}` }, pct(r.changePct)),
          ),
          h(
            "p",
            { class: "muted small" },
            `Start ${kg(r.start)} (${fmtShortDate(r.startDate)})`,
            r.best > r.current + 0.05 ? ` · Bestwert ${kg(r.best)}` : "",
          ),
        ),
      ),
    ),
  );
  return root;
}
