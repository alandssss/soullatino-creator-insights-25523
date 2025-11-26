-- Create user_roles table
create table if not exists public.user_roles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null check (role in ('admin', 'manager', 'viewer', 'supervisor', 'reclutador')),
  created_at timestamptz default now(),
  constraint user_roles_user_id_key unique (user_id)
);

-- Enable RLS
alter table public.user_roles enable row level security;

-- Policies
create policy "Users can view their own role" 
  on public.user_roles for select 
  using (auth.uid() = user_id);

create policy "Admins can manage all roles" 
  on public.user_roles for all 
  using (
    exists (
      select 1 from public.user_roles 
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- Grant access to authenticated users
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
