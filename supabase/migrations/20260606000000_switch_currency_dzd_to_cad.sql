-- Switch currency from Algerian Dinar (DZD) to Canadian Dollar (CAD)

-- Update existing records in stock_items
update stock_items
set price_currency = 'CAD'
where price_currency is distinct from 'CAD';

-- Update the site settings default currency
update site_settings
set value = 'CAD'
where key = 'currency';

-- Recreate the check constraint to allow CAD
alter table stock_items
drop constraint if exists stock_items_price_currency_check;

alter table stock_items
add constraint stock_items_price_currency_check
check (price_currency = 'CAD');

-- Set default for new records
alter table stock_items
alter column price_currency set default 'CAD';
