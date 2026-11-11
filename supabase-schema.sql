-- VYRO starter database for Supabase (PostgreSQL)
-- Run this entire file in Supabase Dashboard > SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text not null default 'عضو VYRO',
  bio text not null default '',
  avatar_url text,
  website text,
  is_private boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint username_format check (username is null or username ~ '^[a-zA-Z0-9_]{3,24}$')
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  media_url text,
  visibility text not null default 'public' check (visibility in ('public','followers','private')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create table if not exists public.likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id,user_id)
);

create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id,following_id),
  constraint no_self_follow check (follower_id <> following_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  kind text not null check (kind in ('like','comment','follow')),
  post_id uuid references public.posts(id) on delete cascade,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists posts_created_idx on public.posts(created_at desc);
create index if not exists posts_user_idx on public.posts(user_id,created_at desc);
create index if not exists comments_post_idx on public.comments(post_id,created_at);
create index if not exists notifications_recipient_idx on public.notifications(recipient_id,created_at desc);
create index if not exists follows_following_idx on public.follows(following_id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name','عضو VYRO'))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.likes enable row level security;
alter table public.follows enable row level security;
alter table public.notifications enable row level security;

-- Public profiles are discoverable; only their owner can edit them.
drop policy if exists "Profiles are viewable" on public.profiles;
create policy "Profiles are viewable" on public.profiles for select using (true);
drop policy if exists "Owners update profile" on public.profiles;
create policy "Owners update profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists "Owners insert profile" on public.profiles;
create policy "Owners insert profile" on public.profiles for insert to authenticated with check (auth.uid() = id);

-- Public posts can be read by anyone; writes require an authenticated owner.
drop policy if exists "Public posts readable" on public.posts;
create policy "Public posts readable" on public.posts for select using (visibility = 'public' or auth.uid() = user_id);
drop policy if exists "Users create own posts" on public.posts;
create policy "Users create own posts" on public.posts for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users edit own posts" on public.posts;
create policy "Users edit own posts" on public.posts for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users delete own posts" on public.posts;
create policy "Users delete own posts" on public.posts for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "Comments readable" on public.comments;
create policy "Comments readable" on public.comments for select using (true);
drop policy if exists "Authenticated comments" on public.comments;
create policy "Authenticated comments" on public.comments for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Owners delete comments" on public.comments;
create policy "Owners delete comments" on public.comments for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "Likes readable" on public.likes;
create policy "Likes readable" on public.likes for select using (true);
drop policy if exists "Users like as self" on public.likes;
create policy "Users like as self" on public.likes for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users unlike as self" on public.likes;
create policy "Users unlike as self" on public.likes for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "Follows readable" on public.follows;
create policy "Follows readable" on public.follows for select using (true);
drop policy if exists "Users follow as self" on public.follows;
create policy "Users follow as self" on public.follows for insert to authenticated with check (auth.uid() = follower_id);
drop policy if exists "Users unfollow as self" on public.follows;
create policy "Users unfollow as self" on public.follows for delete to authenticated using (auth.uid() = follower_id);

drop policy if exists "Users read own notifications" on public.notifications;
create policy "Users read own notifications" on public.notifications for select to authenticated using (auth.uid() = recipient_id);
drop policy if exists "Users mark own notifications" on public.notifications;
create policy "Users mark own notifications" on public.notifications for update to authenticated using (auth.uid() = recipient_id) with check (auth.uid() = recipient_id);

-- Keep this project key public (anon/publishable) only. Never put service_role keys in browser code.
