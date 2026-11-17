-- =====================================================================
-- M1 测试：引导、按住址加入小区、删除账号（supabase test db）
-- =====================================================================
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(14);

create function pg_temp.login_as(p_user uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
end $$;

create function pg_temp.logout() returns void language plpgsql as $$
begin
  perform set_config('role', 'none', true);
  perform set_config('request.jwt.claims', '', true);
end $$;

insert into auth.users (id, phone) values
  ('a1111111-0000-0000-0000-000000000001', '+14165559901'),   -- 住在小区 A 里
  ('a1111111-0000-0000-0000-000000000002', '+14165559902');   -- 还没填住址

-- 放在渥太华附近，避开种子数据里的大多伦多社区
insert into public.communities (id, name_zh, name_en, kind, center_lat, center_lng, radius_m) values
  ('c1111111-0000-0000-0000-00000000000a', '小区 A', 'Complex A', 'complex', 45.4215, -75.6972, 500),
  ('c1111111-0000-0000-0000-00000000000b', '小区 B', 'Complex B', 'complex', 45.5000, -75.5000, 500);
insert into public.communities (id, name_zh, name_en, kind, email_domain) values
  ('c1111111-0000-0000-0000-00000000000c', '某大学', 'Some University', 'school', 'example.edu');

select ok(abs(public.distance_m(45.4215, -75.6972, 45.4305, -75.6972) - 1000) < 5, '纬度差 0.009 度约等于 1 公里');

-- ---------- 住在小区 A 的用户 ----------
select pg_temp.login_as('a1111111-0000-0000-0000-000000000001');

select lives_ok(
  $$ update public.user_private set home_address = 'Wellington St & Bank St', home_lat = 45.4220, home_lng = -75.6980
     where user_id = 'a1111111-0000-0000-0000-000000000001' $$,
  '用户可以保存自己的住址');
select results_eq(
  $$ select id from public.nearby_communities() $$,
  $$ values ('c1111111-0000-0000-0000-00000000000a'::uuid) $$,
  '附近的小区只列出住址范围内的（不包括学校）');
select throws_ok(
  $$ select public.join_community_by_address('c1111111-0000-0000-0000-00000000000b') $$,
  'P0001', 'outside_community_area', '住址不在范围内的小区不能加入');
select throws_ok(
  $$ select public.join_community_by_address('c1111111-0000-0000-0000-00000000000c') $$,
  'P0001', 'community_not_found', '学校社区不能用住址加入');
select lives_ok(
  $$ select public.join_community_by_address('c1111111-0000-0000-0000-00000000000a') $$,
  '住址在范围内可以加入');
select is(
  (select verification_level::text from public.profiles where id = 'a1111111-0000-0000-0000-000000000001'),
  'neighbor', '加入小区后成为邻居级');
select lives_ok(
  $$ select public.join_community_by_address('c1111111-0000-0000-0000-00000000000a') $$,
  '重复加入不会报错');
select throws_ok(
  $$ update public.profiles set onboarded_at = now() where id = 'a1111111-0000-0000-0000-000000000001' $$,
  '23514', null, '没有昵称和主要身份不能完成引导');
select lives_ok(
  $$ update public.profiles set display_name = 'Amy', primary_role = 'rider', active_role = 'rider', onboarded_at = now()
     where id = 'a1111111-0000-0000-0000-000000000001' $$,
  '填了昵称和主要身份就能完成引导');

-- ---------- 还没填住址的用户 ----------
select pg_temp.login_as('a1111111-0000-0000-0000-000000000002');
select throws_ok(
  $$ select public.join_community_by_address('c1111111-0000-0000-0000-00000000000a') $$,
  'P0001', 'no_home_address', '没填住址不能按住址加入');
select is_empty($$ select * from public.nearby_communities() $$, '没填住址时附近没有小区');
select lives_ok($$ select public.delete_my_account() $$, '用户可以删除自己的账号');

select pg_temp.logout();
select is(
  (select count(*)::int from public.profiles where id = 'a1111111-0000-0000-0000-000000000002'),
  0, '删除账号后资料一起删除');

select * from finish();
rollback;
