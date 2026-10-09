import { createDraft } from "../domain/draft";
import { fmtShortDate, localDate } from "../domain/format";
import { BUDGETS, FOCI, LOCATIONS, focusLabel, locationLabel } from "../domain/locations";
import { generatePlan } from "../domain/plan";
import {
  MAX_WEEK_SESSIONS,
  MIN_WEEK_SESSIONS,
  addDays,
  conflicts,
  dayInfo,
  focusLookup,
  isTraining,
  suggestWeek,
  weekDates,
  weekStart,
  weekSummary,
  type DayFocus,
} from "../domain/week";
import { isoWeek } from "../domain/stats";
import type { AppContext } from "./context";
import { clear, h } from "./dom";

const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const dayLabel = (f: DayFocus) => (f === "rest" ? "Ruhetag" : focusLabel(f));

/** Remembered while the app is open. */
const view: { start?: string; selected?: string } = {};

function chips<T extends string | number>(
  legend: string,
  options: { id: T; label: string }[],
  selected: T,
  onSelect: (id: T) => void,
): HTMLElement {
  const buttons = options.map((o) =>
    h(
      "button",
      {
        type: "button",
        class: "chip",
        "aria-pressed": String(o.id === selected),
        onclick: () => {
          onSelect(o.id);
          buttons.forEach((b, i) => b.setAttribute("aria-pressed", String(options[i].id === o.id)));
        },
      },
      o.label,
    ),
  );
  return h("fieldset", { class: "group" }, h("legend", {}, legend), h("div", { class: "chips" }, ...buttons));
}

export function renderWeek(ctx: AppContext): HTMLElement {
  const { state } = ctx;
  const today = localDate(new Date());
  view.start ??= weekStart(today);
  view.selected ??= today;
  const root = h("section", { class: "view" });

  const sessionsPerWeek = () => state.prefs.sessionsPerWeek;
  const focusOf = () => focusLookup(state.sessions, state.week);

  const savePrefs = () => ctx.storage.setMeta("prefs", state.prefs);

  async function setEntry(date: string, focus: DayFocus | null, done = false) {
    if (focus === null) delete state.week[date];
    else state.week[date] = { focus, done };
    await ctx.saveWeek();
    draw();
  }

  async function planWeek() {
    const from = view.start! < today && today < addDays(view.start!, 7) ? today : view.start!;
    const result = suggestWeek(from, focusOf(), sessionsPerWeek());
    let n = 0;
    for (const [date, focus] of Object.entries(result)) {
      state.week[date] = { focus, done: false };
      n++;
    }
    await ctx.saveWeek();
    ctx.toast(n === 0 ? "Alle Tage sind schon belegt." : "Woche geplant. Tage antippen zum Ändern.");
    draw();
  }

  function start(date: string, focus: DayFocus) {
    if (!isTraining(focus)) return;
    const plan = generatePlan(state.prefs.location, focus, state.prefs.budgetMin);
    void savePrefs();
    if (plan.blocks.length === 0) {
      ctx.toast("Für diese Auswahl gibt es keinen passenden Plan. Anderen Ort oder mehr Zeit wählen.");
      return;
    }
    state.draft = createDraft(plan, state.index, new Date(`${date}T12:00:00`));
    ctx.saveDraft();
    ctx.navigate("training");
  }

  function dayPanel(date: string): HTMLElement {
    const info = dayInfo(date, state.sessions, state.week);
    const logged = state.sessions.some((s) => s.date === date);
    const suggestion = suggestWeek(date, focusOf(), sessionsPerWeek())[date];
    const past = date < today;
    const panel = h("div", { class: "card day-panel" });

    if (logged) {
      panel.append(
        h("p", {}, `Erledigt: ${dayLabel(info.focus!)}`),
        h("button", { type: "button", class: "secondary", onclick: () => ctx.navigate("history") }, "Im Verlauf ansehen"),
      );
      return panel;
    }

    const options = [...FOCI.map((f) => ({ id: f.id as DayFocus, label: f.label })), { id: "rest" as DayFocus, label: "Ruhetag" }];
    panel.append(
      chips(past ? "Was hast du trainiert?" : "Training", options, info.focus ?? ("" as DayFocus), (f) => {
        void setEntry(date, f, past && f !== "rest");
      }),
    );

    if (info.focus === undefined && suggestion && suggestion !== "rest") {
      panel.append(
        h("p", { class: "muted" }, `Vorschlag: ${dayLabel(suggestion)}`),
        h("button", { type: "button", class: "secondary", onclick: () => void setEntry(date, suggestion) }, "Vorschlag übernehmen"),
      );
    } else if (info.focus === undefined && suggestion === "rest") {
      panel.append(h("p", { class: "muted" }, "Vorschlag: Ruhetag, damit du dich erholst."));
    }

    if (isTraining(info.focus)) {
      const reasons = conflicts(date, info.focus, focusOf());
      if (reasons.length > 0) {
        panel.append(
          h("p", { class: "warn" }, `Übertrainings-Risiko: ${reasons.join("; ")}.`),
        );
        if (suggestion && suggestion !== info.focus) {
          panel.append(h("button", { type: "button", class: "secondary", onclick: () => void setEntry(date, suggestion) }, `Besser: ${dayLabel(suggestion)}`));
        }
      }
      if (date === today) {
        panel.append(
          chips(
            "Ort",
            LOCATIONS.map((l) => ({ id: l.id, label: l.label })),
            state.prefs.location,
            (id) => (state.prefs.location = id),
          ),
          chips(
            "Zeit",
            BUDGETS.map((b) => ({ id: b as number, label: `${b} min` })),
            state.prefs.budgetMin,
            (id) => (state.prefs.budgetMin = id),
          ),
          h(
            "button",
            { type: "button", class: "primary big", onclick: () => start(date, info.focus!) },
            `${dayLabel(info.focus)} starten`,
          ),
        );
      }
      if (date <= today) {
        panel.append(
          h(
            "button",
            { type: "button", class: "secondary wide", onclick: () => void setEntry(date, info.focus!, !info.done) },
            info.done ? "Doch nicht gemacht" : "Ohne Details als gemacht markieren",
          ),
        );
      }
    }
    if (info.focus !== undefined) {
      panel.append(h("button", { type: "button", class: "link", onclick: () => void setEntry(date, null) }, "Tag leeren"));
    }
    return panel;
  }

  function draw() {
    clear(root);
    const start = view.start!;
    const dates = weekDates(start);
    const lookup = focusOf();
    const suggestions = suggestWeek(start < today && today < addDays(start, 7) ? today : start, lookup, sessionsPerWeek());
    const summary = weekSummary(start, lookup, (d) => dayInfo(d, state.sessions, state.week).done);
    const target = sessionsPerWeek();

    const firstRun = state.sessions.length === 0 && Object.keys(state.week).length === 0;
    root.append(
      h("h1", {}, state.profile.name ? `Hallo ${state.profile.name}` : "Wochenplan"),
      h(
        "div",
        { class: "week-nav" },
        h("button", { type: "button", class: "bar-btn", "aria-label": "Vorherige Woche", onclick: () => { view.start = addDays(start, -7); draw(); } }, "‹"),
        h("div", { class: "week-title" }, h("strong", {}, `KW ${isoWeek(start)}`), h("span", { class: "muted" }, `${fmtShortDate(start)} – ${fmtShortDate(addDays(start, 6))}`)),
        h("button", { type: "button", class: "bar-btn", "aria-label": "Nächste Woche", onclick: () => { view.start = addDays(start, 7); draw(); } }, "›"),
      ),
    );
    if (firstRun) {
      root.append(
        h(
            "div",
            { class: "card hint" },
            h("strong", {}, "Los geht's: "),
            "Tippe einen Tag an und wähle, was du trainierst oder trainiert hast. Mit «Woche automatisch planen» verteilt die App die restlichen Tage so, dass jede Einheit auf die vorherige aufbaut und genug Erholung bleibt. Am Trainingstag erstellt die App aus dem Fokus die Einheit.",
        ),
      );
    }

    const list = h("div", { class: "week-list" });
    dates.forEach((date, i) => {
      const info = dayInfo(date, state.sessions, state.week);
      const sugg = info.focus === undefined && date >= today ? suggestions[date] : undefined;
      const warn = isTraining(info.focus) && !info.done && conflicts(date, info.focus, lookup).length > 0;
      const text = info.focus !== undefined ? dayLabel(info.focus) : sugg ? `Vorschlag: ${dayLabel(sugg)}` : "Frei";
      const selected = view.selected === date;
      const row = h(
        "button",
        {
          type: "button",
          class: `day${selected ? " selected" : ""}${date === today ? " today" : ""}${info.done ? " done" : ""}${info.focus === undefined ? " empty" : ""}`,
          "aria-pressed": String(selected),
          onclick: () => {
            view.selected = date;
            draw();
          },
        },
        h("span", { class: "day-name" }, h("strong", {}, WEEKDAYS[i]), h("span", { class: "muted small" }, fmtShortDate(date))),
        h("span", { class: "day-focus" }, text),
        h("span", { class: "day-mark", "aria-label": info.done ? "erledigt" : warn ? "Warnung" : "" }, info.done ? "✓" : warn ? "⚠" : ""),
      );
      list.append(row);
      if (selected) list.append(dayPanel(date));
    });
    root.append(list);

    root.append(
      h(
        "p",
        { class: "muted" },
        `${summary.done} von ${summary.sessions} geplanten Einheiten erledigt · Ziel ${target} pro Woche`,
      ),
      h("button", { type: "button", class: "primary big", onclick: () => void planWeek() }, "Woche automatisch planen"),
      chips(
        "Einheiten pro Woche",
        Array.from({ length: MAX_WEEK_SESSIONS - MIN_WEEK_SESSIONS + 1 }, (_, i) => ({
          id: MIN_WEEK_SESSIONS + i,
          label: String(MIN_WEEK_SESSIONS + i),
        })),
        target,
        (n) => {
          state.prefs.sessionsPerWeek = n;
          void savePrefs();
          draw();
        },
      ),
      h("p", { class: "muted small" }, `Ort: ${locationLabel(state.prefs.location)} · ${state.prefs.budgetMin} min (am Trainingstag änderbar)`),
    );
  }

  draw();
  return root;
}
