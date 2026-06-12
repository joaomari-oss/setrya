# Setrya — APIs & Services You Need

Every external service the project touches, why it's needed, where to get keys,
cost, and which `.env` variable it maps to.

Legend: 🔴 **Required** · 🟡 **Recommended** · 🟢 **Optional**

---

## 🔴 1. Supabase — Database + Storage (CORE)

Powers Postgres (with pgvector for AI similarity) **and** audio file storage.

| What | Detail |
|---|---|
| Sign up | https://supabase.com → New project (free tier is fine to start) |
| Get DB URL | Project Settings → Database → **Connection string** → **URI** tab → use the **Transaction pooler** (port `6543`) |
| Get API keys | Project Settings → **API** → copy `Project URL`, `anon` key, `service_role` key |
| Enable pgvector | SQL Editor → run `supabase/schema.sql` (turns on `vector` + creates tables/buckets) |
| Storage buckets | Auto-created by the app, or via `schema.sql`: `tracks` (private), `waveforms` (public) |
| Cost | Free: 500MB DB + 1GB storage. Pro $25/mo: 8GB DB + 100GB storage |

**Env vars:**
```
DATABASE_URL=postgresql+asyncpg://postgres.<ref>:<pwd>@aws-0-<region>.pooler.supabase.com:6543/postgres
DATABASE_URL_SYNC=postgresql://postgres.<ref>:<pwd>@aws-0-<region>.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://<ref>.supabase.co
SUPABASE_SERVICE_KEY=<service_role key>   # ⚠️ server only — bypasses RLS
SUPABASE_ANON_KEY=<anon key>
```

> ⚠️ `service_role` key is admin-level. Keep it in the backend `.env` only. Never expose it to the Next.js client.

---

## 🔴 2. Redis — Celery broker (CORE for background analysis)

Audio analysis (BPM, key, waveform, embeddings) runs in Celery workers. Redis is the queue.

| Option | Detail |
|---|---|
| Local/Docker | `docker-compose up redis` — already wired, zero signup |
| Hosted (prod) | **Upstash Redis** https://upstash.com — free tier 10k cmds/day, serverless |
| Alt hosted | Redis Cloud https://redis.com/try-free (30MB free) |
| Cost | Free tiers cover dev; Upstash pay-per-use scales cheap |

**Env vars:**
```
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://localhost:6379/2
```

---

## 🟡 3. Spotify Web API — track metadata search

Search tracks + pull metadata (title, artist, cover, preview, audio features) without uploading files.

| What | Detail |
|---|---|
| Sign up | https://developer.spotify.com/dashboard → Create app |
| Get keys | App → Settings → copy **Client ID** + **Client Secret** |
| Auth used | Client Credentials flow (no user login needed for search) |
| Cost | **Free** |
| Legal | Metadata only — no audio download. Compliant. |

**Env vars:**
```
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
```

---

## 🟢 4. SoundCloud API — track metadata (optional)

Search SoundCloud public tracks for metadata.

| What | Detail |
|---|---|
| Status | ⚠️ SoundCloud **paused public API registration**. New keys are hard to get. |
| If you have access | https://developers.soundcloud.com → register app → Client ID |
| Workaround | Many use a `client_id` from the web player (read-only public metadata) |
| Cost | Free |
| Legal | Metadata + public stream links only — no re-hosting copyrighted audio |

**Env var:**
```
SOUNDCLOUD_CLIENT_ID=
```

---

## 🟢 5. Beatport API — DJ-focused catalog (optional, gated)

Best genre/BPM/key metadata for electronic music, but access is restricted.

| What | Detail |
|---|---|
| Access | https://www.beatport.com/developers — **partner application required** (not instant) |
| Use case | Enrich genre/key/BPM for tracks you don't own |
| Cost | Free for approved partners |
| Note | Stub included; wire in once you have partner credentials |

**Env var:**
```
BEATPORT_API_KEY=
```

---

## 🟢 6. Rekordbox — NO API NEEDED ✅

Rekordbox integration is **file-based**, not an API. Setrya generates a Rekordbox-compatible
`.xml` (collection + playlist + cue points). In Rekordbox: Preferences → Advanced → Database →
rekordbox xml → point at the exported file, then File → Import.

Nothing to sign up for. Already implemented in `backend/app/integrations/rekordbox.py`.

---

## Hosting (when you deploy) — pick later

| Layer | Good options |
|---|---|
| Frontend (Next.js) | **Vercel** (free hobby tier, 1-click) |
| Backend (FastAPI) | **Railway** / **Render** / **Fly.io** (Docker, ~$5/mo) |
| Worker (Celery) | Same host as backend, separate service (Railway/Render worker) |
| Redis | **Upstash** (serverless, free tier) |
| Database + Storage | **Supabase** (already your DB) |

---

## Minimum to run locally TODAY

You only strictly need **two** things to boot the full app:

1. 🔴 **Supabase project** → fill `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`
2. 🔴 **Redis** → `docker-compose up redis` (no signup)

Everything else (Spotify, SoundCloud, Beatport) is optional metadata enrichment —
the app analyzes your **uploaded files** fully without any of them.

---

## Quick checklist

- [ ] Create Supabase project
- [ ] Run `supabase/schema.sql` in Supabase SQL Editor
- [ ] Copy pooler `DATABASE_URL` + service_role key into `.env`
- [ ] Start Redis (`docker-compose up redis`)
- [ ] (optional) Add Spotify Client ID/Secret
- [ ] `cp .env.example .env` and fill the 🔴 rows
- [ ] `docker-compose up --build`
