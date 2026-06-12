# Como rodar o Setrya

## O que você precisa ter

| Ferramenta | Pra quê | Status na sua máquina |
|---|---|---|
| **Docker Desktop** | Backend (FastAPI) + worker (Celery) + Postgres + Redis | ✅ instalado |
| **Node.js 20+** | Frontend (Next.js) | ✅ v24 instalado |

> Não precisa de Python local — o backend roda em Docker (Python 3.12).
> O banco agora é um **Postgres local com pgvector dentro do Docker** (o `.env` tinha placeholder do Supabase, não a URL real — quando quiser migrar, preencha `DATABASE_URL` no `.env` e nos blocos `environment` do `docker-compose.yml`).

## Rodar (2 terminais)

**Terminal 1 — backend completo (Docker):**
```bash
cd C:\Users\KABUM\OneDrive\Documentos\PROGRAMACAO\ProjetosPessoais\setrya\setrya
docker compose up postgres redis backend worker -d
```
Confere: http://localhost:8000/docs deve abrir.

**Terminal 2 — frontend:**
```bash
cd C:\Users\KABUM\OneDrive\Documentos\PROGRAMACAO\ProjetosPessoais\setrya\setrya\frontend
npm run dev
```

## Abrir o site

→ **http://localhost:3000**

1. **Get started** → cria conta.
2. **Library** → **Upload** → arrasta MP3/WAV/FLAC.
3. Worker analisa (BPM, key, energia, waveform) em ~10–30s por faixa.
4. **Set Generator** monta sets · **Simulator** analisa transições · **Playlists** exporta Rekordbox XML.

## Problemas já resolvidos nesta máquina (não mexer)

- **Avast intercepta TLS** → quebrava `npm install`, `next build` (Google Fonts) e `pip` no Docker.
  - npm: `cafile` → `C:\Users\KABUM\avast-root-ca.pem` (já configurado).
  - Node: variável `NODE_EXTRA_CA_CERTS` já gravada no Windows (`setx`) — **abre um terminal NOVO** antes de rodar `npm run dev`/`build`.
  - pip no Docker: `--trusted-host pypi.org --trusted-host files.pythonhosted.org` no `backend/Dockerfile`.
- **bcrypt 5.x × passlib** → pinado `bcrypt==4.0.1`.
- **httpx 0.28 × supabase 2.10** → pinado `httpx==0.27.2`.
- **CORS_ORIGINS** agora é string separada por vírgula (não JSON).

## Pendências suas (opcional)

- **Supabase Storage**: `SUPABASE_SERVICE_KEY` no `.env` está com a chave *publishable* (`sb_publishable_...`). Storage em nuvem só funciona com a **service_role secret** (`sb_secret_...`) — pega em Project Settings → API keys. Enquanto isso, uploads vão pro disco local (funciona normal).
- **Spotify/SoundCloud**: chaves vazias no `.env` — busca externa desligada até preencher (ver `APIS.md`).

## Se algo falhar

- API: http://localhost:8000/docs · Logs: `docker compose logs -f backend worker`
- Resetar: `docker compose down` e subir de novo.
- **OneDrive** deixa `npm install` lento e pode travar `node_modules`. Se acontecer: pausa o sync do OneDrive ou move o projeto pra `C:\dev\setrya`.
