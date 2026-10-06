import { UNIT_LABEL, exerciseDef } from "../domain/exercises";
import { fmtDate, fmtNum, fmtShortDate, localDate } from "../domain/format";
import { FOCI, focusLabel, locationLabel } from "../domain/locations";
import {
  countByFocus,
  countSets,
  exerciseSeries,
  exercisesWithHistory,
  isoWeek,
  recentSessions,
  sessionsInWeek,
  sessionsPerWeek,
  supportsE1RM,
  totals,
  type Metric,
} from "../domain/stats";
import type { Exercise, FocusId, Session } from "../domain/types";
import { lineChart } from "./chart";
import type { AppContext } from "./context";
import { append, clear, h } from "./dom";

type Filter =
  | { kind: "week"; start: string }
  | { kind: "recent" }
  | { kind: "focus"; focus: FocusId }
  | null;

/** Remembered while the app is open, so the tab keeps its place when you come back to it. */
const view: { sub: "stats" | "list"; filter: Filter; exercise?: string; metric: Metric; week?: number } = {
  sub: "stats",
  filter: null,
  metric: "weight",
};

const sortNewest = (sessions: Session[]) =>
  [...sessions].sort((a, b) => b.date.localeCompare(a.date) || b.startedAt.localeCompare(a.startedAt));

function setsText(ex: Exercise): string {
  const def = exerciseDef(ex.name);
  const weighted = !def || def.weighted;
  const unit = def && def.unit !== "reps" ? ` ${UNIT_LABEL[def.unit]}` : "";
  return ex.sets
    .map((s) => (weighted ? `${fmtNum(s.weightKg)} kg × ${fmtNum(s.reps)}${unit}` : `${fmtNum(s.reps)}${unit || " Wdh."}`))
    .join(" · ");
}

function sessionEl(ctx: AppContext, s: Session, open: boolean, redraw: () => void): HTMLElement {
  return h(
    "details",
    { class: "card session", open, id: `session-${s.id}` },
    h(
      "summary",
      {},
      h("span", { class: "s-date" }, fmtDate(s.date)),
      h("span", { class: "s-meta" }, `${focusLabel(s.focus)} · ${locationLabel(s.location)} · ${s.durationMin} min · ${countSets(s)} Sätze`),
    ),
    ...s.blocks.map((b) =>
      h(
        "div",
        { class: "hist-block" },
        h("h4", {}, b.name),
        ...b.exercises.map((e) => h("p", {}, h("strong", {}, e.name), h("br"), setsText(e))),
      ),
    ),
    h(
      "button",
      {
        type: "button",
        class: "link danger",
        onclick: async () => {
          if (!confirm(`Einheit vom ${fmtDate(s.date)} löschen?`)) return;
          await ctx.storage.deleteSession(s.id);
          await ctx.reloadSessions();
          redraw();
        },
      },
      "Einheit löschen",
    ),
  );
}

function filterLabel(f: NonNullable<Filter>): string {
  if (f.kind === "week") return `KW ${isoWeek(f.start)} (ab ${fmtShortDate(f.start)})`;
  if (f.kind === "recent") return "Letzte 4 Wochen";
  return focusLabel(f.focus);
}

function applyFilter(sessions: Session[], f: Filter, today: string): Session[] {
  if (!f) return sessions;
  if (f.kind === "week") return sessionsInWeek(sessions, f.start);
  if (f.kind === "recent") return recentSessions(sessions, today);
  return sessions.filter((s) => s.focus === f.focus);
}

function listView(ctx: AppContext, today: string, openId: string | undefined, redraw: () => void): HTMLElement {
  const all = sortNewest(ctx.state.sessions);
  const shown = applyFilter(all, view.filter, today);
  const wrap = h("div", {});
  if (view.filter) {
    wrap.append(
      h(
        "div",
        { class: "filter-bar" },
        h("span", {}, `Filter: ${filterLabel(view.filter)} · ${shown.length} Einheiten`),
        h("button", { type: "button", class: "secondary", onclick: () => { view.filter = null; redraw(); } }, "Alle anzeigen"),
      ),
    );
  }
  if (all.length === 0) {
    wrap.append(h("div", { class: "card hint" }, "Noch keine gespeicherten Einheiten. Unter «Training» einen Plan erstellen und nach dem Training speichern."));
  } else if (shown.length === 0) {
    wrap.append(h("p", { class: "muted" }, "Keine Einheiten für diesen Filter."));
  } else {
    shown.forEach((s) => wrap.append(sessionEl(ctx, s, s.id === openId, redraw)));
  }
  return wrap;
}

function tile(label: string, value: string, onClick?: () => void): HTMLElement {
  const inner = [h("span", { class: "tile-value" }, value), h("span", { class: "tile-label" }, label)];
  return onClick
    ? h("button", { type: "button", class: "tile", onclick: onClick }, ...inner)
    : h("div", { class: "tile" }, ...inner);
}

function fmtHours(min: number): string {
  return min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, "0")}`;
}

function weeksChart(ctx: AppContext, today: string, goList: (f: Filter, openId?: string) => void): HTMLElement {
  const weeks = sessionsPerWeek(ctx.state.sessions, today, 12);
  if (view.week === undefined || view.week >= weeks.length) view.week = weeks.length - 1;
  const host = h("div", {});
  const draw = () => {
    clear(host);
    const sel = weeks[view.week!];
    host.append(
      lineChart({
        points: weeks.map((w) => ({ label: `KW ${isoWeek(w.start)}`, value: w.count })),
        describe: (p) => `${p.label}: ${p.value} Einheiten`,
        formatY: (v) => String(v),
        zeroBased: true,
        integerTicks: true,
        selected: view.week,
        onSelect: (i) => {
          view.week = i;
          draw();
        },
      }),
      h(
        "div",
        { class: "readout" },
        h("span", {}, h("strong", {}, `KW ${isoWeek(sel.start)}`), ` · ab ${fmtShortDate(sel.start)} · ${sel.count} ${sel.count === 1 ? "Einheit" : "Einheiten"}`),
        sel.count > 0
          ? h("button", { type: "button", class: "secondary", onclick: () => goList({ kind: "week", start: sel.start }) }, "Ansehen")
          : null,
      ),
    );
  };
  draw();
  return host;
}

function exerciseChart(ctx: AppContext, goList: (f: Filter, openId?: string) => void): HTMLElement {
  const names = exercisesWithHistory(ctx.state.sessions);
  const host = h("div", {});
  if (names.length === 0) {
    host.append(h("p", { class: "muted" }, "Sobald du Einheiten gespeichert hast, erscheint hier der Verlauf pro Übung."));
    return host;
  }
  if (!view.exercise || !names.includes(view.exercise)) view.exercise = names[0];

  const select = h(
    "select",
    {
      class: "select",
      "aria-label": "Übung wählen",
      onchange: () => {
        view.exercise = select.value;
        draw();
      },
    },
    ...names.map((n) => h("option", { value: n, selected: n === view.exercise }, n)),
  );
  const body = h("div", {});
  let selected: number | undefined;

  const draw = () => {
    clear(body);
    const name = view.exercise!;
    const def = exerciseDef(name);
    const canE1RM = supportsE1RM(name);
    if (!canE1RM) view.metric = "weight";
    const metric = view.metric;
    const loaded = !def || def.weighted;
    const unit = loaded ? "kg" : UNIT_LABEL[def?.unit ?? "reps"];
    const series = exerciseSeries(ctx.state.sessions, name, metric);
    if (selected === undefined || selected >= series.length) selected = series.length - 1;
    const fmt = (v: number) => `${fmtNum(Math.round(v * 10) / 10)} ${unit}`;

    if (canE1RM && loaded) {
      body.append(
        h(
          "div",
          { class: "chips small" },
          ...(["weight", "e1rm"] as Metric[]).map((m) =>
            h(
              "button",
              { type: "button", class: "chip", "aria-pressed": String(metric === m), onclick: () => { view.metric = m; draw(); } },
              m === "weight" ? "Schwerster Satz" : "Geschätztes 1RM",
            ),
          ),
        ),
      );
    }
    const point = series[selected];
    append(body, [
      lineChart({
        points: series.map((p) => ({ label: fmtShortDate(p.date), value: p.value })),
        describe: (p) => `${p.label}: ${fmt(p.value)}`,
        formatY: (v) => fmtNum(Math.round(v * 10) / 10),
        selected,
        onSelect: (i) => {
          selected = i;
          draw();
        },
      }),
      h(
        "div",
        { class: "readout" },
        h("span", {}, h("strong", {}, fmtDate(point.date, false)), ` · ${fmt(point.value)}`),
        h("button", { type: "button", class: "secondary", onclick: () => goList(null, point.sessionId) }, "Einheit ansehen"),
      ),
      metric === "e1rm" ? h("p", { class: "muted small" }, "Nach Epley: kg × (1 + Wdh. / 30)") : null,
    ]);
  };
  draw();
  host.append(select, body);
  return host;
}

function statsView(ctx: AppContext, today: string, goList: (f: Filter, openId?: string) => void): HTMLElement {
  const sessions = ctx.state.sessions;
  if (sessions.length === 0) {
    return h("div", { class: "card hint" }, "Noch keine Statistik. Nach der ersten gespeicherten Einheit siehst du hier deine Trainings, die Wochenkurve und den Verlauf pro Übung.");
  }
  const t = totals(sessions, today);
  const byFocus = countByFocus(sessions);
  const maxFocus = Math.max(...byFocus.map((f) => f.count));

  return h(
    "div",
    {},
    h(
      "div",
      { class: "tiles" },
      tile("Einheiten gesamt", String(t.sessions), () => goList(null)),
      tile("Letzte 4 Wochen", String(t.last28Days), () => goList({ kind: "recent" })),
      tile("Trainingszeit", fmtHours(t.minutes)),
      tile("Sätze gesamt", String(t.sets)),
    ),
    h("h2", {}, "Einheiten pro Woche"),
    h("p", { class: "muted small" }, "Letzte 12 Wochen. Punkt antippen für Details."),
    weeksChart(ctx, today, goList),
    h("h2", {}, "Was ich trainiert habe"),
    h(
      "div",
      { class: "focus-list" },
      ...byFocus.map(({ focus, count }) =>
        h(
          "button",
          { type: "button", class: "focus-row", onclick: () => goList({ kind: "focus", focus }) },
          h("span", { class: "focus-name" }, FOCI.find((f) => f.id === focus)?.label ?? focus),
          h("span", { class: "focus-bar" }, h("span", { style: `width:${(count / maxFocus) * 100}%` })),
          h("span", { class: "focus-count" }, String(count)),
        ),
      ),
    ),
    h("h2", {}, "Verlauf pro Übung"),
    exerciseChart(ctx, goList),
  );
}

export function renderHistory(ctx: AppContext, openId?: string): HTMLElement {
  const today = localDate(new Date());
  const root = h("section", { class: "view" });
  let pendingOpen = openId;
  if (openId) {
    view.sub = "list";
    view.filter = null;
  }

  const goList = (filter: Filter, openSessionId?: string) => {
    view.sub = "list";
    view.filter = filter;
    pendingOpen = openSessionId;
    draw();
    if (openSessionId) document.getElementById(`session-${openSessionId}`)?.scrollIntoView({ block: "center" });
  };

  const draw = () => {
    clear(root);
    const seg = (id: "stats" | "list", label: string) =>
      h("button", { type: "button", class: "chip", "aria-pressed": String(view.sub === id), onclick: () => { view.sub = id; if (id === "stats") view.filter = null; pendingOpen = undefined; draw(); } }, label);
    root.append(
      h("h1", {}, "Verlauf"),
      h("div", { class: "chips seg" }, seg("stats", "Statistik"), seg("list", "Einheiten")),
      view.sub === "stats" ? statsView(ctx, today, goList) : listView(ctx, today, pendingOpen, draw),
    );
  };
  draw();
  return root;
}
