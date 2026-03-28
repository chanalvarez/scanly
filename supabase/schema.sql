-- Scanly inventory table
-- Run this in your Supabase SQL editor:
-- https://supabase.com/dashboard/project/<your-project>/sql

create table if not exists inventory (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  sku         text unique not null,
  qr_code     text unique not null,
  stock_count integer not null default 0,
  price       numeric(10,2) not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Auto-update updated_at on row change
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger inventory_updated_at
  before update on inventory
  for each row execute function update_updated_at_column();

-- Enable Row Level Security (optional but recommended)
alter table inventory enable row level security;

-- Allow public read/write (adjust for your auth requirements)
create policy "Public can read inventory"
  on inventory for select using (true);

create policy "Public can insert inventory"
  on inventory for insert with check (true);

create policy "Public can update inventory"
  on inventory for update using (true);

-- Enable real-time so the dashboard updates live across all connected staff
alter publication supabase_realtime add table inventory;

-- Sample data
insert into inventory (name, sku, qr_code, stock_count, price) values
  ('Wireless Mouse',     'WM-001', 'PROD-WM-001', 15, 29.99),
  ('Mechanical Keyboard','KB-001', 'PROD-KB-001',  3, 89.99),
  ('USB-C Hub',          'HB-001', 'PROD-HB-001',  8, 49.99),
  ('Monitor Stand',      'MS-001', 'PROD-MS-001',  1, 39.99),
  ('Webcam HD',          'WC-001', 'PROD-WC-001', 22, 69.99);
