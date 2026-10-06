import { checkPin, type PinRecord } from "../domain/auth";
import { h } from "./dom";

const MAX_TRIES = 5;
const WAIT_SEC = 30;

/** Full-screen PIN prompt. Resolves once the right PIN is entered. */
export function showLock(root: HTMLElement, record: PinRecord, name: string): Promise<void> {
  return new Promise((resolve) => {
    let tries = 0;
    let blockedUntil = 0;
    const msg = h("p", { class: "lock-msg", role: "alert" });
    const input = h("input", {
      class: "num lock-input",
      type: "password",
      inputmode: "numeric",
      autocomplete: "off",
      maxLength: 8,
      "aria-label": "PIN",
      placeholder: "PIN",
    });

    const submit = async () => {
      const wait = Math.ceil((blockedUntil - Date.now()) / 1000);
      if (wait > 0) {
        msg.textContent = `Zu viele Versuche. Bitte ${wait} s warten.`;
        return;
      }
      if (await checkPin(input.value, record).catch(() => false)) {
        screen.remove();
        resolve();
        return;
      }
      input.value = "";
      tries++;
      if (tries >= MAX_TRIES) {
        tries = 0;
        blockedUntil = Date.now() + WAIT_SEC * 1000;
        msg.textContent = `Zu viele Versuche. Bitte ${WAIT_SEC} s warten.`;
      } else {
        msg.textContent = "PIN falsch.";
      }
      input.focus();
    };
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") void submit();
    });

    const screen = h(
      "div",
      { class: "lock" },
      h("h1", {}, name ? `Hallo ${name}` : "Trainings-App"),
      h("p", { class: "muted" }, "PIN eingeben, um zu entsperren."),
      input,
      msg,
      h("button", { type: "button", class: "primary big", onclick: () => void submit() }, "Entsperren"),
      h("p", { class: "muted small" }, "PIN vergessen? Die Sperre lässt sich nur zurücksetzen, indem die Website-Daten im Browser gelöscht werden. Dabei gehen die Einheiten verloren, sofern kein Backup existiert."),
    );
    root.append(screen);
    input.focus();
  });
}
