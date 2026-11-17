import type { MessageKey, Messages, MessageVars } from "./types";

/** 按点路径取文案，并把 {name} 替换成变量。找不到时返回 key 本身，方便发现漏写的文案。 */
export function translate(messages: Messages, key: MessageKey, vars?: MessageVars): string {
  let node: unknown = messages;
  for (const part of key.split(".")) {
    if (node && typeof node === "object" && part in node) {
      node = (node as Record<string, unknown>)[part];
    } else {
      return key;
    }
  }
  if (typeof node !== "string") return key;
  if (!vars) return node;
  return node.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match,
  );
}
