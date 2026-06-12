-- Mata-mata: times definidos so apos a fase de grupos.
-- Permite jogo sem time (codigo null) + rotulo de vaga ("1o A", "Venc. Jogo 73").
alter table public.jogos alter column time_casa_cod drop not null;
alter table public.jogos alter column time_fora_cod drop not null;
alter table public.jogos add column if not exists rotulo_casa text;
alter table public.jogos add column if not exists rotulo_fora text;
