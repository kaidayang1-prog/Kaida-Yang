"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { LoadError, SetupNotice, Splash } from "./StatusScreens";

/** 需要登录并完成引导的页面：没登录去介绍页，没完成引导去引导页 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status, profile, refreshProfile } = useAuth();
  const router = useRouter();
  const needsOnboarding = status === "signedIn" && !profile?.onboarded_at;

  useEffect(() => {
    if (status === "signedOut") router.replace("/welcome");
    else if (needsOnboarding) router.replace("/onboarding");
  }, [status, needsOnboarding, router]);

  if (status === "unconfigured") return <SetupNotice />;
  if (status === "error") return <LoadError onRetry={() => void refreshProfile()} />;
  if (status !== "signedIn" || needsOnboarding) return <Splash />;
  return children;
}
