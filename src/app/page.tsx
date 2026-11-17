"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppMark } from "@/components/AppMark";

/** 入口：M1 加登录后，已登录去首页、未登录去介绍页。现在先去介绍页。 */
export default function EntryPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/welcome");
  }, [router]);
  return (
    <main className="flex min-h-dvh items-center justify-center">
      <AppMark size={72} />
    </main>
  );
}
