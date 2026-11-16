-- =====================================================================
-- 行级权限（RLS）
-- 原则：
--   1. public 下所有表都开 RLS；未登录（anon）不能直接读写任何表。
--   2. 读：按“谁需要看”放开。住址、手机号、车牌全号、上车 PIN、信用分、社区成员名单只给本人和必要的人。
--   3. 写：简单内容（帖子、评论、群聊、关注、评价、车辆）客户端直接写，由 RLS 检查；
--      有业务规则的操作（发班次、报名、审批、上车、缺席、结算、发券、改信用分、管理员操作）
--      客户端没有写权限，只能调用数据库函数（RPC），在后续模块的迁移里加。
--   4. 能改哪些列用列级 GRANT 控制，比如用户能改自己的昵称，但不能改 is_admin、信用分、认证等级。
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. 所有表开启 RLS
-- ---------------------------------------------------------------------
do $$
declare r record;
begin
  for r in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', r.tablename);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 1. 表权限基线：先全部收回，登录用户默认只读，写权限下面逐表放开
-- ---------------------------------------------------------------------
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
grant usage on schema public to authenticated;
grant select on all tables in schema public to authenticated;
grant usage on all sequences in schema public to authenticated;

-- 管理员维护的表：客户端有写权限，但 RLS 只放行管理员
grant insert, update, delete on
  public.communities, public.destinations, public.meeting_points, public.fuel_prices,
  public.coupons, public.coupon_codes, public.app_settings
to authenticated;

-- ---------------------------------------------------------------------
-- 2. 用户
-- ---------------------------------------------------------------------

-- 公开资料：登录用户都能看；本人只能改这几列
grant update (display_name, avatar_path, bio, locale, primary_role, active_role, onboarded_at)
  on public.profiles to authenticated;

create policy profiles_select on public.profiles
  for select to authenticated using (true);
create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- 隐私资料：本人和管理员；本人只能改住址（手机号、学校邮箱由登录系统同步）
grant update (home_address, home_lat, home_lng) on public.user_private to authenticated;

create policy user_private_select on public.user_private
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy user_private_update_self on public.user_private
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- 信用分：本人、管理员、正在处理他报名的车主
create policy user_credit_select on public.user_credit
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()) or public.is_driver_of_rider(user_id));

create policy credit_events_select on public.credit_events
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

-- ---------------------------------------------------------------------
-- 3. 社区与认证
-- ---------------------------------------------------------------------

create policy communities_select on public.communities
  for select to authenticated using (is_active);
create policy communities_admin on public.communities
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- 成员名单：只能看到自己的成员资格；加入社区走 RPC（核对住址范围）或学校邮箱触发器；可以自己退出
grant insert, delete on public.community_members to authenticated;

create policy community_members_select on public.community_members
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy community_members_leave on public.community_members
  for delete to authenticated
  using (user_id = (select auth.uid()));
create policy community_members_admin on public.community_members
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

grant insert (user_id, building_or_area, note) on public.community_requests to authenticated;
grant update (status) on public.community_requests to authenticated;

create policy community_requests_select on public.community_requests
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy community_requests_insert on public.community_requests
  for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy community_requests_admin on public.community_requests
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- 完整级认证资料：本人提交、本人和管理员能看；状态只有管理员能改
grant insert (user_id, real_name, licence_front_path, licence_back_path) on public.identity_verifications to authenticated;
grant update (status, reviewer_id, reviewed_at, note) on public.identity_verifications to authenticated;

create policy identity_select on public.identity_verifications
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy identity_insert on public.identity_verifications
  for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy identity_admin on public.identity_verifications
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------------------------------------------------------------------
-- 4. 车辆
-- ---------------------------------------------------------------------

-- 车主能改的列（整洁度汇总、暂停状态、照片时间、车牌前两位由系统维护）
grant insert (owner_id, make_model, color, seats_total, trunk_size, fuel_l_per_100km, pets, smoking)
  on public.vehicles to authenticated;
grant update (make_model, color, seats_total, trunk_size, fuel_l_per_100km, pets, smoking, is_active)
  on public.vehicles to authenticated;
grant delete on public.vehicles to authenticated;

create policy vehicles_select on public.vehicles
  for select to authenticated
  using (owner_id = (select auth.uid()) or public.can_view_vehicle(id));
create policy vehicles_insert on public.vehicles
  for insert to authenticated
  with check (owner_id = (select auth.uid()) and (select public.is_active_user()));
create policy vehicles_update on public.vehicles
  for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy vehicles_delete on public.vehicles
  for delete to authenticated
  using (owner_id = (select auth.uid()));

grant insert, delete on public.vehicle_plates to authenticated;
grant update (plate) on public.vehicle_plates to authenticated;

create policy vehicle_plates_select on public.vehicle_plates
  for select to authenticated using (public.can_see_plate(vehicle_id));
create policy vehicle_plates_insert on public.vehicle_plates
  for insert to authenticated with check (public.owns_vehicle(vehicle_id));
create policy vehicle_plates_update on public.vehicle_plates
  for update to authenticated
  using (public.owns_vehicle(vehicle_id)) with check (public.owns_vehicle(vehicle_id));
create policy vehicle_plates_delete on public.vehicle_plates
  for delete to authenticated using (public.owns_vehicle(vehicle_id));

grant insert (vehicle_id, kind, storage_path), delete on public.vehicle_photos to authenticated;

create policy vehicle_photos_select on public.vehicle_photos
  for select to authenticated using (public.can_view_vehicle(vehicle_id));
create policy vehicle_photos_insert on public.vehicle_photos
  for insert to authenticated with check (public.owns_vehicle(vehicle_id));
create policy vehicle_photos_delete on public.vehicle_photos
  for delete to authenticated using (public.owns_vehicle(vehicle_id));

-- ---------------------------------------------------------------------
-- 5. 目的地、集合点、油价、参数、徽章
-- ---------------------------------------------------------------------

create policy destinations_select on public.destinations
  for select to authenticated using (is_active);
create policy destinations_admin on public.destinations
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- 官方集合点所有人可见；自建集合点只有创建人和用到它的班次能看到
create policy meeting_points_select on public.meeting_points
  for select to authenticated
  using ((is_official and is_active) or created_by = (select auth.uid()) or public.mp_in_visible_trip(id));
-- 普通用户可以新建非官方集合点（车主发班次、乘客提议时用）；官方集合点只有管理员能建和改
create policy meeting_points_insert on public.meeting_points
  for insert to authenticated
  with check (not is_official and created_by = (select auth.uid()) and (select public.is_active_user()));
create policy meeting_points_admin on public.meeting_points
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy fuel_prices_select on public.fuel_prices
  for select to authenticated using (true);
create policy fuel_prices_admin on public.fuel_prices
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy app_settings_select on public.app_settings
  for select to authenticated using (true);
create policy app_settings_admin on public.app_settings
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy badges_select on public.badges
  for select to authenticated using (true);
create policy user_badges_select on public.user_badges
  for select to authenticated using (true);

-- ---------------------------------------------------------------------
-- 6. 班次（写操作全部走 RPC）
-- ---------------------------------------------------------------------

grant update (is_active, ends_on, notes) on public.trip_series to authenticated;

create policy trip_series_select on public.trip_series
  for select to authenticated
  using (driver_id = (select auth.uid()) or (select public.is_admin()));
create policy trip_series_update on public.trip_series
  for update to authenticated
  using (driver_id = (select auth.uid())) with check (driver_id = (select auth.uid()));

create policy trip_series_mp_select on public.trip_series_meeting_points
  for select to authenticated
  using (public.owns_series(series_id) or (select public.is_admin()));

-- 跳过某一期：车主直接加一行
grant insert, delete on public.trip_series_skips to authenticated;

create policy trip_series_skips_select on public.trip_series_skips
  for select to authenticated using (public.owns_series(series_id));
create policy trip_series_skips_insert on public.trip_series_skips
  for insert to authenticated with check (public.owns_series(series_id));
create policy trip_series_skips_delete on public.trip_series_skips
  for delete to authenticated using (public.owns_series(series_id));

create policy trips_select on public.trips
  for select to authenticated using (public.can_view_trip(id));

-- 提议中的集合点只有提议人和车主能看到；生效的集合点能看到班次的人都能看到
create policy trip_mp_select on public.trip_meeting_points
  for select to authenticated
  using (
    public.can_view_trip(trip_id)
    and (status = 'active' or proposed_by = (select auth.uid()) or public.is_trip_driver(trip_id) or (select public.is_admin()))
  );

-- ---------------------------------------------------------------------
-- 7. 报名与上车（写操作全部走 RPC）
-- ---------------------------------------------------------------------

-- 报名记录：乘客本人、车主、管理员；同车的参与者能看到已确认的同伴（逐段油费明细要用）
create policy bookings_select on public.bookings
  for select to authenticated
  using (
    rider_id = (select auth.uid())
    or public.is_trip_driver(trip_id)
    or (select public.is_admin())
    or (status in ('accepted', 'boarded', 'completed') and public.is_trip_participant(trip_id))
  );

-- PIN 只有乘客本人能看；车主核对时调用 RPC，读不到 PIN
create policy booking_pins_select on public.booking_pins
  for select to authenticated
  using (exists (
    select 1 from public.bookings b
    where b.id = booking_pins.booking_id and b.rider_id = (select auth.uid())
  ));

-- ---------------------------------------------------------------------
-- 8. 路线与油费（路线由服务端函数计算写入；账单由结算函数生成）
-- ---------------------------------------------------------------------

create policy route_stops_select on public.route_stops
  for select to authenticated using (public.can_view_trip(trip_id));
create policy route_legs_select on public.route_legs
  for select to authenticated using (public.can_view_trip(trip_id));

create policy fare_settlements_select on public.fare_settlements
  for select to authenticated
  using (public.is_trip_participant(trip_id) or (select public.is_admin()));
create policy fare_shares_select on public.fare_shares
  for select to authenticated
  using (public.is_trip_participant(trip_id) or (select public.is_admin()));

-- ---------------------------------------------------------------------
-- 9. 关注、通知、推送
-- ---------------------------------------------------------------------

grant insert (follower_id, driver_id, notify), delete on public.follows to authenticated;
grant update (notify) on public.follows to authenticated;

create policy follows_select on public.follows
  for select to authenticated
  using (follower_id = (select auth.uid()) or (select public.is_admin()));
create policy follows_insert on public.follows
  for insert to authenticated with check (follower_id = (select auth.uid()));
create policy follows_update on public.follows
  for update to authenticated
  using (follower_id = (select auth.uid())) with check (follower_id = (select auth.uid()));
create policy follows_delete on public.follows
  for delete to authenticated using (follower_id = (select auth.uid()));

grant update (read_at) on public.notifications to authenticated;

create policy notifications_select on public.notifications
  for select to authenticated using (user_id = (select auth.uid()));
create policy notifications_update on public.notifications
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

grant insert (user_id, platform, endpoint, p256dh, auth_secret, device_token, user_agent), delete
  on public.push_subscriptions to authenticated;
grant update (last_seen_at) on public.push_subscriptions to authenticated;

create policy push_select on public.push_subscriptions
  for select to authenticated using (user_id = (select auth.uid()));
create policy push_insert on public.push_subscriptions
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy push_update on public.push_subscriptions
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy push_delete on public.push_subscriptions
  for delete to authenticated using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------
-- 10. 社交
-- ---------------------------------------------------------------------

-- 班次群聊：车主和已确认的乘客
grant insert (trip_id, sender_id, body, phrase_key) on public.trip_messages to authenticated;
grant update (deleted_at) on public.trip_messages to authenticated;

create policy trip_messages_select on public.trip_messages
  for select to authenticated
  using (public.is_trip_participant(trip_id) or (select public.is_admin()));
create policy trip_messages_insert on public.trip_messages
  for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and public.is_trip_participant(trip_id)
    and (select public.is_active_user())
  );
create policy trip_messages_soft_delete on public.trip_messages
  for update to authenticated
  using (sender_id = (select auth.uid())) with check (sender_id = (select auth.uid()));

-- 拼单分装：能看到班次的人都能看到和参加；发起人必须在这趟车上
grant insert (trip_id, organizer_id, title, details, est_total_cents, portions_total, handoff_tmp_id)
  on public.group_buys to authenticated;
grant update (title, details, est_total_cents, portions_total, handoff_tmp_id, status, receipt_total_cents, receipt_photo_path)
  on public.group_buys to authenticated;

create policy group_buys_select on public.group_buys
  for select to authenticated using (public.can_view_trip(trip_id));
create policy group_buys_insert on public.group_buys
  for insert to authenticated
  with check (
    organizer_id = (select auth.uid())
    and public.is_trip_participant(trip_id)
    and (select public.is_active_user())
  );
create policy group_buys_update on public.group_buys
  for update to authenticated
  using (organizer_id = (select auth.uid())) with check (organizer_id = (select auth.uid()));

grant insert (group_buy_id, user_id, portions), delete on public.group_buy_participants to authenticated;
grant update (portions, paid_marked_at) on public.group_buy_participants to authenticated;

create policy gb_participants_select on public.group_buy_participants
  for select to authenticated using (public.can_view_group_buy(group_buy_id));
create policy gb_participants_insert on public.group_buy_participants
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and public.group_buy_is_open(group_buy_id)
    and public.can_view_group_buy(group_buy_id)
    and (select public.is_active_user())
  );
create policy gb_participants_update on public.group_buy_participants
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy gb_participants_delete on public.group_buy_participants
  for delete to authenticated
  using (user_id = (select auth.uid()) and public.group_buy_is_open(group_buy_id));

-- 小区帖子：只有本社区成员能看和发
grant insert (community_id, author_id, kind, title, body, price_cents), delete on public.community_posts to authenticated;
grant update (kind, title, body, price_cents, status) on public.community_posts to authenticated;

create policy posts_select on public.community_posts
  for select to authenticated
  using (public.is_member_of(community_id) or (select public.is_admin()));
create policy posts_insert on public.community_posts
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and public.is_member_of(community_id)
    and (select public.is_active_user())
  );
create policy posts_update on public.community_posts
  for update to authenticated
  using (author_id = (select auth.uid())) with check (author_id = (select auth.uid()));
create policy posts_delete on public.community_posts
  for delete to authenticated
  using (author_id = (select auth.uid()) or (select public.is_admin()));

grant insert (post_id, storage_path), delete on public.post_photos to authenticated;

create policy post_photos_select on public.post_photos
  for select to authenticated using (public.can_view_post(post_id));
create policy post_photos_insert on public.post_photos
  for insert to authenticated with check (public.owns_post(post_id));
create policy post_photos_delete on public.post_photos
  for delete to authenticated using (public.owns_post(post_id) or (select public.is_admin()));

grant insert (post_id, author_id, body), delete on public.post_comments to authenticated;

create policy post_comments_select on public.post_comments
  for select to authenticated using (public.can_view_post(post_id));
create policy post_comments_insert on public.post_comments
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and public.can_view_post(post_id)
    and (select public.is_active_user())
  );
create policy post_comments_delete on public.post_comments
  for delete to authenticated
  using (author_id = (select auth.uid()) or (select public.is_admin()));

-- ---------------------------------------------------------------------
-- 11. 评价与整洁度
-- ---------------------------------------------------------------------

-- 评价公开（建立信任）；只有同车的人在评价期内能写，不能改
grant insert (trip_id, reviewer_id, reviewee_id, stars, tags, comment), delete on public.reviews to authenticated;

create policy reviews_select on public.reviews
  for select to authenticated using (true);
create policy reviews_insert on public.reviews
  for insert to authenticated
  with check (reviewer_id = (select auth.uid()) and public.can_review(trip_id, reviewee_id));
create policy reviews_admin_delete on public.reviews
  for delete to authenticated using ((select public.is_admin()));

grant insert (trip_id, rater_id, vehicle_id, score, tags) on public.cleanliness_ratings to authenticated;

create policy cleanliness_select on public.cleanliness_ratings
  for select to authenticated
  using (rater_id = (select auth.uid()) or (select public.is_admin()));
create policy cleanliness_insert on public.cleanliness_ratings
  for insert to authenticated
  with check (rater_id = (select auth.uid()) and public.can_rate_vehicle(trip_id, vehicle_id));

-- ---------------------------------------------------------------------
-- 12. 优惠券与积分
-- ---------------------------------------------------------------------

create policy coupons_select on public.coupons
  for select to authenticated
  using (
    is_active
    or exists (select 1 from public.coupon_grants g where g.coupon_id = coupons.id and g.user_id = (select auth.uid()))
  );
create policy coupons_admin on public.coupons
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy coupon_codes_admin on public.coupon_codes
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

grant update (used_marked_at) on public.coupon_grants to authenticated;

create policy coupon_grants_select on public.coupon_grants
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy coupon_grants_mark_used on public.coupon_grants
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy points_select on public.points_ledger
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

-- ---------------------------------------------------------------------
-- 13. 举报与管理
-- ---------------------------------------------------------------------

grant insert (reporter_id, target_type, target_id, reason, details) on public.reports to authenticated;
grant update (status, handled_by, resolution_note, handled_at) on public.reports to authenticated;

create policy reports_select on public.reports
  for select to authenticated
  using (reporter_id = (select auth.uid()) or (select public.is_admin()));
create policy reports_insert on public.reports
  for insert to authenticated with check (reporter_id = (select auth.uid()));
create policy reports_admin on public.reports
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy admin_actions_select on public.admin_actions
  for select to authenticated using ((select public.is_admin()));

-- ---------------------------------------------------------------------
-- 14. 实时消息：群聊和通知走 Supabase Realtime（同样受上面的 RLS 限制）
-- ---------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.trip_messages, public.notifications;
  end if;
end $$;
