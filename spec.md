# SPEC — Bolao Copa do Mundo FIFA 2026

*Especificacao tecnica. Cada pagina, componente e comportamento.*
*Guia tatico para a IA codar. Base: `prd.md`.*
*Criado em: 2026-06-11*

---

## 1. MODELO DE DADOS (Supabase / PostgreSQL)

### Tabela `participantes`
| Coluna | Tipo | Notas |
|--------|------|-------|
| id | uuid PK | default gen_random_uuid() |
| nome | text NOT NULL | |
| contato | text NULL | telefone/whats opcional (privado) |
| pago | boolean NOT NULL default false | controle manual |
| pago_em | timestamptz NULL | |
| selecao_campea | text NULL | palpite de campeao |
| campea_em | timestamptz NULL | |
| created_at | timestamptz default now() | |

### Tabela `selecoes` (referencia — times + bandeiras)
| Coluna | Tipo | Notas |
|--------|------|-------|
| codigo | text PK | codigo FIFA 3 letras (MEX, BRA, ...) |
| nome | text NOT NULL | nome completo (Mexico, Brasil) |
| iso2 | text NULL | ISO alpha-2 p/ bandeira via CDN (mx, br) |
| emoji | text NULL | bandeira emoji (fallback rapido) |

> Bandeira renderizada por `iso2` (ex: flagcdn.com/24x18/{iso2}.png)
> com fallback no `emoji`. Seed das selecoes participantes.

### Tabela `rodadas`
| Coluna | Tipo | Notas |
|--------|------|-------|
| id | uuid PK | |
| nome | text NOT NULL | ex: "Rodada 1 — Grupos 11/06" |
| ordem | int NOT NULL default 0 | ordenacao no painel |
| prazo_palpite | timestamptz NULL | **so referencia visual** |
| invalidada | boolean NOT NULL default false | anula todos os jogos da rodada |
| created_at | timestamptz default now() | |

### Tabela `jogos`
| Coluna | Tipo | Notas |
|--------|------|-------|
| id | uuid PK | |
| rodada_id | uuid FK -> rodadas(id) ON DELETE CASCADE | |
| fase | text NULL | grupos / 16avos / oitavas / quartas / semi / terceiro / final |
| grupo | text NULL | A..L (fase de grupos) |
| time_casa_cod | text NULL FK -> selecoes(codigo) | mandante (null no mata-mata ate definir) |
| time_fora_cod | text NULL FK -> selecoes(codigo) | visitante (null no mata-mata ate definir) |
| rotulo_casa | text NULL | vaga do mata-mata quando sem time ("1o A", "Venc. Jogo 73") |
| rotulo_fora | text NULL | idem visitante |
| classico | boolean NOT NULL default false | pontua mais |
| invalidado | boolean NOT NULL default false | anula este jogo |
| data_hora | timestamptz NOT NULL | |
| placar_casa | int NULL | null = nao apurado |
| placar_fora | int NULL | null = nao apurado |
| encerrado | boolean NOT NULL default false | true quando resultado lancado |
| created_at | timestamptz default now() | |

### Tabela `palpites`
Representa o registro do admin para (participante, jogo): ou um palpite
de placar, ou um WO.

| Coluna | Tipo | Notas |
|--------|------|-------|
| id | uuid PK | |
| participante_id | uuid FK -> participantes(id) ON DELETE CASCADE | |
| jogo_id | uuid FK -> jogos(id) ON DELETE CASCADE | |
| palpite_casa | int NULL | >= 0, null se WO |
| palpite_fora | int NULL | >= 0, null se WO |
| wo | boolean NOT NULL default false | admin marcou ausencia |
| pontos | int NOT NULL default 0 | cache (so deste jogo) |
| cravada | boolean NOT NULL default false | cache: placar exato? |
| created_at | timestamptz default now() | |

Constraints:
- `UNIQUE (participante_id, jogo_id)`
- CHECK: `wo = true AND palpite_casa IS NULL AND palpite_fora IS NULL`
  **OU** `wo = false AND palpite_casa IS NOT NULL AND palpite_fora IS NOT NULL`
- **Sem linha** para (participante, jogo) = admin ainda nao registrou
  nada → nao pontua e nao e WO

### Tabela `config` (singleton, id=1)
| Coluna | Tipo | Default |
|--------|------|---------|
| id | int PK check(id=1) | 1 |
| pts_acerto | int | 1 |
| pts_cravada | int | 2 |
| pts_acerto_classico | int | 3 |
| pts_cravada_classico | int | 4 |
| pts_campeao | int | 5 |
| pts_wo | int | -1 |
| pct_1 | int | 60 |
| pct_2 | int | 30 |
| pct_3 | int | 10 |
| valor_cota | numeric(10,2) NULL | null = mostra so % |
| prazo_campeao | timestamptz | 2026-06-11 23:59 |
| campeao_real | text NULL | set no fim -> aplica +5 |

> Admin via Supabase Auth (usuario unico). Identidade em `auth.users`.

---

## 2. LOGICA DE PONTUACAO (server-side)

### 2.1 — Pontos de um palpite
Funcao pura `pontosDoPalpite(palpite, jogo, rodada, config)`:

```
invalidado = jogo.invalidado || rodada.invalidada
se invalidado            -> { pontos: 0, cravada: false }
se palpite.wo            -> { pontos: pts_wo (-1), cravada: false }
se !jogo.encerrado       -> { pontos: 0, cravada: false }

exato = palpite_casa == placar_casa && palpite_fora == placar_fora
saldoP = palpite_casa - palpite_fora
saldoR = placar_casa - placar_fora
resultadoCerto = sign(saldoP) == sign(saldoR)   // empate = 0

se jogo.classico:
  exato          -> pts_cravada_classico (4)
  resultadoCerto -> pts_acerto_classico  (3)
  senao          -> 0
senao:
  exato          -> pts_cravada (2)
  resultadoCerto -> pts_acerto  (1)
  senao          -> 0

cravada = exato
```

> Tiers excludentes. `pontos` no palpite NAO inclui bonus de campeao.

### 2.2 — Bonus de campeao (derivado, no ranking)
```
bonusCampeao(p) =
  (config.campeao_real != null
   && p.selecao_campea == config.campeao_real) ? pts_campeao : 0
```

### 2.3 — Total e classificacao
```
total(p) = sum(palpite.pontos de p)   // ja inclui WO (-1) e exclui invalidados
         + bonusCampeao(p)

cravadas(p) = count(palpites de p where cravada = true)
woCount(p)  = count(palpites de p where wo = true
                    and NOT jogo.invalidado and NOT rodada.invalidada)
acertouCampeao(p) = bonusCampeao(p) > 0

ordenar por:
  total desc,
  cravadas desc,
  woCount asc,
  acertouCampeao desc,
  nome asc
```

### 2.4 — Quando recalcular `pontos`/`cravada`
| Evento | Acao |
|--------|------|
| Lancar/editar resultado do jogo | recalcula palpites do jogo |
| Salvar/editar palpite ou marcar WO | calcula aquele palpite |
| Invalidar/revalidar jogo ou rodada | recalcula palpites afetados |
| Editar `config` de pontuacao | recalcula todos os palpites |
| Definir `campeao_real` | so afeta agregacao (sem recalculo em massa) |

> **Classico:** nesta competicao nenhum jogo e classico (flag default
> false). Mecanismo mantido para uso futuro.
> **Resultados:** sempre lancados manualmente pelo admin. Sem auto-sync
> nem API de resultados (decisao fechada).
> **Mata-mata (placeholder):** jogos de fase eliminatoria entram com
> time_*_cod null e rotulo de vaga ("1o A", "Venc. Jogo 73"). Quando a
> fase de grupos define os classificados, o admin edita o jogo e seleciona
> os 2 times reais (o rotulo some, aparece bandeira+nome). Pontua igual
> aos grupos (placar; sem classico). UI usa o componente LadoTime p/ o
> fallback de rotulo.

---

## 3. PREMIACAO (derivada)

```
se valor_cota null -> exibe so percentuais (60/30/10)
senao:
  arrecadado = count(participantes where pago) * valor_cota
  premio_1 = arrecadado * pct_1/100
  premio_2 = arrecadado * pct_2/100
  premio_3 = arrecadado * pct_3/100
```

---

## 4. PAGINAS, COMPONENTES E COMPORTAMENTOS

### ADMIN (protegidas)

#### 4.1 — `/login`
LoginForm, BotaoEntrar, MensagemErro. Logar via Supabase Auth; erro ->
mensagem; logado -> `/admin`; ja logado em `/login` -> `/admin`.

#### 4.2 — `/admin` (dashboard)
CardResumo, CardPremiacao, ListaPendencias, ListaProximosJogos.
- Contadores: participantes, pagos, rodadas, jogos, jogos sem resultado
- Premiacao (% ou R$ se valor_cota setado)
- Pendencias: jogos passados sem resultado; participantes sem campea antes do prazo

#### 4.3 — `/admin/participantes`
TabelaParticipantes, FormParticipante, ToggleParticipantePago,
SeletorCampea, BotaoExcluir, BuscaParticipante.
- CRUD; toggle pago (seta pago_em); registrar/editar selecao campea
  (bloquear apos `prazo_campeao`); buscar por nome

#### 4.4 — `/admin/rodadas`
TabelaRodadas, FormRodada, BotaoInvalidarRodada, SeletorJogosDaRodada.
- CRUD rodada (nome, ordem, prazo_palpite visual)
- Invalidar/revalidar rodada (recalcula palpites de todos os jogos dela)
- Ver/gerenciar jogos da rodada

#### 4.5 — `/admin/jogos`
TabelaJogos, FormJogo, ToggleClassico, ToggleInvalidado, FormResultado,
FiltroRodada, BotaoExcluir.
- CRUD jogo (rodada, fase, grupo, times, data)
- Botao **marcar como classico** (toggle)
- Botao **invalidar jogo** (toggle, recalcula palpites do jogo)
- Lancar/editar resultado -> encerrado=true -> recalcula palpites do jogo
- Filtrar por rodada

#### 4.6 — `/admin/palpites`
SeletorModo, SeletorRodada/Jogo, SeletorParticipante, GridPalpites,
CelulaPalpite (casa x fora), ToggleWO, BotaoMarcarFaltantesWO.
- Modo por jogo: escolhe jogo -> grid de participantes -> palpite ou WO de cada um
- Modo por participante: escolhe participante -> jogos -> palpite ou WO
- Upsert (UNIQUE participante+jogo); marcar WO limpa o placar
- Atalho "marcar faltantes como WO" para um jogo (helper, nunca automatico)
- Se jogo encerrado, ao salvar calcula pontos/cravada
- Validacao: placar inteiro >= 0

#### 4.7 — `/admin/config`
FormPontuacao, FormPremiacao (%s + valor_cota opcional), FormPrazoCampeao,
FormCampeaoReal, BotaoSalvarRecalcular.
- Editar pontos; %s (validar pct_1+pct_2+pct_3 = 100); valor_cota opcional
- Editar prazo do palpite de campeao; definir campeao real (aplica +5)
- Salvar pontuacao -> recalcula todos os palpites (com aviso)

### PUBLICO (sem login)

#### 4.8 — `/` (classificacao / home)
TabelaClassificacao, LinhaClassificacao (pos, nome, J, pontos, cravadas,
WO, campea), CardPremiacao, CabecalhoBolao, UltimaAtualizacao.
- Classificacao acumulada com desempate (secao 2.3), destaque top 3
- Premiacao (%); selecao campea visivel apos o prazo
- Read-only; sem contato nem status de pagamento

#### 4.9 — `/resultados`
ListaPorRodada, CardJogo (bandeiras + times, placar, classico, status,
invalidado).
- Jogos agrupados por rodada, com placar e marcadores
- **Cada jogo e clicavel -> abre `/jogo/[id]`**

#### 4.10 — `/grade` (grade de palpites)
TabelaGrade (linhas = participantes, colunas = jogos), CelulaGrade
(placar palpitado + pontos / WO / invalidado).
- Matriz completa publica; transparencia total; read-only
- **Cabecalho de cada coluna (jogo) clicavel -> `/jogo/[id]`**

#### 4.11 — `/jogo/[id]` (detalhe do jogo, publico)
CabecalhoJogo (bandeiras + times + placar + badges classico/invalidado),
TabelaPalpitesDoJogo (linhas = participantes), Ordenacao.
- Mostra o palpite de **cada participante** para aquele jogo
- Colunas: Nome | Palpite (casa x fora) | Pontos no jogo | marca WO
- Estados/cores: cravada verde, WO vermelho, invalidado cinza riscado
- Ordenar por pontos do jogo (desc), depois nome
- Read-only; sem dado sensivel

---

## 5. SEGURANCA (thin client / fat server)

- **Auth:** Supabase Auth, so admin. `/admin/*` protegida por middleware
- **Escritas:** Server Actions / Route Handlers. Calculo de pontos/
  classificacao/premiacao SEMPRE no servidor
- **RLS ativo em TODAS as tabelas:**
  | Tabela | SELECT publico | Escrita |
  |--------|----------------|---------|
  | participantes | **so colunas publicas** (nome, campea) via view | so admin |
  | selecoes | sim (read-only) | so admin |
  | rodadas | sim (read-only) | so admin |
  | jogos | sim (read-only) | so admin |
  | palpites | sim (placar e pontos sao publicos) | so admin |
  | config | parcial (so colunas publicas via view) | so admin |
  - `contato`, `pago`, `pago_em` NUNCA expostos no publico — ranking/
    grade leem por view que omite essas colunas, ou Route Handler que filtra
- **Chaves:** `.env.local` (nunca commitar). Service role so no servidor
- **Validacao no servidor** (placar >= 0; pcts somam 100)

---

## 6. ARVORE DE ROTAS

```
app/
├── (public)/
│   ├── page.tsx                  # / classificacao + premiacao
│   ├── resultados/page.tsx       # jogos por rodada (clicaveis)
│   ├── grade/page.tsx            # matriz participante x jogo
│   └── jogo/[id]/page.tsx        # palpites de todos para um jogo
├── login/page.tsx
├── admin/
│   ├── layout.tsx                # guard de auth
│   ├── page.tsx                  # dashboard
│   ├── participantes/page.tsx
│   ├── rodadas/page.tsx
│   ├── jogos/page.tsx
│   ├── palpites/page.tsx
│   └── config/page.tsx
├── actions/
│   ├── participantes.ts
│   ├── rodadas.ts
│   ├── jogos.ts
│   ├── palpites.ts
│   └── config.ts
└── middleware.ts                 # protege /admin/*
lib/
├── supabase/{client.ts, server.ts}
├── pontuacao.ts                  # pontosDoPalpite (pura)
└── ranking.ts                    # total, cravadas, WO, campeao, premiacao, ordenacao
supabase/
└── migrations/*.sql
```

---

## 7. ORDEM DE EXECUCAO (issues sugeridas)

```
1. Setup: Next.js + Tailwind + Supabase client + deploy vazio na Vercel
2. Schema: migrations (selecoes, participantes, rodadas, jogos, palpites, config) + RLS + seed config + seed selecoes (times + bandeiras)
3. Auth admin + middleware /admin
4. CRUD participantes (+ pago + campea)
5. CRUD rodadas (+ prazo visual + invalidar)
6. CRUD jogos (+ classico + invalidar)
7. Lancar resultado + recalculo (lib pontuacao)
8. Lancar palpites + WO manual (grid)
9. lib ranking: total + cravadas + WO + campeao + desempate + premiacao
10. Publico: classificacao (/) + premiacao
11. Publico: resultados (/resultados)
12. Publico: grade de palpites (/grade) + detalhe do jogo (/jogo/[id])
13. Config (pontuacao, %s, valor opcional, prazo, campeao real) + recalculo
14. Dashboard
15. SEO + responsivo + checklist seguranca
```

Cada item = 1 issue. `/clear` entre plan e execute. Ver
`fluxo-anti-vibe-coding.md` no diretorio de Servicos.

---

## 8. DESENVOLVIMENTO — ORQUESTRACAO MULTI-AGENTE

Eu (Claude) atuo como **orquestrador**. Subagentes executam em paralelo
quando os arquivos nao colidem. A arquitetura (thin client/fat server,
um arquivo de action e uma pasta de rota por feature) foi desenhada
justamente para permitir paralelismo sem conflito.

### Principio de paralelizacao
- **Serial** so o que cria contrato compartilhado (schema, tipos,
  tokens, client supabase). Depois disso, **isolar por feature**.
- Arquivos compartilhados (schema, `lib/supabase/*`, tipos gerados,
  `tailwind.config`, `globals.css`) sao criados na Onda 0 e ficam
  **read-only** para as ondas seguintes -> sem corrida.
- Cada agente de feature so escreve nos SEUS arquivos (1 action + 1
  pasta de rota + componentes proprios).

### Ondas

```
ONDA 0 — FUNDACAO (serial, caminho critico)        [1 agente]
  - create-next-app (TS + Tailwind + App Router) + deploy vazio Vercel
  - tokens do design-system.md em tailwind.config + globals + next/font
  - lib/supabase/{client,server}.ts
  - migrations: selecoes, participantes, rodadas, jogos, palpites, config
    + RLS + views publicas + seed (config, 48 selecoes, jogos 1a rodada)
  - tipos TS gerados do schema (generate types)
  GATE: typecheck + build verdes; migrations aplicam; deploy sobe.

ONDA 1 — NUCLEO (paralelo)                          [4 agentes]
  A. lib/pontuacao.ts + testes (funcao pura, 1/2, sem classico, WO,
     invalidado) — sem deps de UI
  B. lib/ranking.ts + testes (total, cravadas, WO, campeao, desempate,
     premiacao 60/30/10)
  C. Auth: login + middleware /admin + casca admin (layout/nav)
  D. Componentes base do design-system (TabelaDensa, CelulaGrade,
     badges, CardPremiacao, bottom nav, casca publica, BandeiraTime)
  GATE: testes das libs passam; componentes renderizam isolados.

ONDA 2 — FEATURES ADMIN (paralelo, 1 agente/feature) [5 agentes]
  deps: schema (O0) + componentes (O1.D) + libs (O1.A/B)
  - Participantes: actions + /admin/participantes (CRUD, pago, campea)
  - Rodadas: actions + /admin/rodadas (CRUD, prazo, invalidar)
  - Jogos: actions + /admin/jogos (CRUD, classico, invalidar, resultado
    -> recalcula via lib/pontuacao)
  - Palpites: actions + /admin/palpites (grid, WO manual, upsert)
  - Config: actions + /admin/config (pontuacao, %s, prazo, campeao real,
    recalculo em massa)
  GATE por feature: typecheck + fluxo manual no browser + checklist
  seguranca (RLS, sem secret no client, escrita so admin).

ONDA 3 — PUBLICO (paralelo)                          [4 agentes]
  deps: lib/ranking (O1.B) + componentes (O1.D) + dados (O2)
  - / classificacao + premiacao
  - /resultados (por rodada, clicaveis)
  - /grade (matriz + seletor de rodada)
  - /jogo/[id] (palpites de todos)
  GATE: views publicas nao expoem contato/pagamento; mobile ok.

ONDA 4 — FECHAMENTO (serial/curto)                   [1-2 agentes]
  - Dashboard admin (consome contadores + premiacao)
  - SEO/meta, responsivo final, a11y, headers de seguranca
  - Revisao integrada + deploy producao
```

### Validacao (harness)
- **Sensores** entre ondas: `pnpm typecheck`, `pnpm build`, testes das
  libs. Nao avancar onda com gate vermelho.
- **Agente validador separado** do implementador: para cada feature,
  contrato = checklist da issue; validador testa item a item; falhou ->
  volta pro implementador. Loop ate passar.
- **Isolamento:** se duas tarefas precisarem tocar arquivo comum, usar
  worktree isolado ou serializar so aquele ponto.

### Paralelismo real por onda
O0 = 1 · O1 = 4 · O2 = 5 · O3 = 4 · O4 = 1-2. Pico ~5 agentes
simultaneos. Dependencia entre ondas e dura (gate); dentro da onda,
tudo concorrente por isolamento de arquivos.

---

*Documento vivo. Base: `prd.md`. Regras do agente: `claude.md`.*
*Visual: `design-system.md`. Mockups: `mockups/`.*
