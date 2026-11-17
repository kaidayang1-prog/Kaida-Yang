"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import type { Enums } from "@/lib/supabase/database.types";
import { supabase } from "@/lib/supabase/client";

export interface MyCommunity {
  id: string;
  name_zh: string;
  name_en: string;
  kind: Enums<"community_kind">;
  source: Enums<"membership_source">;
}

async function fetchMyCommunities(userId: string): Promise<MyCommunity[]> {
  const { data, error } = await supabase()
    .from("community_members")
    .select("source, communities ( id, name_zh, name_en, kind )")
    .eq("user_id", userId)
    .order("joined_at");
  if (error) throw error;
  return (data ?? []).flatMap((row) => (row.communities ? [{ ...row.communities, source: row.source }] : []));
}

/** 我加入的小区和学校（成员名单不公开，这里只能读到自己的成员资格） */
export function useMyCommunities() {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const [loaded, setLoaded] = useState<{ userId: string; list: MyCommunity[] } | null>(null);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    fetchMyCommunities(userId).then(
      (list) => active && setLoaded({ userId, list }),
      () => active && setLoaded({ userId, list: [] }),
    );
    return () => {
      active = false;
    };
  }, [userId]);

  const reload = useCallback(async () => {
    if (!userId) return [];
    const list = await fetchMyCommunities(userId);
    setLoaded({ userId, list });
    return list;
  }, [userId]);

  const communities = loaded && loaded.userId === userId ? loaded.list : null;
  return { communities, reload };
}
