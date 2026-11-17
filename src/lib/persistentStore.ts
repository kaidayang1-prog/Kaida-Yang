"use client";

import { useSyncExternalStore } from "react";

/**
 * 存在本机（localStorage）的小设置，比如语言、当前身份。
 * 用 useSyncExternalStore 读取：静态导出时服务端用默认值渲染，到了手机上再换成本机保存的值，
 * 不会出现水合（hydration）不一致。
 * localStorage 可能不可用（隐私模式、被禁用），所以读写都包了 try/catch。
 */
export interface PersistentStore<T> {
  get(): T;
  set(value: T): void;
  subscribe(listener: () => void): () => void;
  readonly defaultValue: T;
}

export function createPersistentStore<T extends string>(
  key: string,
  defaultValue: T,
  isValid: (value: string) => value is T,
): PersistentStore<T> {
  const listeners = new Set<() => void>();
  let memoryValue: T | null = null;

  const read = (): T => {
    if (memoryValue !== null) return memoryValue;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null && isValid(raw)) return raw;
    } catch {
      // 读不到就用默认值
    }
    return defaultValue;
  };

  return {
    defaultValue,
    get: read,
    set(value) {
      memoryValue = value;
      try {
        window.localStorage.setItem(key, value);
      } catch {
        // 写不进去时只在本次打开期间生效
      }
      listeners.forEach((listener) => listener());
    },
    subscribe(listener) {
      listeners.add(listener);
      const onStorage = (event: StorageEvent) => {
        if (event.key === key) {
          memoryValue = null;
          listener();
        }
      };
      window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(listener);
        window.removeEventListener("storage", onStorage);
      };
    },
  };
}

export function usePersistentValue<T extends string>(store: PersistentStore<T>): T {
  return useSyncExternalStore(store.subscribe, store.get, () => store.defaultValue);
}
