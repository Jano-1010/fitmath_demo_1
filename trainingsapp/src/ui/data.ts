import { makeBackup, parseBackup } from "../db/backup";
import { localDate } from "../domain/format";
import type { AppContext } from "./context";
import { h } from "./dom";

export function renderData(ctx: AppContext): HTMLElement {
  const exportJson = () => {
    const backup = makeBackup(ctx.state.sessions, ctx.state.prefs, ctx.state.week);
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = h("a", { href: url, download: `trainingsapp-backup-${localDate(new Date())}.json` });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  };

  const fileInput = h("input", {
    type: "file",
    accept: "application/json,.json",
    hidden: true,
    onchange: async () => {
      const file = fileInput.files?.[0];
      fileInput.value = "";
      if (!file) return;
      try {
        const backup = parseBackup(await file.text());
        if (!confirm(`${backup.sessions.length} Einheiten importieren? Bestehende Einheiten mit gleicher ID werden überschrieben, alle anderen bleiben erhalten.`)) return;
        await ctx.storage.putSessions(backup.sessions);
        if (backup.week) {
          Object.assign(ctx.state.week, backup.week);
          await ctx.saveWeek();
        }
        await ctx.reloadSessions();
        ctx.toast(`${backup.sessions.length} Einheiten importiert.`);
        ctx.navigate("history");
      } catch (e) {
        ctx.toast(e instanceof Error ? e.message : "Import fehlgeschlagen.");
      }
    },
  });

  return h(
    "section",
    { class: "view" },
    h("h1", {}, "Daten"),
    h("p", { class: "muted" }, `${ctx.state.sessions.length} Einheiten gespeichert, nur auf diesem Gerät.`),
    h(
      "div",
      { class: "card" },
      h("h3", {}, "Backup"),
      h("p", { class: "muted" }, "Alle Einheiten als JSON-Datei sichern oder von einer Datei wiederherstellen. Regelmässig exportieren, falls das Handy verloren geht oder der Browser Daten löscht."),
      h("button", { type: "button", class: "primary", onclick: exportJson }, "Exportieren"),
      h("button", { type: "button", class: "secondary", onclick: () => fileInput.click() }, "Importieren"),
      fileInput,
    ),
  );
}
