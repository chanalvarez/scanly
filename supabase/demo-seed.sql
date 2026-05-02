-- ============================================================
-- SCANLY DEMO SEED
-- Run this in your Scanly demo Supabase project SQL Editor
--
-- 1. Make sure schema.sql has been run first
-- 2. Run this file in SQL Editor
--
-- No demo user UUID needed — the app uses public RLS policies
-- (anon key has full read/write access as configured in schema.sql)
-- ============================================================

-- ── Wipe existing sample data so this is idempotent ─────────
delete from inventory where sku like 'DEMO-%';

-- ── Demo inventory (realistic Philippine retail store) ───────
-- Mix of healthy stock, low stock (< 5), and zero stock
-- to show all dashboard states and Low Stock badges
insert into inventory (name, sku, qr_code, stock_count, price) values

  -- Grocery / FMCG
  ('Lucky Me Pancit Canton Original',  'DEMO-LM-001', '4800016012345',  48,   9.00),
  ('Nescafe 3-in-1 Original (30s)',    'DEMO-NS-002', '4800567890123',   3,  89.50),
  ('Safeguard White Bar Soap 135g',    'DEMO-SG-003', '4800194567890',  12,  45.75),
  ('Ariel Powder Detergent 500g',      'DEMO-AR-004', '4800261234567',   2, 115.00),
  ('Milo Powdered Choco Drink 300g',   'DEMO-ML-005', '4800200987654',  19,  98.00),

  -- Personal care
  ('Pantene Shampoo Smooth 180ml',     'DEMO-PT-006', '4800178345678',   7,  89.00),
  ('Colgate Cavity Protection 150ml',  'DEMO-CG-007', '4800191234567',  15,  65.25),
  ('Dove Body Lotion 200ml',           'DEMO-DV-008', '4800292345678',   1, 139.00),
  ('Gillette Fusion Razor 2s',         'DEMO-GL-009', '4800098765432',   4, 210.00),
  ('Listerine Cool Mint 250ml',        'DEMO-LS-010', '4800123987654',   9, 145.00),

  -- Beverages
  ('C2 Apple Green Tea 355ml',         'DEMO-C2-011', '4800134567890',  30,  25.00),
  ('Zesto Orange Juice 250ml',         'DEMO-ZS-012', '4800145678901',  22,  18.00),
  ('Cobra Energy Drink 240ml',         'DEMO-CB-013', '4800156789012',   0,  35.00),
  ('Summit Mineral Water 500ml',       'DEMO-SW-014', '4800167890123',  60,  15.00),

  -- Snacks
  ('Piattos Cheese 85g',               'DEMO-PA-015', '4800178901234',  11,  45.00),
  ('Nova Country Cheddar 78g',         'DEMO-NV-016', '4800189012345',   3,  40.00),
  ('Chippy BBQ 110g',                  'DEMO-CP-017', '4800190123456',   8,  42.00),
  ('Skyflakes Crackers 250g',          'DEMO-SK-018', '4800201234567',   2,  55.00),

  -- Household
  ('Zonrox Bleach Regular 500ml',      'DEMO-ZN-019', '4800212345678',  14,  48.00),
  ('Downy Fabric Conditioner 800ml',   'DEMO-DW-020', '4800223456789',   5,  99.75),
  ('Joy Dishwashing Liquid 250ml',     'DEMO-JY-021', '4800234567890',  18,  55.00),
  ('Baygon Multi-Insect Killer 600ml', 'DEMO-BG-022', '4800245678901',   1, 189.00)

on conflict (sku)     do update set stock_count = excluded.stock_count, price = excluded.price
-- also handle barcode column uniqueness gracefully
on conflict (qr_code) do update set stock_count = excluded.stock_count, price = excluded.price;

-- ── Scan history table (portfolio demo feed) ─────────────────
create table if not exists scan_history (
  id            uuid primary key default gen_random_uuid(),
  document_label text not null,
  barcode       text,
  product_name  text,
  scanned_at    timestamptz not null default now()
);

alter table scan_history enable row level security;

drop policy if exists "Public can read scan_history" on scan_history;
create policy "Public can read scan_history"
  on scan_history for select using (true);

-- Clear old demo scan history
delete from scan_history;

insert into scan_history (document_label, barcode, product_name, scanned_at) values
  ('Stock check · SC-DEMO-001', '4800016012345', 'Lucky Me Pancit Canton Original', now() - interval '15 minutes'),
  ('Receiving · RCV-DEMO-042',  '4800567890123', 'Nescafe 3-in-1 Original (30s)',   now() - interval '40 minutes'),
  ('Cycle count · CC-DEMO-08',  '4800261234567', 'Ariel Powder Detergent 500g',     now() - interval '2 hours'),
  ('Return auth · RA-DEMO-003', '4800292345678', 'Dove Body Lotion 200ml',          now() - interval '5 hours'),
  ('Stock check · SC-DEMO-002', '4800178901234', 'Piattos Cheese 85g',              now() - interval '1 day'),
  ('Receiving · RCV-DEMO-043',  '4800189012345', 'Nova Country Cheddar 78g',        now() - interval '2 days'),
  ('Cycle count · CC-DEMO-09',  '4800201234567', 'Skyflakes Crackers 250g',         now() - interval '3 days');
