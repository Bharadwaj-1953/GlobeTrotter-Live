-- ============================================================
-- GlobeTrotter Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Profiles (extends auth.users)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  full_name text,
  avatar_url text,
  bio text,
  level integer default 1,
  countries_visited integer default 0,
  cities_visited integer default 0,
  miles_traveled integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table profiles enable row level security;
create policy "Public profiles are viewable by everyone." on profiles for select using (true);
create policy "Users can insert their own profile." on profiles for insert with check ((select auth.uid()) = id);
create policy "Users can update own profile." on profiles for update using ((select auth.uid()) = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, username)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    split_part(new.email, '@', 1)
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Trips (solo)
create table if not exists trips (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  destination_id text,
  from_city text,
  start_date date,
  end_date date,
  budget integer,
  transport_option_id text,
  hotel_id text,
  status text default 'draft' check (status in ('draft', 'active', 'completed')),
  total_cost integer,
  image_url text,
  num_travelers integer default 1,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table trips enable row level security;
create policy "Users can view own trips." on trips for select using ((select auth.uid()) = user_id);
create policy "Users can insert own trips." on trips for insert with check ((select auth.uid()) = user_id);
create policy "Users can update own trips." on trips for update using ((select auth.uid()) = user_id);
create policy "Users can delete own trips." on trips for delete using ((select auth.uid()) = user_id);

-- Trip Activities
create table if not exists trip_activities (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid references trips(id) on delete cascade not null,
  activity_id text not null,
  scheduled_date date,
  scheduled_time text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table trip_activities enable row level security;
create policy "Users can manage own trip activities." on trip_activities for all
  using (exists (select 1 from trips where trips.id = trip_activities.trip_id and trips.user_id = (select auth.uid())));

-- Group Trips
create table if not exists group_trips (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_by uuid references auth.users(id) on delete cascade not null,
  from_city text,
  start_date date,
  end_date date,
  transport_modes text[] default '{}',
  status text default 'voting' check (status in ('voting', 'planning', 'booked', 'completed')),
  winning_destination_id text,
  budget_per_person integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table group_trips enable row level security;
create policy "Group members can view group trips." on group_trips for select
  using (
    (select auth.uid()) = created_by
    or exists (
      select 1 from group_members
      where group_members.group_trip_id = group_trips.id
      and group_members.user_id = (select auth.uid())
    )
  );
create policy "Users can create group trips." on group_trips for insert with check ((select auth.uid()) = created_by);
create policy "Organizer can update group trips." on group_trips for update using ((select auth.uid()) = created_by);

-- Group Members
create table if not exists group_members (
  id uuid default gen_random_uuid() primary key,
  group_trip_id uuid references group_trips(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  personal_budget integer,
  role text default 'member' check (role in ('organizer', 'member')),
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(group_trip_id, user_id)
);

alter table group_members enable row level security;
create policy "Members can view group members." on group_members for select
  using (
    exists (
      select 1 from group_trips
      where group_trips.id = group_members.group_trip_id
      and (group_trips.created_by = (select auth.uid())
        or exists (
          select 1 from group_members gm2
          where gm2.group_trip_id = group_members.group_trip_id
          and gm2.user_id = (select auth.uid())
        ))
    )
  );
create policy "Users can join groups." on group_members for insert with check ((select auth.uid()) = user_id);
create policy "Users can leave groups." on group_members for delete using ((select auth.uid()) = user_id);

-- Destination Votes
create table if not exists destination_votes (
  id uuid default gen_random_uuid() primary key,
  group_trip_id uuid references group_trips(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  destination_id text not null,
  voted_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(group_trip_id, user_id)
);

alter table destination_votes enable row level security;
create policy "Members can view votes." on destination_votes for select
  using (
    exists (
      select 1 from group_members
      where group_members.group_trip_id = destination_votes.group_trip_id
      and group_members.user_id = (select auth.uid())
    )
  );
create policy "Members can cast votes." on destination_votes for insert
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from group_members
      where group_members.group_trip_id = destination_votes.group_trip_id
      and group_members.user_id = (select auth.uid())
    )
  );
create policy "Members can change votes." on destination_votes for update using ((select auth.uid()) = user_id);
create policy "Members can remove votes." on destination_votes for delete using ((select auth.uid()) = user_id);

-- Enable Realtime for destination_votes
alter publication supabase_realtime add table destination_votes;
alter publication supabase_realtime add table group_members;

-- ============================================================
-- DONE! Your schema is ready.
-- ============================================================
