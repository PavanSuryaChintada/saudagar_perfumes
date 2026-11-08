-- 0032_pieces_for_sets: accessories and discovery sets are counted in pieces, not poured from liquid. The move to
-- liquid (0028) treated any product with sizes in ml as a perfume; these keep the counts each size has now.
do $$
declare rec record;
begin
  for rec in
    select p.id from public.products p join public.categories c on c.id = p.primary_category_id
    where c.slug in ('accessories', 'discovery-sets', 'gift-sets') and p.stock_unit = 'ml'
  loop
    perform set_config('app.stock_write', 'on', true);
    update public.products set stock_unit = 'piece', stock_ml = 0 where id = rec.id;
    perform set_config('app.stock_write', 'off', true);
    insert into public.inventory_movements (product_id, delta, stock_after, reason, note)
    values (rec.id, 0, 0, 'correction', 'Counted in pieces (accessory or set); each size keeps its current count');
  end loop;
end $$;
