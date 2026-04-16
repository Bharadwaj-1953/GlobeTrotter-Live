import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const SQL = `
-- PROFILES
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  username text unique,
  full_name text,
  avatar_url text,
  bio text,
  home_city text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- TRIPS
create table if not exists public.trips (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  destination_id text,
  destination_name text,
  destination_country text,
  from_city text,
  start_date date,
  end_date date,
  budget numeric(10,2),
  num_travelers integer default 1,
  transport_option_id text,
  hotel_id text,
  status text default 'draft',
  total_cost numeric(10,2),
  image_url text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- GROUP TRIPS
create table if not exists public.group_trips (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  created_by uuid references auth.users on delete cascade not null,
  from_city text,
  start_date date,
  end_date date,
  transport_modes text[] default '{}',
  status text default 'voting',
  budget_per_person numeric(10,2),
  winning_destination_id text,
  cover_image_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- GROUP MEMBERS
create table if not exists public.group_members (
  id uuid default gen_random_uuid() primary key,
  group_trip_id uuid references public.group_trips on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  role text default 'member',
  personal_budget numeric(10,2),
  status text default 'active',
  joined_at timestamptz default now(),
  unique(group_trip_id, user_id)
);

-- DESTINATION VOTES
create table if not exists public.destination_votes (
  id uuid default gen_random_uuid() primary key,
  group_trip_id uuid references public.group_trips on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  destination_id text not null,
  created_at timestamptz default now(),
  unique(group_trip_id, user_id)
);

-- RLS
alter table public.profiles enable row level security;
alter table public.trips enable row level security;
alter table public.group_trips enable row level security;
alter table public.group_members enable row level security;
alter table public.destination_votes enable row level security;

-- Profile policies
do $$ begin
  if not exists (select 1 from pg_policies where tablename='profiles' and policyname='profiles_public_read') then
    create policy "profiles_public_read" on public.profiles for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='profiles' and policyname='profiles_owner_insert') then
    create policy "profiles_owner_insert" on public.profiles for insert with check (auth.uid() = id);
  end if;
  if not exists (select 1 from pg_policies where tablename='profiles' and policyname='profiles_owner_update') then
    create policy "profiles_owner_update" on public.profiles for update using (auth.uid() = id);
  end if;
end $$;

-- Trip policies
do $$ begin
  if not exists (select 1 from pg_policies where tablename='trips' and policyname='trips_owner_select') then
    create policy "trips_owner_select" on public.trips for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='trips' and policyname='trips_owner_insert') then
    create policy "trips_owner_insert" on public.trips for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='trips' and policyname='trips_owner_update') then
    create policy "trips_owner_update" on public.trips for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='trips' and policyname='trips_owner_delete') then
    create policy "trips_owner_delete" on public.trips for delete using (auth.uid() = user_id);
  end if;
end $$;

-- Group trip policies
do $$ begin
  if not exists (select 1 from pg_policies where tablename='group_trips' and policyname='group_trips_read') then
    create policy "group_trips_read" on public.group_trips for select using (
      auth.uid() = created_by or
      exists(select 1 from public.group_members where group_trip_id = group_trips.id and user_id = auth.uid())
    );
  end if;
  if not exists (select 1 from pg_policies where tablename='group_trips' and policyname='group_trips_insert') then
    create policy "group_trips_insert" on public.group_trips for insert with check (auth.uid() = created_by);
  end if;
  if not exists (select 1 from pg_policies where tablename='group_trips' and policyname='group_trips_update') then
    create policy "group_trips_update" on public.group_trips for update using (auth.uid() = created_by);
  end if;
  if not exists (select 1 from pg_policies where tablename='group_trips' and policyname='group_trips_delete') then
    create policy "group_trips_delete" on public.group_trips for delete using (auth.uid() = created_by);
  end if;
end $$;

-- Group member policies
do $$ begin
  if not exists (select 1 from pg_policies where tablename='group_members' and policyname='group_members_read') then
    create policy "group_members_read" on public.group_members for select using (
      exists(select 1 from public.group_members gm where gm.group_trip_id = group_members.group_trip_id and gm.user_id = auth.uid())
    );
  end if;
  if not exists (select 1 from pg_policies where tablename='group_members' and policyname='group_members_insert') then
    create policy "group_members_insert" on public.group_members for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='group_members' and policyname='group_members_update') then
    create policy "group_members_update" on public.group_members for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='group_members' and policyname='group_members_delete') then
    create policy "group_members_delete" on public.group_members for delete using (auth.uid() = user_id);
  end if;
end $$;

-- Vote policies
do $$ begin
  if not exists (select 1 from pg_policies where tablename='destination_votes' and policyname='votes_read') then
    create policy "votes_read" on public.destination_votes for select using (
      exists(select 1 from public.group_members where group_trip_id = destination_votes.group_trip_id and user_id = auth.uid())
    );
  end if;
  if not exists (select 1 from pg_policies where tablename='destination_votes' and policyname='votes_insert') then
    create policy "votes_insert" on public.destination_votes for insert with check (
      auth.uid() = user_id and
      exists(select 1 from public.group_members where group_trip_id = destination_votes.group_trip_id and user_id = auth.uid())
    );
  end if;
  if not exists (select 1 from pg_policies where tablename='destination_votes' and policyname='votes_update') then
    create policy "votes_update" on public.destination_votes for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='destination_votes' and policyname='votes_delete') then
    create policy "votes_delete" on public.destination_votes for delete using (auth.uid() = user_id);
  end if;
end $$;

-- Auto-create profile trigger
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
`

export async function POST() {
  try {
    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Use the management API via fetch to run SQL
    const projectRef = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '')
    
    // Try via the pg REST endpoint with service key
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'apikey': SERVICE_KEY,
      },
      body: JSON.stringify({ sql: SQL })
    })

    if (!res.ok) {
      // Fallback: try via Supabase management API
      const mgmtRes = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SERVICE_KEY}`,
        },
        body: JSON.stringify({ query: SQL })
      })

      if (!mgmtRes.ok) {
        return NextResponse.json({ 
          success: false, 
          error: 'Could not run SQL automatically. Please run manually.',
          sql: SQL,
          instructions: [
            '1. Go to https://supabase.com and sign in',
            '2. Open your project',
            '3. Click "SQL Editor" in the left sidebar',
            '4. Paste the SQL from the "sql" field above',
            '5. Click "Run" (green button)',
            '6. Come back here and click "Verify Setup"'
          ]
        }, { status: 200 })
      }
    }

    return NextResponse.json({ success: true, message: 'All tables created successfully' })
  } catch (err: any) {
    return NextResponse.json({ 
      success: false, 
      error: err.message,
      sql: SQL,
    }, { status: 200 })
  }
}

export async function GET() {
  // Check which tables exist
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  const tables = ['profiles', 'trips', 'group_trips', 'group_members', 'destination_votes']
  const status: Record<string, boolean> = {}

  for (const table of tables) {
    const { error } = await admin.from(table as any).select('id').limit(1)
    status[table] = !error || error.code !== '42P01'
  }

  const allReady = Object.values(status).every(Boolean)
  return NextResponse.json({ allReady, tables: status })
}
