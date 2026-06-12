-- ============================================================
-- Bolao Amigos FC — seed
-- Config + 48 selecoes + 17 participantes + 1a rodada de grupos
-- (24 jogos, 11-17/jun) + palpites do dia 1 + resultado MEX 2x0 RSA.
-- Fonte dos jogos: FIFA scores-fixtures. Ver dados-bolao.md.
-- ============================================================

-- ---------- CONFIG ----------
insert into public.config (id) values (1)
on conflict (id) do nothing;

-- ---------- SELECOES (48) ----------
insert into public.selecoes (codigo, nome, iso2) values
  ('MEX','Mexico','mx'), ('RSA','Africa do Sul','za'),
  ('KOR','Republica da Coreia','kr'), ('CZE','Tchequia','cz'),
  ('CAN','Canada','ca'), ('BIH','Bosnia e Herzegovina','ba'),
  ('QAT','Catar','qa'), ('SUI','Suica','ch'),
  ('BRA','Brasil','br'), ('MAR','Marrocos','ma'),
  ('HAI','Haiti','ht'), ('SCO','Escocia','gb-sct'),
  ('USA','EUA','us'), ('PAR','Paraguai','py'),
  ('AUS','Australia','au'), ('TUR','Turquia','tr'),
  ('GER','Alemanha','de'), ('CUW','Curacau','cw'),
  ('CIV','Costa do Marfim','ci'), ('ECU','Equador','ec'),
  ('NED','Holanda','nl'), ('JPN','Japao','jp'),
  ('SWE','Suecia','se'), ('TUN','Tunisia','tn'),
  ('BEL','Belgica','be'), ('EGY','Egito','eg'),
  ('IRN','Ira','ir'), ('NZL','Nova Zelandia','nz'),
  ('ESP','Espanha','es'), ('CPV','Cabo Verde','cv'),
  ('KSA','Arabia Saudita','sa'), ('URU','Uruguai','uy'),
  ('FRA','Franca','fr'), ('SEN','Senegal','sn'),
  ('IRQ','Iraque','iq'), ('NOR','Noruega','no'),
  ('ARG','Argentina','ar'), ('ALG','Argelia','dz'),
  ('AUT','Austria','at'), ('JOR','Jordania','jo'),
  ('POR','Portugal','pt'), ('COD','RD do Congo','cd'),
  ('UZB','Uzbequistao','uz'), ('COL','Colombia','co'),
  ('ENG','Inglaterra','gb-eng'), ('CRO','Croacia','hr'),
  ('GHA','Gana','gh'), ('PAN','Panama','pa')
on conflict (codigo) do nothing;

-- ---------- PARTICIPANTES (17) ----------
insert into public.participantes (nome) values
  ('Adriano'), ('Alisson'), ('Bruno Zenci'), ('Diego Franqueiro'),
  ('Dyego'), ('Fabricio'), ('Felipe'), ('Felipe Teodoro'),
  ('Gabriel'), ('Hiago Caetano'), ('Joaninha'), ('Machado'),
  ('Mec'), ('Nelson'), ('Paulinho'), ('Ribeiro'), ('Ricardo PT')
on conflict do nothing;

-- ---------- RODADAS (1a rodada de grupos, por dia) ----------
insert into public.rodadas (nome, ordem, prazo_palpite) values
  ('Dia 1 — 11/06', 1, '2026-06-11 21:00-03'),
  ('Dia 2 — 12/06', 2, '2026-06-12 14:00-03'),
  ('Dia 3 — 13/06', 3, '2026-06-13 14:00-03'),
  ('Dia 4 — 14/06', 4, '2026-06-14 12:00-03'),
  ('Dia 5 — 15/06', 5, '2026-06-15 11:00-03'),
  ('Dia 6 — 16/06', 6, '2026-06-16 14:00-03'),
  ('Dia 7 — 17/06', 7, '2026-06-17 12:00-03')
on conflict do nothing;

-- ---------- JOGOS (24) ----------
-- helper inline: cada insert referencia a rodada pelo nome.
insert into public.jogos (rodada_id, fase, grupo, time_casa_cod, time_fora_cod, data_hora)
select r.id, v.fase, v.grupo, v.casa, v.fora, v.dh::timestamptz
from (values
  -- Dia 1
  ('Dia 1 — 11/06','grupos','A','MEX','RSA','2026-06-11 22:00-03'),
  ('Dia 1 — 11/06','grupos','A','KOR','CZE','2026-06-11 22:00-03'),
  -- Dia 2
  ('Dia 2 — 12/06','grupos','B','CAN','BIH','2026-06-12 15:00-03'),
  ('Dia 2 — 12/06','grupos','D','USA','PAR','2026-06-12 21:00-03'),
  -- Dia 3
  ('Dia 3 — 13/06','grupos','B','QAT','SUI','2026-06-13 15:00-03'),
  ('Dia 3 — 13/06','grupos','C','BRA','MAR','2026-06-13 18:00-03'),
  ('Dia 3 — 13/06','grupos','C','HAI','SCO','2026-06-13 21:00-03'),
  ('Dia 3 — 13/06','grupos','D','AUS','TUR','2026-06-14 00:00-03'),
  -- Dia 4
  ('Dia 4 — 14/06','grupos','E','GER','CUW','2026-06-14 13:00-03'),
  ('Dia 4 — 14/06','grupos','F','NED','JPN','2026-06-14 16:00-03'),
  ('Dia 4 — 14/06','grupos','E','CIV','ECU','2026-06-14 19:00-03'),
  ('Dia 4 — 14/06','grupos','F','SWE','TUN','2026-06-14 22:00-03'),
  -- Dia 5
  ('Dia 5 — 15/06','grupos','H','ESP','CPV','2026-06-15 12:00-03'),
  ('Dia 5 — 15/06','grupos','G','BEL','EGY','2026-06-15 15:00-03'),
  ('Dia 5 — 15/06','grupos','H','KSA','URU','2026-06-15 18:00-03'),
  ('Dia 5 — 15/06','grupos','G','IRN','NZL','2026-06-15 21:00-03'),
  -- Dia 6
  ('Dia 6 — 16/06','grupos','I','FRA','SEN','2026-06-16 15:00-03'),
  ('Dia 6 — 16/06','grupos','I','IRQ','NOR','2026-06-16 18:00-03'),
  ('Dia 6 — 16/06','grupos','J','ARG','ALG','2026-06-16 21:00-03'),
  -- Dia 7
  ('Dia 7 — 17/06','grupos','J','AUT','JOR','2026-06-17 00:00-03'),
  ('Dia 7 — 17/06','grupos','K','POR','COD','2026-06-17 13:00-03'),
  ('Dia 7 — 17/06','grupos','L','ENG','CRO','2026-06-17 16:00-03'),
  ('Dia 7 — 17/06','grupos','L','GHA','PAN','2026-06-17 19:00-03'),
  ('Dia 7 — 17/06','grupos','K','UZB','COL','2026-06-17 22:00-03')
) as v(rodada, fase, grupo, casa, fora, dh)
join public.rodadas r on r.nome = v.rodada
where not exists (
  select 1 from public.jogos j
  where j.time_casa_cod = v.casa and j.time_fora_cod = v.fora
);

-- ---------- RESULTADO DIA 1 ----------
update public.jogos
  set placar_casa = 2, placar_fora = 0, encerrado = true
  where time_casa_cod = 'MEX' and time_fora_cod = 'RSA';
-- KOR x CZE permanece agendado (sem placar).

-- ---------- PALPITES DIA 1 ----------
-- MEX x RSA (encerrado 2x0): pontos pre-calculados (cravada=2, acerto=1).
insert into public.palpites (participante_id, jogo_id, palpite_casa, palpite_fora, pontos, cravada)
select p.id, j.id, v.pc, v.pf, v.pts, v.cr
from (values
  ('Adriano',2,2,0,false), ('Alisson',2,1,1,false), ('Bruno Zenci',1,1,0,false),
  ('Diego Franqueiro',2,2,0,false), ('Dyego',2,0,2,true), ('Fabricio',2,0,2,true),
  ('Felipe',2,1,1,false), ('Felipe Teodoro',2,1,1,false), ('Gabriel',1,1,0,false),
  ('Hiago Caetano',2,0,2,true), ('Joaninha',2,1,1,false), ('Machado',1,0,1,false),
  ('Mec',3,1,1,false), ('Nelson',1,2,0,false), ('Paulinho',1,3,0,false),
  ('Ribeiro',2,0,2,true), ('Ricardo PT',3,1,1,false)
) as v(nome,pc,pf,pts,cr)
join public.participantes p on p.nome = v.nome
join public.jogos j on j.time_casa_cod = 'MEX' and j.time_fora_cod = 'RSA'
on conflict (participante_id, jogo_id) do nothing;

-- KOR x CZE (agendado): pontos 0 ate apurar.
insert into public.palpites (participante_id, jogo_id, palpite_casa, palpite_fora, pontos, cravada)
select p.id, j.id, v.pc, v.pf, 0, false
from (values
  ('Adriano',1,1), ('Alisson',1,3), ('Bruno Zenci',0,1), ('Diego Franqueiro',2,0),
  ('Dyego',1,1), ('Fabricio',2,1), ('Felipe',1,0), ('Felipe Teodoro',1,2),
  ('Gabriel',0,2), ('Hiago Caetano',1,1), ('Joaninha',3,1), ('Machado',2,1),
  ('Mec',0,0), ('Nelson',1,1), ('Paulinho',1,2), ('Ribeiro',1,1), ('Ricardo PT',2,1)
) as v(nome,pc,pf)
join public.participantes p on p.nome = v.nome
join public.jogos j on j.time_casa_cod = 'KOR' and j.time_fora_cod = 'CZE'
on conflict (participante_id, jogo_id) do nothing;

-- ============================================================
-- FASE DE GRUPOS COMPLETA — matchdays 2 e 3 (dias 18-27/jun)
-- (matchday 1 ja inserido acima). Total da fase de grupos = 72 jogos.
-- ============================================================
insert into public.rodadas (nome, ordem, prazo_palpite) values
  ('Dia 8 — 18/06', 8,  '2026-06-18 11:00-03'),
  ('Dia 9 — 19/06', 9,  '2026-06-19 14:00-03'),
  ('Dia 10 — 20/06', 10, '2026-06-20 12:00-03'),
  ('Dia 11 — 21/06', 11, '2026-06-21 11:00-03'),
  ('Dia 12 — 22/06', 12, '2026-06-22 12:00-03'),
  ('Dia 13 — 23/06', 13, '2026-06-23 12:00-03'),
  ('Dia 14 — 24/06', 14, '2026-06-24 14:00-03'),
  ('Dia 15 — 25/06', 15, '2026-06-25 15:00-03'),
  ('Dia 16 — 26/06', 16, '2026-06-26 14:00-03'),
  ('Dia 17 — 27/06', 17, '2026-06-27 16:00-03')
on conflict do nothing;

insert into public.jogos (rodada_id, fase, grupo, time_casa_cod, time_fora_cod, data_hora)
select r.id, v.fase, v.grupo, v.casa, v.fora, v.dh::timestamptz
from (values
  ('Dia 8 — 18/06','grupos','A','CZE','RSA','2026-06-18 12:00-03'),
  ('Dia 8 — 18/06','grupos','B','SUI','BIH','2026-06-18 15:00-03'),
  ('Dia 8 — 18/06','grupos','B','CAN','QAT','2026-06-18 18:00-03'),
  ('Dia 8 — 18/06','grupos','A','MEX','KOR','2026-06-18 21:00-03'),
  ('Dia 9 — 19/06','grupos','D','USA','AUS','2026-06-19 15:00-03'),
  ('Dia 9 — 19/06','grupos','C','SCO','MAR','2026-06-19 18:00-03'),
  ('Dia 9 — 19/06','grupos','C','BRA','HAI','2026-06-19 20:30-03'),
  ('Dia 9 — 19/06','grupos','D','TUR','PAR','2026-06-19 23:00-03'),
  ('Dia 10 — 20/06','grupos','F','NED','SWE','2026-06-20 13:00-03'),
  ('Dia 10 — 20/06','grupos','E','GER','CIV','2026-06-20 16:00-03'),
  ('Dia 10 — 20/06','grupos','E','ECU','CUW','2026-06-20 20:00-03'),
  ('Dia 11 — 21/06','grupos','F','TUN','JPN','2026-06-21 00:00-03'),
  ('Dia 11 — 21/06','grupos','H','ESP','KSA','2026-06-21 12:00-03'),
  ('Dia 11 — 21/06','grupos','G','BEL','IRN','2026-06-21 15:00-03'),
  ('Dia 11 — 21/06','grupos','H','URU','CPV','2026-06-21 18:00-03'),
  ('Dia 11 — 21/06','grupos','G','NZL','EGY','2026-06-21 21:00-03'),
  ('Dia 12 — 22/06','grupos','J','ARG','AUT','2026-06-22 13:00-03'),
  ('Dia 12 — 22/06','grupos','I','FRA','IRQ','2026-06-22 17:00-03'),
  ('Dia 12 — 22/06','grupos','I','NOR','SEN','2026-06-22 20:00-03'),
  ('Dia 12 — 22/06','grupos','J','JOR','ALG','2026-06-22 23:00-03'),
  ('Dia 13 — 23/06','grupos','K','POR','UZB','2026-06-23 13:00-03'),
  ('Dia 13 — 23/06','grupos','L','ENG','GHA','2026-06-23 16:00-03'),
  ('Dia 13 — 23/06','grupos','L','PAN','CRO','2026-06-23 19:00-03'),
  ('Dia 13 — 23/06','grupos','K','COL','COD','2026-06-23 22:00-03'),
  ('Dia 14 — 24/06','grupos','B','SUI','CAN','2026-06-24 15:00-03'),
  ('Dia 14 — 24/06','grupos','B','BIH','QAT','2026-06-24 15:00-03'),
  ('Dia 14 — 24/06','grupos','C','SCO','BRA','2026-06-24 18:00-03'),
  ('Dia 14 — 24/06','grupos','C','MAR','HAI','2026-06-24 18:00-03'),
  ('Dia 14 — 24/06','grupos','A','CZE','MEX','2026-06-24 21:00-03'),
  ('Dia 14 — 24/06','grupos','A','RSA','KOR','2026-06-24 21:00-03'),
  ('Dia 15 — 25/06','grupos','E','CUW','CIV','2026-06-25 16:00-03'),
  ('Dia 15 — 25/06','grupos','E','ECU','GER','2026-06-25 16:00-03'),
  ('Dia 15 — 25/06','grupos','F','JPN','SWE','2026-06-25 19:00-03'),
  ('Dia 15 — 25/06','grupos','F','TUN','NED','2026-06-25 19:00-03'),
  ('Dia 15 — 25/06','grupos','D','TUR','USA','2026-06-25 22:00-03'),
  ('Dia 15 — 25/06','grupos','D','PAR','AUS','2026-06-25 22:00-03'),
  ('Dia 16 — 26/06','grupos','I','NOR','FRA','2026-06-26 15:00-03'),
  ('Dia 16 — 26/06','grupos','I','SEN','IRQ','2026-06-26 15:00-03'),
  ('Dia 16 — 26/06','grupos','H','CPV','KSA','2026-06-26 20:00-03'),
  ('Dia 16 — 26/06','grupos','H','URU','ESP','2026-06-26 20:00-03'),
  ('Dia 16 — 26/06','grupos','G','EGY','IRN','2026-06-26 23:00-03'),
  ('Dia 16 — 26/06','grupos','G','NZL','BEL','2026-06-26 23:00-03'),
  ('Dia 17 — 27/06','grupos','L','PAN','ENG','2026-06-27 17:00-03'),
  ('Dia 17 — 27/06','grupos','L','CRO','GHA','2026-06-27 17:00-03'),
  ('Dia 17 — 27/06','grupos','K','COL','POR','2026-06-27 19:30-03'),
  ('Dia 17 — 27/06','grupos','K','COD','UZB','2026-06-27 19:30-03'),
  ('Dia 17 — 27/06','grupos','J','ALG','AUT','2026-06-27 22:00-03'),
  ('Dia 17 — 27/06','grupos','J','JOR','ARG','2026-06-27 22:00-03')
) as v(rodada, fase, grupo, casa, fora, dh)
join public.rodadas r on r.nome = v.rodada
where not exists (
  select 1 from public.jogos j
  where j.time_casa_cod = v.casa and j.time_fora_cod = v.fora
    and j.data_hora = v.dh::timestamptz
);
