create extension if not exists pgcrypto;

create table if not exists public.trip_photos (
  photo_id uuid primary key default gen_random_uuid(),
  trip_id text not null default 'asia-2026',
  storage_path text not null unique,
  uploaded_by uuid not null,
  uploader_email text not null,
  captured_at timestamptz,
  trip_date date not null,
  leg_id text not null,
  caption text check (char_length(caption) <= 280),
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  content_hash text not null,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (trip_id, content_hash)
);

create index if not exists trip_photos_trip_date_idx
  on public.trip_photos (trip_id, trip_date desc, captured_at desc);

alter table public.trip_photos enable row level security;

do $$
begin
  if not exists (select 1 from storage.buckets where id = 'trip-photos') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values (
      'trip-photos',
      'trip-photos',
      true,
      8388608,
      array['image/jpeg', 'image/png', 'image/webp']
    );
  end if;
end $$;

create or replace function public.set_trip_photos_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_trip_photos_updated_at on public.trip_photos;
create trigger set_trip_photos_updated_at
before update on public.trip_photos
for each row execute function public.set_trip_photos_updated_at();

revoke all on public.trip_photos from anon, authenticated;
