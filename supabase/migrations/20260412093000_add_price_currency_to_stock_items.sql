alter table public.stock_items
add column if not exists price_currency text not null default 'DZD';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'stock_items_price_currency_check'
  ) then
    alter table public.stock_items
    add constraint stock_items_price_currency_check
    check (price_currency = 'DZD');
  end if;
end $$;

update public.stock_items
set price_currency = 'DZD'
where price_currency is null or price_currency = '';