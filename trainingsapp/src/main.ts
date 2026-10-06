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
import { renderStrength } from "./ui/strength";
import { renderLogin } from "./ui/login";
import { showLock } from "./ui/lock";
import type { Profile } from "./domain/auth";

const DEFAULT_PREFS: Prefs = { location: "gym_full", focus: "full", budgetMin: 60 };
const TABS: { id: Tab; label: string }[] = [
  { id: "training", label: "Training" },
  { id: "history", label: "Verlauf" },
  { id: "stats", label: "Statistik" },
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
    profile: (await storage.getMeta<Profile>("profile")) ?? { name: "" },
  };
  if (state.profile.pin) await showLock(root, state.profile.pin, state.profile.name);

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
    { class: "tabs", "aria-label": "Hauptnavigation" },
    ...TABS.map((t) => h("button", { type: "button", "data-tab": t.id, onclick: () => ctx.navigate(t.id) }, t.label)),
  );

  const homeBtn = h("button", {
    type: "button",
    class: "bar-btn",
    "aria-label": "Startseite",
    onclick: () => ctx.navigate("training"),
    innerHTML:
      '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v10h13V10"/><path d="M10 20v-6h4v6"/></svg>',
  });

  const menu = h(
    "div",
    { class: "menu", id: "main-menu", hidden: true },
    h("button", { type: "button", onclick: () => ctx.navigate("data") }, "Daten"),
    h("button", { type: "button", onclick: () => ctx.navigate("login") }, "Login"),
  );
  const menuBtn = h("button", {
    type: "button",
    class: "bar-btn",
    "aria-label": "Menü",
    "aria-expanded": "false",
    "aria-controls": "main-menu",
    onclick: (e: Event) => {
      e.stopPropagation();
      setMenu(!menuOpen);
    },
    innerHTML:
      '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 6.5h16M4 12h16M4 17.5h16"/></svg>',
  });
  let menuOpen = false;
  function setMenu(open: boolean) {
    menuOpen = open;
    menu.hidden = !open;
    menuBtn.setAttribute("aria-expanded", String(open));
  }
  document.addEventListener("click", (e) => {
    if (menuOpen && !menu.contains(e.target as Node)) setMenu(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setMenu(false);
  });

  const topbar = h("header", { class: "topbar" }, menuBtn, nav, homeBtn, menu);

  function render() {
    clear(view);
    setMenu(false);
    nav.querySelectorAll("button").forEach((b) => b.setAttribute("aria-current", String(b.dataset.tab === tab)));
    if (tab === "training") view.append(state.draft ? renderSession(ctx, state.draft) : renderHome(ctx));
    else if (tab === "history") view.append(renderHistory(ctx, openId));
    else if (tab === "stats") view.append(renderStrength(ctx));
    else if (tab === "login") view.append(renderLogin(ctx));
    else view.append(renderData(ctx));
    window.scrollTo(0, 0);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") persistDraft.flush();
  });

  window.addEventListener("pagehide", () => persistDraft.flush());

  root.append(topbar, view, toastEl);
  render();
  registerSW({ immediate: true });
}

start().catch((e) => {
  document.getElementById("app")!.textContent = `Start fehlgeschlagen: ${e instanceof Error ? e.message : e}`;
});
