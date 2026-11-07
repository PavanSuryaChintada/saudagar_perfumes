-- 0008 Drag-to-reorder for admin lists, in one call.

create or replace function public.reorder_rows(p_table text, p_ids uuid[])
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'NOT_ADMIN: Only admins can reorder.';
  end if;
  if p_table not in ('attribute_options', 'categories', 'collections', 'notes', 'product_media', 'product_variants') then
    raise exception 'REORDER_TABLE: % cannot be reordered.', p_table;
  end if;
  execute format(
    'update public.%I t set position = o.ord - 1 from unnest($1) with ordinality as o(id, ord) where t.id = o.id',
    p_table) using p_ids;
end $$;
grant execute on function public.reorder_rows(text, uuid[]) to authenticated;

create or replace function public.reorder_collection_products(p_collection uuid, p_product_ids uuid[])
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'NOT_ADMIN: Only admins can reorder.';
  end if;
  update public.product_collections pc set position = o.ord - 1
  from unnest(p_product_ids) with ordinality as o(id, ord)
  where pc.collection_id = p_collection and pc.product_id = o.id;
end $$;
grant execute on function public.reorder_collection_products(uuid, uuid[]) to authenticated;
