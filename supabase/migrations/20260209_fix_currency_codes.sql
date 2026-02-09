-- Fix existing 'TL' currency values to 'TRY'
update employees
set currency = 'TRY'
where currency = 'TL' or currency is null;
