create type "public"."subscription_status" as enum ('trialing', 'active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'unpaid', 'paused');

drop policy "Users can insert their own chat messages" on "public"."chat_messages";

drop policy "Users can view their own chat messages" on "public"."chat_messages";

drop policy "Allow admins to read all external_api_usage_logs" on "public"."external_api_usage_logs";

drop policy "Public profiles are viewable by everyone." on "public"."profiles";

drop policy "Users can insert their own profile." on "public"."profiles";

drop policy "Users can update own profile." on "public"."profiles";

drop policy "consolidated_update_policy" on "public"."profiles";

drop policy "profiles_update_policy" on "public"."profiles";

drop policy "Users can CRUD their own saved research" on "public"."saved_research";

drop policy "system_settings_select_policy" on "public"."system_settings";

drop policy "Users can CRUD their own notes" on "public"."task_notes";

drop policy "Users can CRUD their own tasks" on "public"."tasks";

drop policy "Theme settings only delete by admins" on "public"."theme_settings";

drop policy "Theme settings only insert by admins" on "public"."theme_settings";

drop policy "Theme settings only select by admins" on "public"."theme_settings";

drop policy "Theme settings only update by admins" on "public"."theme_settings";

drop policy "theme_settings_admin_policy" on "public"."theme_settings";

drop policy "Allow admins to read all user_api_logs" on "public"."user_api_logs";

drop policy "Allow admins to read external_api_usage_logs" on "public"."external_api_usage_logs";

drop policy "Allow users to delete own profile" on "public"."profiles";

drop policy "Allow users to insert their own profile" on "public"."profiles";

drop policy "profiles_select_policy" on "public"."profiles";

drop policy "Allow users to insert their own saved research" on "public"."saved_research";

drop policy "Allow users to select their own saved research" on "public"."saved_research";

drop policy "allow users to delete their own research" on "public"."saved_research";

drop policy "admins_can_delete_system_settings" on "public"."system_settings";

drop policy "admins_can_insert_system_settings" on "public"."system_settings";

drop policy "admins_can_update_system_settings" on "public"."system_settings";

drop policy "admins_can_view_system_settings" on "public"."system_settings";

drop policy "Allow individual delete access (of Allow delete for own notes)" on "public"."task_notes";

drop policy "Allow individual read access (of Allow select for own notes)" on "public"."task_notes";

drop policy "Allow individual update access (of Allow update for own notes)" on "public"."task_notes";

drop policy "Allow insert for own notes" on "public"."task_notes";

drop policy "Allow individual delete access" on "public"."tasks";

drop policy "Allow admins to read user_api_logs" on "public"."user_api_logs";

alter table "public"."profiles" drop constraint "profiles_username_key";

alter table "public"."profiles" drop constraint "username_length";

alter table "public"."chat_messages" drop constraint "chat_messages_role_check";

alter table "public"."chat_messages" drop constraint "chat_messages_user_id_fkey";

alter table "public"."external_api_usage_logs" drop constraint "external_api_usage_logs_user_id_fkey";

alter table "public"."profiles" drop constraint "profiles_id_fkey";

alter table "public"."saved_research" drop constraint "saved_research_user_id_fkey";

alter table "public"."task_notes" drop constraint "task_notes_user_id_fkey";

alter table "public"."tasks" drop constraint "tasks_user_id_fkey";

alter table "public"."user_api_logs" drop constraint "user_api_logs_user_id_fkey";

drop index if exists "public"."idx_external_api_logs_called_at";

drop index if exists "public"."idx_external_api_logs_function_name";

drop index if exists "public"."idx_external_api_logs_service_name";

drop index if exists "public"."idx_external_api_logs_user_id";

drop index if exists "public"."idx_tasks_updated_at";

drop index if exists "public"."idx_tasks_user_id";

drop index if exists "public"."idx_tasks_user_updated_at";

drop index if exists "public"."idx_user_api_logs_called_at";

drop index if exists "public"."idx_user_api_logs_user_id_function_name";

drop index if exists "public"."profiles_username_key";

create table "public"."customers" (
    "id" uuid not null,
    "stripe_customer_id" text
);


alter table "public"."customers" enable row level security;

create table "public"."feedback" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "user_id" uuid,
    "user_email" text,
    "subject" text,
    "message" text not null,
    "status" text default 'nieuw'::text,
    "important" boolean default false
);


alter table "public"."feedback" enable row level security;

create table "public"."pinned_messages" (
    "id" uuid not null default gen_random_uuid(),
    "original_message_id" uuid,
    "task_id" uuid not null,
    "user_id" uuid not null,
    "role" text not null,
    "content" text not null,
    "message_type" text not null,
    "created_at" timestamp with time zone default now(),
    "pinned_at" timestamp with time zone default now()
);


alter table "public"."pinned_messages" enable row level security;

create table "public"."prices" (
    "id" text not null,
    "product_id" text,
    "active" boolean,
    "description" text,
    "unit_amount" bigint,
    "currency" text,
    "type" text,
    "interval" text,
    "interval_count" integer,
    "trial_period_days" integer,
    "metadata" jsonb
);


alter table "public"."prices" enable row level security;

create table "public"."products" (
    "id" text not null,
    "active" boolean,
    "name" text,
    "description" text,
    "metadata" jsonb
);


alter table "public"."products" enable row level security;

create table "public"."role_permissions" (
    "role" text not null,
    "enabled_features" text[] not null default '{}'::text[]
);


alter table "public"."role_permissions" enable row level security;

create table "public"."subscriptions" (
    "id" text not null,
    "user_id" uuid not null,
    "status" subscription_status,
    "metadata" jsonb,
    "price_id" text,
    "quantity" integer,
    "cancel_at_period_end" boolean,
    "created" timestamp with time zone not null default timezone('utc'::text, now()),
    "current_period_start" timestamp with time zone not null default timezone('utc'::text, now()),
    "current_period_end" timestamp with time zone not null default timezone('utc'::text, now()),
    "ended_at" timestamp with time zone default timezone('utc'::text, now()),
    "cancel_at" timestamp with time zone default timezone('utc'::text, now()),
    "canceled_at" timestamp with time zone default timezone('utc'::text, now()),
    "trial_start" timestamp with time zone default timezone('utc'::text, now()),
    "trial_end" timestamp with time zone default timezone('utc'::text, now())
);


alter table "public"."subscriptions" enable row level security;

alter table "public"."chat_messages" add column "is_pinned" boolean default false;

alter table "public"."chat_messages" alter column "id" set default gen_random_uuid();

alter table "public"."chat_messages" alter column "id" set data type uuid using "id"::uuid;

alter table "public"."external_api_usage_logs" add column "response_time_ms" integer;

alter table "public"."profiles" drop column "enabled_features";

alter table "public"."profiles" drop column "full_name";

alter table "public"."profiles" drop column "username";

alter table "public"."profiles" drop column "website";

alter table "public"."profiles" add column "ai_mode_preference" text default 'gpt4o'::text;

alter table "public"."profiles" add column "created_at" timestamp with time zone not null default now();

alter table "public"."profiles" add column "email_notifications_enabled" boolean default true;

alter table "public"."profiles" add column "layout_preference" text default '50-50'::text;

alter table "public"."profiles" add column "name" text;

alter table "public"."profiles" add column "status" text not null default 'active'::text;

alter table "public"."profiles" alter column "language_preference" set default 'nl'::text;

alter table "public"."profiles" alter column "role" set default 'free'::text;

alter table "public"."profiles" alter column "updated_at" set default now();

alter table "public"."profiles" alter column "updated_at" set not null;

alter table "public"."saved_research" add column "prompt" text;

alter table "public"."task_notes" drop column "updated_at";

alter table "public"."task_notes" alter column "user_id" drop not null;

alter table "public"."tasks" drop column "due_date";

alter table "public"."tasks" drop column "updated_at";

alter table "public"."tasks" add column "ai_subtask_generation_count" integer not null default 0;

alter table "public"."tasks" add column "category" text;

alter table "public"."tasks" add column "deadline" timestamp with time zone;

alter table "public"."tasks" add column "subtasks" jsonb;

alter table "public"."tasks" alter column "priority" drop not null;

alter table "public"."tasks" alter column "status" set default 'todo'::text;

alter table "public"."tasks" alter column "status" drop not null;

drop sequence if exists "public"."chat_messages_id_seq";

CREATE UNIQUE INDEX customers_pkey ON public.customers USING btree (id);

CREATE UNIQUE INDEX customers_stripe_customer_id_key ON public.customers USING btree (stripe_customer_id);

CREATE UNIQUE INDEX feedback_pkey ON public.feedback USING btree (id);

CREATE INDEX idx_chat_messages_task_id ON public.chat_messages USING btree (task_id);

CREATE INDEX idx_chat_messages_user_id ON public.chat_messages USING btree (user_id);

CREATE INDEX idx_saved_research_task_id ON public.saved_research USING btree (task_id);

CREATE INDEX idx_saved_research_user_id ON public.saved_research USING btree (user_id);

CREATE INDEX idx_task_notes_task_id ON public.task_notes USING btree (task_id);

CREATE INDEX idx_task_notes_user_id ON public.task_notes USING btree (user_id);

CREATE UNIQUE INDEX pinned_messages_original_message_id_task_id_user_id_key ON public.pinned_messages USING btree (original_message_id, task_id, user_id);

CREATE UNIQUE INDEX pinned_messages_pkey ON public.pinned_messages USING btree (id);

CREATE UNIQUE INDEX prices_pkey ON public.prices USING btree (id);

CREATE UNIQUE INDEX products_pkey ON public.products USING btree (id);

CREATE UNIQUE INDEX role_permissions_pkey ON public.role_permissions USING btree (role);

CREATE UNIQUE INDEX subscriptions_pkey ON public.subscriptions USING btree (id);

alter table "public"."customers" add constraint "customers_pkey" PRIMARY KEY using index "customers_pkey";

alter table "public"."feedback" add constraint "feedback_pkey" PRIMARY KEY using index "feedback_pkey";

alter table "public"."pinned_messages" add constraint "pinned_messages_pkey" PRIMARY KEY using index "pinned_messages_pkey";

alter table "public"."prices" add constraint "prices_pkey" PRIMARY KEY using index "prices_pkey";

alter table "public"."products" add constraint "products_pkey" PRIMARY KEY using index "products_pkey";

alter table "public"."role_permissions" add constraint "role_permissions_pkey" PRIMARY KEY using index "role_permissions_pkey";

alter table "public"."subscriptions" add constraint "subscriptions_pkey" PRIMARY KEY using index "subscriptions_pkey";

alter table "public"."chat_messages" add constraint "chat_messages_task_id_fkey" FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE not valid;

alter table "public"."chat_messages" validate constraint "chat_messages_task_id_fkey";

alter table "public"."customers" add constraint "customers_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) not valid;

alter table "public"."customers" validate constraint "customers_id_fkey";

alter table "public"."customers" add constraint "customers_stripe_customer_id_key" UNIQUE using index "customers_stripe_customer_id_key";

alter table "public"."feedback" add constraint "feedback_message_check" CHECK ((char_length(message) > 0)) not valid;

alter table "public"."feedback" validate constraint "feedback_message_check";

alter table "public"."feedback" add constraint "feedback_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."feedback" validate constraint "feedback_user_id_fkey";

alter table "public"."pinned_messages" add constraint "pinned_messages_original_message_id_task_id_user_id_key" UNIQUE using index "pinned_messages_original_message_id_task_id_user_id_key";

alter table "public"."pinned_messages" add constraint "pinned_messages_task_id_fkey" FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE not valid;

alter table "public"."pinned_messages" validate constraint "pinned_messages_task_id_fkey";

alter table "public"."pinned_messages" add constraint "pinned_messages_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."pinned_messages" validate constraint "pinned_messages_user_id_fkey";

alter table "public"."prices" add constraint "prices_currency_check" CHECK ((char_length(currency) = 3)) not valid;

alter table "public"."prices" validate constraint "prices_currency_check";

alter table "public"."prices" add constraint "prices_interval_check" CHECK (("interval" = ANY (ARRAY['day'::text, 'week'::text, 'month'::text, 'year'::text]))) not valid;

alter table "public"."prices" validate constraint "prices_interval_check";

alter table "public"."prices" add constraint "prices_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) not valid;

alter table "public"."prices" validate constraint "prices_product_id_fkey";

alter table "public"."prices" add constraint "prices_type_check" CHECK ((type = ANY (ARRAY['one_time'::text, 'recurring'::text]))) not valid;

alter table "public"."prices" validate constraint "prices_type_check";

alter table "public"."profiles" add constraint "profiles_language_preference_check" CHECK ((language_preference = ANY (ARRAY['nl'::text, 'en'::text]))) not valid;

alter table "public"."profiles" validate constraint "profiles_language_preference_check";

alter table "public"."profiles" add constraint "profiles_role_check" CHECK ((role = ANY (ARRAY['free'::text, 'paid'::text, 'admin'::text]))) not valid;

alter table "public"."profiles" validate constraint "profiles_role_check";

alter table "public"."role_permissions" add constraint "role_permissions_role_check" CHECK ((role = ANY (ARRAY['free'::text, 'paid'::text, 'admin'::text]))) not valid;

alter table "public"."role_permissions" validate constraint "role_permissions_role_check";

alter table "public"."saved_research" add constraint "saved_research_task_id_fkey" FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE not valid;

alter table "public"."saved_research" validate constraint "saved_research_task_id_fkey";

alter table "public"."subscriptions" add constraint "subscriptions_price_id_fkey" FOREIGN KEY (price_id) REFERENCES prices(id) not valid;

alter table "public"."subscriptions" validate constraint "subscriptions_price_id_fkey";

alter table "public"."subscriptions" add constraint "subscriptions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES customers(id) not valid;

alter table "public"."subscriptions" validate constraint "subscriptions_user_id_fkey";

alter table "public"."task_notes" add constraint "task_notes_task_id_fkey" FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE not valid;

alter table "public"."task_notes" validate constraint "task_notes_task_id_fkey";

alter table "public"."tasks" add constraint "tasks_priority_check" CHECK ((priority = ANY (ARRAY['high'::text, 'medium'::text, 'low'::text, 'none'::text]))) not valid;

alter table "public"."tasks" validate constraint "tasks_priority_check";

alter table "public"."tasks" add constraint "tasks_status_check" CHECK ((status = ANY (ARRAY['todo'::text, 'in_progress'::text, 'done'::text]))) not valid;

alter table "public"."tasks" validate constraint "tasks_status_check";

alter table "public"."chat_messages" add constraint "chat_messages_role_check" CHECK ((role = ANY (ARRAY['user'::text, 'assistant'::text]))) not valid;

alter table "public"."chat_messages" validate constraint "chat_messages_role_check";

alter table "public"."chat_messages" add constraint "chat_messages_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."chat_messages" validate constraint "chat_messages_user_id_fkey";

alter table "public"."external_api_usage_logs" add constraint "external_api_usage_logs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."external_api_usage_logs" validate constraint "external_api_usage_logs_user_id_fkey";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."saved_research" add constraint "saved_research_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."saved_research" validate constraint "saved_research_user_id_fkey";

alter table "public"."task_notes" add constraint "task_notes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."task_notes" validate constraint "task_notes_user_id_fkey";

alter table "public"."tasks" add constraint "tasks_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."tasks" validate constraint "tasks_user_id_fkey";

alter table "public"."user_api_logs" add constraint "user_api_logs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."user_api_logs" validate constraint "user_api_logs_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_my_role()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$SELECT role
FROM public.profiles
WHERE id = auth.uid()$function$
;

CREATE OR REPLACE FUNCTION public.get_pinned_messages(p_task_id uuid, p_user_id uuid)
 RETURNS TABLE(id uuid, original_message_id uuid, task_id uuid, user_id uuid, role text, content text, message_type text, created_at timestamp with time zone, pinned_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT *
    FROM public.pinned_messages
    WHERE task_id = p_task_id
    AND user_id = p_user_id
    ORDER BY created_at ASC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_profile_with_permissions(user_id uuid)
 RETURNS TABLE(id uuid, name text, role text, avatar_url text, language_preference text, email_notifications_enabled boolean, ai_mode_preference text, research_model_preference text, created_at timestamp with time zone, updated_at timestamp with time zone, status text, email text, enabled_features text[], layout_preference text)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
      SELECT
        p.id,
        p.name,
        p.role,
        p.avatar_url,
        p.language_preference,
        p.email_notifications_enabled,
        p.ai_mode_preference,
        p.research_model_preference,
        p.created_at,
        p.updated_at,
        p.status,
        u.email,
        coalesce(rp.enabled_features, '{}'::text[]) as enabled_features,
        p.layout_preference -- Nieuw toegevoegd veld
      FROM
        public.profiles p
      JOIN
        auth.users u ON p.id = u.id
      LEFT JOIN
        public.role_permissions rp ON p.role = rp.role
      WHERE
        p.id = get_user_profile_with_permissions.user_id;
    $function$
;

CREATE OR REPLACE FUNCTION public.pin_message(p_message_id uuid, p_task_id uuid, p_user_id uuid, p_role text, p_content text, p_message_type text, p_created_at timestamp with time zone)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
    -- Voeg toe aan pinned_messages
    INSERT INTO public.pinned_messages (
        original_message_id, task_id, user_id, role, content, message_type, created_at
    ) VALUES (
        p_message_id, p_task_id, p_user_id, p_role, p_content, p_message_type, p_created_at
    )
    ON CONFLICT (original_message_id, task_id, user_id) DO NOTHING;
    
    -- Update flag in chat_messages als het daar bestaat
    UPDATE public.chat_messages
    SET is_pinned = true
    WHERE id = p_message_id AND user_id = p_user_id;
    
    RETURN TRUE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.unpin_message(p_message_id uuid, p_task_id uuid, p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
    -- Verwijder uit pinned_messages
    DELETE FROM public.pinned_messages
    WHERE original_message_id = p_message_id
    AND task_id = p_task_id
    AND user_id = p_user_id;
    
    -- Update flag in chat_messages als het daar bestaat
    UPDATE public.chat_messages
    SET is_pinned = false
    WHERE id = p_message_id AND user_id = p_user_id;
    
    RETURN TRUE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_aggregated_user_api_logs()
 RETURNS TABLE(user_id uuid, function_name text, call_count bigint, last_called_at timestamp with time zone)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
  SELECT
      ual.user_id,
      ual.function_name,
      COUNT(*) AS call_count,
      MAX(ual.called_at) AS last_called_at
  FROM
      public.user_api_logs ual
  GROUP BY
      ual.user_id,
      ual.function_name
  ORDER BY
      last_called_at DESC;
$function$
;

CREATE OR REPLACE FUNCTION public.get_available_themes_for_role(p_role text)
 RETURNS text[]
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  themes TEXT[];
BEGIN
  SELECT available_themes INTO themes 
  FROM public.theme_settings 
  WHERE role = p_role;
  
  -- Fallback naar 'custom-dark' als rol niet bestaat of geen thema's heeft
  IF themes IS NULL OR array_length(themes, 1) = 0 THEN
    themes := ARRAY['custom-dark']::TEXT[];
  END IF;
  
  RETURN themes;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_default_theme_for_role(p_role text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  theme TEXT;
BEGIN
  SELECT default_theme INTO theme 
  FROM public.theme_settings 
  WHERE role = p_role;
  
  -- Fallback naar 'custom-dark' als rol niet bestaat of geen standaard thema heeft
  IF theme IS NULL THEN
    theme := 'custom-dark';
  END IF;
  
  RETURN theme;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_theme_settings()
 RETURNS TABLE(role text, available_themes text[], default_theme text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  -- Controleer eerst of de tabel theme_settings bestaat
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'theme_settings'
  ) THEN
    -- Als de tabel bestaat, haal de gegevens op
    RETURN QUERY
    SELECT ts.role, ts.available_themes, ts.default_theme
    FROM public.theme_settings ts;
  ELSE
    -- Als de tabel niet bestaat, geef standaard waardes terug
    RETURN QUERY
    SELECT 'admin'::TEXT, ARRAY['light', 'dark', 'custom-dark']::TEXT[], 'custom-dark'::TEXT
    UNION ALL
    SELECT 'paid'::TEXT, ARRAY['light', 'dark', 'custom-dark']::TEXT[], 'custom-dark'::TEXT
    UNION ALL
    SELECT 'free'::TEXT, ARRAY['custom-dark']::TEXT[], 'custom-dark'::TEXT;
  END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_theme_settings(p_role text, p_available_themes text[], p_default_theme text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  -- Controleer of de rol bestaat
  IF NOT EXISTS (SELECT 1 FROM public.theme_settings WHERE role = p_role) THEN
    RETURN FALSE;
  END IF;

  -- Controleer of het standaard thema in de beschikbare thema's zit
  IF NOT p_default_theme = ANY(p_available_themes) THEN
    RAISE EXCEPTION 'Default theme must be in the available themes list';
  END IF;

  -- Update de instellingen
  UPDATE public.theme_settings
  SET 
    available_themes = p_available_themes,
    default_theme = p_default_theme,
    updated_at = NOW()
  WHERE role = p_role;

  RETURN TRUE;
END;
$function$
;

grant delete on table "public"."customers" to "anon";

grant insert on table "public"."customers" to "anon";

grant references on table "public"."customers" to "anon";

grant select on table "public"."customers" to "anon";

grant trigger on table "public"."customers" to "anon";

grant truncate on table "public"."customers" to "anon";

grant update on table "public"."customers" to "anon";

grant delete on table "public"."customers" to "authenticated";

grant insert on table "public"."customers" to "authenticated";

grant references on table "public"."customers" to "authenticated";

grant select on table "public"."customers" to "authenticated";

grant trigger on table "public"."customers" to "authenticated";

grant truncate on table "public"."customers" to "authenticated";

grant update on table "public"."customers" to "authenticated";

grant delete on table "public"."customers" to "service_role";

grant insert on table "public"."customers" to "service_role";

grant references on table "public"."customers" to "service_role";

grant select on table "public"."customers" to "service_role";

grant trigger on table "public"."customers" to "service_role";

grant truncate on table "public"."customers" to "service_role";

grant update on table "public"."customers" to "service_role";

grant delete on table "public"."feedback" to "anon";

grant insert on table "public"."feedback" to "anon";

grant references on table "public"."feedback" to "anon";

grant select on table "public"."feedback" to "anon";

grant trigger on table "public"."feedback" to "anon";

grant truncate on table "public"."feedback" to "anon";

grant update on table "public"."feedback" to "anon";

grant delete on table "public"."feedback" to "authenticated";

grant insert on table "public"."feedback" to "authenticated";

grant references on table "public"."feedback" to "authenticated";

grant select on table "public"."feedback" to "authenticated";

grant trigger on table "public"."feedback" to "authenticated";

grant truncate on table "public"."feedback" to "authenticated";

grant update on table "public"."feedback" to "authenticated";

grant delete on table "public"."feedback" to "service_role";

grant insert on table "public"."feedback" to "service_role";

grant references on table "public"."feedback" to "service_role";

grant select on table "public"."feedback" to "service_role";

grant trigger on table "public"."feedback" to "service_role";

grant truncate on table "public"."feedback" to "service_role";

grant update on table "public"."feedback" to "service_role";

grant delete on table "public"."pinned_messages" to "anon";

grant insert on table "public"."pinned_messages" to "anon";

grant references on table "public"."pinned_messages" to "anon";

grant select on table "public"."pinned_messages" to "anon";

grant trigger on table "public"."pinned_messages" to "anon";

grant truncate on table "public"."pinned_messages" to "anon";

grant update on table "public"."pinned_messages" to "anon";

grant delete on table "public"."pinned_messages" to "authenticated";

grant insert on table "public"."pinned_messages" to "authenticated";

grant references on table "public"."pinned_messages" to "authenticated";

grant select on table "public"."pinned_messages" to "authenticated";

grant trigger on table "public"."pinned_messages" to "authenticated";

grant truncate on table "public"."pinned_messages" to "authenticated";

grant update on table "public"."pinned_messages" to "authenticated";

grant delete on table "public"."pinned_messages" to "service_role";

grant insert on table "public"."pinned_messages" to "service_role";

grant references on table "public"."pinned_messages" to "service_role";

grant select on table "public"."pinned_messages" to "service_role";

grant trigger on table "public"."pinned_messages" to "service_role";

grant truncate on table "public"."pinned_messages" to "service_role";

grant update on table "public"."pinned_messages" to "service_role";

grant delete on table "public"."prices" to "anon";

grant insert on table "public"."prices" to "anon";

grant references on table "public"."prices" to "anon";

grant select on table "public"."prices" to "anon";

grant trigger on table "public"."prices" to "anon";

grant truncate on table "public"."prices" to "anon";

grant update on table "public"."prices" to "anon";

grant delete on table "public"."prices" to "authenticated";

grant insert on table "public"."prices" to "authenticated";

grant references on table "public"."prices" to "authenticated";

grant select on table "public"."prices" to "authenticated";

grant trigger on table "public"."prices" to "authenticated";

grant truncate on table "public"."prices" to "authenticated";

grant update on table "public"."prices" to "authenticated";

grant delete on table "public"."prices" to "service_role";

grant insert on table "public"."prices" to "service_role";

grant references on table "public"."prices" to "service_role";

grant select on table "public"."prices" to "service_role";

grant trigger on table "public"."prices" to "service_role";

grant truncate on table "public"."prices" to "service_role";

grant update on table "public"."prices" to "service_role";

grant delete on table "public"."products" to "anon";

grant insert on table "public"."products" to "anon";

grant references on table "public"."products" to "anon";

grant select on table "public"."products" to "anon";

grant trigger on table "public"."products" to "anon";

grant truncate on table "public"."products" to "anon";

grant update on table "public"."products" to "anon";

grant delete on table "public"."products" to "authenticated";

grant insert on table "public"."products" to "authenticated";

grant references on table "public"."products" to "authenticated";

grant select on table "public"."products" to "authenticated";

grant trigger on table "public"."products" to "authenticated";

grant truncate on table "public"."products" to "authenticated";

grant update on table "public"."products" to "authenticated";

grant delete on table "public"."products" to "service_role";

grant insert on table "public"."products" to "service_role";

grant references on table "public"."products" to "service_role";

grant select on table "public"."products" to "service_role";

grant trigger on table "public"."products" to "service_role";

grant truncate on table "public"."products" to "service_role";

grant update on table "public"."products" to "service_role";

grant delete on table "public"."role_permissions" to "anon";

grant insert on table "public"."role_permissions" to "anon";

grant references on table "public"."role_permissions" to "anon";

grant select on table "public"."role_permissions" to "anon";

grant trigger on table "public"."role_permissions" to "anon";

grant truncate on table "public"."role_permissions" to "anon";

grant update on table "public"."role_permissions" to "anon";

grant delete on table "public"."role_permissions" to "authenticated";

grant insert on table "public"."role_permissions" to "authenticated";

grant references on table "public"."role_permissions" to "authenticated";

grant select on table "public"."role_permissions" to "authenticated";

grant trigger on table "public"."role_permissions" to "authenticated";

grant truncate on table "public"."role_permissions" to "authenticated";

grant update on table "public"."role_permissions" to "authenticated";

grant delete on table "public"."role_permissions" to "service_role";

grant insert on table "public"."role_permissions" to "service_role";

grant references on table "public"."role_permissions" to "service_role";

grant select on table "public"."role_permissions" to "service_role";

grant trigger on table "public"."role_permissions" to "service_role";

grant truncate on table "public"."role_permissions" to "service_role";

grant update on table "public"."role_permissions" to "service_role";

grant delete on table "public"."subscriptions" to "anon";

grant insert on table "public"."subscriptions" to "anon";

grant references on table "public"."subscriptions" to "anon";

grant select on table "public"."subscriptions" to "anon";

grant trigger on table "public"."subscriptions" to "anon";

grant truncate on table "public"."subscriptions" to "anon";

grant update on table "public"."subscriptions" to "anon";

grant delete on table "public"."subscriptions" to "authenticated";

grant insert on table "public"."subscriptions" to "authenticated";

grant references on table "public"."subscriptions" to "authenticated";

grant select on table "public"."subscriptions" to "authenticated";

grant trigger on table "public"."subscriptions" to "authenticated";

grant truncate on table "public"."subscriptions" to "authenticated";

grant update on table "public"."subscriptions" to "authenticated";

grant delete on table "public"."subscriptions" to "service_role";

grant insert on table "public"."subscriptions" to "service_role";

grant references on table "public"."subscriptions" to "service_role";

grant select on table "public"."subscriptions" to "service_role";

grant trigger on table "public"."subscriptions" to "service_role";

grant truncate on table "public"."subscriptions" to "service_role";

grant update on table "public"."subscriptions" to "service_role";

create policy "Allow individual user access to their own customer record"
on "public"."customers"
as permissive
for select
to public
using ((auth.uid() = id));


create policy "Allow authenticated users to insert their own feedback"
on "public"."feedback"
as permissive
for insert
to authenticated
with check ((auth.uid() = user_id));


create policy "feedback_select_policy"
on "public"."feedback"
as permissive
for select
to authenticated
using (((user_id = ( SELECT auth.uid() AS uid)) OR (( SELECT (auth.jwt() ->> 'role'::text)) = 'admin'::text)));


create policy "Allow users to delete their own pinned messages"
on "public"."pinned_messages"
as permissive
for delete
to authenticated
using ((auth.uid() = user_id));


create policy "Allow users to insert their own pinned messages"
on "public"."pinned_messages"
as permissive
for insert
to authenticated
with check ((auth.uid() = user_id));


create policy "Allow users to select their own pinned messages"
on "public"."pinned_messages"
as permissive
for select
to authenticated
using ((auth.uid() = user_id));


create policy "Allow users to update their own pinned messages"
on "public"."pinned_messages"
as permissive
for update
to authenticated
using ((auth.uid() = user_id));


create policy "Allow public read access to active prices"
on "public"."prices"
as permissive
for select
to public
using ((active = true));


create policy "Allow public read access to active products"
on "public"."products"
as permissive
for select
to public
using ((active = true));


create policy "Allow admins update all, users their own"
on "public"."profiles"
as permissive
for update
to authenticated
using (((get_my_role() = 'admin'::text) OR (auth.uid() = id)))
with check (((get_my_role() = 'admin'::text) OR (auth.uid() = id)));


create policy "Users can update their own profile"
on "public"."profiles"
as permissive
for update
to authenticated
using ((auth.uid() = id));


create policy "Allow admin full access"
on "public"."role_permissions"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));


create policy "Allow authenticated read access"
on "public"."role_permissions"
as permissive
for select
to public
using ((auth.role() = 'authenticated'::text));


create policy "Allow individual user access to their own subscriptions"
on "public"."subscriptions"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Allow public read for system_settings"
on "public"."system_settings"
as permissive
for select
to public
using (true);


create policy "Theme settings only editable by admins"
on "public"."theme_settings"
as permissive
for all
to public
using (((auth.jwt() ->> 'role'::text) = 'admin'::text));


create policy "Theme settings only viewable by admins"
on "public"."theme_settings"
as permissive
for select
to public
using (((auth.jwt() ->> 'role'::text) = 'admin'::text));


create policy "Allow admins to read external_api_usage_logs"
on "public"."external_api_usage_logs"
as permissive
for select
to authenticated
using ((( SELECT profiles.role
   FROM profiles
  WHERE (profiles.id = auth.uid())) = 'admin'::text));


create policy "Allow users to delete own profile"
on "public"."profiles"
as permissive
for delete
to authenticated
using ((auth.uid() = id));


create policy "Allow users to insert their own profile"
on "public"."profiles"
as permissive
for insert
to authenticated
with check ((auth.uid() = id));


create policy "profiles_select_policy"
on "public"."profiles"
as permissive
for select
to authenticated
using (((id = ( SELECT auth.uid() AS uid)) OR (( SELECT (auth.jwt() ->> 'role'::text)) = 'admin'::text)));


create policy "Allow users to insert their own saved research"
on "public"."saved_research"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Allow users to select their own saved research"
on "public"."saved_research"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "allow users to delete their own research"
on "public"."saved_research"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "admins_can_delete_system_settings"
on "public"."system_settings"
as permissive
for delete
to authenticated
using ((( SELECT profiles.role
   FROM profiles
  WHERE (profiles.id = auth.uid())) = 'admin'::text));


create policy "admins_can_insert_system_settings"
on "public"."system_settings"
as permissive
for insert
to authenticated
with check ((( SELECT profiles.role
   FROM profiles
  WHERE (profiles.id = auth.uid())) = 'admin'::text));


create policy "admins_can_update_system_settings"
on "public"."system_settings"
as permissive
for update
to authenticated
using ((( SELECT profiles.role
   FROM profiles
  WHERE (profiles.id = auth.uid())) = 'admin'::text))
with check ((( SELECT profiles.role
   FROM profiles
  WHERE (profiles.id = auth.uid())) = 'admin'::text));


create policy "admins_can_view_system_settings"
on "public"."system_settings"
as permissive
for select
to authenticated
using ((( SELECT profiles.role
   FROM profiles
  WHERE (profiles.id = auth.uid())) = 'admin'::text));


create policy "Allow individual delete access (of Allow delete for own notes)"
on "public"."task_notes"
as permissive
for delete
to authenticated
using ((auth.uid() = user_id));


create policy "Allow individual read access (of Allow select for own notes)"
on "public"."task_notes"
as permissive
for select
to authenticated
using ((auth.uid() = user_id));


create policy "Allow individual update access (of Allow update for own notes)"
on "public"."task_notes"
as permissive
for update
to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));


create policy "Allow insert for own notes"
on "public"."task_notes"
as permissive
for insert
to authenticated
with check ((auth.uid() = user_id));


create policy "Allow individual delete access"
on "public"."tasks"
as permissive
for delete
to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));


create policy "Allow admins to read user_api_logs"
on "public"."user_api_logs"
as permissive
for select
to authenticated
using ((( SELECT profiles.role
   FROM profiles
  WHERE (profiles.id = auth.uid())) = 'admin'::text));



