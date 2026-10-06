import "./styles.css";
import { registerSW } from "virtual:pwa-register";
import { createIdbStorage } from "./db/idb";
import type { Prefs } from "./db/storage";
import { buildIndex } from "./domain/exercise-index";
import type { Draft } from "./domain/draft";
import { debounce, clear, h } from "./ui/dom";
import type { AppContext, AppState, Tab } from "./ui/context";
import { renderData } from "./ui/data";
import { renderHistory } from "./ui/history";
import { renderHome } from "./ui/home";
import { renderSession } from "./ui/session";

const DEFAULT_PREFS: Prefs = { location: "gym_full", focus: "full", budgetMin: 60 };
const TABS: { id: Tab; label: string }[] = [
  { id: "training", label: "Training" },
  { id: "history", label: "Verlauf" },
  { id: "data", label: "Daten" },
];

async function start() {
  const root = document.getElementById("app")!;
  const storage = await createIdbStorage();
  void navigator.storage?.persist?.();

  const state: AppState = {
    sessions: await storage.getSessions(),
    index: await storage.getIndex(),
    prefs: { ...DEFAULT_PREFS, ...(await storage.getMeta<Prefs>("prefs")) },
    draft: (await storage.getMeta<Draft>("draft")) ?? null,
  };

  let tab: Tab = "training";
  let openId: string | undefined;
  const view = h("main", { id: "view" });
  const toastEl = h("div", { class: "toast", role: "status", "aria-live": "polite" });
  let toastTimer: ReturnType<typeof setTimeout> | undefined;

  const persistDraft = debounce(() => {
    void storage.setMeta("draft", state.draft);
  }, 250);

  const ctx: AppContext = {
    storage,
    state,
    saveDraft: persistDraft,
    navigate(next, openSessionId) {
      tab = next;
      openId = openSessionId;
      render();
    },
    toast(message) {
      toastEl.textContent = message;
      toastEl.classList.add("show");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toastEl.classList.remove("show"), 3500);
    },
    async reloadSessions() {
      state.sessions = await storage.getSessions();
      state.index = buildIndex(state.sessions);
      await storage.setIndex(state.index);
    },
  };

  const nav = h(
    "nav",
    { class: "tabs" },
    ...TABS.map((t) => h("button", { type: "button", "data-tab": t.id, onclick: () => ctx.navigate(t.id) }, t.label)),
  );

  const homeBtn = h("button", {
    type: "button",
    class: "home-btn",
    "aria-label": "Startseite",
    onclick: () => ctx.navigate("training"),
    innerHTML:
      '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v10h13V10"/><path d="M10 20v-6h4v6"/></svg>',
  });

  function render() {
    clear(view);
    nav.querySelectorAll("button").forEach((b) => b.setAttribute("aria-current", String(b.dataset.tab === tab)));
    if (tab === "training") view.append(state.draft ? renderSession(ctx, state.draft) : renderHome(ctx));
    else if (tab === "history") view.append(renderHistory(ctx, openId));
    else view.append(renderData(ctx));
    window.scrollTo(0, 0);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") persistDraft.flush();
  });

  window.addEventListener("pagehide", () => persistDraft.flush());

  root.append(homeBtn, view, toastEl, nav);
  render();
  registerSW({ immediate: true });
}

start().catch((e) => {
  document.getElementById("app")!.textContent = `Start fehlgeschlagen: ${e instanceof Error ? e.message : e}`;
});
