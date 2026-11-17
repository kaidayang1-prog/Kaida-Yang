import type { ReactNode } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { TabBar } from "@/components/TabBar";

/** 登录后的主界面：内容区 + 底部 Tab。没登录或没完成引导会被带到对应页面。 */
export default function TabsLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <div className="mx-auto min-h-dvh max-w-md pb-[calc(env(safe-area-inset-bottom)+4.5rem)]">
        {children}
        <TabBar />
      </div>
    </RequireAuth>
  );
}
