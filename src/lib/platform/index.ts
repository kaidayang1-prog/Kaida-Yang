/**
 * 平台差异集中在这个目录：网页（PWA）和以后 Capacitor 打包的 APP 各一份实现。
 * 现在只有网页实现；打包时在这里加原生分支（推送、定位、分享、相机、本地存储）。
 */

interface CapacitorGlobal {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
}

/** 是否运行在 Capacitor 打包的 APP 里（不依赖 Capacitor 包，打包前也能安全调用） */
export function isNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  const capacitor = (window as unknown as { Capacitor?: CapacitorGlobal }).Capacitor;
  return Boolean(capacitor?.isNativePlatform?.());
}

export type Platform = "web" | "ios" | "android";

export function currentPlatform(): Platform {
  if (typeof window === "undefined") return "web";
  const capacitor = (window as unknown as { Capacitor?: CapacitorGlobal }).Capacitor;
  const platform = capacitor?.getPlatform?.();
  return platform === "ios" || platform === "android" ? platform : "web";
}

/** 网页是否已经“添加到主屏幕”并以独立窗口打开（iPhone 收网页推送的前提） */
export function isStandalonePwa(): boolean {
  if (typeof window === "undefined") return false;
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return iosStandalone || window.matchMedia?.("(display-mode: standalone)").matches === true;
}
