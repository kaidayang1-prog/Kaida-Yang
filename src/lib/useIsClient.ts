"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** 静态导出时页面先在构建时渲染；依赖当前时间、本机设置的内容要等到了手机上再显示，避免水合不一致 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
