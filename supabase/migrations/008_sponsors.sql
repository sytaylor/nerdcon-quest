-- Inc 6: Sponsors + Sponsor Side Quests

create table if not exists sponsors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tagline text not null,
  logo_emoji text not null default '🏢',
  booth_number text not null,
  website text,
  category text not null check (category in ('platinum', 'gold', 'silver')),
  side_quest_title text not null,
  side_quest_description text not null,
  side_quest_xp int not null default 25,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Track sponsor booth visits (side quest completions)
create table if not exists sponsor_visits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sponsor_id uuid not null references sponsors(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, sponsor_id)
);

-- RLS
alter table sponsors enable row level security;
alter table sponsor_visits enable row level security;

create policy "Anyone can view sponsors" on sponsors for select using (true);
create policy "Users can view own visits" on sponsor_visits for select using (user_id = auth.uid());
create policy "Users can record visits" on sponsor_visits for insert with check (user_id = auth.uid());

-- Seed sponsors (fintech-themed)
insert into sponsors (name, tagline, logo_emoji, booth_number, category, side_quest_title, side_quest_description, side_quest_xp, display_order) values
  ('Stripe', 'Payments infrastructure for the internet', '💳', 'P1', 'platinum', 'Payment Architect', 'Visit the Stripe booth and demo the new Issuing API', 40, 1),
  ('Plaid', 'The easiest way to connect bank accounts', '🔗', 'P2', 'platinum', 'Connection Master', 'Try the Plaid Link demo and connect a sandbox account', 40, 2),
  ('Neon', 'Serverless Postgres for modern apps', '🐘', 'P3', 'platinum', 'Query Runner', 'Run a query on the Neon live demo terminal', 40, 3),
  ('Mercury', 'Banking for startups', '🚀', 'G1', 'gold', 'Startup Banker', 'Chat with the Mercury team about treasury APIs', 30, 4),
  ('Ramp', 'The corporate card that saves you money', '💰', 'G2', 'gold', 'Expense Hunter', 'Snap a receipt with the Ramp receipt scanner', 30, 5),
  ('Moov', 'Money movement APIs', '⚡', 'G3', 'gold', 'Money Mover', 'Move mock money through the Moov sandbox', 30, 6),
  ('Alloy', 'Identity decisioning for fintech', '🛡️', 'G4', 'gold', 'Identity Verifier', 'Run a mock KYC check on the Alloy demo', 30, 7),
  ('Unit', 'Banking-as-a-service for platforms', '🏦', 'S1', 'silver', 'Platform Builder', 'See the Unit embedded banking demo', 25, 8),
  ('Lithic', 'Card issuing infrastructure', '💎', 'S2', 'silver', 'Card Crafter', 'Design a custom card on the Lithic sandbox', 25, 9),
  ('Sardine', 'Fraud and compliance platform', '🐟', 'S3', 'silver', 'Fraud Fighter', 'Spot the fraudulent transaction in the Sardine demo', 25, 10),
  ('Synctera', 'Banking-as-a-service for fintechs', '🔄', 'S4', 'silver', 'BaaS Explorer', 'Tour the Synctera partner dashboard', 25, 11),
  ('Upstash', 'Serverless Redis and Kafka', '🔴', 'S5', 'silver', 'Cache Commander', 'Set and get a key in the Upstash Redis playground', 25, 12);
