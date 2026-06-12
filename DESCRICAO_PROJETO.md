# Setrya — Descrições para cadastro em plataformas

## Nome do app
**Setrya**

## Tagline (1 linha)
- PT: Assistente de DJ com IA — análise de áudio, sets perfeitos e recomendações harmônicas.
- EN: AI-powered DJ assistant — audio analysis, perfect set building, and harmonic recommendations.

## Descrição curta (~250 caracteres, cabe em qualquer formulário)
**PT:** Setrya é um assistente de DJ com IA. Analisa suas músicas (BPM, tom Camelot, energia), gera sets completos com curvas de energia, sugere transições e exporta para Rekordbox. Integrações de metadados enriquecem a biblioteca do usuário.

**EN:** Setrya is an AI DJ assistant. It analyzes your music (BPM, Camelot key, energy), generates complete DJ sets with energy curves, suggests transitions, and exports to Rekordbox. Metadata integrations enrich the user's library.

## Descrição longa (para campos "describe your app / use case")
**EN (use esta nos cadastros de API — Spotify/SoundCloud pedem em inglês):**

Setrya is a web-based DJ assistant for working DJs. Users upload their own audio files; the platform runs an AI analysis pipeline (librosa) that extracts BPM, musical key (Camelot notation), energy, danceability and cue points, and computes audio embeddings for similarity search (pgvector). On top of that analysis, Setrya generates complete DJ sets following configurable energy curves (warm-up → peak → closing), scores harmonic compatibility between tracks using the Camelot wheel, suggests transition type and timing for each track pair, and exports finished sets to Rekordbox XML with cue points.

**How we use the API:** metadata search only — when a user looks up a track, we query the catalog API for title, artist, album art and preview metadata to enrich the user's local library and recommendations. We do not download, stream, store or redistribute audio content from the platform; users only play files they uploaded themselves. Authentication of end users is handled by our own backend (JWT); API credentials are stored server-side only.

- App type: Web App
- Website: https://SEU-PROJETO.vercel.app
- Redirect URI (Spotify): https://SEU-PROJETO.vercel.app/api/auth/spotify/callback
- Commercial use: No (personal/hobby project, no monetization)

**PT (se o formulário aceitar português):**

Setrya é um assistente de DJ via web. O usuário envia suas próprias músicas; um pipeline de IA (librosa) extrai BPM, tom (notação Camelot), energia, dançabilidade e cue points, e gera embeddings de áudio para busca por similaridade (pgvector). Com isso, o Setrya monta sets completos seguindo curvas de energia configuráveis, calcula compatibilidade harmônica pela roda de Camelot, sugere tipo e timing de transição para cada par de faixas e exporta o set em XML do Rekordbox com cue points.

**Uso da API:** apenas busca de metadados — título, artista, capa e metadados de preview para enriquecer a biblioteca local do usuário. Não baixamos, transmitimos nem redistribuímos áudio da plataforma; o usuário só toca arquivos que ele mesmo enviou. Credenciais da API ficam somente no servidor.

## Stack (se pedirem)
Next.js 15 + React 19 (frontend) · FastAPI/Python (backend) · PostgreSQL + pgvector · Celery + Redis (análise em background) · librosa (análise de áudio)
