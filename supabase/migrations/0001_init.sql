-- ============================================================
-- Bolao Amigos FC — schema inicial (Copa do Mundo FIFA 2026)
-- Tabelas, RLS, views publicas. Ver spec.md secao 1 e 5.
-- ============================================================

-- ---------- SELECOES (referencia: times + bandeiras) ----------
create table if not exists public.selecoes (
  codigo text primary key,            -- codigo FIFA, ex 'BRA'
  nome   text not null,
  iso2   text,                        -- p/ flagcdn, ex 'br'
  emoji  text
);

-- ---------- PARTICIPANTES ----------
create table if not exists public.participantes (
  id             uuid primary key default gen_random_uuid(),
  nome           text not null,
  contato        text,               -- PRIVADO
  pago           boolean not null default false,
  pago_em        timestamptz,
  selecao_campea text references public.selecoes(codigo),
  campea_em      timestamptz,
  created_at     timestamptz not null default now()
);

-- ---------- RODADAS (agrupamento manual) ----------
create table if not exists public.rodadas (
  id            uuid primary key default gen_random_uuid(),
  nome          text not null,
  ordem         int not null default 0,
  prazo_palpite timestamptz,         -- so referencia visual
  invalidada    boolean not null default false,
  created_at    timestamptz not null default now()
);

-- ---------- JOGOS ----------
create table if not exists public.jogos (
  id            uuid primary key default gen_random_uuid(),
  rodada_id     uuid not null references public.rodadas(id) on delete cascade,
  fase          text,
  grupo         text,
  time_casa_cod text not null references public.selecoes(codigo),
  time_fora_cod text not null references public.selecoes(codigo),
  classico      boolean not null default false,
  invalidado    boolean not null default false,
  data_hora     timestamptz not null,
  placar_casa   int,
  placar_fora   int,
  encerrado     boolean not null default false,
  created_at    timestamptz not null default now()
);
create index if not exists jogos_rodada_idx on public.jogos(rodada_id);

-- ---------- PALPITES (placar OU WO) ----------
create table if not exists public.palpites (
  id              uuid primary key default gen_random_uuid(),
  participante_id uuid not null references public.participantes(id) on delete cascade,
  jogo_id         uuid not null references public.jogos(id) on delete cascade,
  palpite_casa    int,
  palpite_fora    int,
  wo              boolean not null default false,
  pontos          int not null default 0,
  cravada         boolean not null default false,
  created_at      timestamptz not null default now(),
  unique (participante_id, jogo_id),
  constraint palpite_wo_xor_placar check (
    (wo = true  and palpite_casa is null and palpite_fora is null) or
    (wo = false and palpite_casa is not null and palpite_fora is not null
                and palpite_casa >= 0 and palpite_fora >= 0)
  )
);
create index if not exists palpites_jogo_idx on public.palpites(jogo_id);
create index if not exists palpites_part_idx on public.palpites(participante_id);

-- ---------- CONFIG (singleton id = 1) ----------
create table if not exists public.config (
  id                   int primary key default 1 check (id = 1),
  pts_acerto           int not null default 1,
  pts_cravada          int not null default 2,
  pts_acerto_classico  int not null default 3,
  pts_cravada_classico int not null default 4,
  pts_campeao          int not null default 5,
  pts_wo               int not null default -1,
  pct_1                int not null default 60,
  pct_2                int not null default 30,
  pct_3                int not null default 10,
  valor_cota           numeric(10,2),
  prazo_campeao        timestamptz not null default '2026-06-11 23:59:00-03',
  campeao_real         text references public.selecoes(codigo)
);

-- ============================================================
-- RLS
-- ============================================================
alter table public.selecoes      enable row level security;
alter table public.participantes enable row level security;
alter table public.rodadas       enable row level security;
alter table public.jogos         enable row level security;
alter table public.palpites      enable row level security;
alter table public.config        enable row level security;

-- Leitura publica (anon + authenticated). participantes fica DE FORA.
create policy "read selecoes" on public.selecoes for select using (true);
create policy "read rodadas"  on public.rodadas  for select using (true);
create policy "read jogos"    on public.jogos    for select using (true);
create policy "read palpites" on public.palpites for select using (true);
create policy "read config"   on public.config   for select using (true);

-- participantes: leitura so do admin (authenticated). Publico usa a view.
create policy "admin read participantes" on public.participantes
  for select to authenticated using (true);

-- Escrita: somente admin autenticado (no MVP, authenticated = admin).
create policy "admin write selecoes"      on public.selecoes      for all to authenticated using (true) with check (true);
create policy "admin write participantes" on public.participantes for all to authenticated using (true) with check (true);
create policy "admin write rodadas"       on public.rodadas       for all to authenticated using (true) with check (true);
create policy "admin write jogos"         on public.jogos         for all to authenticated using (true) with check (true);
create policy "admin write palpites"      on public.palpites      for all to authenticated using (true) with check (true);
create policy "admin write config"        on public.config        for all to authenticated using (true) with check (true);

-- ============================================================
-- VIEW PUBLICA — participante sem dados sensiveis
-- (roda como owner, bypassa RLS de participantes; expoe so o seguro)
-- ============================================================
create or replace view public.participantes_publico as
  select id, nome, selecao_campea
  from public.participantes;

-- ============================================================
-- GRANTS (Supabase: anon = visitante, authenticated = admin)
-- ============================================================
grant select on public.selecoes, public.rodadas, public.jogos,
                public.palpites, public.config,
                public.participantes_publico
  to anon, authenticated;

grant select, insert, update, delete on
  public.selecoes, public.participantes, public.rodadas,
  public.jogos, public.palpites, public.config
  to authenticated;
