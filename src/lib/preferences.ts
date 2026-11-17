"use client";

import { createPersistentStore, usePersistentValue } from "./persistentStore";

export type Role = "rider" | "driver";

/** 当前身份。M1 登录后改为读写用户资料里的 active_role，这里作为未登录时的本机设置 */
export const roleStore = createPersistentStore<Role>(
  "carpool.role",
  "rider",
  (value): value is Role => value === "rider" || value === "driver",
);

export function useRole(): [Role, (role: Role) => void] {
  return [usePersistentValue(roleStore), roleStore.set];
}
