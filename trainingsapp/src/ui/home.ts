import { createDraft } from "../domain/draft";
import { BUDGETS, FOCI, LOCATIONS, focusLabel, locationLabel } from "../domain/locations";
import { generatePlan } from "../domain/plan";
import { fmtDate } from "../domain/format";
import type { AppContext } from "./context";
import { h } from "./dom";

function chipGroup<T extends string | number>(
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

export function renderHome(ctx: AppContext): HTMLElement {
  const { prefs, sessions } = ctx.state;

  const create = async () => {
    const plan = generatePlan(prefs.location, prefs.focus, prefs.budgetMin);
    await ctx.storage.setMeta("prefs", prefs);
    if (plan.blocks.length === 0) {
      ctx.toast("Für diese Auswahl gibt es keinen passenden Plan. Anderen Ort, Fokus oder mehr Zeit wählen.");
      return;
    }
    ctx.state.draft = createDraft(plan, ctx.state.index);
    ctx.saveDraft();
    ctx.navigate("training");
  };

  const last = [...sessions].sort((a, b) => b.date.localeCompare(a.date) || b.startedAt.localeCompare(a.startedAt))[0];

  return h(
    "section",
    { class: "view" },
    h("h1", {}, ctx.state.profile.name ? `Hallo ${ctx.state.profile.name}` : "Training"),
    sessions.length === 0
      ? h(
          "div",
          { class: "card hint" },
          h("strong", {}, "Los geht's: "),
          "Ort, Fokus und Zeit wählen und «Plan erstellen» tippen. Während des Trainings pro Satz Gewicht und Wiederholungen prüfen und mit ✓ abhaken. Mit «Einheit speichern» landet alles im Verlauf, und bei jeder Übung steht beim nächsten Mal das letzte Gewicht.",
        )
      : last
        ? h("p", { class: "muted" }, `Letzte Einheit: ${fmtDate(last.date)} · ${focusLabel(last.focus)} · ${locationLabel(last.location)}`)
        : null,
    chipGroup(
      "Ort",
      LOCATIONS.map((l) => ({ id: l.id, label: l.label })),
      prefs.location,
      (id) => (prefs.location = id),
    ),
    chipGroup("Fokus", FOCI, prefs.focus, (id) => (prefs.focus = id)),
    chipGroup(
      "Zeit",
      BUDGETS.map((b) => ({ id: b as number, label: `${b} min` })),
      prefs.budgetMin,
      (id) => (prefs.budgetMin = id),
    ),
    h("div", { class: "sticky-cta" }, h("button", { type: "button", class: "primary big", onclick: create }, "Plan erstellen")),
  );
}
