import { useEffect, useMemo, useState } from "react";
import { BookOpen, Home, ListTodo, MoreHorizontal, Timer } from "lucide-react";
import { Paywall } from "./Paywall.jsx";
import { Breathe } from "./screens/Breathe.jsx";
import { Focus } from "./screens/Focus.jsx";
import { Journal } from "./screens/Journal.jsx";
import { More } from "./screens/More.jsx";
import { Onboarding } from "./screens/Onboarding.jsx";
import { Tasks } from "./screens/Tasks.jsx";
import { Today } from "./screens/Today.jsx";
import { hasPremium, initPurchases, purchasePackage, purchasesConfigured, restorePurchases } from "./lib/purchases.js";
import { loadState, saveState, uid } from "./lib/storage.js";
import { themeById, themeVars } from "./lib/themes.js";
import { applyChrome, haptic } from "./native.js";
import { LumaContext } from "./ui.jsx";

const TABS = [
  { id: "today", label: "Today", icon: Home },
  { id: "tasks", label: "Tasks", icon: ListTodo },
  { id: "focus", label: "Focus", icon: Timer },
  { id: "journal", label: "Journal", icon: BookOpen },
  { id: "more", label: "More", icon: MoreHorizontal },
];

export function App() {
  const [state, setState] = useState(loadState);
  const [tab, setTab] = useState("today");
  const [paywall, setPaywall] = useState(false);
  const [breathId, setBreathId] = useState(null);
  const [offering, setOffering] = useState(null);
  const [storePremium, setStorePremium] = useState(false);
  const purchasesReady = purchasesConfigured();

  useEffect(() => {
    const handle = setTimeout(() => saveState(state), 250);
    return () => clearTimeout(handle);
  }, [state]);

  useEffect(() => {
    let alive = true;
    initPurchases((customerInfo) => {
      if (alive) setStorePremium(hasPremium(customerInfo));
    }).then((result) => {
      if (!alive || !result) return;
      setStorePremium(result.isPremium);
      setOffering(result.offering);
    }).catch(() => {
      if (alive) setStorePremium(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const run = state.activeFocus;
    if (!run || run.pausedRemainingMs != null) return undefined;
    const id = setInterval(() => {
      setState((current) => {
        const active = current.activeFocus;
        if (!active || active.pausedRemainingMs != null || active.endsAt > Date.now()) return current;
        haptic("medium");
        return {
          ...current,
          activeFocus: null,
          focusSessions: [{
            id: active.id,
            startedAt: active.startedAt,
            endedAt: Date.now(),
            durationMin: active.durationMin,
            taskId: active.taskId,
            distractions: active.distractions || [],
            completed: true,
            filed: false,
          }, ...current.focusSessions],
        };
      });
    }, 500);
    return () => clearInterval(id);
  }, [state.activeFocus]);

  const theme = themeById(state.profile.themeId);
  useEffect(() => {
    applyChrome(theme);
  }, [theme]);

  const isPremium = purchasesReady ? storePremium : Boolean(state.profile.premiumPreview);

  const api = useMemo(() => {
    const update = (fn) => setState((current) => fn(current));
    return {
      state,
      update,
      tone: state.profile.tone,
      isPremium,
      purchasesReady,
      offering,
      setTab,
      openPaywall: () => setPaywall(true),
      closePaywall: () => setPaywall(false),
      openBreathe: (id) => setBreathId(id),
      closeBreathe: () => setBreathId(null),
      breathId,
      startFocus: (durationMin, taskId = null) => {
        setState((current) => ({
          ...current,
          activeFocus: {
            id: uid(),
            startedAt: Date.now(),
            durationMin,
            endsAt: Date.now() + durationMin * 60 * 1000,
            pausedRemainingMs: null,
            taskId,
            distractions: [],
          },
        }));
        setTab("focus");
        setBreathId(null);
      },
      purchase: async (pkg) => {
        const result = await purchasePackage(pkg);
        const premium = hasPremium(result.customerInfo);
        if (premium) setStorePremium(true);
        return { ...result, isPremium: premium };
      },
      restore: async () => {
        if (!purchasesReady) return { isPremium: false, message: "Purchases aren't connected yet." };
        try {
          const customerInfo = await restorePurchases();
          const premium = hasPremium(customerInfo);
          setStorePremium(premium);
          return { isPremium: premium, message: premium ? "Restored." : "No active subscription found." };
        } catch (error) {
          return { isPremium: false, message: error?.message || "Restore didn't finish." };
        }
      },
    };
  }, [state, isPremium, purchasesReady, offering, breathId]);

  const Screen = {
    today: Today,
    tasks: Tasks,
    focus: Focus,
    journal: Journal,
    more: More,
  }[tab];

  return (
    <LumaContext.Provider value={api}>
      <div className="app" style={themeVars(theme)} data-dark={theme.dark ? "true" : "false"} data-reduce={state.profile.reducedMotion ? "true" : "false"}>
        {state.profile.onboarded ? (
          <div key={tab} className="screen">
            <Screen />
          </div>
        ) : (
          <div className="screen">
            <Onboarding />
          </div>
        )}
        {state.profile.onboarded && !breathId ? (
          <nav className="nav" aria-label="Primary">
            {TABS.map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.id} type="button" className={tab === item.id ? "on" : ""} onClick={() => setTab(item.id)} aria-current={tab === item.id ? "page" : undefined}>
                  <Icon size={18} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        ) : null}
        {breathId ? <Breathe /> : null}
        {paywall ? <Paywall /> : null}
      </div>
    </LumaContext.Provider>
  );
}
