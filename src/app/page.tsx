"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoadError, SetupNotice, Splash } from "@/components/StatusScreens";
import { useAuth } from "@/lib/auth/AuthProvider";

/** 入口：没登录去介绍页；登录了但没完成引导去引导页；否则去首页 */
export default function EntryPage() {
  const { status, profile, refreshProfile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "signedOut") router.replace("/welcome");
    else if (status === "signedIn") router.replace(profile?.onboarded_at ? "/home" : "/onboarding");
  }, [status, profile, router]);

  if (status === "unconfigured") return <SetupNotice />;
  if (status === "error") return <LoadError onRetry={() => void refreshProfile()} />;
  return <Splash />;
}
