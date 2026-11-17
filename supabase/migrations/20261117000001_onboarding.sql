-- =====================================================================
-- M1：注册引导、按住址加入社区、删除账号
-- 学校邮箱加入社区由 auth.users 上的触发器处理（见 20261116000002_functions.sql）。
-- =====================================================================

-- 完成引导时必须有昵称和主要身份
alter table public.profiles
  add constraint profiles_onboarded_complete
  check (onboarded_at is null or (char_length(btrim(display_name)) between 1 and 30 and primary_role is not null));

alter table public.user_private
  add constraint user_private_home_range
  check (home_lat is null or (home_lat between -90 and 90 and home_lng between -180 and 180));

-- 两点之间的直线距离（米）
create or replace function public.distance_m(
  lat1 double precision, lng1 double precision, lat2 double precision, lng2 double precision
)
returns double precision language sql immutable parallel safe set search_path = '' as $$
  select 2 * 6371000 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2)
    + cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)
  ))
$$;

-- 我的住址落在哪些小区范围内（只用本人保存的住址，坐标不出数据库）
create or replace function public.nearby_communities()
returns table (id uuid, name_zh text, name_en text, kind public.community_kind, distance_m integer)
language sql stable security definer set search_path = '' as $$
  select c.id, c.name_zh, c.name_en, c.kind,
         round(public.distance_m(p.home_lat, p.home_lng, c.center_lat, c.center_lng))::integer
    from public.user_private p
    join public.communities c on c.is_active and c.kind <> 'school'
   where p.user_id = auth.uid()
     and p.home_lat is not null
     and public.distance_m(p.home_lat, p.home_lng, c.center_lat, c.center_lng) <= c.radius_m
   order by 5
   limit 10
$$;

-- 按住址加入小区：住址必须在小区范围内（错误信息是固定代码，前端翻译成中英文）
create or replace function public.join_community_by_address(p_community uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_lat double precision;
  v_lng double precision;
  v_community public.communities;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if not public.is_active_user() then
    raise exception 'account_suspended' using errcode = '42501';
  end if;

  select p.home_lat, p.home_lng into v_lat, v_lng from public.user_private p where p.user_id = auth.uid();
  if v_lat is null then
    raise exception 'no_home_address' using errcode = 'P0001';
  end if;

  select * into v_community from public.communities c
   where c.id = p_community and c.is_active and c.kind <> 'school';
  if not found then
    raise exception 'community_not_found' using errcode = 'P0001';
  end if;

  if public.distance_m(v_lat, v_lng, v_community.center_lat, v_community.center_lng) > v_community.radius_m then
    raise exception 'outside_community_area' using errcode = 'P0001';
  end if;

  insert into public.community_members (community_id, user_id, source)
  values (p_community, auth.uid(), 'address')
  on conflict (community_id, user_id) do nothing;
end $$;

-- 删除我的账号（PIPEDA：用户可以删除自己的数据）。相关资料随外键一起删除。
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  delete from auth.users where id = auth.uid();
end $$;

revoke execute on function
  public.distance_m(double precision, double precision, double precision, double precision),
  public.nearby_communities(),
  public.join_community_by_address(uuid),
  public.delete_my_account()
from public, anon;

grant execute on function
  public.distance_m(double precision, double precision, double precision, double precision),
  public.nearby_communities(),
  public.join_community_by_address(uuid),
  public.delete_my_account()
to authenticated;
