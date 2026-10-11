import { clientsClaim } from "workbox-core";
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";

self.skipWaiting();
clientsClaim();

function isNativeShell(url) {
  return (
    url.startsWith("capacitor:") ||
    url.startsWith("ionic:") ||
    url.startsWith("https://localhost") ||
    url.startsWith("http://localhost")
  );
}

// The native app ships its own files. An older service worker can keep serving
// the previous screen after Xcode installs a new build, so drop that cache
// and load the copy that just shipped.
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const shell = windows.filter((client) => isNativeShell(client.url));
    if (!shell.length) return;
    const keys = await self.caches.keys();
    await Promise.all(keys.map((key) => self.caches.delete(key)));
    await self.registration.unregister();
    await Promise.all(shell.map((client) => client.navigate(client.url)));
  })());
});

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
