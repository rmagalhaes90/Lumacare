# LumaCare

*Small steps. Better days.*

A private, local-first self-care and anti-procrastination companion. No account, no servers, no analytics — everything lives on the device.

## What's inside

Today dashboard with mood/energy/stress check-in and adaptive suggestions · task management with a break-it-down assistant, resistance check, two-minute launch, and brain dump · focus timer with distraction capture · habits with minimum versions (no streak shaming) · animated breathing exercises · private journal with prompts · deterministic local insights · six themes · reduced motion · JSON backup and restore-by-export.

## Requirements

- Node.js 18 or newer
- For native Android builds: Android Studio
- For native iOS builds: a Mac with Xcode

## Run it

```bash
npm install
npm run dev
```

Open the printed URL. To test on your phone during development, run `npm run dev -- --host` and open `http://<your-computer's-ip>:5173` from the phone (same Wi-Fi network).

## Option A — Install on a phone as a PWA (easiest, no app stores)

1. `npm run build`
2. Host the `dist/` folder anywhere with HTTPS (Netlify, Vercel, Cloudflare Pages, GitHub Pages — drag-and-drop works on all of them). PWAs require HTTPS to install.
3. Open the URL on the phone:
   - **Android (Chrome):** menu → *Add to Home screen* → *Install*
   - **iPhone (Safari):** Share → *Add to Home Screen*
4. The app now launches full-screen from its own icon and works fully offline after the first load.

## Option B — Native Android app (APK)

```bash
npm install
npm run android:add      # one time: creates the android/ project
npm run mobile:sync      # builds the web app and copies it into the native shell
npm run android:open     # opens Android Studio
```

In Android Studio: run on a connected device or emulator, or **Build → Build APK(s)** to produce an installable APK. For Play Store distribution, generate a signed release bundle (Build → Generate Signed Bundle).

## Option C — Native iOS app

On a Mac:

```bash
npm install
npm run ios:add
npm run mobile:sync
npm run ios:open         # opens Xcode
```

Select your team under Signing & Capabilities, then run on a device. App Store distribution requires an Apple Developer account.

## Monetization — LumaCare+

The app ships with a subscription paywall built on RevenueCat, wired into `src/lib/purchases.js`, `src/Paywall.jsx`, and gating logic inside `src/App.jsx`.

### Pricing

| Plan | Price | Notes |
|---|---|---|
| Monthly | $4.99 / month | |
| Yearly | $29.99 / year | ≈ $2.50/mo, a 50% discount vs. monthly — the default selection on the paywall |

These are starting points based on 2026 category benchmarks for indie lifestyle/journaling apps (well below Calm/Headspace's ~$70/yr, above ultra-budget apps like Finch). You can test different prices later in App Store Connect / Play Console without touching this code — RevenueCat reads live prices from the store, the numbers in `Paywall.jsx` are just display copy to keep in sync.

**Deliberately no free trial.** Category data shows trial users in journaling/habit apps churn faster than users who buy directly — a trial mostly attracts people hoping motivation will materialize rather than people who've already decided the app is useful. A generous permanent free tier does more for conversion here than a time-limited trial of the paid one.

### What's free vs. LumaCare+

The split was chosen to keep the app's actual purpose — getting people unstuck — free forever, and charge for scale/depth/cosmetics instead:

**Always free, no limit:** daily check-in, the supportive-actions view, the full anti-procrastination toolkit (breakdown assistant, two-minute launch, brain dump), the focus timer at any duration with distraction capture, unlimited journal entries, the complete self-care library, local backup export, and 2 themes (Calm Light, Midnight).

**LumaCare+:** unlimited habits (free is capped at 3), all 6 themes, all 4 breathing exercises beyond Box breathing, and every pattern in Insights beyond the first (free shows 1).

One rule the code follows throughout: **a limit is never applied retroactively.** If someone picks a "premium" theme during onboarding, or already has 5 habits, downgrading never deletes or locks what they already have — it only blocks acquiring more while on the free plan. See `FREE_THEME_IDS`, `FREE_BREATH_IDS`, `FREE_HABIT_LIMIT`, and `FREE_INSIGHT_LIMIT` near the top of `App.jsx` if you want to change any of these.

### Setting up RevenueCat (do this before the paywall can take real payments)

1. Create a free account at [app.revenuecat.com](https://app.revenuecat.com).
2. In App Store Connect, create a subscription group (e.g. "LumaCare+") with two auto-renewable subscriptions:
   - `lumacare_plus_monthly` — $4.99/month
   - `lumacare_plus_yearly` — $29.99/year
   Fill in localized display names/descriptions and submit them for review alongside your app binary (first-time subscriptions review together with the app).
3. In Google Play Console, create matching subscription products with the same two IDs and prices under Monetize → Subscriptions.
4. Back in RevenueCat: add your iOS and Android app, paste in the App Store Connect / Play Console API credentials it asks for, then create one **entitlement** called `premium` and attach both products to it. Create one **offering** called `default` containing both packages.
5. Copy your RevenueCat public SDK keys (Project Settings → API Keys) into `REVENUECAT_API_KEY_IOS` and `REVENUECAT_API_KEY_ANDROID` in `src/lib/purchases.js`.
6. `npm run mobile:sync` and test with a sandbox/test account on a real device — in-app purchases don't work in the iOS Simulator or most emulators.

Until you do this, the app runs safely in free-tier mode: `initPurchases` detects it's not on a native platform (or that RevenueCat isn't configured) and just treats everyone as free, so nothing crashes in the browser preview or before you've set up the store side.

### Required App Store / Play Store housekeeping for subscriptions

- **Restore Purchases** — required by Apple guideline 3.1.2, already implemented (in the paywall, and via "Manage" once subscribed).
- **Privacy label update** — now that the app makes one network call (to RevenueCat, to verify a purchase), update the App Privacy questionnaire in App Store Connect. It's still a very short list: purchase history, linked to the user's account, used for app functionality only — not for tracking or advertising. The in-app privacy copy (More → Privacy and data) already reflects this honestly.
- **Terms & privacy policy links** — the paywall has a placeholder line for these; add real URLs once you've published a privacy policy page (required for submission regardless of monetization).
- **Subscription management** — the "Manage subscription" button deep-links to the native subscription settings screen on each platform (`manageSubscriptionUrl()` in `purchases.js`).

### Ads — not implemented, and worth thinking through first

You mentioned wanting ads on the free tier too. It's technically straightforward to add (`@capgo/capacitor-admob` or `@capacitor-community/admob` is the current standard for Capacitor), but it sits in real tension with this app's privacy promise — ad networks typically use device identifiers for targeting, which means an ATT (App Tracking Transparency) prompt on iOS and an honest rewrite of the privacy copy that's currently in the app. If you still want it after the subscription paywall is live and generating some signal, a clean approach is: ads only on free-tier screens that aren't Journal or Breathing (keep the private/calm screens ad-free even on free), and an explicit "Remove ads" benefit added to the LumaCare+ feature list. Happy to wire this up as a follow-up.

## After changing web code

Native shells don't rebuild automatically — run `npm run mobile:sync` again, then rebuild in Android Studio / Xcode.

## Icons

Icons are generated locally (no design tools needed): `npm run icons` regenerates `public/pwa-192.png`, `pwa-512.png`, and `apple-touch-icon.png` from `scripts/gen-icons.js`. Edit the palette constants in that file to rebrand.

## Data & privacy

- All data is stored in the app's local storage on the device (`lumacare-v1` key), debounced-saved on every change.
- **Backups:** More → Privacy and data → *Download backup* produces a dated JSON file. Do this before uninstalling or clearing browser/site data.
- All personal content (tasks, mood, journal, habits) stays on-device. The one exception is the LumaCare+ paywall, which calls RevenueCat to verify a subscription — it never sees your personal data, only purchase status.

## Architecture notes

- Single-page React 18 + Vite. Styling is inline with a theme-token system (six themes in `THEMES`), so there's no CSS pipeline to configure.
- Copy is centralized in `COPY` and keyed by encouragement tone (gentle / direct / motivational / minimal).
- The task-breakdown assistant (`suggestBreakdown`) is deterministic and offline by design — templates keyed to task type. A future LLM can be swapped in behind the same function signature.
- `vite-plugin-pwa` generates the service worker (auto-update strategy) and web manifest.
- Capacitor wraps the same `dist/` output for native builds; `capacitor.config.json` holds the app ID and name.

## Known limitations / good next steps

- Restore-from-backup UI (import JSON) — currently export only.
- Local notifications via `@capacitor/local-notifications` for gentle reminders.
- Haptics via `@capacitor/haptics` on breathing phase changes.
- Routines builder, weekly review flow, and goals from the full product spec.
- Migrating storage from localStorage to IndexedDB (Dexie) if data grows large.

## Wellbeing note

LumaCare supports personal organization and general wellbeing. It is not a medical device and does not provide diagnosis, treatment, or emergency support.
