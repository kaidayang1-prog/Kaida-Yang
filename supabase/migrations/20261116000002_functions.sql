-- =====================================================================
-- 权限辅助函数（RLS 策略里用）和基础触发器
-- 业务操作（发班次、报名、审批、上车、缺席、结算、发券等）按模块在后续迁移里加，
-- 都写成 security definer 函数（RPC），客户端只能通过它们改这些表。
-- 所有函数都设置 search_path = ''，表名写全，防止被同名对象劫持。
-- =====================================================================

-- ---------------------------------------------------------------------
-- 通用
-- ---------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- 把文本安全地转成 uuid（从存储路径里取 id 时用），格式不对返回 null
create or replace function public.try_uuid(p text)
returns uuid language plpgsql immutable set search_path = '' as $$
begin
  return p::uuid;
exception when others then
  return null;
end $$;

create or replace function public.setting_int(p_key text, p_default integer)
returns integer language sql stable security definer set search_path = '' as $$
  select coalesce((select (s.value #>> '{}')::integer from public.app_settings s where s.key = p_key), p_default)
$$;

-- ---------------------------------------------------------------------
-- 身份
-- ---------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(
    (select p.is_admin and p.status = 'active' from public.profiles p where p.id = auth.uid()),
    false)
$$;

create or replace function public.is_active_user()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select p.status = 'active' from public.profiles p where p.id = auth.uid()), false)
$$;

create or replace function public.is_profile_active(p_user uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select p.status = 'active' from public.profiles p where p.id = p_user), false)
$$;

create or replace function public.is_member_of(p_community uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.community_members m
    where m.community_id = p_community and m.user_id = auth.uid()
  )
$$;

-- ---------------------------------------------------------------------
-- 班次
-- ---------------------------------------------------------------------

create or replace function public.has_booking(p_trip uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.bookings b where b.trip_id = p_trip and b.rider_id = auth.uid())
$$;

create or replace function public.is_trip_driver(p_trip uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.trips t where t.id = p_trip and t.driver_id = auth.uid())
$$;

-- 参与者 = 车主 + 已被接受 / 已上车 / 已完成的乘客（群聊、账单、拼单发起都用它）
create or replace function public.is_trip_participant(p_trip uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_trip_driver(p_trip)
      or exists (
        select 1 from public.bookings b
        where b.trip_id = p_trip and b.rider_id = auth.uid()
          and b.status in ('accepted', 'boarded', 'completed')
      )
$$;

-- 谁能看到一个班次：
--   车主本人、管理员、报过名的人；
--   或者车主账号正常、班次没取消，并且：公开班次（车辆没有因整洁度被暂停）对所有登录用户可见，
--   社区班次只对该社区成员可见。
create or replace function public.can_view_trip(p_trip uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.trips t
    where t.id = p_trip
      and (
        t.driver_id = auth.uid()
        or public.is_admin()
        or public.has_booking(t.id)
        or (
          t.status <> 'cancelled'
          and public.is_profile_active(t.driver_id)
          and (
            (t.visibility = 'public'
              and not exists (select 1 from public.vehicles v where v.id = t.vehicle_id and v.listing_paused))
            or (t.visibility = 'community' and public.is_member_of(t.community_id))
          )
        )
      )
  )
$$;

-- 车主是否正在处理这个人的报名（用来决定车主能不能看他的信用分）
create or replace function public.is_driver_of_rider(p_rider uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.bookings b
    join public.trips t on t.id = b.trip_id
    where b.rider_id = p_rider and t.driver_id = auth.uid()
      and b.status in ('pending', 'accepted', 'boarded')
  )
$$;

create or replace function public.owns_series(p_series uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.trip_series s where s.id = p_series and s.driver_id = auth.uid())
$$;

-- 是否在这趟车上（评价用）：车主，或者真正上了车的乘客
create or replace function public.was_on_trip(p_trip uuid, p_user uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.trips t where t.id = p_trip and t.driver_id = p_user)
      or exists (
        select 1 from public.bookings b
        where b.trip_id = p_trip and b.rider_id = p_user and b.status in ('boarded', 'completed')
      )
$$;

create or replace function public.can_review(p_trip uuid, p_reviewee uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select p_reviewee <> auth.uid()
     and exists (
       select 1 from public.trips t
       where t.id = p_trip and t.status = 'completed'
         and t.completed_at > now() - make_interval(days => public.setting_int('review_window_days', 7))
     )
     and public.was_on_trip(p_trip, auth.uid())
     and public.was_on_trip(p_trip, p_reviewee)
$$;

create or replace function public.can_rate_vehicle(p_trip uuid, p_vehicle uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
           select 1 from public.trips t
           where t.id = p_trip and t.vehicle_id = p_vehicle and t.status = 'completed'
             and t.completed_at > now() - make_interval(days => public.setting_int('review_window_days', 7))
         )
     and exists (
           select 1 from public.bookings b
           where b.trip_id = p_trip and b.rider_id = auth.uid() and b.status in ('boarded', 'completed')
         )
$$;

-- ---------------------------------------------------------------------
-- 车辆、集合点
-- ---------------------------------------------------------------------

create or replace function public.owns_vehicle(p_vehicle uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.vehicles v where v.id = p_vehicle and v.owner_id = auth.uid())
$$;

-- 车辆信息跟着班次走：能看到用这辆车的班次（近 30 天及以后），就能看到车辆资料和车内照片
create or replace function public.can_view_vehicle(p_vehicle uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.owns_vehicle(p_vehicle)
      or public.is_admin()
      or exists (
        select 1 from public.trips t
        where t.vehicle_id = p_vehicle
          and t.depart_at > now() - interval '30 days'
          and public.can_view_trip(t.id)
      )
$$;

-- 车牌全号：车主、管理员，或者这辆车近期班次里已被接受的乘客（方便在集合点认车）
create or replace function public.can_see_plate(p_vehicle uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.owns_vehicle(p_vehicle)
      or public.is_admin()
      or exists (
        select 1 from public.bookings b
        join public.trips t on t.id = b.trip_id
        where t.vehicle_id = p_vehicle and b.rider_id = auth.uid()
          and b.status in ('accepted', 'boarded', 'completed')
          and t.depart_at > now() - interval '2 days'
      )
$$;

-- 非官方集合点只有用到它的班次能看见
create or replace function public.mp_in_visible_trip(p_mp uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.trip_meeting_points tmp
    where tmp.meeting_point_id = p_mp and public.can_view_trip(tmp.trip_id)
  )
$$;

-- ---------------------------------------------------------------------
-- 拼单、帖子
-- ---------------------------------------------------------------------

create or replace function public.can_view_group_buy(p_group_buy uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.group_buys g
    where g.id = p_group_buy and public.can_view_trip(g.trip_id)
  )
$$;

create or replace function public.group_buy_is_open(p_group_buy uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.group_buys g where g.id = p_group_buy and g.status = 'open')
$$;

create or replace function public.is_group_buy_organizer(p_group_buy uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.group_buys g where g.id = p_group_buy and g.organizer_id = auth.uid())
$$;

create or replace function public.can_view_post(p_post uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.community_posts p
    where p.id = p_post and (public.is_member_of(p.community_id) or public.is_admin())
  )
$$;

create or replace function public.owns_post(p_post uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.community_posts p where p.id = p_post and p.author_id = auth.uid())
$$;

-- ---------------------------------------------------------------------
-- 认证等级：完整级（管理员设置）> 邻居级（至少加入一个社区）> 手机号
-- ---------------------------------------------------------------------

create or replace function public.refresh_verification_level(p_user uuid)
returns void language sql security definer set search_path = '' as $$
  update public.profiles p
     set verification_level = case
           when p.full_verified_at is not null then 'full'::public.verification_level
           when exists (select 1 from public.community_members m where m.user_id = p.id) then 'neighbor'::public.verification_level
           else 'phone'::public.verification_level
         end
   where p.id = p_user
$$;

create or replace function public.on_membership_changed()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform public.refresh_verification_level(coalesce(new.user_id, old.user_id));
  return null;
end $$;

create trigger community_members_refresh_level
  after insert or delete on public.community_members
  for each row execute function public.on_membership_changed();

-- ---------------------------------------------------------------------
-- 注册与登录信息同步（auth.users → public）
-- ---------------------------------------------------------------------

-- 新用户：建公开资料、隐私资料、信用分
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_locale text := new.raw_user_meta_data ->> 'locale';
begin
  insert into public.profiles (id, locale)
  values (new.id, case when v_locale in ('zh', 'en') then v_locale else 'zh' end)
  on conflict (id) do nothing;

  insert into public.user_private (user_id, phone) values (new.id, new.phone)
  on conflict (user_id) do nothing;

  insert into public.user_credit (user_id) values (new.id)
  on conflict (user_id) do nothing;

  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 手机号变化时同步；邮箱验证通过且属于某个学校的域名时，记下学校邮箱并自动加入该学校社区
create or replace function public.handle_auth_user_updated()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_domain text;
begin
  if new.phone is distinct from old.phone then
    update public.user_private set phone = new.phone, updated_at = now() where user_id = new.id;
  end if;

  if new.email is not null and new.email_confirmed_at is not null
     and (new.email is distinct from old.email or new.email_confirmed_at is distinct from old.email_confirmed_at) then
    v_domain := lower(split_part(new.email, '@', 2));

    with matched as (
      select c.id from public.communities c
      where c.kind = 'school' and c.is_active and c.email_domain is not null
        and (v_domain = lower(c.email_domain)
             or right(v_domain, length(c.email_domain) + 1) = '.' || lower(c.email_domain))
    ), joined as (
      insert into public.community_members (community_id, user_id, source)
      select m.id, new.id, 'school_email' from matched m
      on conflict (community_id, user_id) do nothing
      returning 1
    )
    update public.user_private
       set school_email = lower(new.email), school_email_verified_at = new.email_confirmed_at, updated_at = now()
     where user_id = new.id and exists (select 1 from matched);
  end if;

  return new;
end $$;

create trigger on_auth_user_updated
  after update of phone, email, email_confirmed_at on auth.users
  for each row execute function public.handle_auth_user_updated();

-- ---------------------------------------------------------------------
-- 车辆：上传照片时更新“照片更新于”；车牌变化时更新公开的前两位
-- ---------------------------------------------------------------------

create or replace function public.on_vehicle_photo_added()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.vehicles set photos_updated_at = now() where id = new.vehicle_id;
  return null;
end $$;

create trigger vehicle_photos_touch
  after insert on public.vehicle_photos
  for each row execute function public.on_vehicle_photo_added();

create or replace function public.on_plate_changed()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.vehicles
     set plate_hint = left(upper(regexp_replace(new.plate, '\s', '', 'g')), 2)
   where id = new.vehicle_id;
  return null;
end $$;

create trigger vehicle_plates_hint
  after insert or update of plate on public.vehicle_plates
  for each row execute function public.on_plate_changed();

-- ---------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------

create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger user_private_updated_at before update on public.user_private for each row execute function public.set_updated_at();
create trigger vehicles_updated_at before update on public.vehicles for each row execute function public.set_updated_at();
create trigger trips_updated_at before update on public.trips for each row execute function public.set_updated_at();
create trigger bookings_updated_at before update on public.bookings for each row execute function public.set_updated_at();
create trigger group_buys_updated_at before update on public.group_buys for each row execute function public.set_updated_at();
create trigger community_posts_updated_at before update on public.community_posts for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 函数执行权限：默认谁都不能调；RLS 用到的辅助函数开放给登录用户
-- ---------------------------------------------------------------------

revoke execute on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated;
revoke execute on function
  public.set_updated_at(),
  public.refresh_verification_level(uuid),
  public.on_membership_changed(),
  public.handle_new_user(),
  public.handle_auth_user_updated(),
  public.on_vehicle_photo_added(),
  public.on_plate_changed()
from authenticated;
