import { checkPin, makePinRecord, validPin, type Profile } from "../domain/auth";
import type { AppContext } from "./context";
import { h } from "./dom";

export async function saveProfile(ctx: AppContext, profile: Profile): Promise<void> {
  await ctx.storage.setMeta("profile", profile);
  ctx.state.profile = profile;
}

function pinInput(label: string): HTMLInputElement {
  return h("input", {
    class: "text-input",
    type: "password",
    inputmode: "numeric",
    autocomplete: "off",
    maxLength: 8,
    placeholder: label,
    "aria-label": label,
  });
}

export function renderLogin(ctx: AppContext): HTMLElement {
  const profile = ctx.state.profile;
  const hasPin = !!profile.pin;
  const msg = h("p", { class: "form-msg", role: "status" });
  const say = (text: string) => {
    msg.textContent = text;
  };

  const nameInput = h("input", {
    class: "text-input",
    type: "text",
    autocomplete: "off",
    maxLength: 30,
    value: profile.name,
    "aria-label": "Name",
    placeholder: "Name",
  });

  const current = pinInput("Aktuelle PIN");
  const next = pinInput(hasPin ? "Neue PIN (4 bis 8 Ziffern)" : "PIN (4 bis 8 Ziffern)");
  const repeat = pinInput("PIN wiederholen");

  const apply = async () => {
    if (!validPin(next.value)) return say("Die PIN braucht 4 bis 8 Ziffern.");
    if (next.value !== repeat.value) return say("Die beiden PINs stimmen nicht überein.");
    if (profile.pin && !(await checkPin(current.value, profile.pin).catch(() => false))) return say("Aktuelle PIN ist falsch.");
    try {
      await saveProfile(ctx, { ...ctx.state.profile, pin: await makePinRecord(next.value) });
    } catch (e) {
      return say(e instanceof Error ? e.message : "Speichern fehlgeschlagen.");
    }
    ctx.toast(hasPin ? "PIN geändert." : "PIN-Sperre aktiviert.");
    ctx.navigate("login");
  };

  const remove = async () => {
    if (profile.pin && !(await checkPin(current.value, profile.pin).catch(() => false))) return say("Aktuelle PIN ist falsch.");
    await saveProfile(ctx, { name: ctx.state.profile.name });
    ctx.toast("PIN-Sperre entfernt.");
    ctx.navigate("login");
  };

  return h(
    "section",
    { class: "view" },
    h("h1", {}, "Login"),
    h("p", { class: "muted" }, "Dein Profil liegt nur auf diesem Gerät. Es gibt kein Konto und keine Übertragung an Dritte."),
    h(
      "div",
      { class: "card" },
      h("h3", {}, "Profil"),
      nameInput,
      h(
        "button",
        {
          type: "button",
          class: "primary",
          onclick: async () => {
            await saveProfile(ctx, { ...ctx.state.profile, name: nameInput.value.trim() });
            ctx.toast("Name gespeichert.");
          },
        },
        "Speichern",
      ),
    ),
    h(
      "div",
      { class: "card" },
      h("h3", {}, "PIN-Sperre"),
      h("p", { class: "muted" }, hasPin ? "Aktiv: Die App fragt beim Öffnen nach der PIN." : "Aus: Die App öffnet ohne Abfrage."),
      hasPin ? current : null,
      next,
      repeat,
      h("button", { type: "button", class: "primary", onclick: apply }, hasPin ? "PIN ändern" : "PIN aktivieren"),
      hasPin ? h("button", { type: "button", class: "secondary", onclick: remove }, "Sperre entfernen") : null,
      msg,
      h("p", { class: "muted small" }, "Die Sperre hält neugierige Blicke fern. Die gespeicherten Daten selbst werden nicht verschlüsselt."),
    ),
  );
}
