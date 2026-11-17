-- =====================================================================
-- 权限（RLS）测试：用 `supabase test db` 运行（pgTAP）
-- 场景：Lily 是车主（Avondale 小区），Amy 是同小区乘客，Dana 住另一个小区，Eve 刚注册，还有一个管理员。
-- 数据库里可能已有种子数据，所以每条断言都只统计本测试自己建的数据。
-- =====================================================================
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(41);

-- ---------- 切换身份的小工具（只在本次测试事务里存在） ----------
create function pg_temp.login_as(p_user uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
end $$;

create function pg_temp.login_anon() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  perform set_config('role', 'anon', true);
end $$;

create function pg_temp.logout() returns void language plpgsql as $$
begin
  perform set_config('role', 'none', true);
  perform set_config('request.jwt.claims', '', true);
end $$;

-- ---------- 测试数据（以数据库管理员身份写入） ----------
insert into auth.users (id, phone) values
  ('11111111-1111-1111-1111-111111111111', '+14165550101'),   -- Lily 车主
  ('22222222-2222-2222-2222-222222222222', '+14165550102'),   -- Amy 同小区乘客
  ('33333333-3333-3333-3333-333333333333', '+14165550103'),   -- Dana 别的小区
  ('44444444-4444-4444-4444-444444444444', '+14165550104'),   -- 管理员
  ('55555555-5555-5555-5555-555555555555', '+14165550105');   -- Eve 刚注册

select is((select count(*)::int from public.profiles where id in ('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','33333333-3333-3333-3333-333333333333','44444444-4444-4444-4444-444444444444','55555555-5555-5555-5555-555555555555')), 5, '注册后自动创建公开资料');
select is((select count(*)::int from public.user_credit where score = 100 and user_id in ('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','33333333-3333-3333-3333-333333333333','44444444-4444-4444-4444-444444444444','55555555-5555-5555-5555-555555555555')), 5, '注册后信用分为 100');
select ok(
  not exists (select 1 from pg_tables where schemaname = 'public' and not rowsecurity),
  'public 下所有表都开启了 RLS'
);

update public.profiles set display_name = 'Lily', primary_role = 'driver', active_role = 'driver'
 where id = '11111111-1111-1111-1111-111111111111';
update public.profiles set display_name = 'Amy', primary_role = 'rider' where id = '22222222-2222-2222-2222-222222222222';
update public.profiles set display_name = 'Dana', primary_role = 'rider' where id = '33333333-3333-3333-3333-333333333333';
update public.profiles set display_name = 'Admin', is_admin = true where id = '44444444-4444-4444-4444-444444444444';
update public.user_private set home_address = '5168 Yonge St', home_lat = 43.77, home_lng = -79.413
 where user_id = '22222222-2222-2222-2222-222222222222';

insert into public.communities (id, name_zh, name_en, kind, center_lat, center_lng, radius_m, email_domain) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Avondale 小区', 'Avondale', 'complex', 43.770, -79.413, 300, null),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'Finch 公寓', 'Finch Tower', 'building', 43.781, -79.416, 100, null),
  ('aaaaaaaa-0000-0000-0000-000000000003', '多伦多大学', 'University of Toronto', 'school', null, null, null, 'utoronto.ca');

insert into public.community_members (community_id, user_id, source) values
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'address'),
  ('aaaaaaaa-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'address'),
  ('aaaaaaaa-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333', 'address');

select is((select verification_level::text from public.profiles where id = '22222222-2222-2222-2222-222222222222'),
          'neighbor', '加入社区后升为邻居级');
select is((select verification_level::text from public.profiles where id = '55555555-5555-5555-5555-555555555555'),
          'phone', '没加入社区的仍是手机号级');

insert into public.vehicles (id, owner_id, make_model, color, seats_total, fuel_l_per_100km)
values ('bbbbbbbb-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Honda Odyssey', '白色', 7, 8.5);
insert into public.vehicle_plates (vehicle_id, plate) values ('bbbbbbbb-0000-0000-0000-000000000001', 'crpl 214');

select is((select plate_hint from public.vehicles where id = 'bbbbbbbb-0000-0000-0000-000000000001'),
          'CR', '公开显示的车牌只有前两位');

insert into public.destinations (id, brand, name_zh, name_en, address, lat, lng) values
  ('cccccccc-0000-0000-0000-000000000001', 'costco', 'Costco North York', 'Costco North York',
   '100 Billy Bishop Way, North York, ON', 43.725, -79.472);

insert into public.meeting_points (id, name_zh, kind, lat, lng, is_official, created_by) values
  ('dddddddd-0000-0000-0000-000000000001', 'North York Centre 地铁站', 'subway', 43.768, -79.413, true, null),
  ('dddddddd-0000-0000-0000-000000000002', 'Avondale 3 号楼大堂', 'lobby', 43.770, -79.414, false,
   '11111111-1111-1111-1111-111111111111');

insert into public.trips (id, driver_id, vehicle_id, destination_id, visibility, community_id, depart_at,
                          seats_offered, min_riders, signup_deadline, fuel_l_per_100km, gas_cents_per_litre) values
  ('eeeeeeee-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-0000-0000-0000-000000000001',
   'cccccccc-0000-0000-0000-000000000001', 'community', 'aaaaaaaa-0000-0000-0000-000000000001',
   now() + interval '3 days', 3, 2, now() + interval '2 days', 8.5, 169),
  ('eeeeeeee-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-0000-0000-0000-000000000001',
   'cccccccc-0000-0000-0000-000000000001', 'public', null,
   now() + interval '4 days', 3, 2, now() + interval '3 days', 8.5, 169);

insert into public.trip_meeting_points (id, trip_id, meeting_point_id, seq, pass_at) values
  ('ffffffff-0000-0000-0000-000000000001', 'eeeeeeee-0000-0000-0000-000000000001', 'dddddddd-0000-0000-0000-000000000001', 1, now() + interval '3 days'),
  ('ffffffff-0000-0000-0000-000000000002', 'eeeeeeee-0000-0000-0000-000000000001', 'dddddddd-0000-0000-0000-000000000002', 2, now() + interval '3 days 10 minutes'),
  ('ffffffff-0000-0000-0000-000000000003', 'eeeeeeee-0000-0000-0000-000000000002', 'dddddddd-0000-0000-0000-000000000001', 1, now() + interval '4 days');

insert into public.bookings (id, trip_id, rider_id, pickup_tmp_id, dropoff_tmp_id, status) values
  ('99999999-0000-0000-0000-000000000001', 'eeeeeeee-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222',
   'ffffffff-0000-0000-0000-000000000002', 'ffffffff-0000-0000-0000-000000000002', 'accepted');
insert into public.booking_pins (booking_id, pin) values ('99999999-0000-0000-0000-000000000001', '4827');

-- ---------- Amy：同小区、已被接受的乘客 ----------
select pg_temp.login_as('22222222-2222-2222-2222-222222222222');

select is((select count(*)::int from public.trips where id in ('eeeeeeee-0000-0000-0000-000000000001','eeeeeeee-0000-0000-0000-000000000002')), 2, 'Amy 能看到本小区班次和公开班次');
select is((select count(*)::int from public.user_private), 1, 'Amy 只能看到自己的隐私资料（包括种子数据在内，一共只有 1 行）');
select is((select count(*)::int from public.community_members), 1, 'Amy 看不到社区成员名单，只看到自己');
select is((select pin::text from public.booking_pins), '4827', 'Amy 能看到自己的上车 PIN');
select is((select count(*)::int from public.vehicle_plates), 1, '已被接受的乘客能看到车牌全号（方便认车）');
select is((select count(*)::int from public.meeting_points where id in ('dddddddd-0000-0000-0000-000000000001','dddddddd-0000-0000-0000-000000000002')), 2, 'Amy 能看到班次用到的自建集合点');
select lives_ok(
  $$ insert into public.trip_messages (trip_id, sender_id, body)
     values ('eeeeeeee-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', '我到集合点了') $$,
  'Amy 能在自己的班次群聊里发消息');
select throws_ok(
  $$ insert into public.trips (driver_id, vehicle_id, destination_id, visibility, community_id, depart_at,
                               seats_offered, signup_deadline, fuel_l_per_100km, gas_cents_per_litre)
     values ('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-0000-0000-0000-000000000001',
             'cccccccc-0000-0000-0000-000000000001', 'public', null, now() + interval '1 day', 3,
             now() + interval '12 hours', 8.5, 100) $$,
  '42501', null, '客户端不能直接写班次表（必须走 RPC）');
select throws_ok(
  $$ update public.profiles set is_admin = true where id = '22222222-2222-2222-2222-222222222222' $$,
  '42501', null, '用户不能把自己改成管理员');
select throws_ok(
  $$ update public.user_credit set score = 100 where user_id = '22222222-2222-2222-2222-222222222222' $$,
  '42501', null, '用户不能改自己的信用分');
select lives_ok(
  $$ update public.profiles set display_name = 'Amy W' where id = '22222222-2222-2222-2222-222222222222' $$,
  'Amy 能改自己的昵称');
update public.profiles set display_name = 'Hacked' where id = '11111111-1111-1111-1111-111111111111';
select lives_ok(
  $$ insert into public.community_posts (community_id, author_id, kind, title)
     values ('aaaaaaaa-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'giveaway', '送一个婴儿推车') $$,
  'Amy 能在自己小区发闲置帖子');
select throws_ok(
  $$ insert into public.community_members (community_id, user_id, source)
     values ('aaaaaaaa-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'address') $$,
  '42501', null, '不能自己随便加入别的社区（要核对住址或学校邮箱）');
select lives_ok(
  $$ insert into storage.objects (bucket_id, name)
     values ('avatars', '22222222-2222-2222-2222-222222222222/me.png') $$,
  'Amy 能上传自己的头像');
select throws_ok(
  $$ insert into storage.objects (bucket_id, name)
     values ('avatars', '11111111-1111-1111-1111-111111111111/fake.png') $$,
  '42501', null, '不能往别人的文件夹上传');

-- ---------- Dana：另一个小区，没有报名 ----------
select pg_temp.login_as('33333333-3333-3333-3333-333333333333');

select is((select count(*)::int from public.trips where id in ('eeeeeeee-0000-0000-0000-000000000001','eeeeeeee-0000-0000-0000-000000000002')), 1, 'Dana 只能看到公开班次，看不到别的小区的社区班次');
select is((select count(*)::int from public.bookings where id = '99999999-0000-0000-0000-000000000001'), 0, 'Dana 看不到别人的报名');
select is((select count(*)::int from public.vehicles where id = 'bbbbbbbb-0000-0000-0000-000000000001'), 1, 'Dana 能通过公开班次看到车辆资料');
select is((select count(*)::int from public.vehicle_plates where vehicle_id = 'bbbbbbbb-0000-0000-0000-000000000001'), 0, '但看不到车牌全号');
select is((select count(*)::int from public.meeting_points where id in ('dddddddd-0000-0000-0000-000000000001','dddddddd-0000-0000-0000-000000000002')), 1, 'Dana 只能看到官方集合点，看不到别的小区班次的自建点');
select is((select count(*)::int from public.trip_messages where trip_id in ('eeeeeeee-0000-0000-0000-000000000001','eeeeeeee-0000-0000-0000-000000000002')), 0, 'Dana 看不到别人班次的群聊');
select throws_ok(
  $$ insert into public.trip_messages (trip_id, sender_id, body)
     values ('eeeeeeee-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'hi') $$,
  '42501', null, 'Dana 不能在别人的班次群聊发消息');
select is((select count(*)::int from public.community_posts where community_id = 'aaaaaaaa-0000-0000-0000-000000000001'), 0, 'Dana 看不到别的小区的帖子');
select throws_ok(
  $$ insert into public.community_posts (community_id, author_id, kind, title)
     values ('aaaaaaaa-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'swap', '换书') $$,
  '42501', null, 'Dana 不能往别的小区发帖');
select is((select count(*)::int from public.user_credit), 1, 'Dana 只看得到自己的信用分');
select lives_ok(
  $$ insert into public.reports (reporter_id, target_type, target_id, reason)
     values ('33333333-3333-3333-3333-333333333333', 'trip', 'eeeeeeee-0000-0000-0000-000000000002', 'other') $$,
  'Dana 可以举报');

-- ---------- Lily：车主 ----------
select pg_temp.login_as('11111111-1111-1111-1111-111111111111');

select is((select count(*)::int from public.bookings where id = '99999999-0000-0000-0000-000000000001'), 1, '车主能看到自己班次的报名');
select is((select count(*)::int from public.booking_pins), 0, '车主看不到乘客的 PIN（只能输入后由系统核对）');
select is((select count(*)::int from public.user_credit where user_id = '22222222-2222-2222-2222-222222222222'), 1,
          '车主能看到报名乘客的信用分');
select is((select count(*)::int from public.user_private where user_id = '22222222-2222-2222-2222-222222222222'), 0,
          '车主看不到乘客的住址和手机号');

-- ---------- 未登录 ----------
select pg_temp.login_anon();
select throws_ok($$ select count(*) from public.trips $$, '42501', null, '未登录不能直接读任何表');

-- ---------- 管理员 ----------
select pg_temp.login_as('44444444-4444-4444-4444-444444444444');
select is((select count(*)::int from public.user_private where user_id in ('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','33333333-3333-3333-3333-333333333333','44444444-4444-4444-4444-444444444444','55555555-5555-5555-5555-555555555555')), 5, '管理员能看到所有用户的隐私资料');

-- ---------- 系统行为 ----------
select pg_temp.logout();

select is((select display_name from public.profiles where id = '11111111-1111-1111-1111-111111111111'), 'Lily',
          '改别人的资料不会生效');

update auth.users set email = 'eve@mail.utoronto.ca', email_confirmed_at = now()
 where id = '55555555-5555-5555-5555-555555555555';
select is((select verification_level::text from public.profiles where id = '55555555-5555-5555-5555-555555555555'),
          'neighbor', '学校邮箱验证通过后自动加入学校社区，升为邻居级');

update public.profiles set status = 'suspended' where id = '11111111-1111-1111-1111-111111111111';
select pg_temp.login_as('33333333-3333-3333-3333-333333333333');
select is((select count(*)::int from public.trips where id in ('eeeeeeee-0000-0000-0000-000000000001','eeeeeeee-0000-0000-0000-000000000002')), 0, '车主账号被暂停后，他的班次对其他人隐藏');
select pg_temp.logout();

select * from finish();
rollback;
