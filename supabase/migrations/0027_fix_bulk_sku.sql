-- 0027_fix_bulk_sku: bulk_update_variants named a variable "sku", which clashed with the column of the same name.
create or replace function public.bulk_update_variants(p_rows jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  r jsonb;
  v public.product_variants;
  v_sku text;
  target int;
  updated int := 0;
  stock_changes int := 0;
  errors jsonb := '[]'::jsonb;
begin
  if not public.is_admin() then raise exception 'NOT_ADMIN: Only admins can change prices and stock.'; end if;
  for r in select e from jsonb_array_elements(coalesce(p_rows, '[]'::jsonb)) e loop
    v_sku := upper(trim(coalesce(r ->> 'sku', '')));
    begin
      select * into v from public.product_variants where upper(product_variants.sku) = v_sku for update;
      if not found then
        raise exception 'SKU_NOT_FOUND: No size has the SKU %.', v_sku;
      end if;
      if r ? 'price' and (r -> 'price') <> 'null'::jsonb and (r ->> 'price')::numeric < 0 then
        raise exception 'PRICE: Prices can''t be negative.';
      end if;
      if r ? 'price' or r ? 'compare_at_price' then
        update public.product_variants set
          price = case when r ? 'price' then nullif(r ->> 'price', '')::numeric else price end,
          compare_at_price = case when r ? 'compare_at_price' then nullif(r ->> 'compare_at_price', '')::numeric else compare_at_price end
        where id = v.id;
      end if;
      if r ? 'stock' and (r -> 'stock') <> 'null'::jsonb then
        target := (r ->> 'stock')::int;
        if target < 0 then raise exception 'STOCK: Stock can''t be below 0.'; end if;
        if target <> v.stock then
          perform app_private.apply_stock_change(v.id, target - v.stock, 'correction', null, 'Bulk update from spreadsheet');
          stock_changes := stock_changes + 1;
        end if;
      end if;
      updated := updated + 1;
    exception when others then
      errors := errors || jsonb_build_object('sku', v_sku, 'message', app_private.plain_error(sqlerrm));
    end;
  end loop;
  return jsonb_build_object('updated', updated, 'stock_changes', stock_changes, 'errors', errors);
end $$;
