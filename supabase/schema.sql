-- ============================================================
-- Setrya — Supabase schema bootstrap
-- Run this ONCE in: Supabase Dashboard -> SQL Editor -> New query
-- The FastAPI app also auto-creates tables via SQLAlchemy, but running
-- this first guarantees pgvector + the ivfflat index exist.
-- ============================================================

-- 1) Enable pgvector (Supabase ships it; just turn it on)
create extension if not exists vector;

-- ============================================================
-- 2) Tables (mirror of SQLAlchemy models — idempotent)
-- ============================================================

create table if not exists users (
    id uuid primary key default gen_random_uuid(),
    name varchar(255) not null,
    email varchar(255) unique not null,
    hashed_password varchar(255) not null,
    avatar_url varchar(500),
    is_active boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz
);
create index if not exists idx_users_email on users(email);

create table if not exists tracks (
    id uuid primary key default gen_random_uuid(),
    title varchar(500) not null,
    artist varchar(500) not null,
    album varchar(500),
    duration_ms integer,
    bpm float,
    key varchar(10),
    key_standard varchar(10),
    energy float,
    danceability float,
    valence float,
    loudness float,
    genre varchar(100),
    subgenre varchar(100),
    cue_points float[],
    mix_in_point float,
    mix_out_point float,
    file_path varchar(1000),
    storage_key varchar(1000),
    audio_url varchar(1000),
    waveform_path varchar(1000),
    waveform_url varchar(1000),
    waveform_peaks jsonb,
    cover_url varchar(1000),
    external_source varchar(20) default 'local',
    external_id varchar(255),
    preview_url varchar(1000),
    is_analyzed integer default 0,
    created_at timestamptz default now(),
    updated_at timestamptz
);
create index if not exists idx_tracks_bpm on tracks(bpm);
create index if not exists idx_tracks_genre on tracks(genre);
create index if not exists idx_tracks_analyzed on tracks(is_analyzed);

create table if not exists playlists (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users(id) on delete cascade,
    name varchar(255) not null,
    description text,
    cover_url varchar(1000),
    is_auto_generated boolean default false,
    target_duration_min integer default 120,
    created_at timestamptz default now(),
    updated_at timestamptz
);
create index if not exists idx_playlists_user on playlists(user_id);

create table if not exists playlist_tracks (
    id uuid primary key default gen_random_uuid(),
    playlist_id uuid not null references playlists(id) on delete cascade,
    track_id uuid not null references tracks(id) on delete cascade,
    position integer not null,
    transition_type varchar(50),
    mix_in_offset integer,
    mix_out_offset integer,
    transition_notes text
);
create index if not exists idx_pt_playlist on playlist_tracks(playlist_id, position);

create table if not exists user_preferences (
    id uuid primary key default gen_random_uuid(),
    user_id uuid unique not null references users(id) on delete cascade,
    preferred_bpm_min float default 120.0,
    preferred_bpm_max float default 145.0,
    preferred_genres varchar[] default '{}',
    preferred_keys varchar[] default '{}',
    preferred_energy_min float default 0.5,
    preferred_energy_max float default 1.0,
    transition_patterns jsonb default '{}',
    set_structure_pattern jsonb default '{}',
    mixing_style varchar(50),
    updated_at timestamptz
);

create table if not exists track_embeddings (
    id uuid primary key default gen_random_uuid(),
    track_id uuid unique not null references tracks(id) on delete cascade,
    vector vector(42) not null,            -- MFCC(26) + chroma(12) + spectral(4)
    model_version varchar(50) default 'v1',
    created_at timestamptz default now()
);

create table if not exists listening_history (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users(id) on delete cascade,
    track_id uuid not null references tracks(id) on delete cascade,
    played_at timestamptz default now(),
    play_duration_ms integer,
    context varchar(50)
);
create index if not exists idx_history_user on listening_history(user_id);

-- ============================================================
-- 3) pgvector similarity index (cosine). Build AFTER you have rows.
--    lists ~= sqrt(row_count); 100 is fine up to ~100k tracks.
-- ============================================================
create index if not exists idx_embeddings_cosine
    on track_embeddings using ivfflat (vector vector_cosine_ops)
    with (lists = 100);

-- ============================================================
-- 4) Storage buckets — create in Dashboard -> Storage, OR run:
-- ============================================================
insert into storage.buckets (id, name, public)
values ('tracks', 'tracks', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('waveforms', 'waveforms', true)
on conflict (id) do nothing;

-- The backend uses the service_role key, which bypasses RLS, so no extra
-- storage policies are required for server-side upload/download.
