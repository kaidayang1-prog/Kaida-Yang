import type { ReactNode } from "react";
import { TabBar } from "@/components/TabBar";

/** 登录后的主界面：内容区 + 底部 Tab。M1 起在这里检查登录状态。 */
export default function TabsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto min-h-dvh max-w-md pb-[calc(env(safe-area-inset-bottom)+4.5rem)]">
      {children}
      <TabBar />
    </div>
  );
}
