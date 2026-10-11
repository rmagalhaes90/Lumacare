import { useState } from "react";
import { useLuma } from "./ui.jsx";
import { Button } from "./ui.jsx";
import {
  openExternal,
  plansFromOffering,
  PRIVACY_POLICY_URL,
  TERMS_URL,
} from "./lib/purchases.js";

const FEATURES = [
  "Unlimited habits",
  "All six themes",
  "Every breathing exercise",
  "The full insights picture",
];

export function Paywall() {
  const { offering, purchasesReady, purchase, restore, closePaywall } = useLuma();
  const plans = plansFromOffering(offering);
  const [selected, setSelected] = useState(plans[0].id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const plan = plans.find((item) => item.id === selected) || plans[0];

  async function onBuy() {
    setError("");
    setNote("");
    if (!purchasesReady || !plan.pkg) {
      setNote("Store purchases aren't connected yet. You can preview Plus from More until the RevenueCat keys are in place.");
      return;
    }
    setBusy(true);
    try {
      const result = await purchase(plan.pkg);
      if (result?.isPremium) closePaywall();
      else if (!result?.cancelled) setNote("Purchase finished, and Plus isn't active yet. Restore if you already subscribed.");
    } catch (err) {
      setError(err?.message || "The purchase didn't finish.");
    } finally {
      setBusy(false);
    }
  }

  async function onRestore() {
    setError("");
    setNote("");
    if (!purchasesReady) {
      setNote("Restore will work once purchases are connected.");
      return;
    }
    setBusy(true);
    try {
      const result = await restore();
      if (result?.isPremium) {
        setNote("Purchases restored.");
        closePaywall();
      } else setNote("No active LumaCare+ subscription was found for this Apple ID.");
    } catch (err) {
      setError(err?.message || "Restore didn't finish.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="sheet-backdrop" onClick={closePaywall} role="presentation">
      <div className="sheet" role="dialog" aria-modal="true" aria-label="LumaCare+" onClick={(event) => event.stopPropagation()}>
        <div className="spread">
          <p className="kicker" style={{ margin: 0 }}>LumaCare+</p>
          <button className="icon-btn" type="button" onClick={closePaywall} aria-label="Close">×</button>
        </div>
        <h2>More room, same gentle pace.</h2>
        <p className="muted tiny">
          Check-ins, tasks, the focus timer, journal, backup, and Box breathing stay free.
        </p>
        <ul className="tiny">
          {FEATURES.map((feature) => <li key={feature}>{feature}</li>)}
        </ul>
        <div className="stack">
          {plans.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`plan ${item.id === selected ? "on" : ""}`}
              onClick={() => setSelected(item.id)}
            >
              <span className="spread">
                <strong>
                  {item.title}
                  {item.badge ? <span className="badge">{item.badge}</span> : null}
                </strong>
                <span>{item.price}</span>
              </span>
              <span className="tiny">{item.detail}</span>
            </button>
          ))}
          <Button className="full" onClick={onBuy} disabled={busy}>
            {busy ? "Working…" : `Continue with ${plan.title.toLowerCase()}`}
          </Button>
          <Button variant="ghost" className="full" onClick={onRestore} disabled={busy}>
            Restore purchases
          </Button>
          <Button variant="ghost" className="full" onClick={closePaywall}>Continue with free</Button>
          {error ? <p className="error">{error}</p> : null}
          {note ? <p className="tiny muted">{note}</p> : null}
          <p className="tiny muted">
            Subscriptions renew until you cancel in Apple ID settings.{" "}
            {PRIVACY_POLICY_URL ? (
              <button type="button" className="text-link" onClick={() => openExternal(PRIVACY_POLICY_URL)}>Privacy policy</button>
            ) : null}{" "}
            {TERMS_URL ? (
              <button type="button" className="text-link" onClick={() => openExternal(TERMS_URL)}>Terms</button>
            ) : (
              "Privacy policy and terms links go here before the app is submitted."
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
