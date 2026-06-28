-- Referencia de posicoes p/ o "movimento" do ranking (subiu/caiu).
-- Guarda a posicao de cada participante no fim do dia anterior; o movimento
-- exibido = posicao na referencia - posicao atual (calculada na hora).
create table if not exists public.ranking_snapshot (
  participante_id uuid primary key references public.participantes(id) on delete cascade,
  posicao         int not null,
  capturado_em    timestamptz not null default now()
);

alter table public.ranking_snapshot enable row level security;

-- Leitura publica (so posicao; nada sensivel) p/ o ranking mostrar as setas.
create policy "read ranking_snapshot" on public.ranking_snapshot
  for select using (true);
-- Escrita so do admin autenticado (via Server Action).
create policy "admin write ranking_snapshot" on public.ranking_snapshot
  for all to authenticated using (true) with check (true);

grant select on public.ranking_snapshot to anon, authenticated;
grant insert, update, delete on public.ranking_snapshot to authenticated;
