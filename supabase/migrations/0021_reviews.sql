-- 0021_reviews: verified-buyer reviews (admin approved, photos, longevity/sillage feedback, helpful votes),
-- product ratings from approved reviews, the wishlist saved to the account, and back-in-stock requests.

-- ============================================================ reviews
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  order_item_id uuid unique references public.order_items (id) on delete set null,
  rating int not null check (rating between 1 and 5),
  title text check (title is null or length(title) <= 120),
  body text check (body is null or length(body) <= 2000),
  longevity_option_id uuid references public.attribute_options (id) on delete set null,
  sillage_option_id uuid references public.attribute_options (id) on delete set null,
  display_name text not null check (length(trim(display_name)) between 1 and 60),
  city text check (city is null or length(city) <= 60),
  status text not null default 'PENDING' check (status in ('PENDING', 'APPROVED', 'REJECTED', 'HIDDEN')),
  admin_note text,
  helpful_count int not null default 0,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, user_id)
);
create index if not exists reviews_product_idx on public.reviews (product_id, status, created_at desc);
create index if not exists reviews_status_idx on public.reviews (status, created_at desc);
drop trigger if exists reviews_updated_at on public.reviews;
create trigger reviews_updated_at before update on public.reviews for each row execute function public.set_updated_at();

create table if not exists public.review_media (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews (id) on delete cascade,
  path text not null,
  position int not null default 0
);
create index if not exists review_media_review_idx on public.review_media (review_id, position);

create table if not exists public.review_votes (
  review_id uuid not null references public.reviews (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (review_id, user_id)
);

alter table public.reviews enable row level security;
alter table public.review_media enable row level security;
alter table public.review_votes enable row level security;
drop policy if exists reviews_read on public.reviews;
create policy reviews_read on public.reviews for select to anon, authenticated using (status = 'APPROVED' or user_id = auth.uid() or public.is_admin());
drop policy if exists review_media_read on public.review_media;
create policy review_media_read on public.review_media for select to anon, authenticated
  using (exists (select 1 from public.reviews r where r.id = review_id and (r.status = 'APPROVED' or r.user_id = auth.uid() or public.is_admin())));
drop policy if exists review_votes_own on public.review_votes;
create policy review_votes_own on public.review_votes for select to authenticated using (user_id = auth.uid() or public.is_admin());

create or replace function app_private.refresh_product_rating(pid uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform set_config('app.derived_write', 'on', true);
  update public.products p set
    rating_avg = coalesce((select round(avg(rating)::numeric, 2) from public.reviews where product_id = pid and status = 'APPROVED'), 0),
    rating_count = (select count(*) from public.reviews where product_id = pid and status = 'APPROVED')
  where p.id = pid;
  perform set_config('app.derived_write', 'off', true);
end $$;

-- Products the signed-in customer can review: delivered, not yet reviewed.
create or replace function public.reviewable_items()
returns table (order_item_id uuid, product_id uuid, product_name text, product_slug text, image_url text, order_number text, delivered_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select distinct on (i.product_id) i.id, i.product_id, i.product_name, i.product_slug, i.image_url, o.order_number, o.delivered_at
  from public.order_items i join public.orders o on o.id = i.order_id
  where o.user_id = auth.uid() and o.status = 'DELIVERED' and i.line_type = 'item' and i.product_id is not null
    and not exists (select 1 from public.reviews r where r.product_id = i.product_id and r.user_id = auth.uid())
  order by i.product_id, o.delivered_at desc
$$;
grant execute on function public.reviewable_items() to authenticated;

create or replace function public.submit_review(
  p_order_item uuid, p_rating int, p_title text, p_body text, p_longevity uuid, p_sillage uuid,
  p_display_name text, p_city text, p_media jsonb default '[]'::jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  it public.order_items;
  o public.orders;
  rid uuid;
  m text;
  pos int := 0;
begin
  select * into it from public.order_items where id = p_order_item;
  select * into o from public.orders where id = it.order_id;
  if it.id is null or o.user_id is distinct from auth.uid() or it.line_type <> 'item' then
    raise exception 'REVIEW_NOT_ALLOWED: You can review products from your delivered orders.';
  end if;
  if o.status <> 'DELIVERED' then
    raise exception 'REVIEW_NOT_ALLOWED: You can review this once your order is delivered.';
  end if;
  if exists (select 1 from public.reviews where product_id = it.product_id and user_id = auth.uid()) then
    raise exception 'REVIEW_EXISTS: You''ve already reviewed this fragrance.';
  end if;
  if p_rating is null or p_rating not between 1 and 5 then
    raise exception 'REVIEW_RATING: Choose 1 to 5 stars.';
  end if;
  if nullif(trim(coalesce(p_display_name, '')), '') is null then
    raise exception 'REVIEW_NAME: Add the name to show with your review.';
  end if;
  if jsonb_typeof(coalesce(p_media, '[]'::jsonb)) <> 'array' or jsonb_array_length(coalesce(p_media, '[]'::jsonb)) > 4 then
    raise exception 'REVIEW_MEDIA: Add up to 4 photos.';
  end if;
  if p_longevity is not null and not exists (select 1 from public.attribute_options where id = p_longevity and kind = 'longevity') then
    raise exception 'REVIEW_OPTION: Choose a longevity from the list.';
  end if;
  if p_sillage is not null and not exists (select 1 from public.attribute_options where id = p_sillage and kind = 'sillage') then
    raise exception 'REVIEW_OPTION: Choose a sillage from the list.';
  end if;
  insert into public.reviews (product_id, user_id, order_item_id, rating, title, body, longevity_option_id, sillage_option_id, display_name, city)
  values (it.product_id, auth.uid(), it.id, p_rating, nullif(trim(coalesce(p_title, '')), ''), nullif(trim(coalesce(p_body, '')), ''),
          p_longevity, p_sillage, trim(p_display_name), nullif(trim(coalesce(p_city, '')), ''))
  returning id into rid;
  for m in select jsonb_array_elements_text(coalesce(p_media, '[]'::jsonb)) loop
    if split_part(m, '/', 1) <> auth.uid()::text then
      raise exception 'REVIEW_MEDIA: Upload the photos again.';
    end if;
    insert into public.review_media (review_id, path, position) values (rid, m, pos);
    pos := pos + 1;
  end loop;
  return rid;
end $$;
grant execute on function public.submit_review(uuid, int, text, text, uuid, uuid, text, text, jsonb) to authenticated;

create or replace function public.vote_review(p_review uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r public.reviews; voted boolean;
begin
  if auth.uid() is null then
    raise exception 'SIGN_IN_REQUIRED: Sign in to vote.';
  end if;
  select * into r from public.reviews where id = p_review and status = 'APPROVED';
  if not found then raise exception 'REVIEW_NOT_FOUND: Review not found.'; end if;
  if r.user_id = auth.uid() then raise exception 'REVIEW_OWN: You can''t vote on your own review.'; end if;
  if exists (select 1 from public.review_votes where review_id = p_review and user_id = auth.uid()) then
    delete from public.review_votes where review_id = p_review and user_id = auth.uid();
    voted := false;
  else
    insert into public.review_votes (review_id, user_id) values (p_review, auth.uid());
    voted := true;
  end if;
  update public.reviews set helpful_count = (select count(*) from public.review_votes where review_id = p_review) where id = p_review
  returning helpful_count into r.helpful_count;
  return jsonb_build_object('voted', voted, 'helpful_count', r.helpful_count);
end $$;
grant execute on function public.vote_review(uuid) to authenticated;

create or replace function public.moderate_review(p_review uuid, p_status text, p_note text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare pid uuid;
begin
  if not public.is_admin() then raise exception 'NOT_ADMIN: Only admins can moderate reviews.'; end if;
  if p_status not in ('APPROVED', 'REJECTED', 'HIDDEN', 'PENDING') then raise exception 'REVIEW_STATUS: Choose a status.'; end if;
  update public.reviews set status = p_status, admin_note = nullif(trim(coalesce(p_note, '')), ''),
    approved_at = case when p_status = 'APPROVED' then coalesce(approved_at, now()) else approved_at end
  where id = p_review returning product_id into pid;
  if pid is null then raise exception 'REVIEW_NOT_FOUND: Review not found.'; end if;
  perform app_private.refresh_product_rating(pid);
end $$;
grant execute on function public.moderate_review(uuid, text, text) to authenticated;

-- The product page: approved reviews with summary, newest / most helpful / highest / lowest.
create or replace function public.product_reviews(p_slug text, p_sort text default 'newest', p_page int default 0, p_page_size int default 6)
returns jsonb language sql stable security definer set search_path = '' as $$
  with p as (select id from public.products where slug = p_slug and is_active and archived_at is null),
  rv as (select r.* from public.reviews r join p on p.id = r.product_id where r.status = 'APPROVED')
  select jsonb_build_object(
    'count', (select count(*) from rv),
    'average', coalesce((select round(avg(rating)::numeric, 1) from rv), 0),
    'distribution', (select jsonb_object_agg(s, (select count(*) from rv where rating = s)) from generate_series(1, 5) s),
    'longevity', coalesce((select jsonb_agg(jsonb_build_object('label', o.label, 'count', c) order by c desc)
      from (select longevity_option_id, count(*) c from rv where longevity_option_id is not null group by 1) x
      join public.attribute_options o on o.id = x.longevity_option_id), '[]'::jsonb),
    'sillage', coalesce((select jsonb_agg(jsonb_build_object('label', o.label, 'count', c) order by c desc)
      from (select sillage_option_id, count(*) c from rv where sillage_option_id is not null group by 1) x
      join public.attribute_options o on o.id = x.sillage_option_id), '[]'::jsonb),
    'reviews', coalesce((
      select jsonb_agg(row order by ord)
      from (
        select jsonb_build_object(
          'id', r.id, 'rating', r.rating, 'title', r.title, 'body', r.body, 'display_name', r.display_name, 'city', r.city,
          'created_at', r.created_at, 'helpful_count', r.helpful_count, 'verified', r.order_item_id is not null,
          'longevity', (select label from public.attribute_options where id = r.longevity_option_id),
          'sillage', (select label from public.attribute_options where id = r.sillage_option_id),
          'mine', r.user_id = auth.uid(),
          'voted', exists (select 1 from public.review_votes v where v.review_id = r.id and v.user_id = auth.uid()),
          'media', coalesce((select jsonb_agg(m.path order by m.position) from public.review_media m where m.review_id = r.id), '[]'::jsonb)
        ) as row,
        row_number() over (order by
          case when p_sort = 'helpful' then r.helpful_count end desc nulls last,
          case when p_sort = 'highest' then r.rating end desc nulls last,
          case when p_sort = 'lowest' then r.rating end asc nulls last,
          r.created_at desc) as ord
        from rv r
        order by ord
        offset greatest(0, p_page) * least(24, greatest(1, p_page_size))
        limit least(24, greatest(1, p_page_size))
      ) page), '[]'::jsonb)
  )
$$;
grant execute on function public.product_reviews(text, text, int, int) to anon, authenticated;

-- ============================================================ wishlist
create table if not exists public.wishlists (
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);
alter table public.wishlists enable row level security;
drop policy if exists wishlists_own on public.wishlists;
create policy wishlists_own on public.wishlists for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists wishlists_admin on public.wishlists;
create policy wishlists_admin on public.wishlists for select to authenticated using (public.is_admin());

create or replace function public.my_wishlist()
returns text[] language sql stable security definer set search_path = '' as $$
  select coalesce(array_agg(p.slug order by w.created_at), '{}')
  from public.wishlists w join public.products p on p.id = w.product_id
  where w.user_id = auth.uid()
$$;
grant execute on function public.my_wishlist() to authenticated;

-- Replaces the saved wishlist with these product slugs (unknown slugs are ignored).
create or replace function public.set_wishlist(p_slugs text[])
returns text[] language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'SIGN_IN_REQUIRED: Sign in to save your wishlist.'; end if;
  delete from public.wishlists w where w.user_id = auth.uid()
    and w.product_id not in (select id from public.products where slug = any (coalesce(p_slugs, '{}')));
  insert into public.wishlists (user_id, product_id)
  select auth.uid(), p.id from public.products p where p.slug = any (coalesce(p_slugs, '{}'))
  on conflict do nothing;
  return public.my_wishlist();
end $$;
grant execute on function public.set_wishlist(text[]) to authenticated;

-- ============================================================ back in stock
create table if not exists public.back_in_stock_requests (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants (id) on delete cascade,
  user_id uuid references auth.users (id) on delete cascade,
  email text check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone text,
  created_at timestamptz not null default now(),
  back_in_stock_at timestamptz,
  notified_at timestamptz
);
create unique index if not exists bis_user_variant on public.back_in_stock_requests (variant_id, user_id) where user_id is not null;
create unique index if not exists bis_email_variant on public.back_in_stock_requests (variant_id, lower(email)) where user_id is null and email is not null;
alter table public.back_in_stock_requests enable row level security;
drop policy if exists bis_read on public.back_in_stock_requests;
create policy bis_read on public.back_in_stock_requests for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists bis_admin on public.back_in_stock_requests;
create policy bis_admin on public.back_in_stock_requests for update to authenticated using (public.is_admin()) with check (public.is_admin());

create or replace function public.request_back_in_stock(p_variant uuid, p_email text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); mail text := lower(nullif(trim(coalesce(p_email, '')), ''));
begin
  if not exists (select 1 from public.product_variants where id = p_variant and kind = 'retail') then
    raise exception 'VARIANT_NOT_FOUND: That size no longer exists.';
  end if;
  if uid is null and (mail is null or mail !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') then
    raise exception 'EMAIL_INVALID: Enter your email and we''ll tell you when it''s back.';
  end if;
  if uid is not null then
    insert into public.back_in_stock_requests (variant_id, user_id, email, phone)
    select p_variant, uid, coalesce(mail, pr.email), pr.phone from public.profiles pr where pr.id = uid
    on conflict (variant_id, user_id) where user_id is not null do update set notified_at = null, back_in_stock_at = null, created_at = now();
  else
    insert into public.back_in_stock_requests (variant_id, email) values (p_variant, mail)
    on conflict (variant_id, lower(email)) where user_id is null and email is not null do update set notified_at = null, back_in_stock_at = null, created_at = now();
  end if;
end $$;
grant execute on function public.request_back_in_stock(uuid, text) to anon, authenticated;

-- When a size comes back (0 → more), open requests are flagged for the admin to notify.
create or replace function app_private.variants_back_in_stock()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.stock = 0 and new.stock > 0 then
    update public.back_in_stock_requests set back_in_stock_at = now()
    where variant_id = new.id and notified_at is null and back_in_stock_at is null;
  end if;
  return new;
end $$;
drop trigger if exists variants_back_in_stock on public.product_variants;
create trigger variants_back_in_stock after update of stock on public.product_variants for each row execute function app_private.variants_back_in_stock();
