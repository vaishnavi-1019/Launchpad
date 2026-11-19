create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  target_role text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Launchpad user'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  source_job_id text,
  company text not null,
  role text not null,
  description text,
  website text,
  listing_url text,
  location text,
  work_mode text check (work_mode in ('remote', 'hybrid', 'on-site')),
  employment_type text check (employment_type in ('internship', 'full-time', 'part-time', 'contract')),
  salary_range text,
  application_date date,
  status text not null default 'wishlist'
    check (status in ('wishlist', 'applied', 'assessment', 'interview', 'offer', 'rejected')),
  created_at timestamptz not null default now(),
  applied_at timestamptz,
  interview_at timestamptz,
  interview_type text,
  notes text,
  contact_person text,
  follow_up_date date,
  tags text[] not null default '{}',
  activity jsonb not null default '[]'::jsonb
    check (jsonb_typeof(activity) = 'array'),
  unique (id, user_id)
);

create index applications_user_status_idx on public.applications (user_id, status);
create index applications_user_created_idx on public.applications (user_id, created_at desc);
create index applications_user_follow_up_idx on public.applications (user_id, follow_up_date);

create table public.saved_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  listing_id text not null,
  listing_data jsonb not null check (jsonb_typeof(listing_data) = 'object'),
  created_at timestamptz not null default now(),
  unique (user_id, listing_id),
  unique (id, user_id)
);

create index saved_jobs_user_created_idx on public.saved_jobs (user_id, created_at desc);

create table public.interview_preparations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  application_id uuid not null,
  scheduled_at timestamptz not null,
  interview_type text not null,
  reminder text not null default 'none'
    check (reminder in ('none', '15', '30', '60', '1440')),
  checklist jsonb not null default '[]'::jsonb check (jsonb_typeof(checklist) = 'array'),
  company_research text not null default '',
  role_notes text not null default '',
  interviewer_questions jsonb not null default '[]'::jsonb
    check (jsonb_typeof(interviewer_questions) = 'array'),
  technical_questions jsonb not null default '[]'::jsonb
    check (jsonb_typeof(technical_questions) = 'array'),
  behavioral_questions jsonb not null default '[]'::jsonb
    check (jsonb_typeof(behavioral_questions) = 'array'),
  star_stories jsonb not null default '[]'::jsonb
    check (jsonb_typeof(star_stories) = 'array'),
  personal_notes text not null default '',
  outcome text not null default 'upcoming'
    check (outcome in ('upcoming', 'advanced', 'offer', 'rejected', 'withdrew')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (application_id, user_id)
    references public.applications (id, user_id) on delete cascade
);

create index interview_preparations_user_schedule_idx
  on public.interview_preparations (user_id, scheduled_at);
create index interview_preparations_application_idx
  on public.interview_preparations (application_id, user_id);

create trigger interview_preparations_set_updated_at
  before update on public.interview_preparations
  for each row execute function public.set_updated_at();

create table public.skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  category text not null
    check (category in ('Frontend', 'Backend', 'Database', 'Tools', 'Soft Skills')),
  proficiency text not null default 'beginner'
    check (proficiency in ('beginner', 'learning', 'intermediate', 'advanced')),
  learning_status text not null default 'to-learn'
    check (learning_status in ('have', 'learning', 'to-learn', 'completed')),
  progress integer not null default 0 check (progress between 0 and 100),
  priority text not null default 'medium'
    check (priority in ('high', 'medium', 'low')),
  manual_required boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  unique (user_id, name)
);

create index skills_user_status_idx on public.skills (user_id, learning_status);
create index skills_user_category_idx on public.skills (user_id, category);

create trigger skills_set_updated_at
  before update on public.skills
  for each row execute function public.set_updated_at();

create table public.learning_resources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  skill_id uuid not null,
  title text not null,
  url text,
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  foreign key (skill_id, user_id)
    references public.skills (id, user_id) on delete cascade
);

create index learning_resources_skill_idx
  on public.learning_resources (skill_id, user_id, position);

create table public.skill_job_sources (
  user_id uuid not null references auth.users (id) on delete cascade,
  skill_id uuid not null,
  saved_job_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (skill_id, saved_job_id),
  foreign key (skill_id, user_id)
    references public.skills (id, user_id) on delete cascade,
  foreign key (saved_job_id, user_id)
    references public.saved_jobs (id, user_id) on delete cascade
);

create index skill_job_sources_saved_job_idx
  on public.skill_job_sources (saved_job_id, user_id);

alter table public.profiles enable row level security;
alter table public.applications enable row level security;
alter table public.saved_jobs enable row level security;
alter table public.interview_preparations enable row level security;
alter table public.skills enable row level security;
alter table public.learning_resources enable row level security;
alter table public.skill_job_sources enable row level security;

create policy "Profiles are private to their owner"
  on public.profiles for all to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "Applications are private to their owner"
  on public.applications for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Saved jobs are private to their owner"
  on public.saved_jobs for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Interview preparation is private to its owner"
  on public.interview_preparations for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Skills are private to their owner"
  on public.skills for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Learning resources are private to their owner"
  on public.learning_resources for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Skill job sources are private to their owner"
  on public.skill_job_sources for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant select, insert, update, delete
  on table
    public.profiles,
    public.applications,
    public.saved_jobs,
    public.interview_preparations,
    public.skills,
    public.learning_resources,
    public.skill_job_sources
  to authenticated;
