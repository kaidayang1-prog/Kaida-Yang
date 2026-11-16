-- =====================================================================
-- 拼车购物 Carpool Shopping · 数据库结构（设计稿 v0.2）
-- 约定：
--   · 金额一律用整数“分”（cents）；距离用 numeric 公里；时间用 timestamptz，界面按 America/Toronto 显示。
--   · 不收集族裔、国籍等信息；社区只按住址或学校邮箱划分（安省人权法）。
--   · 用户住址、手机号、车牌全号、上车 PIN、信用分放在单独的表里，由 RLS 只给本人和必要的人看。
--   · RLS 策略在 20261116000003_rls.sql；权限辅助函数和触发器在 20261116000002_functions.sql。
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------
-- 枚举
-- ---------------------------------------------------------------------
create type public.user_role as enum ('driver', 'rider');
create type public.verification_level as enum ('phone', 'neighbor', 'full');
create type public.account_status as enum ('active', 'suspended');
create type public.community_kind as enum ('building', 'complex', 'school', 'area');
create type public.membership_source as enum ('address', 'school_email', 'admin');
create type public.trunk_size as enum ('small', 'medium', 'large');
create type public.meeting_point_kind as enum ('lobby', 'gate', 'subway', 'plaza', 'parking', 'other');
create type public.trip_visibility as enum ('community', 'public');
create type public.trip_status as enum ('open', 'confirmed', 'in_progress', 'completed', 'cancelled');
create type public.cancel_reason as enum ('min_riders_not_met', 'driver_cancelled', 'admin');
create type public.trip_mp_status as enum ('active', 'proposed', 'rejected', 'removed');
create type public.booking_status as enum (
  'pending',     -- 等车主确认
  'accepted',    -- 车主已接受
  'rejected',    -- 车主拒绝
  'withdrawn',   -- 乘客自己取消
  'cancelled',   -- 班次取消导致
  'boarded',     -- 已核对 PIN 上车
  'no_show',     -- 集合点等满 5 分钟未到
  'completed'    -- 行程结束
);
create type public.route_source as enum ('google', 'mock');
create type public.group_buy_status as enum ('open', 'full', 'purchased', 'closed', 'cancelled');
create type public.post_kind as enum ('swap', 'giveaway', 'wanted', 'notice');
create type public.post_status as enum ('open', 'reserved', 'closed');
create type public.push_platform as enum ('web', 'ios', 'android');
create type public.report_target as enum ('user', 'trip', 'message', 'post', 'comment', 'group_buy', 'meeting_point', 'review');
create type public.report_reason as enum ('safety', 'harassment', 'discrimination', 'spam', 'fraud', 'no_show_dispute', 'inappropriate', 'other');
create type public.report_status as enum ('open', 'reviewing', 'resolved', 'dismissed');
create type public.credit_reason as enum ('no_show', 'late_cancel', 'driver_late_cancel', 'trip_completed', 'admin_adjust');
create type public.points_reason as enum ('full_car', 'admin_adjust');

-- ---------------------------------------------------------------------
-- 1. 用户
-- ---------------------------------------------------------------------

-- 公开资料：所有登录用户可见，所以这里不放任何隐私字段
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 30),
  avatar_path text,
  bio text check (char_length(bio) <= 200),
  locale text not null default 'zh' check (locale in ('zh', 'en')),
  primary_role public.user_role,                       -- 注册时选；为空表示还没完成引导
  active_role public.user_role not null default 'rider',   -- 当前身份，可随时切换，首页按它显示
  verification_level public.verification_level not null default 'phone',  -- 由触发器维护
  full_verified_at timestamptz,                        -- 完整级：管理员手动设置（暂不做审核流程）
  status public.account_status not null default 'active',
  is_admin boolean not null default false,
  -- 公开的汇总数据，由触发器维护，客户端不能改
  rating_avg numeric(3, 2),                            -- 最近 100 次评价平均，满 3 次才有值
  rating_count integer not null default 0,
  trips_completed integer not null default 0,
  onboarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 隐私资料：只有本人和管理员能看
create table public.user_private (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  phone text,                                          -- 从 auth.users 同步
  home_address text,                                   -- 只用来匹配小区、在本机计算离集合点多远；从不公开
  home_lat double precision,
  home_lng double precision,
  school_email text,                                   -- 验证通过的学校邮箱
  school_email_verified_at timestamptz,
  updated_at timestamptz not null default now(),
  check ((home_lat is null) = (home_lng is null))
);

-- 信用分：本人、管理员、正在处理他报名的车主可见
create table public.user_credit (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  score integer not null default 100 check (score between 0 and 100),
  no_shows_60d integer not null default 0,
  restricted_until timestamptz,                        -- 在此之前不能报名
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 2. 社区与认证
-- ---------------------------------------------------------------------

create table public.communities (
  id uuid primary key default gen_random_uuid(),
  name_zh text not null,
  name_en text not null,
  kind public.community_kind not null,
  center_lat double precision,
  center_lng double precision,
  radius_m integer check (radius_m between 50 and 5000),  -- 住址落在这个范围内可以加入
  email_domain text,                                    -- 学校邮箱域名，如 utoronto.ca（子域名也算）
  city text not null default 'Toronto',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  check (kind = 'school' or (center_lat is not null and center_lng is not null and radius_m is not null)),
  check (kind <> 'school' or email_domain is not null)
);

-- 成员名单不公开（防止别人推断谁住在哪栋楼），只有本人和管理员能看到成员行
create table public.community_members (
  community_id uuid not null references public.communities (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  source public.membership_source not null,
  joined_at timestamptz not null default now(),
  primary key (community_id, user_id)
);
create index community_members_user_idx on public.community_members (user_id);

-- 住址附近还没有社区时，用户可以申请开通（只填楼名或路口，不要求门牌号）
create table public.community_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  building_or_area text not null check (char_length(building_or_area) between 2 and 120),
  note text check (char_length(note) <= 300),
  status text not null default 'open' check (status in ('open', 'created', 'declined')),
  created_at timestamptz not null default now()
);

-- 完整级认证：先只留接口（提交实名和驾照照片），暂不做审核流程
create table public.identity_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  real_name text not null check (char_length(real_name) between 2 and 80),
  licence_front_path text,                             -- 私有存储桶 identity-docs
  licence_back_path text,
  status text not null default 'submitted' check (status in ('submitted', 'approved', 'rejected')),
  reviewer_id uuid references public.profiles (id),
  reviewed_at timestamptz,
  note text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 3. 车辆
-- ---------------------------------------------------------------------

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  make_model text not null check (char_length(make_model) between 2 and 60),
  color text not null check (char_length(color) between 1 and 30),
  plate_hint text,                                     -- 车牌前两位，公开显示；全号在 vehicle_plates
  seats_total smallint not null check (seats_total between 2 and 7),     -- 含司机
  trunk_size public.trunk_size not null default 'medium',
  fuel_l_per_100km numeric(4, 1) not null check (fuel_l_per_100km between 3 and 25),  -- 公开显示
  pets boolean not null default false,
  smoking boolean not null default false,
  photos_updated_at timestamptz,                       -- 卡片显示“照片更新于 X 天前”
  cleanliness_avg numeric(3, 2),                       -- 最近 20 次，满 3 次才有值
  cleanliness_count integer not null default 0,
  listing_paused boolean not null default false,       -- 整洁度低于 3.0 时暂停公开班次
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index vehicles_owner_idx on public.vehicles (owner_id);

-- 车牌全号：车主、管理员、已被接受的乘客（出发前后）可见
create table public.vehicle_plates (
  vehicle_id uuid primary key references public.vehicles (id) on delete cascade,
  plate text not null check (char_length(plate) between 2 and 10)
);

create table public.vehicle_photos (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  kind text not null check (kind in ('seat', 'trunk')),  -- 只拍车内，避免照片里露出车牌
  storage_path text not null,
  created_at timestamptz not null default now()
);
create index vehicle_photos_vehicle_idx on public.vehicle_photos (vehicle_id);

-- ---------------------------------------------------------------------
-- 4. 目的地、集合点、油价（管理员维护）
-- ---------------------------------------------------------------------

create table public.destinations (
  id uuid primary key default gen_random_uuid(),
  brand text not null,                                 -- 'costco' | 'tnt' | 'ikea' | ...
  name_zh text not null,
  name_en text not null,
  address text not null,
  lat double precision not null,
  lng double precision not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 集合点：公共、明亮、能临时停车的地方；从不使用私人住址
create table public.meeting_points (
  id uuid primary key default gen_random_uuid(),
  name_zh text not null check (char_length(name_zh) between 2 and 60),
  name_en text,
  description text check (char_length(description) <= 200),   -- 如“北门雨棚下”
  kind public.meeting_point_kind not null default 'other',
  lat double precision not null,
  lng double precision not null,
  is_official boolean not null default false,          -- 平台推荐的官方集合点
  community_id uuid references public.communities (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index meeting_points_official_idx on public.meeting_points (community_id) where is_official and is_active;

-- 油价由平台统一设置（GTA 平均价），车主不能自己定价
create table public.fuel_prices (
  id bigint generated always as identity primary key,
  region text not null default 'GTA',
  cents_per_litre integer not null check (cents_per_litre between 50 and 350),
  effective_from date not null,
  source_note text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  unique (region, effective_from)
);

-- ---------------------------------------------------------------------
-- 5. 班次
-- ---------------------------------------------------------------------

-- 重复班次模板（如每周六 10:00 去 Costco），定时任务提前生成每一期 trips
create table public.trip_series (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.profiles (id) on delete cascade,
  vehicle_id uuid not null references public.vehicles (id),
  destination_id uuid not null references public.destinations (id),
  visibility public.trip_visibility not null default 'community',
  community_id uuid references public.communities (id),
  weekday smallint not null check (weekday between 0 and 6),          -- 0 = 周日
  depart_time time not null,                           -- 第一个集合点的时间（多伦多时间）
  est_return_minutes integer check (est_return_minutes between 30 and 600),
  seats_offered smallint not null check (seats_offered between 1 and 6),
  min_riders smallint not null default 2 check (min_riders between 1 and 6),
  signup_close_hours smallint not null default 12 check (signup_close_hours between 2 and 72),
  notes text check (char_length(notes) <= 300),
  starts_on date not null,
  ends_on date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  check (visibility = 'public' or community_id is not null),
  check (min_riders <= seats_offered),
  check (ends_on is null or ends_on >= starts_on)
);

create table public.trip_series_meeting_points (
  series_id uuid not null references public.trip_series (id) on delete cascade,
  seq smallint not null check (seq between 1 and 3),
  meeting_point_id uuid not null references public.meeting_points (id),
  offset_minutes smallint not null default 0 check (offset_minutes between 0 and 90),  -- 相对出发时间
  primary key (series_id, seq)
);

create table public.trip_series_skips (
  series_id uuid not null references public.trip_series (id) on delete cascade,
  skip_date date not null,
  primary key (series_id, skip_date)
);

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  series_id uuid references public.trip_series (id) on delete set null,
  driver_id uuid not null references public.profiles (id) on delete cascade,
  vehicle_id uuid not null references public.vehicles (id),
  destination_id uuid not null references public.destinations (id),
  visibility public.trip_visibility not null default 'community',
  community_id uuid references public.communities (id),
  depart_at timestamptz not null,                      -- = 第一个集合点的经过时间
  est_return_at timestamptz,
  seats_offered smallint not null check (seats_offered between 1 and 6),
  min_riders smallint not null default 2 check (min_riders >= 1),   -- 只算乘客（含同行家人），不含车主
  signup_deadline timestamptz not null,                -- 到点判断是否成团，之后不再接受报名
  status public.trip_status not null default 'open',
  cancel_reason public.cancel_reason,
  -- 发布时冻结，之后车主不能改：
  fuel_l_per_100km numeric(4, 1) not null check (fuel_l_per_100km between 3 and 25),
  gas_cents_per_litre integer not null check (gas_cents_per_litre between 50 and 350),
  route_version integer not null default 0,            -- 集合点变化后重新算路线，版本加 1
  notes text check (char_length(notes) <= 300),
  share_token text not null unique default encode(extensions.gen_random_bytes(9), 'hex'),
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (visibility = 'public' or community_id is not null),
  check (min_riders <= seats_offered),
  check (signup_deadline <= depart_at),
  check (status <> 'cancelled' or cancel_reason is not null)
);
create index trips_status_depart_idx on public.trips (status, depart_at);
create index trips_community_depart_idx on public.trips (community_id, depart_at);
create index trips_driver_depart_idx on public.trips (driver_id, depart_at);
create unique index trips_series_once_idx on public.trips (series_id, depart_at) where series_id is not null;

-- 班次的集合点（1–3 个），乘客提议的新集合点也放这里（status = 'proposed'，车主同意后变 active）
create table public.trip_meeting_points (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  meeting_point_id uuid not null references public.meeting_points (id),
  status public.trip_mp_status not null default 'active',
  seq smallint check (seq between 1 and 3),            -- 去程顺序；回程默认倒序
  pass_at timestamptz,                                 -- 经过时间
  proposed_by uuid references public.profiles (id) on delete set null,
  proposal_note text check (char_length(proposal_note) <= 200),
  created_at timestamptz not null default now(),
  unique (trip_id, meeting_point_id),
  unique (trip_id, id),
  check (status <> 'active' or (seq is not null and pass_at is not null))
);
create unique index trip_mp_active_seq_idx on public.trip_meeting_points (trip_id, seq) where status = 'active';

-- ---------------------------------------------------------------------
-- 6. 报名、上车
-- ---------------------------------------------------------------------

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  rider_id uuid not null references public.profiles (id) on delete cascade,
  pickup_tmp_id uuid not null,                         -- 上车集合点
  dropoff_tmp_id uuid not null,                        -- 回程下车点，默认同上车点
  party_size smallint not null default 1 check (party_size between 1 and 4),  -- 含同行家人，每人算一份 AA
  message text check (char_length(message) <= 200),
  status public.booking_status not null default 'pending',
  decided_at timestamptz,
  boarded_at timestamptz,
  no_show_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (trip_id, pickup_tmp_id) references public.trip_meeting_points (trip_id, id),
  foreign key (trip_id, dropoff_tmp_id) references public.trip_meeting_points (trip_id, id)
);
create unique index bookings_one_active_idx on public.bookings (trip_id, rider_id)
  where status in ('pending', 'accepted', 'boarded');
create index bookings_rider_idx on public.bookings (rider_id, created_at desc);
create index bookings_trip_status_idx on public.bookings (trip_id, status);

-- 上车 PIN 单独放：只有乘客本人能看；车主输入后由数据库函数核对，车主读不到
create table public.booking_pins (
  booking_id uuid primary key references public.bookings (id) on delete cascade,
  pin char(4) not null check (pin ~ '^[0-9]{4}$'),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 7. 路线与油费
-- 公开路线只包括：集合点 →（集合点）→ 超市 →（集合点）→ 集合点。
-- 车主家到第一个集合点、最后一个集合点回家这两段车上只有车主，不影响别人分摊，所以不公开、不入账。
-- ---------------------------------------------------------------------

create table public.route_stops (
  trip_id uuid not null references public.trips (id) on delete cascade,
  route_version integer not null,
  seq smallint not null,
  kind text not null check (kind in ('pickup', 'destination', 'dropoff')),
  trip_meeting_point_id uuid references public.trip_meeting_points (id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  primary key (trip_id, route_version, seq)
);

create table public.route_legs (
  trip_id uuid not null references public.trips (id) on delete cascade,
  route_version integer not null,
  seq smallint not null,                               -- 第 seq 段 = 第 seq 站 → 第 seq+1 站
  distance_km numeric(7, 2) not null check (distance_km >= 0),   -- 只来自地图，车主不能改
  duration_min integer,
  source public.route_source not null,
  computed_at timestamptz not null default now(),
  primary key (trip_id, route_version, seq)
);

-- 行程结束后生成的账单（以数据库为准）；行程中的实时预估由前端用同一算法计算
create table public.fare_settlements (
  trip_id uuid primary key references public.trips (id) on delete cascade,
  route_version integer not null,
  fuel_l_per_100km numeric(4, 1) not null,
  gas_cents_per_litre integer not null,
  total_cents integer not null check (total_cents >= 0),
  legs jsonb not null,                                 -- 逐段快照：公里数、油费、车上有谁
  finalized_at timestamptz not null default now()
);

create table public.fare_shares (
  id bigint generated always as identity primary key,
  trip_id uuid not null references public.fare_settlements (trip_id) on delete cascade,
  user_id uuid references public.profiles (id) on delete set null,
  booking_id uuid references public.bookings (id) on delete set null,   -- 车主这一行为空
  is_driver boolean not null default false,
  amount_cents integer not null check (amount_cents >= 0),
  exact_cents numeric(12, 4) not null,
  paid_marked_at timestamptz,                          -- 乘客点“已付”（线下转账，平台不经手钱）
  received_confirmed_at timestamptz,                   -- 车主点“已收到”（可选）
  unique (trip_id, user_id)
);

-- ---------------------------------------------------------------------
-- 8. 准时与信用
-- ---------------------------------------------------------------------

create table public.credit_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  delta integer not null,
  reason public.credit_reason not null,
  trip_id uuid references public.trips (id) on delete set null,
  booking_id uuid references public.bookings (id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);
create index credit_events_user_idx on public.credit_events (user_id, created_at desc);

-- ---------------------------------------------------------------------
-- 9. 关注、通知、推送
-- ---------------------------------------------------------------------

create table public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  driver_id uuid not null references public.profiles (id) on delete cascade,
  notify boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (follower_id, driver_id),
  check (follower_id <> driver_id)
);
create index follows_driver_idx on public.follows (driver_id);

create table public.notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,              -- 'trip_new' | 'booking_accepted' | 'trip_cancelled_min_riders' | ...（文案在 i18n 文件）
  payload jsonb not null default '{}',
  read_at timestamptz,
  pushed_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);

-- Web Push 订阅；以后 Capacitor 打包成 APP，iOS / 安卓的设备 token 也存这里
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  platform public.push_platform not null,
  endpoint text,
  p256dh text,
  auth_secret text,
  device_token text,
  user_agent text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  check (
    (platform = 'web' and endpoint is not null and p256dh is not null and auth_secret is not null)
    or (platform <> 'web' and device_token is not null)
  )
);
create unique index push_subscriptions_endpoint_idx on public.push_subscriptions (endpoint) where endpoint is not null;
create unique index push_subscriptions_token_idx on public.push_subscriptions (device_token) where device_token is not null;

-- ---------------------------------------------------------------------
-- 10. 社交：班次群聊、拼单分装、小区帖子
-- ---------------------------------------------------------------------

create table public.trip_messages (
  id bigint generated always as identity primary key,
  trip_id uuid not null references public.trips (id) on delete cascade,
  sender_id uuid references public.profiles (id) on delete set null,
  body text not null check (char_length(body) between 1 and 1000),
  phrase_key text,                                     -- 快捷短语，前端按读者的语言显示
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);
create index trip_messages_trip_idx on public.trip_messages (trip_id, id);

-- 拼单分装：如“一箱鸡蛋三家分”。发起人必须在这趟车上；同一社区的邻居都可以参加，在集合点分
create table public.group_buys (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  organizer_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 2 and 80),
  details text check (char_length(details) <= 300),
  est_total_cents integer check (est_total_cents between 0 and 100000),
  portions_total smallint not null check (portions_total between 2 and 12),
  handoff_tmp_id uuid,                                 -- 在哪个集合点分
  status public.group_buy_status not null default 'open',
  receipt_total_cents integer check (receipt_total_cents between 0 and 100000),
  receipt_photo_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (trip_id, handoff_tmp_id) references public.trip_meeting_points (trip_id, id)
);
create index group_buys_trip_idx on public.group_buys (trip_id);

create table public.group_buy_participants (
  group_buy_id uuid not null references public.group_buys (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  portions smallint not null default 1 check (portions between 1 and 6),
  joined_at timestamptz not null default now(),
  paid_marked_at timestamptz,
  primary key (group_buy_id, user_id)
);

-- 小区主页的帖子：闲置交换、免费送、求购、通知
create table public.community_posts (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  kind public.post_kind not null,
  title text not null check (char_length(title) between 2 and 80),
  body text check (char_length(body) <= 1000),
  price_cents integer check (price_cents between 0 and 1000000),   -- 为空表示免费或交换
  status public.post_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index community_posts_community_idx on public.community_posts (community_id, created_at desc);

create table public.post_photos (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts (id) on delete cascade,
  storage_path text not null,
  created_at timestamptz not null default now()
);

create table public.post_comments (
  id bigint generated always as identity primary key,
  post_id uuid not null references public.community_posts (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);
create index post_comments_post_idx on public.post_comments (post_id, id);

-- ---------------------------------------------------------------------
-- 11. 评价、整洁度、徽章
-- ---------------------------------------------------------------------

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  reviewer_id uuid not null references public.profiles (id) on delete cascade,
  reviewee_id uuid not null references public.profiles (id) on delete cascade,
  stars smallint not null check (stars between 1 and 5),
  tags text[] not null default '{}',
  comment text check (char_length(comment) <= 300),
  created_at timestamptz not null default now(),
  unique (trip_id, reviewer_id, reviewee_id),
  check (reviewer_id <> reviewee_id)
);
create index reviews_reviewee_idx on public.reviews (reviewee_id, created_at desc);

-- 原始整洁度评分只给评分人和管理员看；车主只看到汇总（避免针对评分人）
create table public.cleanliness_ratings (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  rater_id uuid not null references public.profiles (id) on delete cascade,
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  score smallint not null check (score between 1 and 5),
  tags text[] not null default '{}'
    check (tags <@ array['seats_clean', 'no_odor', 'trunk_usable', 'no_pet_hair', 'not_as_pictured']::text[]),
  created_at timestamptz not null default now(),
  unique (trip_id, rater_id)
);
create index cleanliness_vehicle_idx on public.cleanliness_ratings (vehicle_id, created_at desc);

-- 徽章名称和说明在 i18n 文件里，这里只存代码
create table public.badges (
  code text primary key,
  sort smallint not null default 0,
  is_active boolean not null default true
);

create table public.user_badges (
  user_id uuid not null references public.profiles (id) on delete cascade,
  badge_code text not null references public.badges (code) on delete cascade,
  awarded_at timestamptz not null default now(),
  primary key (user_id, badge_code)
);

-- ---------------------------------------------------------------------
-- 12. 优惠券与积分（先做展示，线下使用）
-- ---------------------------------------------------------------------

create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  merchant text not null,
  title_zh text not null,
  title_en text not null,
  details_zh text,
  details_en text,
  image_path text,
  valid_from date,
  valid_until date,
  award_rule text not null default 'full_car' check (award_rule in ('full_car', 'manual')),
  quantity_total integer check (quantity_total >= 0),  -- 为空表示不限量
  quantity_granted integer not null default 0,
  is_active boolean not null default true,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  check (valid_until is null or valid_from is null or valid_until >= valid_from)
);

-- 券码池（管理员批量导入），只有管理员能看；发出时把券码复制到 coupon_grants
create table public.coupon_codes (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons (id) on delete cascade,
  code text not null,
  assigned_at timestamptz,
  unique (coupon_id, code)
);

create table public.coupon_grants (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  trip_id uuid references public.trips (id) on delete set null,
  code text,
  granted_at timestamptz not null default now(),
  used_marked_at timestamptz                           -- 用户自己标记“已使用”
);
create unique index coupon_grants_once_per_trip_idx on public.coupon_grants (coupon_id, trip_id) where trip_id is not null;
create index coupon_grants_user_idx on public.coupon_grants (user_id, granted_at desc);

create table public.points_ledger (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  delta integer not null,
  reason public.points_reason not null,
  trip_id uuid references public.trips (id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);
create unique index points_once_per_trip_idx on public.points_ledger (user_id, trip_id, reason) where trip_id is not null;

-- ---------------------------------------------------------------------
-- 13. 举报与管理
-- ---------------------------------------------------------------------

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles (id) on delete set null,
  target_type public.report_target not null,
  target_id text not null,                             -- uuid，或消息/评论的数字 id
  reason public.report_reason not null,
  details text check (char_length(details) <= 1000),
  status public.report_status not null default 'open',
  handled_by uuid references public.profiles (id),
  resolution_note text,
  created_at timestamptz not null default now(),
  handled_at timestamptz
);
create index reports_status_idx on public.reports (status, created_at desc);

create table public.admin_actions (
  id bigint generated always as identity primary key,
  admin_id uuid references public.profiles (id) on delete set null,
  action text not null,
  target_type text not null,
  target_id text not null,
  note text,
  created_at timestamptz not null default now()
);

-- 可调的业务参数（管理员可改）
create table public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.app_settings (key, value) values
  ('wait_minutes', '5'),                      -- 每个集合点最多等几分钟
  ('signup_close_hours_default', '12'),       -- 默认出发前几小时截止报名
  ('recurring_horizon_days', '14'),           -- 重复班次提前生成几天
  ('review_window_days', '7'),                -- 行程结束后几天内可以评价
  ('full_car_points', '10'),                  -- 满员车主得几积分
  ('credit_rules', '{
      "no_show": -20,
      "late_cancel": -10, "late_cancel_hours": 2,
      "driver_late_cancel": -15, "driver_late_cancel_hours": 12,
      "trip_completed": 2,
      "restrict": [{"no_shows_60d": 2, "days": 7}, {"no_shows_60d": 3, "days": 30}]
   }');

insert into public.badges (code, sort) values
  ('first_trip', 10),        -- 完成第一趟
  ('good_neighbor', 20),     -- 好邻居：完成 5 趟以上、评分 4.5 以上、90 天内没有缺席
  ('punctual', 30),          -- 准时达人：连续 10 趟没有缺席
  ('tidy_car', 40),          -- 整洁车主：整洁度 4.5 以上（至少 5 次评分）
  ('group_buy_helper', 50);  -- 拼单热心人：发起并完成 3 次拼单
