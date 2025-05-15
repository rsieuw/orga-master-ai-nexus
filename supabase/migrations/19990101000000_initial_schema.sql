-- @fileoverview Initial database schema setup.
-- This migration creates the core tables for the application:
-- - public.profiles: Stores user profile information, extending auth.users.
-- - public.chat_messages: Stores chat messages related to tasks.
-- - public.task_notes: Stores notes associated with tasks.
-- - public.saved_research: Stores research content saved by users for tasks.
-- It also sets up Row Level Security (RLS) policies for these tables and
-- a trigger (handle_new_user) to automatically create a profile when a new user signs up.

-- Create a table for public profiles
create table public.profiles (
  id uuid references auth.users not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  website text,
  -- Add language_preference column
  language_preference text default 'en'::text null,
  -- Add enabled_features column (array of text)
  enabled_features text[] null,
  constraint username_length check (char_length(username) >= 3)
);

-- Set up Row Level Security (RLS)
alter table public.profiles
  enable row level security;

create policy "Public profiles are viewable by everyone." on public.profiles
  for select using (true);

create policy "Users can insert their own profile." on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on public.profiles
  for update using (auth.uid() = id);

-- This trigger automatically creates a profile entry when a new user signs up via Supabase Auth.
-- It also attempts to set username from email if not provided in metadata.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  profile_username text;
begin
  -- Try to get username from metadata, otherwise use part of email
  if new.raw_user_meta_data is not null and new.raw_user_meta_data->>'username' is not null then
    profile_username := new.raw_user_meta_data->>'username';
  else
    profile_username := split_part(new.email, '@', 1);
  end if;
  
  insert into public.profiles (id, username)
  values (new.id, profile_username);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create chat_messages table
CREATE TABLE public.chat_messages (
    id BIGSERIAL PRIMARY KEY,
    task_id UUID NOT NULL, -- Foreign key to your tasks table
    user_id UUID NOT NULL REFERENCES auth.users(id),
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    message_type TEXT NULL, -- e.g., 'standard', 'research_result', 'action_confirm', 'error', 'note_saved', 'system'
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own chat messages" ON public.chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own chat messages" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create task_notes table
CREATE TABLE public.task_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL, -- Foreign key to your tasks table
    user_id UUID NOT NULL REFERENCES auth.users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE public.task_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD their own notes" ON public.task_notes FOR ALL USING (auth.uid() = user_id);

-- Create saved_research table
CREATE TABLE public.saved_research (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL, -- Foreign key to your tasks table
    user_id UUID NOT NULL REFERENCES auth.users(id),
    research_content TEXT NOT NULL,
    subtask_title TEXT NULL, -- Title of the subtask if research was for a subtask
    citations JSONB NULL,    -- Store citations as a JSON array of strings
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE public.saved_research ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD their own saved research" ON public.saved_research FOR ALL USING (auth.uid() = user_id); 