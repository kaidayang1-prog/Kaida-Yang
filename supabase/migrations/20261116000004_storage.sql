-- =====================================================================
-- 文件存储（Supabase Storage）
-- 路径约定（第一段文件夹决定权限）：
--   avatars/{用户id}/文件              公开读，本人写
--   vehicle-photos/{车主id}/{车辆id}/文件   能看到这辆车的人可读，车主写（只拍车内）
--   post-photos/{社区id}/{帖子id}/文件      本社区成员可读，发帖人写
--   receipts/{拼单id}/文件              能看到这个拼单的人可读，发起人写
--   identity-docs/{用户id}/文件         只有本人和管理员可读（驾照照片）
--   coupon-images/文件                  公开读，管理员写
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp']),
  ('vehicle-photos', 'vehicle-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/heic']),
  ('post-photos', 'post-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/heic']),
  ('receipts', 'receipts', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/heic']),
  ('identity-docs', 'identity-docs', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']),
  ('coupon-images', 'coupon-images', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- 头像
create policy avatars_read on storage.objects
  for select to authenticated using (bucket_id = 'avatars');
create policy avatars_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy avatars_update on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy avatars_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- 车内照片
create policy vehicle_photos_read on storage.objects
  for select to authenticated
  using (bucket_id = 'vehicle-photos' and public.can_view_vehicle(public.try_uuid((storage.foldername(name))[2])));
create policy vehicle_photos_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'vehicle-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.owns_vehicle(public.try_uuid((storage.foldername(name))[2]))
  );
create policy vehicle_photos_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'vehicle-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- 帖子照片
create policy post_photos_read on storage.objects
  for select to authenticated
  using (bucket_id = 'post-photos' and public.is_member_of(public.try_uuid((storage.foldername(name))[1])));
create policy post_photos_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'post-photos'
    and public.is_member_of(public.try_uuid((storage.foldername(name))[1]))
    and public.owns_post(public.try_uuid((storage.foldername(name))[2]))
  );
create policy post_photos_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'post-photos' and public.owns_post(public.try_uuid((storage.foldername(name))[2])));

-- 拼单小票
create policy receipts_read on storage.objects
  for select to authenticated
  using (bucket_id = 'receipts' and public.can_view_group_buy(public.try_uuid((storage.foldername(name))[1])));
create policy receipts_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'receipts' and public.is_group_buy_organizer(public.try_uuid((storage.foldername(name))[1])));
create policy receipts_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'receipts' and public.is_group_buy_organizer(public.try_uuid((storage.foldername(name))[1])));

-- 驾照等认证材料
create policy identity_docs_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'identity-docs'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_admin()))
  );
create policy identity_docs_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'identity-docs' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy identity_docs_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'identity-docs' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- 优惠券图片
create policy coupon_images_read on storage.objects
  for select to authenticated using (bucket_id = 'coupon-images');
create policy coupon_images_admin on storage.objects
  for all to authenticated
  using (bucket_id = 'coupon-images' and (select public.is_admin()))
  with check (bucket_id = 'coupon-images' and (select public.is_admin()));
