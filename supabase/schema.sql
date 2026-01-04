create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text unique not null,
  openai_api_key text,
  created_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete cascade,
  name text not null,
  email text,
  phone text,
  intent text,
  budget text,
  timeline text,
  lead_score numeric,
  summary text,
  stage text default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.marketing_content (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete cascade,
  listing_details text not null,
  content_type text not null,
  generated_text text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete cascade,
  file_url text,
  buyer text,
  seller text,
  price numeric,
  address text,
  missing_signatures text[],
  summary text,
  next_tasks jsonb default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete cascade,
  name text not null,
  deal_id uuid references public.deals (id) on delete cascade,
  stage text,
  last_message text,
  next_action text,
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete cascade,
  client_id uuid references public.clients (id) on delete cascade,
  sender text check (sender in ('agent', 'ai')),
  content text not null,
  created_at timestamptz not null default now()
);


