# Setrya — Dados para Registro de APIs

Tudo pronto pra copiar e colar nos formulários de cada plataforma (Spotify, SoundCloud, Beatport, etc.). Os campos estão em **inglês** porque é assim que os formulários pedem.

---

## Identidade do Projeto (use em qualquer formulário)

| Campo | Valor |
|---|---|
| **Project / App Name** | `Setrya` |
| **Site Name** | `Setrya — AI DJ Studio` |
| **Tagline** | `AI-powered DJ studio for set planning, mixing assistance and track recommendation` |
| **Category / Industry** | `Music / DJ Software / Creator Tools` |
| **Status** | `In development (private beta)` |
| **Contact email** | *(coloque seu email de contato)* |

### Website / Homepage URL

Use **um destes** (em ordem de preferência — o formulário aceita qualquer URL bem formada e acessível):

1. **Repositório GitHub** (recomendado enquanto não tem site público):
   `https://github.com/<seu-usuario>/setrya`
2. **Landing page provisória no Vercel** (criar grátis):
   `https://setrya.vercel.app`
3. **Domínio próprio** (quando comprar):
   `https://setrya.app` ou `https://setrya.io`

> ⚠️ A URL precisa retornar HTTP 200. Pra dev, suba o repositório público no GitHub ou faça um deploy estático de 1 clique no Vercel — é o caminho mais rápido.

---

## 🎵 1. Spotify for Developers

**Link do dashboard:** https://developer.spotify.com/dashboard
**Docs da API:** https://developer.spotify.com/documentation/web-api

### Campos do formulário "Create App"

| Campo do Spotify | O que colar |
|---|---|
| **App name** | `Setrya` |
| **App description** | *(usar o bloco abaixo)* |
| **Website** | `https://github.com/<seu-usuario>/setrya` *(ou a URL do seu Vercel)* |
| **Redirect URIs** | `http://127.0.0.1:8000/auth/spotify/callback` <br> `http://localhost:3000/auth/spotify/callback` <br> `https://setrya.vercel.app/auth/spotify/callback` |
| **Which API/SDKs are you planning to use?** | ✅ **Web API** *(marca só essa — é a única que você usa)* |
| **Commercial integration?** | `No` (selecione "Non-commercial" enquanto está em dev) |

#### App description (cola exatamente isso)

```
Setrya is an AI-assisted DJ studio that helps electronic music DJs plan sets,
analyze their music library, and discover compatible tracks. We use the Spotify
Web API exclusively for read-only metadata enrichment: searching tracks by
title/artist, fetching audio features (BPM, key, energy, danceability) and
album artwork to augment the metadata of audio files the user has uploaded to
their own private library. No Spotify audio content is downloaded, cached or
redistributed. All playback within Setrya happens from files the user owns.
```

#### "Which API/SDKs" — resposta detalhada

Se o formulário pedir explicação por extenso, use:

```
Web API only. Specifically the following endpoints:
- GET /v1/search (track search)
- GET /v1/tracks/{id} and /v1/tracks?ids=...
- GET /v1/audio-features/{id} and /v1/audio-features?ids=...
- GET /v1/audio-analysis/{id}
- GET /v1/artists/{id}
- GET /v1/albums/{id}

Authentication: Client Credentials flow (server-to-server, no end-user login,
no access to private user data). No use of Web Playback SDK, iOS SDK or
Android SDK.
```

---

## 🟠 2. SoundCloud for Developers

**Link:** https://developers.soundcloud.com
**Form de aplicação:** https://developers.soundcloud.com/docs/api/guide#authentication (registro de novos apps está pausado oficialmente — preencha o formulário de contato em https://developers.soundcloud.com/ e descreva o uso)
**Docs:** https://developers.soundcloud.com/docs/api/reference

### Campos típicos

| Campo | O que colar |
|---|---|
| **Application name** | `Setrya` |
| **Website** | `https://github.com/<seu-usuario>/setrya` |
| **Redirect URI** | `http://localhost:3000/auth/soundcloud/callback` <br> `https://setrya.vercel.app/auth/soundcloud/callback` |
| **Description** | *(bloco abaixo)* |
| **Which API/SDKs are you planning to use?** | ✅ **HTTP API v2** (REST) — não usa SDK móvel |

#### Description

```
Setrya is an AI-powered DJ planning tool. We use the SoundCloud HTTP API to
let DJs search public tracks by title/artist for metadata enrichment (title,
artist name, duration, genre tags, artwork URL, public stream URL). We do not
re-host, download or redistribute any SoundCloud audio — playback happens via
SoundCloud's own public stream endpoints inside the user's session. Read-only
usage, no posting or modifying user content.
```

#### "Which API/SDKs" — resposta detalhada

```
SoundCloud HTTP API v2 only (REST/JSON). Endpoints used:
- GET /tracks (search)
- GET /tracks/{id}
- GET /users/{id}/tracks
- GET /resolve

Authentication: OAuth 2.1 Client Credentials. No mobile SDK, no widget
embedding, no upload endpoints.
```

---

## 🟣 3. Beatport for Developers

**Link:** https://api.beatport.com/v4/docs/
**Programa de partner:** https://www.beatport.com/developers (formulário de contato — acesso é caso a caso, focado em parceiros comerciais)

### Campos do formulário de aplicação

| Campo | O que colar |
|---|---|
| **Company / Project name** | `Setrya` |
| **Website** | `https://github.com/<seu-usuario>/setrya` |
| **Use case category** | `DJ software / Library management` |
| **Description** | *(bloco abaixo)* |
| **Which API/SDKs are you planning to use?** | ✅ **Beatport API v4 (catalog/metadata endpoints)** |

#### Description

```
Setrya is a DJ studio software focused on electronic music. We are applying
for Beatport API access to enrich track metadata in our users' libraries
specifically for electronic genres: accurate genre/subgenre classification,
canonical BPM, musical key (Camelot + Open Key notation), label, release date
and artwork. Metadata only — we do not stream, download or resell Beatport
audio. Targeted at professional and hobbyist DJs preparing sets from music
they already own.
```

#### "Which API/SDKs" — resposta detalhada

```
Beatport API v4, catalog endpoints only:
- GET /catalog/search
- GET /catalog/tracks/{id}
- GET /catalog/releases/{id}
- GET /catalog/artists/{id}
- GET /catalog/genres

Read-only metadata enrichment. No commerce / cart / purchase endpoints, no
streaming endpoints, no SDK.
```

---

## 🟢 4. Discogs API (bônus — útil pra metadata vinílico)

**Link:** https://www.discogs.com/settings/developers
**Docs:** https://www.discogs.com/developers

| Campo | Valor |
|---|---|
| **Application name** | `Setrya` |
| **Description** | `DJ library tool — Discogs read-only metadata enrichment (release info, label, year, genre) for tracks in users' personal libraries.` |
| **Website / Callback URL** | `https://github.com/<seu-usuario>/setrya` |
| **Which API/SDKs** | ✅ **Discogs HTTP API v2** (REST) |

---

## 🟢 5. MusicBrainz / AcoustID (bônus — fingerprinting de áudio grátis)

**Link MusicBrainz:** https://musicbrainz.org/account/applications
**Link AcoustID:** https://acoustid.org/new-application

| Campo | Valor |
|---|---|
| **Application name** | `Setrya` |
| **Version** | `0.1.0` |
| **Website** | `https://github.com/<seu-usuario>/setrya` |
| **Description** | `AI DJ studio — uses MusicBrainz + AcoustID for audio fingerprinting and canonical metadata lookup on tracks uploaded by users.` |
| **Which API/SDKs** | ✅ **MusicBrainz WS/2** + **AcoustID lookup API** (REST) |

---

## URLs de Redirect / Callback que você vai precisar registrar

Cola **todas estas** sempre que o formulário aceitar múltiplas URIs de callback. Cobre dev local + deploy:

```
http://localhost:3000/auth/<provider>/callback
http://127.0.0.1:3000/auth/<provider>/callback
http://localhost:8000/auth/<provider>/callback
http://127.0.0.1:8000/auth/<provider>/callback
https://setrya.vercel.app/auth/<provider>/callback
```

Troca `<provider>` por `spotify`, `soundcloud`, `beatport`, etc.

> 💡 Spotify **exige HTTPS** em produção mas aceita `http://127.0.0.1` (não `localhost`!) em desenvolvimento desde 2025. Use `127.0.0.1` no callback de dev pra evitar dor de cabeça.

---

## Checklist de Setup

- [ ] Criar repositório público no GitHub (`https://github.com/<user>/setrya`) → vira sua "Website" oficial
- [ ] (Opcional, recomendado) Deploy de 1 clique do frontend no Vercel → `https://setrya.vercel.app`
- [ ] Spotify Dashboard → criar app com os dados acima → copiar `Client ID` + `Client Secret` pro `.env`
- [ ] Enviar formulário de contato SoundCloud (registro novo está pausado)
- [ ] Enviar aplicação de partner pra Beatport (resposta demora dias/semanas)
- [ ] (Opcional) Registrar Discogs + MusicBrainz/AcoustID (instantâneo, sem aprovação)
