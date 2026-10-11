import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { ENTITLEMENT_ID, PRODUCT_MONTHLY, PRODUCT_YEARLY } from "./gating.js";

// Public SDK keys from RevenueCat → Project settings → API keys.
// Leave these empty until the store products exist. The app stays on the free tier.
export const REVENUECAT_API_KEY_IOS = "";
export const REVENUECAT_API_KEY_ANDROID = "";

// Required before App Store submission. Shown on the paywall when set.
export const PRIVACY_POLICY_URL = "";
export const TERMS_URL = "";

const FALLBACK_PLANS = [
  {
    id: "yearly",
    productId: PRODUCT_YEARLY,
    title: "Yearly",
    price: "$29.99",
    detail: "About $2.50 a month",
    badge: "Save 50%",
    pkg: null,
  },
  {
    id: "monthly",
    productId: PRODUCT_MONTHLY,
    title: "Monthly",
    price: "$4.99",
    detail: "Billed each month",
    badge: "",
    pkg: null,
  },
];

export function apiKeyForPlatform(platform = Capacitor.getPlatform()) {
  if (platform === "ios") return REVENUECAT_API_KEY_IOS.trim();
  if (platform === "android") return REVENUECAT_API_KEY_ANDROID.trim();
  return "";
}

export function purchasesConfigured(platform = Capacitor.getPlatform()) {
  return Capacitor.isNativePlatform() && Boolean(apiKeyForPlatform(platform));
}

export function hasPremium(customerInfo) {
  return Boolean(customerInfo?.entitlements?.active?.[ENTITLEMENT_ID]);
}

export function manageSubscriptionUrl(platform = Capacitor.getPlatform()) {
  if (platform === "android") {
    return "https://play.google.com/store/account/subscriptions?package=app.lumacare.companion";
  }
  return "https://apps.apple.com/account/subscriptions";
}

export async function openExternal(url) {
  if (!url) return;
  if (Capacitor.isNativePlatform()) {
    await Browser.open({ url });
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

function isCancelled(error) {
  return error?.userCancelled === true || error?.code === "1" || error?.code === 1;
}

export function plansFromOffering(offering) {
  if (!offering) return FALLBACK_PLANS.map((plan) => ({ ...plan }));
  const packages = offering.availablePackages || [];
  const match = (productId, packageType) =>
    packages.find(
      (pkg) =>
        pkg?.product?.identifier === productId ||
        pkg?.product?.identifier?.startsWith(`${productId}:`) ||
        pkg?.packageType === packageType,
    );
  const yearly = offering.annual || match(PRODUCT_YEARLY, "ANNUAL");
  const monthly = offering.monthly || match(PRODUCT_MONTHLY, "MONTHLY");

  const lift = (pkg, fallback) => {
    if (!pkg) return { ...fallback };
    const perMonth = pkg.product?.pricePerMonthString;
    return {
      ...fallback,
      price: pkg.product?.priceString || fallback.price,
      detail: fallback.id === "yearly" && perMonth ? `${perMonth} / month` : fallback.detail,
      pkg,
    };
  };

  return [lift(yearly, FALLBACK_PLANS[0]), lift(monthly, FALLBACK_PLANS[1])];
}

export async function initPurchases(onCustomerInfo) {
  if (!purchasesConfigured()) {
    return { configured: false, isPremium: false, offering: null };
  }
  const { Purchases } = await import("@revenuecat/purchases-capacitor");
  await Purchases.configure({ apiKey: apiKeyForPlatform() });
  if (onCustomerInfo) {
    await Purchases.addCustomerInfoUpdateListener((info) => {
      const customerInfo = info?.customerInfo || info;
      onCustomerInfo(customerInfo);
    });
  }
  const { customerInfo } = await Purchases.getCustomerInfo();
  const offerings = await Purchases.getOfferings();
  return {
    configured: true,
    isPremium: hasPremium(customerInfo),
    offering: offerings?.current || null,
  };
}

export async function purchasePackage(pkg) {
  const { Purchases } = await import("@revenuecat/purchases-capacitor");
  try {
    const result = await Purchases.purchasePackage({ aPackage: pkg });
    return { customerInfo: result.customerInfo, cancelled: false };
  } catch (error) {
    if (isCancelled(error)) return { customerInfo: null, cancelled: true };
    throw error;
  }
}

export async function restorePurchases() {
  const { Purchases } = await import("@revenuecat/purchases-capacitor");
  const { customerInfo } = await Purchases.restorePurchases();
  return customerInfo;
}
