-- Backfill do mata-mata (apos a fase de grupos): numero FIFA (73..104),
-- times reais dos 16-avos e ligacoes do chaveamento (vencedor avanca,
-- perdedor das semis vai pro 3o lugar). Idempotente por rotulo/numero.
--
-- Os 16-avos foram derivados dos resultados dos grupos no DB; os 6 jogos
-- 1ºvs3º seguem a tabela oficial FIFA 2026 de alocacao de 3os lugares
-- (combinacao dos grupos B,D,E,F,I,J,K,L).

-- 1) Numero FIFA (73..104) por rotulo de vaga.
update public.jogos j set numero = m.n
from (values
  ('2º A','2º B',73),
  ('1º E','3º A/B/C/D/F',74),
  ('1º F','2º C',75),
  ('1º C','2º F',76),
  ('1º I','3º C/D/F/G/H',77),
  ('2º E','2º I',78),
  ('1º A','3º C/E/F/H/I',79),
  ('1º L','3º E/H/I/J/K',80),
  ('1º D','3º B/E/F/I/J',81),
  ('1º G','3º A/E/H/I/J',82),
  ('2º K','2º L',83),
  ('1º H','2º J',84),
  ('1º B','3º E/F/G/I/J',85),
  ('1º J','2º H',86),
  ('1º K','3º D/E/I/J/L',87),
  ('2º D','2º G',88),
  ('Venc. Jogo 73','Venc. Jogo 75',89),
  ('Venc. Jogo 74','Venc. Jogo 77',90),
  ('Venc. Jogo 76','Venc. Jogo 78',91),
  ('Venc. Jogo 79','Venc. Jogo 80',92),
  ('Venc. Jogo 83','Venc. Jogo 84',93),
  ('Venc. Jogo 81','Venc. Jogo 82',94),
  ('Venc. Jogo 86','Venc. Jogo 88',95),
  ('Venc. Jogo 85','Venc. Jogo 87',96),
  ('Venc. Oitava 1','Venc. Oitava 2',97),
  ('Venc. Oitava 5','Venc. Oitava 6',98),
  ('Venc. Oitava 3','Venc. Oitava 4',99),
  ('Venc. Oitava 7','Venc. Oitava 8',100),
  ('Venc. Quarta 1','Venc. Quarta 2',101),
  ('Venc. Quarta 3','Venc. Quarta 4',102),
  ('Perdedor Semi 1','Perdedor Semi 2',103),
  ('Vencedor Semi 1','Vencedor Semi 2',104)
) as m(rc,rf,n)
where j.rotulo_casa = m.rc and j.rotulo_fora = m.rf;

-- 2) Times reais nos 16-avos (definidos pelos resultados dos grupos).
update public.jogos j set time_casa_cod = t.casa, time_fora_cod = t.fora
from (values
  (73,'RSA','CAN'),(74,'GER','PAR'),(75,'NED','MAR'),(76,'BRA','JPN'),
  (77,'FRA','SWE'),(78,'CIV','NOR'),(79,'MEX','ECU'),(80,'ENG','COD'),
  (81,'USA','BIH'),(82,'BEL','SEN'),(83,'POR','CRO'),(84,'ESP','AUT'),
  (85,'SUI','ALG'),(86,'ARG','CPV'),(87,'COL','GHA'),(88,'AUS','EGY')
) as t(n,casa,fora)
where j.numero = t.n;

-- 3) Chaveamento: vencedor avanca (de -> para, em qual slot).
update public.jogos j set avanca_para_jogo_id = d.id, avanca_para_slot = w.slot
from (values
  (73,89,'casa'),(75,89,'fora'),
  (74,90,'casa'),(77,90,'fora'),
  (76,91,'casa'),(78,91,'fora'),
  (79,92,'casa'),(80,92,'fora'),
  (83,93,'casa'),(84,93,'fora'),
  (81,94,'casa'),(82,94,'fora'),
  (86,95,'casa'),(88,95,'fora'),
  (85,96,'casa'),(87,96,'fora'),
  (89,97,'casa'),(90,97,'fora'),
  (93,98,'casa'),(94,98,'fora'),
  (91,99,'casa'),(92,99,'fora'),
  (95,100,'casa'),(96,100,'fora'),
  (97,101,'casa'),(98,101,'fora'),
  (99,102,'casa'),(100,102,'fora'),
  (101,104,'casa'),(102,104,'fora')
) as w(de,para,slot)
join public.jogos d on d.numero = w.para
where j.numero = w.de;

-- 4) Perdedor das semis vai pro 3o lugar (mesmo slot do avanco).
update public.jogos j set perdedor_para_jogo_id = d.id
from (values (101,103),(102,103)) as l(de,para)
join public.jogos d on d.numero = l.para
where j.numero = l.de;
