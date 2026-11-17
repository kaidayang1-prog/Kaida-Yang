-- =====================================================================
-- 种子数据（只用于本地开发：supabase db reset 时自动导入）
-- 坐标、门店地址都是近似值，只为了演示；正式上线前由管理员在后台核对。
-- 住址只用路口，不用具体门牌号。
--
-- 测试账号（验证码都是 123456，见 config.toml 的 [auth.sms.test_otp]）：
--   416-555-0101  Lily   车主（完整级），北约克中心，有车
--   416-555-0102  Wei    车主（邻居级），万锦 Unionville，有车
--   416-555-0103  Amy    乘客，北约克中心
--   416-555-0104  Ben    乘客，北约克中心
--   416-555-0105  Chen   乘客，多伦多大学（学校邮箱）
--   416-555-0106  Dana   乘客，万锦 Unionville
--   416-555-0107  Admin  管理员，北约克中心
--   416-555-0110 / 0111 / 0112  新用户，没有资料，用来测试注册引导
-- =====================================================================

-- ---------- 社区 ----------
insert into public.communities (id, name_zh, name_en, kind, center_lat, center_lng, radius_m, email_domain, city) values
  ('c0000000-0000-4000-8000-000000000001', '北约克中心', 'North York Centre', 'area', 43.7680, -79.4135, 1200, null, 'Toronto'),
  ('c0000000-0000-4000-8000-000000000002', '万锦 Unionville', 'Markham Unionville', 'area', 43.8665, -79.3140, 1500, null, 'Markham'),
  ('c0000000-0000-4000-8000-000000000003', '多伦多大学', 'University of Toronto', 'school', null, null, null, 'utoronto.ca', 'Toronto'),
  ('c0000000-0000-4000-8000-000000000004', '约克大学', 'York University', 'school', null, null, null, 'yorku.ca', 'Toronto');

-- ---------- 目的地（门店） ----------
insert into public.destinations (id, brand, name_zh, name_en, address, lat, lng) values
  ('d0000000-0000-4000-8000-000000000001', 'costco', 'Costco 北约克', 'Costco North York', '100 Billy Bishop Way, North York, ON', 43.7266, -79.4689),
  ('d0000000-0000-4000-8000-000000000002', 'costco', 'Costco 士嘉堡', 'Costco Scarborough', '1411 Warden Ave, Scarborough, ON', 43.7713, -79.3030),
  ('d0000000-0000-4000-8000-000000000003', 'tnt', 'T&T 大统华 Promenade 店', 'T&T Supermarket Promenade', '1 Promenade Circle, Thornhill, ON', 43.8072, -79.4512),
  ('d0000000-0000-4000-8000-000000000004', 'tnt', 'T&T 大统华 Cherry Street 店', 'T&T Supermarket Cherry Street', '222 Cherry St, Toronto, ON', 43.6513, -79.3533),
  ('d0000000-0000-4000-8000-000000000005', 'ikea', 'IKEA 北约克', 'IKEA North York', '15 Provost Dr, North York, ON', 43.7697, -79.3836),
  ('d0000000-0000-4000-8000-000000000006', 'ikea', 'IKEA 怡陶碧谷', 'IKEA Etobicoke', '1475 The Queensway, Etobicoke, ON', 43.6237, -79.5076);

-- ---------- 官方集合点（公共、明亮、能临时停车） ----------
insert into public.meeting_points (id, name_zh, name_en, description, kind, lat, lng, is_official, community_id) values
  ('e0000000-0000-4000-8000-000000000001', 'North York Centre 地铁站', 'North York Centre Station', 'Park Home Ave 出口旁的临时停车带', 'subway', 43.7686, -79.4128, true, 'c0000000-0000-4000-8000-000000000001'),
  ('e0000000-0000-4000-8000-000000000002', 'Mel Lastman Square 北侧', 'Mel Lastman Square (north side)', '广场北侧落客区', 'plaza', 43.7681, -79.4152, true, 'c0000000-0000-4000-8000-000000000001'),
  ('e0000000-0000-4000-8000-000000000003', 'Sheppard-Yonge 地铁站', 'Sheppard-Yonge Station', 'Kiss & Ride 接送区', 'subway', 43.7612, -79.4109, true, 'c0000000-0000-4000-8000-000000000001'),
  ('e0000000-0000-4000-8000-000000000004', 'Finch 地铁站', 'Finch Station', 'Kiss & Ride 接送区', 'subway', 43.7807, -79.4155, true, 'c0000000-0000-4000-8000-000000000001'),
  ('e0000000-0000-4000-8000-000000000005', 'Unionville GO 站', 'Unionville GO Station', '接送区', 'parking', 43.8516, -79.3145, true, 'c0000000-0000-4000-8000-000000000002'),
  ('e0000000-0000-4000-8000-000000000006', 'St. George 地铁站', 'St. George Station', 'Bedford Rd 出口', 'subway', 43.6683, -79.3997, true, 'c0000000-0000-4000-8000-000000000003');

-- ---------- 油价（GTA 平均价，示例） ----------
insert into public.fuel_prices (region, cents_per_litre, effective_from, source_note) values
  ('GTA', 145, date '2026-11-01', '示例价格：上线前由管理员更新为当周 GTA 平均油价');

-- ---------- 测试账号 ----------
-- 直接写入登录系统的用户表；触发器会自动建公开资料、隐私资料和信用分
insert into auth.users (
  instance_id, id, aud, role, phone, phone_confirmed_at, email, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select '00000000-0000-0000-0000-000000000000', u.id::uuid, 'authenticated', 'authenticated', u.phone, now(),
       u.email, case when u.email is null then null else now() end,
       '{"provider":"phone","providers":["phone"]}'::jsonb, '{"locale":"zh"}'::jsonb, now(), now(),
       '', '', '', ''
  from (values
    ('00000000-0000-4000-8000-000000000101', '14165550101', null),
    ('00000000-0000-4000-8000-000000000102', '14165550102', null),
    ('00000000-0000-4000-8000-000000000103', '14165550103', null),
    ('00000000-0000-4000-8000-000000000104', '14165550104', null),
    ('00000000-0000-4000-8000-000000000105', '14165550105', 'chen@mail.utoronto.ca'),
    ('00000000-0000-4000-8000-000000000106', '14165550106', null),
    ('00000000-0000-4000-8000-000000000107', '14165550107', null)
  ) as u (id, phone, email);

insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select u.id::text, u.id,
       jsonb_build_object('sub', u.id::text, 'phone', u.phone, 'phone_verified', true),
       'phone', now(), now(), now()
  from auth.users u
 where u.id::text like '00000000-0000-4000-8000-000000000%';

-- 公开资料
update public.profiles p
   set display_name = s.name, primary_role = s.role::public.user_role, active_role = s.role::public.user_role,
       onboarded_at = now(), is_admin = s.admin, full_verified_at = case when s.is_full then now() end
  from (values
    ('00000000-0000-4000-8000-000000000101', 'Lily', 'driver', false, true),
    ('00000000-0000-4000-8000-000000000102', 'Wei', 'driver', false, false),
    ('00000000-0000-4000-8000-000000000103', 'Amy', 'rider', false, false),
    ('00000000-0000-4000-8000-000000000104', 'Ben', 'rider', false, false),
    ('00000000-0000-4000-8000-000000000105', 'Chen', 'rider', false, false),
    ('00000000-0000-4000-8000-000000000106', 'Dana', 'rider', false, false),
    ('00000000-0000-4000-8000-000000000107', 'Admin', 'rider', true, false)
  ) as s (id, name, role, admin, is_full)
 where p.id = s.id::uuid;

-- 住址（路口，不用门牌号）
update public.user_private up
   set home_address = s.address, home_lat = s.lat, home_lng = s.lng
  from (values
    ('00000000-0000-4000-8000-000000000101', 'Yonge St & Finch Ave, North York', 43.7746, -79.4140),
    ('00000000-0000-4000-8000-000000000102', 'Main St Unionville & Hwy 7, Markham', 43.8600, -79.3140),
    ('00000000-0000-4000-8000-000000000103', 'Yonge St & Park Home Ave, North York', 43.7690, -79.4136),
    ('00000000-0000-4000-8000-000000000104', 'Doris Ave & Byng Ave, North York', 43.7730, -79.4105),
    ('00000000-0000-4000-8000-000000000106', 'Main St Unionville & Carlton Rd, Markham', 43.8700, -79.3200),
    ('00000000-0000-4000-8000-000000000107', 'Yonge St & Sheppard Ave, North York', 43.7615, -79.4110)
  ) as s (id, address, lat, lng)
 where up.user_id = s.id::uuid;

update public.user_private
   set school_email = 'chen@mail.utoronto.ca', school_email_verified_at = now()
 where user_id = '00000000-0000-4000-8000-000000000105';

-- 社区成员（触发器会把认证等级升为邻居级；Lily 已设为完整级）
insert into public.community_members (community_id, user_id, source) values
  ('c0000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000101', 'address'),
  ('c0000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000102', 'address'),
  ('c0000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000103', 'address'),
  ('c0000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000104', 'address'),
  ('c0000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000105', 'school_email'),
  ('c0000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000106', 'address'),
  ('c0000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000107', 'address');

-- ---------- 车辆（照片在 M2 加） ----------
insert into public.vehicles (id, owner_id, make_model, color, seats_total, trunk_size, fuel_l_per_100km, pets, smoking) values
  ('b0000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000101', 'Honda Odyssey', '白色', 7, 'large', 8.5, false, false),
  ('b0000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000102', 'Toyota RAV4', '灰色', 5, 'medium', 7.8, true, false);

insert into public.vehicle_plates (vehicle_id, plate) values
  ('b0000000-0000-4000-8000-000000000001', 'CRPL 214'),
  ('b0000000-0000-4000-8000-000000000002', 'BKMR 551');
