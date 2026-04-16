'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Loader2, Database, Copy, Check, ExternalLink, RefreshCw } from 'lucide-react'

const TABLE_NAMES = ['profiles', 'trips', 'group_trips', 'group_members', 'destination_votes']

const SQL_SCRIPT = `-- =====================================================
-- GLOBETROTTER DATABASE SETUP  (run once in Supabase)
-- =====================================================

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text, username text unique, full_name text,
  avatar_url text, bio text, home_city text,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists public.trips (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null, destination_id text, destination_name text,
  destination_country text, from_city text, start_date date, end_date date,
  budget numeric(10,2), num_travelers integer default 1,
  transport_option_id text, hotel_id text, status text default 'draft',
  total_cost numeric(10,2), image_url text, notes text,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists public.group_trips (
  id uuid default gen_random_uuid() primary key,
  name text not null, description text,
  created_by uuid references auth.users on delete cascade not null,
  from_city text, start_date date, end_date date,
  transport_modes text[] default '{}', status text default 'voting',
  budget_per_person numeric(10,2), winning_destination_id text,
  cover_image_url text,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists public.group_members (
  id uuid default gen_random_uuid() primary key,
  group_trip_id uuid references public.group_trips on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  role text default 'member', personal_budget numeric(10,2),
  status text default 'active', joined_at timestamptz default now(),
  unique(group_trip_id, user_id)
);

create table if not exists public.destination_votes (
  id uuid default gen_random_uuid() primary key,
  group_trip_id uuid references public.group_trips on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  destination_id text not null, created_at timestamptz default now(),
  unique(group_trip_id, user_id)
);

alter table public.profiles enable row level security;
alter table public.trips enable row level security;
alter table public.group_trips enable row level security;
alter table public.group_members enable row level security;
alter table public.destination_votes enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='profiles' and policyname='profiles_public_read') then
    create policy "profiles_public_read" on public.profiles for select using (true);
    create policy "profiles_owner_insert" on public.profiles for insert with check (auth.uid() = id);
    create policy "profiles_owner_update" on public.profiles for update using (auth.uid() = id);
  end if;
  if not exists (select 1 from pg_policies where tablename='trips' and policyname='trips_owner_select') then
    create policy "trips_owner_select" on public.trips for select using (auth.uid() = user_id);
    create policy "trips_owner_insert" on public.trips for insert with check (auth.uid() = user_id);
    create policy "trips_owner_update" on public.trips for update using (auth.uid() = user_id);
    create policy "trips_owner_delete" on public.trips for delete using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='group_trips' and policyname='group_trips_read') then
    create policy "group_trips_read" on public.group_trips for select using (auth.uid() = created_by or exists(select 1 from public.group_members where group_trip_id = group_trips.id and user_id = auth.uid()));
    create policy "group_trips_insert" on public.group_trips for insert with check (auth.uid() = created_by);
    create policy "group_trips_update" on public.group_trips for update using (auth.uid() = created_by);
    create policy "group_trips_delete" on public.group_trips for delete using (auth.uid() = created_by);
  end if;
  if not exists (select 1 from pg_policies where tablename='group_members' and policyname='group_members_read') then
    create policy "group_members_read" on public.group_members for select using (exists(select 1 from public.group_members gm where gm.group_trip_id = group_members.group_trip_id and gm.user_id = auth.uid()));
    create policy "group_members_insert" on public.group_members for insert with check (auth.uid() = user_id);
    create policy "group_members_update" on public.group_members for update using (auth.uid() = user_id);
    create policy "group_members_delete" on public.group_members for delete using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='destination_votes' and policyname='votes_read') then
    create policy "votes_read" on public.destination_votes for select using (exists(select 1 from public.group_members where group_trip_id = destination_votes.group_trip_id and user_id = auth.uid()));
    create policy "votes_insert" on public.destination_votes for insert with check (auth.uid() = user_id and exists(select 1 from public.group_members where group_trip_id = destination_votes.group_trip_id and user_id = auth.uid()));
    create policy "votes_update" on public.destination_votes for update using (auth.uid() = user_id);
    create policy "votes_delete" on public.destination_votes for delete using (auth.uid() = user_id);
  end if;
end $$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();`

export default function SetupPage() {
  const router = useRouter()
  const [status, setStatus] = useState<Record<string, boolean>>({})
  const [checking, setChecking] = useState(true)
  const [setting, setSetting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const checkStatus = async () => {
    setChecking(true)
    try {
      const res = await fetch('/api/setup')
      const data = await res.json()
      setStatus(data.tables || {})
      if (data.allReady) setDone(true)
    } catch {
      setError('Could not connect to server')
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => { checkStatus() }, [])

  const handleSetup = async () => {
    setSetting(true)
    setError('')
    try {
      const res = await fetch('/api/setup', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        await checkStatus()
      } else {
        setError(data.error || 'Auto-setup failed. Please use the manual SQL below.')
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSetting(false)
    }
  }

  const copySQL = () => {
    navigator.clipboard.writeText(SQL_SCRIPT)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const allReady = TABLE_NAMES.every(t => status[t])

  if (done || allReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-10 text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Database Ready!</h1>
          <p className="text-slate-500 mb-8">All 5 tables are set up. Your app is fully functional.</p>
          <button onClick={() => router.push('/home')}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25">
            Go to App →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10 pt-8">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Database className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Database Setup</h1>
          <p className="text-slate-500">Create the Supabase tables to make the app fully functional</p>
        </div>

        {/* Table status */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900">Table Status</h2>
            <button onClick={checkStatus} disabled={checking}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors">
              <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
          <div className="space-y-2.5">
            {TABLE_NAMES.map(table => (
              <div key={table} className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-xl">
                <span className="font-mono text-sm text-slate-700">{table}</span>
                {checking ? (
                  <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                ) : status[table] ? (
                  <span className="flex items-center gap-1.5 text-emerald-600 text-xs font-semibold">
                    <CheckCircle className="w-4 h-4" />Ready
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-red-500 text-xs font-semibold">
                    <XCircle className="w-4 h-4" />Missing
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
            <p className="text-sm text-amber-800 font-medium">{error}</p>
          </div>
        )}

        {/* Manual SQL steps */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
          <h2 className="font-bold text-slate-900 mb-1">Run SQL in Supabase (2 minutes)</h2>
          <p className="text-slate-500 text-sm mb-5">Copy the script below and paste it into your Supabase SQL Editor</p>

          <div className="space-y-3 mb-5">
            {[
              { step: '1', text: 'Go to', link: 'https://supabase.com/dashboard', linkText: 'supabase.com/dashboard' },
              { step: '2', text: 'Open your project → click SQL Editor in the left sidebar' },
              { step: '3', text: 'Click "+ New query", paste the script below, click Run' },
              { step: '4', text: 'Come back and click Verify Setup below' },
            ].map(item => (
              <div key={item.step} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {item.step}
                </div>
                <p className="text-sm text-slate-700">
                  {item.text}{' '}
                  {item.link && (
                    <a href={item.link} target="_blank" rel="noopener noreferrer"
                      className="text-blue-600 font-semibold hover:underline inline-flex items-center gap-0.5">
                      {item.linkText}<ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </p>
              </div>
            ))}
          </div>

          <div className="relative">
            <pre className="bg-slate-900 text-slate-100 rounded-xl p-4 text-xs overflow-auto max-h-48 font-mono leading-relaxed">
              {SQL_SCRIPT.slice(0, 400)}...
            </pre>
            <button onClick={copySQL}
              className="absolute top-3 right-3 flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
              {copied ? <><Check className="w-3.5 h-3.5" />Copied!</> : <><Copy className="w-3.5 h-3.5" />Copy SQL</>}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button onClick={checkStatus} disabled={checking}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-60">
            {checking ? <><Loader2 className="w-5 h-5 animate-spin" />Checking...</> : <><RefreshCw className="w-5 h-5" />Verify Setup</>}
          </button>
          <p className="text-center text-xs text-slate-400">After running the SQL, click Verify Setup to confirm all tables are ready</p>
        </div>
      </div>
    </div>
  )
}
