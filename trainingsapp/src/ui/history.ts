import { UNIT_LABEL, exerciseDef } from "../domain/exercises";
import { fmtDate, fmtNum } from "../domain/format";
import { focusLabel, locationLabel } from "../domain/locations";
import type { Exercise, Session } from "../domain/types";
import type { AppContext } from "./context";
import { h } from "./dom";

function setsText(ex: Exercise): string {
  const def = exerciseDef(ex.name);
  const weighted = !def || def.weighted;
  const unit = def && def.unit !== "reps" ? ` ${UNIT_LABEL[def.unit]}` : "";
  return ex.sets
    .map((s) => (weighted ? `${fmtNum(s.weightKg)} kg × ${fmtNum(s.reps)}${unit}` : `${fmtNum(s.reps)}${unit || " Wdh."}`))
    .join(" · ");
}

function sessionEl(ctx: AppContext, s: Session, open: boolean): HTMLElement {
  const sets = s.blocks.reduce((n, b) => n + b.exercises.reduce((m, e) => m + e.sets.length, 0), 0);
  return h(
    "details",
    { class: "card session", open },
    h(
      "summary",
      {},
      h("span", { class: "s-date" }, fmtDate(s.date)),
      h("span", { class: "s-meta" }, `${focusLabel(s.focus)} · ${locationLabel(s.location)} · ${s.durationMin} min · ${sets} Sätze`),
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
          ctx.navigate("history");
        },
      },
      "Einheit löschen",
    ),
  );
}

export function renderHistory(ctx: AppContext, openId?: string): HTMLElement {
  const sessions = [...ctx.state.sessions].sort(
    (a, b) => b.date.localeCompare(a.date) || b.startedAt.localeCompare(a.startedAt),
  );
  return h(
    "section",
    { class: "view" },
    h("h1", {}, "Verlauf"),
    sessions.length === 0
      ? h("div", { class: "card hint" }, "Noch keine gespeicherten Einheiten. Unter «Training» einen Plan erstellen und nach dem Training speichern.")
      : h("div", {}, ...sessions.map((s) => sessionEl(ctx, s, s.id === openId))),
  );
}
