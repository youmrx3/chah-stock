-- Force the application and database to use Algerian Dinar (DZD) only.

alter table if exists public.stock_items
  add column if not exists price_currency text;

update public.stock_items
set price_currency = 'DZD'
where price_currency is distinct from 'DZD';

do $$
begin
  if to_regclass('public.site_settings') is not null then
    update public.site_settings
    set value = 'DZD'
    where key = 'currency';
  end if;
end $$;

alter table if exists public.stock_items
  drop constraint if exists stock_items_price_currency_check;

alter table if exists public.stock_items
  add constraint stock_items_price_currency_check
  check (price_currency = 'DZD');

alter table if exists public.stock_items
  alter column price_currency set not null,
  alter column price_currency set default 'DZD';
