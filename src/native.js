import { Capacitor } from "@capacitor/core";

export async function bootNative() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { StatusBar } = await import("@capacitor/status-bar");
    await StatusBar.setOverlaysWebView({ overlay: true });
  } catch {
    /* status bar plugin is iOS/Android only */
  }
  try {
    const { SplashScreen } = await import("@capacitor/splash-screen");
    await SplashScreen.hide();
  } catch {
    /* splash already hidden */
  }
}

export async function paintStatusBar(theme) {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({ style: theme.dark ? Style.Light : Style.Dark });
    await StatusBar.setBackgroundColor({ color: theme.bg });
  } catch {
    /* setBackgroundColor is a no-op on iOS */
  }
}

export function applyChrome(theme) {
  document.documentElement.style.background = theme.bg;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme.bg);
  paintStatusBar(theme);
}

export async function haptic(kind = "light") {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    const style = kind === "medium" ? ImpactStyle.Medium : ImpactStyle.Light;
    await Haptics.impact({ style });
  } catch {
    /* haptics unavailable */
  }
}
