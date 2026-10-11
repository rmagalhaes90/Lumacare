import { Capacitor } from "@capacitor/core";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { App } from "./App.jsx";
import { bootNative } from "./native.js";
import { hydrateState } from "./lib/storage.js";
import "./styles.css";

const SHELL_REFRESH = "lumacare-shell-refresh";

async function dropStaleShell() {
  const hadWorker = "serviceWorker" in navigator && navigator.serviceWorker.controller;
  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  }
  if (globalThis.caches) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }
  if (hadWorker && !sessionStorage.getItem(SHELL_REFRESH)) {
    sessionStorage.setItem(SHELL_REFRESH, "1");
    location.reload();
    return true;
  }
  return false;
}

async function start() {
  if (Capacitor.isNativePlatform()) {
    try {
      if (await dropStaleShell()) return;
    } catch {
      /* a private webview can omit the cache API */
    }
  } else {
    registerSW({ immediate: true });
  }

  await hydrateState();
  bootNative();
  createRoot(document.getElementById("root")).render(<App />);
}

start();
