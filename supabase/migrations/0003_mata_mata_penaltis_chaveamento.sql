-- Mata-mata: penaltis (shootout) + chaveamento automatico (avanco de
-- vencedor/perdedor). Colunas explicitas no proprio jogo.
alter table public.jogos add column if not exists numero int;
alter table public.jogos add column if not exists penaltis_casa int;
alter table public.jogos add column if not exists penaltis_fora int;
alter table public.jogos add column if not exists avanca_para_jogo_id uuid references public.jogos(id) on delete set null;
alter table public.jogos add column if not exists avanca_para_slot text;
alter table public.jogos add column if not exists perdedor_para_jogo_id uuid references public.jogos(id) on delete set null;

-- numero unico quando presente (mata-mata 73..104).
create unique index if not exists jogos_numero_key on public.jogos(numero) where numero is not null;

-- slot valido (casa/fora) ou nulo.
alter table public.jogos drop constraint if exists jogos_avanca_slot_chk;
alter table public.jogos add constraint jogos_avanca_slot_chk
  check (avanca_para_slot is null or avanca_para_slot in ('casa','fora'));

-- penaltis: ambos-ou-nenhum; quando definidos, placar empatado e vencedor
-- existe (placares de penaltis distintos, >= 0).
alter table public.jogos drop constraint if exists jogos_penaltis_chk;
alter table public.jogos add constraint jogos_penaltis_chk check (
  (penaltis_casa is null and penaltis_fora is null)
  or (
    penaltis_casa is not null and penaltis_fora is not null
    and penaltis_casa >= 0 and penaltis_fora >= 0
    and penaltis_casa <> penaltis_fora
    and placar_casa is not null and placar_fora is not null
    and placar_casa = placar_fora
  )
);
