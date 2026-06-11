# ARCHITECTURE — Bolao Clube dos Amigos Copa 2026

*Organizacao tecnica, camadas e regras de seguranca.*
*Base: `prd.md`, `spec.md`. Criado em: 2026-06-11*

---

## 1. PRINCIPIO: THIN CLIENT / FAT SERVER

- **Frontend** so captura intencao do admin e renderiza dados
- **Backend** (Server Actions / Route Handlers) concentra TODA logica:
  pontuacao, WO, invalidacao, classificacao, premiacao
- Nenhuma chave/secret nem regra de negocio no client
- O painel publico e read-only e le so dados nao sensiveis

---

## 2. CAMADAS

```
┌─────────────────────────────────────────────┐
│  CLIENT (browser)                            │
│  - Paginas publicas (read-only)              │
│  - Paginas admin (formularios, tabelas)      │
│  - Dispara Server Actions; nunca calcula     │
└───────────────────┬─────────────────────────┘
                    │
┌───────────────────▼─────────────────────────┐
│  SERVER (Next.js — Vercel)                   │
│  - Server Actions / Route Handlers           │
│  - lib/pontuacao.ts  (funcao pura)           │
│  - lib/ranking.ts    (agregacao + ordenacao) │
│  - Middleware: protege /admin/*              │
│  - Service role key (so aqui)                │
└───────────────────┬─────────────────────────┘
                    │
┌───────────────────▼─────────────────────────┐
│  SUPABASE (PostgreSQL + Auth + RLS)          │
│  - Tabelas: participantes, rodadas, jogos,   │
│    palpites, config                          │
│  - Views publicas (omitem dado sensivel)     │
│  - RLS em todas as tabelas                   │
└─────────────────────────────────────────────┘
```

---

## 3. ESTRUTURA DE PASTAS

```
bolao/
├── claude.md            # regras do agente
├── prd.md               # requisitos
├── spec.md              # spec tecnica
├── design-brief.md      # guia visual (Stitch)
├── architecture.md      # este arquivo
├── issues/              # tarefinhas quebradas da spec
├── src/
│   ├── app/
│   │   ├── (public)/                 # /, /resultados, /grade
│   │   ├── login/
│   │   ├── admin/                    # dashboard + CRUDs (protegido)
│   │   ├── actions/                  # Server Actions por entidade
│   │   └── middleware.ts             # guard /admin/*
│   ├── components/                   # UI reutilizavel (TabelaDensa, etc.)
│   ├── lib/
│   │   ├── supabase/{client,server}.ts
│   │   ├── pontuacao.ts              # pura, testavel
│   │   └── ranking.ts
│   └── styles/
├── supabase/
│   └── migrations/*.sql              # schema + RLS + views + seed
├── public/
├── .env.local                        # NUNCA commitar
├── .gitignore                        # inclui .env.local
└── package.json
```

---

## 4. FLUXO DE DADOS

### Escrita (admin)
```
Form admin -> Server Action -> valida input ->
  escreve no Supabase (service role) ->
  recalcula pontos/cravada dos palpites afetados ->
  revalida cache da pagina
```

### Leitura publica
```
Pagina publica (server component) ->
  le view publica (sem contato/pagamento) ->
  lib/ranking ordena (desempate) -> renderiza
```

### Pontuacao (sempre server)
- `lib/pontuacao.ts`: `pontosDoPalpite(palpite, jogo, rodada, config)` — pura
- `lib/ranking.ts`: soma, cravadas, WO, bonus campeao, premiacao, ordenacao
- Disparo de recalculo: ver `spec.md` secao 2.4

---

## 5. SEGURANCA

### RLS (Row Level Security) — ativo em TODAS as tabelas
| Tabela | SELECT publico | Escrita |
|--------|----------------|---------|
| participantes | so via view publica (nome, campea) | so admin autenticado |
| rodadas | sim | so admin |
| jogos | sim | so admin |
| palpites | sim (placar/pontos publicos) | so admin |
| config | so via view publica | so admin |

- Colunas sensiveis (`contato`, `pago`, `pago_em`) NUNCA na view publica
- Escrita exige `auth.uid()` (admin logado)

### Chaves e env
| Var | Onde | Exposta? |
|-----|------|----------|
| NEXT_PUBLIC_SUPABASE_URL | client+server | sim (publica) |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | client+server | sim (protegida por RLS) |
| SUPABASE_SERVICE_ROLE_KEY | so server | **NUNCA** no client |

- `.env.local` no `.gitignore`. Producao: env vars na Vercel
- Middleware redireciona `/admin/*` nao autenticado para `/login`

---

## 6. DEPLOY

- GitHub (repo privado) -> Vercel (deploy automatico por push)
- Preview deploy por branch para validar com o cliente
- Migrations Supabase versionadas em `supabase/migrations/`
- SSL automatico (Vercel)

---

## 7. DECISOES ARQUITETURAIS

| Decisao | Motivo |
|---------|--------|
| Single-admin, sem auth de palpitador | Reduz escopo e superficie de risco |
| Pontos cacheados em `palpites.pontos` | Leitura rapida; recalculo so em eventos |
| WO como flag manual na linha de palpite | Admin recebe palpites no WhatsApp |
| Invalidacao como flag (jogo e rodada) | Reversivel; nao apaga dado |
| Classificacao derivada em query/lib | Desempate complexo (4 criterios) no server |
| Views publicas | Garante que dado sensivel nunca vaza pro publico |

---

*Documento vivo. Complementos: `prd.md`, `spec.md`, `design-brief.md`.*
