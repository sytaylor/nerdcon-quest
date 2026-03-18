-- 002_sessions_schedule.sql
-- Session and schedule support for NerdCon Quest (Nov 19-20 2026, San Diego)

-- ============================================================================
-- TABLES
-- ============================================================================

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  track text check (track in ('builder', 'operator', 'explorer', 'general')),
  session_type text check (session_type in ('keynote', 'panel', 'workshop', 'fireside', 'lightning', 'social')),
  room text,
  day integer check (day in (1, 2)),
  start_time time not null,
  end_time time not null,
  speaker_names text[],
  speaker_bios jsonb default '[]'::jsonb,
  capacity integer,
  tags text[],
  created_at timestamptz default now()
);

create table if not exists public.user_schedule (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  session_id uuid not null references public.sessions(id) on delete cascade,
  added_at timestamptz default now(),
  unique (user_id, session_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

create index if not exists idx_sessions_day on public.sessions (day);
create index if not exists idx_sessions_track on public.sessions (track);
create index if not exists idx_sessions_session_type on public.sessions (session_type);
create index if not exists idx_sessions_start_time on public.sessions (start_time);
create index if not exists idx_user_schedule_user_id on public.user_schedule (user_id);
create index if not exists idx_user_schedule_session_id on public.user_schedule (session_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

alter table public.sessions enable row level security;
alter table public.user_schedule enable row level security;

-- Sessions: anyone can read (public schedule)
create policy "Sessions are publicly readable"
  on public.sessions for select
  using (true);

-- User schedule: owner can read own entries
create policy "Users can read own schedule"
  on public.user_schedule for select
  using (auth.uid() = user_id);

-- User schedule: owner can add to own schedule
create policy "Users can add to own schedule"
  on public.user_schedule for insert
  with check (auth.uid() = user_id);

-- User schedule: owner can remove from own schedule
create policy "Users can remove from own schedule"
  on public.user_schedule for delete
  using (auth.uid() = user_id);

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Day 1: November 19, 2026

insert into public.sessions (title, description, track, session_type, room, day, start_time, end_time, speaker_names, speaker_bios, capacity, tags) values

-- 09:00-10:00 Opening Keynote
(
  'Opening Keynote: Welcome to NerdCon Quest',
  'Kick off two days of fintech exploration with a look at the forces reshaping financial services — and why the builders in this room will define what comes next.',
  'general', 'keynote', 'Main Stage', 1, '09:00', '10:00',
  array['Maya Chen'],
  '[{"name": "Maya Chen", "bio": "Serial fintech founder and angel investor. Previously co-founded Payable (acq. 2023). Forbes 30 Under 30.", "company": "Arcline Ventures", "role": "General Partner"}]'::jsonb,
  500,
  array['fintech', 'innovation']
),

-- 10:15-11:00 Embedded Finance
(
  'The Future of Embedded Finance',
  'From buy-now-pay-later to insurance-at-checkout, embedded finance is eating the world. Panelists debate where the real value accrues and what gets commoditised.',
  'builder', 'panel', 'Main Stage', 1, '10:15', '11:00',
  array['Raj Patel', 'Samira Okafor', 'David Weiss'],
  '[{"name": "Raj Patel", "bio": "Built embedded lending APIs processing $2B+ annually.", "company": "LendLayer", "role": "CTO"}, {"name": "Samira Okafor", "bio": "Former Stripe product lead, now building BaaS infrastructure for African markets.", "company": "Kora Finance", "role": "CEO"}, {"name": "David Weiss", "bio": "15 years in payments infrastructure. Card-issuing nerd.", "company": "Marqeta", "role": "VP Engineering"}]'::jsonb,
  500,
  array['payments', 'banking', 'embedded-finance']
),

-- 10:15-11:00 Compliance
(
  'Scaling Compliance at Speed',
  'Hands-on workshop covering how to ship fast without getting a consent order. Real playbooks from teams that went from 0 to 10M users under a regulated umbrella.',
  'operator', 'workshop', 'Workshop A', 1, '10:15', '11:00',
  array['Elena Rodriguez'],
  '[{"name": "Elena Rodriguez", "bio": "Ex-OCC examiner turned startup compliance architect. Helped three neobanks get chartered.", "company": "Comply.ai", "role": "Founder & CEO"}]'::jsonb,
  80,
  array['compliance', 'regulation']
),

-- 11:15-12:00 Real-Time Payments
(
  'Building Real-Time Payment Rails',
  'Deep dive into FedNow, RTP, and the plumbing that makes instant payments work. Bring your laptop — we are building a settlement simulator live.',
  'builder', 'workshop', 'Workshop B', 1, '11:15', '12:00',
  array['James Okonkwo'],
  '[{"name": "James Okonkwo", "bio": "Payments infrastructure engineer who has built real-time rails for three central banks.", "company": "Moov Financial", "role": "Principal Engineer"}]'::jsonb,
  60,
  array['payments', 'infrastructure']
),

-- 11:15-12:00 Product-Led Growth
(
  'Product-Led Growth in Fintech',
  'Can you really PLG a financial product? Panelists from consumer and SMB fintech share what worked, what flopped, and the metrics that matter.',
  'operator', 'panel', 'Workshop A', 1, '11:15', '12:00',
  array['Lisa Tran', 'Marcus Webb'],
  '[{"name": "Lisa Tran", "bio": "Grew a neobank from 0 to 3M users with zero paid acquisition.", "company": "Braid Finance", "role": "VP Growth"}, {"name": "Marcus Webb", "bio": "B2B fintech growth leader. Obsessed with activation funnels.", "company": "Ramp", "role": "Head of Product"}]'::jsonb,
  80,
  array['growth', 'product']
),

-- 12:00-13:00 Lunch
(
  'Lunch & Networking',
  'Grab lunch, meet fellow nerds, and check out the sponsor booths. Side quest stations open for QR badge scanning.',
  'general', 'social', 'Networking Hub', 1, '12:00', '13:00',
  array[]::text[],
  '[]'::jsonb,
  500,
  array['networking']
),

-- 13:00-13:45 API Design
(
  'API Design for Financial Services',
  'Idempotency keys, webhook reliability, versioning strategies, and error handling patterns for APIs that move money. Drawn from real production incidents.',
  'builder', 'workshop', 'Workshop B', 1, '13:00', '13:45',
  array['Priya Sharma'],
  '[{"name": "Priya Sharma", "bio": "Designed APIs used by 50K+ developers at a top payments company. Author of \"Financial API Patterns\".", "company": "Plaid", "role": "Staff Engineer"}]'::jsonb,
  60,
  array['payments', 'api', 'infrastructure']
),

-- 13:00-13:45 Fundraising
(
  'Fundraising in a Down Market',
  'Candid fireside chat on raising when multiples have compressed. What VCs actually want to see, how to extend runway, and when to consider alternative funding.',
  'operator', 'fireside', 'Main Stage', 1, '13:00', '13:45',
  array['Nadia Karim', 'Tom Blomfield'],
  '[{"name": "Nadia Karim", "bio": "Fintech-focused VC who has led 30+ seed and Series A rounds.", "company": "Ribbit Capital", "role": "Partner"}, {"name": "Tom Blomfield", "bio": "Founded two fintech unicorns. Now advises early-stage founders.", "company": "Independent", "role": "Advisor & Angel Investor"}]'::jsonb,
  500,
  array['fundraising', 'venture-capital']
),

-- 14:00-14:45 ZKP Identity
(
  'Zero-Knowledge Proofs for Identity',
  'Lightning talks on how ZKPs can prove you are over 18, solvent, or KYC-verified without revealing underlying data. Demos included.',
  'builder', 'lightning', 'Workshop A', 1, '14:00', '14:45',
  array['Anika Patel', 'Kwame Asante'],
  '[{"name": "Anika Patel", "bio": "Cryptography PhD building privacy-preserving identity verification.", "company": "zkMe", "role": "Co-Founder"}, {"name": "Kwame Asante", "bio": "Smart contract auditor and ZKP researcher.", "company": "Ethereum Foundation", "role": "Research Engineer"}]'::jsonb,
  80,
  array['identity', 'privacy', 'cryptography']
),

-- 14:00-14:45 CFO AI Spend
(
  'The CFO''s Guide to AI Spend',
  'AI budgets are exploding but ROI is murky. Finance leaders discuss how to evaluate, budget, and measure AI investments without lighting money on fire.',
  'operator', 'panel', 'Main Stage', 1, '14:00', '14:45',
  array['Rebecca Liu', 'Jonathan Marks', 'Fatima Al-Hassan'],
  '[{"name": "Rebecca Liu", "bio": "CFO who scaled a fintech from Series B to IPO. Known for ruthless capital allocation.", "company": "Affirm", "role": "Former CFO"}, {"name": "Jonathan Marks", "bio": "AI strategy consultant for Fortune 500 financial institutions.", "company": "McKinsey", "role": "Partner"}, {"name": "Fatima Al-Hassan", "bio": "Built ML cost-optimization tools used by 200+ companies.", "company": "Cloudfare AI", "role": "Director of Product"}]'::jsonb,
  500,
  array['ai', 'finance', 'strategy']
),

-- 15:00-16:00 Boss Fight Keynote
(
  'Boss Fight: What Fintech Gets Wrong',
  'The day one closer. A provocative keynote challenging the industry''s sacred cows — from financial inclusion theater to unit economics denial.',
  'general', 'keynote', 'Main Stage', 1, '15:00', '16:00',
  array['Alex Rampell'],
  '[{"name": "Alex Rampell", "bio": "Legendary fintech investor and contrarian thinker. Coined the term \"distribution vs. innovation\" in financial services.", "company": "a16z", "role": "General Partner"}]'::jsonb,
  500,
  array['fintech', 'strategy', 'innovation']
),

-- 16:30-18:00 Sponsor Hour
(
  'Sponsor Activation Hour',
  'Visit sponsor booths, collect quest badges, and try live product demos. Side quests unlock exclusive NerdCon loot.',
  'general', 'social', 'Sponsor Hall', 1, '16:30', '18:00',
  array[]::text[],
  '[]'::jsonb,
  500,
  array['networking', 'sponsors']
),

-- 19:00-22:00 Happy Hour
(
  'Rooftop Happy Hour',
  'Sunset views over San Diego Bay. Open bar, tacos, and the chance to pitch your wildest fintech idea in 60 seconds or less.',
  'general', 'social', 'VIP Lounge', 1, '19:00', '22:00',
  array[]::text[],
  '[]'::jsonb,
  300,
  array['networking', 'social']
),

-- ============================================================================
-- Day 2: November 20, 2026
-- ============================================================================

-- 09:00-09:45 Stablecoins
(
  'Stablecoins: The Next Payment Network',
  'Are stablecoins the TCP/IP of money? Builders shipping stablecoin payment products debate architecture, regulation, and where USDC and USDT fit long-term.',
  'builder', 'panel', 'Main Stage', 2, '09:00', '09:45',
  array['Carlos Domingo', 'Wei Zhang', 'Sarah Brennan'],
  '[{"name": "Carlos Domingo", "bio": "Built stablecoin settlement infrastructure processing $500M/month.", "company": "Circle", "role": "Head of Payments"}, {"name": "Wei Zhang", "bio": "Cross-border payments veteran pivoting a $4B corridor to stablecoins.", "company": "BVNK", "role": "CTO"}, {"name": "Sarah Brennan", "bio": "Payments lawyer specializing in digital asset regulation.", "company": "Davis Polk", "role": "Partner"}]'::jsonb,
  500,
  array['stablecoins', 'payments', 'crypto']
),

-- 09:00-09:45 Hiring
(
  'Hiring and Retaining Fintech Talent',
  'A candid conversation about what engineers and operators actually want, why your hiring funnel is broken, and how to compete with Big Tech comp.',
  'operator', 'fireside', 'Workshop A', 2, '09:00', '09:45',
  array['Danielle Washington', 'Ben Shapiro'],
  '[{"name": "Danielle Washington", "bio": "Built engineering teams from 5 to 200 at two fintech unicorns.", "company": "Brex", "role": "VP Engineering"}, {"name": "Ben Shapiro", "bio": "Recruiter turned people-ops leader. Data-driven approach to retention.", "company": "Mercury", "role": "Head of People"}]'::jsonb,
  80,
  array['hiring', 'talent', 'culture']
),

-- 10:00-10:45 Open Banking
(
  'Open Banking 2.0',
  'CFPB 1033 is live. Now what? Workshop on building with open banking APIs, screen scraping vs. API access, and what the next wave of data-sharing unlocks.',
  'builder', 'workshop', 'Workshop B', 2, '10:00', '10:45',
  array['Michael Torres'],
  '[{"name": "Michael Torres", "bio": "Led open banking product at a major aggregator. Wrote the integration guide used by 500+ fintechs.", "company": "MX Technologies", "role": "Principal Product Manager"}]'::jsonb,
  60,
  array['open-banking', 'regulation', 'api']
),

-- 10:00-10:45 Regulation as Moat
(
  'Regulation as a Moat',
  'Why the best fintech companies lean into regulation instead of running from it. Case studies from companies that turned compliance into competitive advantage.',
  'operator', 'panel', 'Workshop A', 2, '10:00', '10:45',
  array['Nkechi Okoro', 'David Park'],
  '[{"name": "Nkechi Okoro", "bio": "Former state banking regulator. Now helps fintechs navigate licensing across 50 states.", "company": "Lithic", "role": "General Counsel"}, {"name": "David Park", "bio": "Built a lending company that got its own bank charter in under 18 months.", "company": "Varo Bank", "role": "Co-Founder"}]'::jsonb,
  80,
  array['regulation', 'compliance', 'strategy']
),

-- 11:00-12:00 Great Debate
(
  'The Great Debate: Banks vs Fintechs',
  'A structured Oxford-style debate. The motion: \"In 10 years, traditional banks will be mere utilities.\" Two sides, audience votes, no mercy.',
  'general', 'panel', 'Main Stage', 2, '11:00', '12:00',
  array['Catherine Bessant', 'Nik Storonsky', 'Jamie Dimon Jr.', 'Vlad Tenev'],
  '[{"name": "Catherine Bessant", "bio": "30-year banking veteran and digital transformation leader.", "company": "Bank of America", "role": "Former CTO"}, {"name": "Nik Storonsky", "bio": "Built one of Europe''s largest fintechs from a single FX product.", "company": "Revolut", "role": "CEO"}, {"name": "Jamie Dimon Jr.", "bio": "Next-gen banking scion running fintech partnerships.", "company": "JPMorgan Chase", "role": "Head of Fintech Strategy"}, {"name": "Vlad Tenev", "bio": "Democratized stock trading for a generation.", "company": "Robinhood", "role": "CEO"}]'::jsonb,
  500,
  array['banking', 'fintech', 'disruption']
),

-- 12:00-13:00 Lunch & Demos
(
  'Lunch & Builder Demos',
  'Grab lunch and watch live demos from builders shipping products at the conference. Vote for your favorite — winner gets the NerdCon Builder Trophy.',
  'general', 'social', 'Networking Hub', 2, '12:00', '13:00',
  array[]::text[],
  '[]'::jsonb,
  500,
  array['networking', 'demos']
),

-- 13:00-14:00 Lightning Talks
(
  'Lightning Talks: 5 Startups, 5 Minutes Each',
  'Five early-stage founders pitch their products to the NerdCon crowd. Audience Q&A, live feedback, and maybe a term sheet or two.',
  'explorer', 'lightning', 'Main Stage', 2, '13:00', '14:00',
  array['Yuki Tanaka', 'Amara Osei', 'Diego Fernandez', 'Hannah Keller', 'Ravi Krishnan'],
  '[{"name": "Yuki Tanaka", "bio": "Building AI-powered treasury management for SMBs.", "company": "Kasumi", "role": "Founder"}, {"name": "Amara Osei", "bio": "Cross-border remittances via mobile money rails.", "company": "SendFi", "role": "CEO"}, {"name": "Diego Fernandez", "bio": "Compliance-as-code for crypto exchanges.", "company": "RegShield", "role": "CTO"}, {"name": "Hannah Keller", "bio": "Embedded insurance for gig economy platforms.", "company": "Blanket", "role": "Co-Founder"}, {"name": "Ravi Krishnan", "bio": "Real-time credit scoring using alternative data.", "company": "TrueScore", "role": "Founder"}]'::jsonb,
  500,
  array['startups', 'pitches', 'innovation']
),

-- 14:15-15:00 Cross-Border
(
  'Cross-Border Payments Masterclass',
  'The nitty-gritty of moving money across borders: correspondent banking, FX, compliance, and the new rails trying to displace SWIFT. Workshop format with real transaction traces.',
  'builder', 'workshop', 'Workshop B', 2, '14:15', '15:00',
  array['Omar Hassan'],
  '[{"name": "Omar Hassan", "bio": "20 years in cross-border payments. Built corridor infrastructure connecting 40+ countries.", "company": "Wise", "role": "Staff Engineer"}]'::jsonb,
  60,
  array['payments', 'cross-border', 'infrastructure']
),

-- 15:15-16:15 Closing Keynote
(
  'Closing Keynote: The Next Decade of Fintech',
  'Where do we go from here? A forward-looking keynote connecting the dots from two days of conversation — and issuing a challenge to everyone in the room.',
  'general', 'keynote', 'Main Stage', 2, '15:15', '16:15',
  array['Simon Taylor'],
  '[{"name": "Simon Taylor", "bio": "Writer of Fintech Brainfood, the industry''s most-read weekly newsletter. Connecting dots between fintech, crypto, and traditional finance since 2019.", "company": "Fintech Brainfood", "role": "Founder"}]'::jsonb,
  500,
  array['fintech', 'innovation', 'strategy']
),

-- 16:30-18:00 Farewell Networking
(
  'Farewell Networking',
  'Last chance to swap contacts, finish side quests, and say goodbye. See you at NerdCon 2027.',
  'general', 'social', 'Networking Hub', 2, '16:30', '18:00',
  array[]::text[],
  '[]'::jsonb,
  500,
  array['networking', 'social']
);
