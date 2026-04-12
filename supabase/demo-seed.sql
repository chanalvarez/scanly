-- Scanly demo seed — run in Supabase SQL Editor AFTER supabase/schema.sql
--
-- Demo sign-in (create in Dashboard → Authentication → Users → Add user):
--   Email: demo@scanly.com
--   Password: demo123
--
-- This app does not use Supabase Auth in code yet; the account is for your
-- demo project / manual testing. Inventory + scan history are readable with the anon key.

-- Simulated scan / document log for portfolio demos
create table if not exists scan_history (
  id          uuid primary key default gen_random_uuid(),
  document_label text not null,
  barcode     text,
  product_name text,
  scanned_at  timestamptz not null default now()
);

alter table scan_history enable row level security;

create policy "Public can read scan_history"
  on scan_history for select using (true);

insert into scan_history (document_label, barcode, product_name, scanned_at) values
  ('Receiving manifest · WH-DEMO-1042', 'PROD-KB-001', 'Mechanical Keyboard', now() - interval '35 minutes'),
  ('Cycle count sheet · CC-DEMO-08', 'PROD-HB-001', 'USB-C Hub', now() - interval '2 hours'),
  ('Return authorization · RA-DEMO-003', 'PROD-MS-001', 'Monitor Stand', now() - interval '5 hours'),
  ('Inbound ASN · ASN-DEMO-2401', 'PROD-WM-001', 'Wireless Mouse', now() - interval '1 day'),
  ('Stock transfer · ST-DEMO-91', 'PROD-WC-001', 'Webcam HD', now() - interval '2 days');

-- Extra demo inventory (optional — expands the default sample set)
insert into inventory (name, sku, qr_code, stock_count, price) values
  ('Label Printer', 'LP-010', 'PROD-LP-010', 6, 129.99),
  ('Ergonomic Chair', 'CH-204', 'PROD-CH-204', 2, 249.00)
on conflict (sku) do nothing;
