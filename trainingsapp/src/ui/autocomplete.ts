import type { ExerciseDef } from "../domain/types";
import { clear, h } from "./dom";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Pick-only exercise search: free text is never accepted, only entries from the fixed list. */
export function exercisePicker(items: ExerciseDef[], onPick: (def: ExerciseDef) => void): HTMLElement {
  const list = h("div", { class: "picker-list", role: "listbox" });
  const input = h("input", {
    type: "search",
    class: "picker-input",
    placeholder: "Übung suchen …",
    autocomplete: "off",
    "aria-label": "Übung suchen",
    oninput: () => render(),
  });

  function render() {
    clear(list);
    const q = norm(input.value.trim());
    if (!q) return;
    const hits = items.filter((d) => norm(d.name).includes(q)).slice(0, 8);
    if (hits.length === 0) {
      list.append(h("p", { class: "muted" }, "Keine passende Übung am gewählten Ort."));
      return;
    }
    for (const d of hits) {
      list.append(
        h("button", { type: "button", class: "picker-item", role: "option", onclick: () => onPick(d) }, d.name),
      );
    }
  }

  return h("div", { class: "picker" }, input, list);
}
