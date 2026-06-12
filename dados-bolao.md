# DADOS DO BOLAO — seed real

*Participantes/palpites: `participantes e palpites dia 1.jpeg`.*
*Jogos: tabela OFICIAL FIFA 2026 (scores-fixtures), 1a rodada de grupos.*
*Fonte: fifa.com/.../canadamexicousa2026/scores-fixtures · puxado 2026-06-11*
*Uso: seed do banco + conteudo realista no mockup do Stitch.*

---

## PARTICIPANTES (17)

Adriano · Alisson · Bruno Zenci · Diego Franqueiro · Dyego · Fabricio ·
Felipe · Felipe Teodoro · Gabriel · Hiago Caetano · Joaninha · Machado ·
Mec · Nelson · Paulinho · Ribeiro · Ricardo PT

---

## SELECOES (seed — codigo FIFA + iso2 p/ bandeira)

| Grupo | Selecao | codigo | iso2 |
|-------|---------|--------|------|
| A | Mexico | MEX | mx |
| A | Africa do Sul | RSA | za |
| A | Republica da Coreia | KOR | kr |
| A | Tchequia | CZE | cz |
| B | Canada | CAN | ca |
| B | Bosnia e Herzegovina | BIH | ba |
| B | Catar | QAT | qa |
| B | Suica | SUI | ch |
| C | Brasil | BRA | br |
| C | Marrocos | MAR | ma |
| C | Haiti | HAI | ht |
| C | Escocia | SCO | gb-sct |
| D | EUA | USA | us |
| D | Paraguai | PAR | py |
| D | Australia | AUS | au |
| D | Turquia | TUR | tr |
| E | Alemanha | GER | de |
| E | Curacau | CUW | cw |
| E | Costa do Marfim | CIV | ci |
| E | Equador | ECU | ec |
| F | Holanda | NED | nl |
| F | Japao | JPN | jp |
| F | Suecia | SWE | se |
| F | Tunisia | TUN | tn |
| G | Belgica | BEL | be |
| G | Egito | EGY | eg |
| G | Ira | IRN | ir |
| G | Nova Zelandia | NZL | nz |
| H | Espanha | ESP | es |
| H | Cabo Verde | CPV | cv |
| H | Arabia Saudita | KSA | sa |
| H | Uruguai | URU | uy |
| I | Franca | FRA | fr |
| I | Senegal | SEN | sn |
| I | Iraque | IRQ | iq |
| I | Noruega | NOR | no |
| J | Argentina | ARG | ar |
| J | Argelia | ALG | dz |
| J | Austria | AUT | at |
| J | Jordania | JOR | jo |
| K | Portugal | POR | pt |
| K | RD do Congo | COD | cd |
| K | Uzbequistao | UZB | uz |
| K | Colombia | COL | co |
| L | Inglaterra | ENG | gb-eng |
| L | Croacia | CRO | hr |
| L | Gana | GHA | gh |
| L | Panama | PAN | pa |

> Bandeira: flagcdn.com/{iso2}.svg (Escocia=gb-sct, Inglaterra=gb-eng).
> codigo FIFA difere do ISO (GER/de, NED/nl, KSA/sa, etc.).

---

## JOGOS — TORNEIO COMPLETO (104 jogos / 22 rodadas)

> Fonte completa e fiel = `supabase/seed.sql` (aplicado no banco). Abaixo
> so a 1a rodada como amostra; o restante esta no seed.

Estrutura carregada:
- **Fase de grupos: 72 jogos**, times reais, rodadas "Dia 1"–"Dia 17"
  (11–27/jun), 1 rodada por dia.
- **Mata-mata: 32 jogos (placeholder)**, rodadas por fase: "16-avos de
  final", "Oitavas de final", "Quartas de final", "Semifinais",
  "3o lugar e Final" (28/jun–19/jul). Times = null + rotulo de vaga
  ("1o A", "Venc. Jogo 73"...) ate os grupos definirem; admin troca pelo
  time real depois.

### 1a rodada — amostra (Dia 1, 11/06)
Horarios conforme FIFA (fuso de Brasilia).

### Rodada Dia 1 — 11/06
| Grupo | Jogo | Hora | Local |
|-------|------|------|-------|
| A | Mexico x Africa do Sul | 22:00 | Cidade do Mexico |
| A | Republica da Coreia x Tchequia | 22:00 | Guadalajara |

### Rodada Dia 2 — 12/06
| Grupo | Jogo | Hora | Local |
|-------|------|------|-------|
| B | Canada x Bosnia e Herzegovina | 15:00 | Toronto |
| D | EUA x Paraguai | 21:00 | Los Angeles |

### Rodada Dia 3 — 13/06
| Grupo | Jogo | Hora | Local |
|-------|------|------|-------|
| B | Catar x Suica | 15:00 | Baia de Sao Francisco |
| C | Brasil x Marrocos | 18:00 | Nova York/Nova Jersey |
| C | Haiti x Escocia | 21:00 | Boston |
| D | Australia x Turquia | 00:00 (14/06) | Vancouver |

### Rodada Dia 4 — 14/06
| Grupo | Jogo | Hora | Local |
|-------|------|------|-------|
| E | Alemanha x Curacau | 13:00 | Houston |
| F | Holanda x Japao | 16:00 | Dallas |
| E | Costa do Marfim x Equador | 19:00 | Filadelfia |
| F | Suecia x Tunisia | 22:00 | Monterrey |

### Rodada Dia 5 — 15/06
| Grupo | Jogo | Hora | Local |
|-------|------|------|-------|
| H | Espanha x Cabo Verde | 12:00 | Atlanta |
| G | Belgica x Egito | 15:00 | Seattle |
| H | Arabia Saudita x Uruguai | 18:00 | Miami |
| G | Ira x Nova Zelandia | 21:00 | Los Angeles |

### Rodada Dia 6 — 16/06
| Grupo | Jogo | Hora | Local |
|-------|------|------|-------|
| I | Franca x Senegal | 15:00 | Nova York/Nova Jersey |
| I | Iraque x Noruega | 18:00 | Boston |
| J | Argentina x Argelia | 21:00 | Kansas City |

### Rodada Dia 7 — 17/06
| Grupo | Jogo | Hora | Local |
|-------|------|------|-------|
| J | Austria x Jordania | 00:00 | Baia de Sao Francisco |
| K | Portugal x RD do Congo | 13:00 | Houston |
| L | Inglaterra x Croacia | 16:00 | Dallas |
| L | Gana x Panama | 19:00 | Toronto |
| K | Uzbequistao x Colombia | 22:00 | Cidade do Mexico |

---

## PALPITES — DIA 1 (Grupo A, 11/06)

| Participante | MEX x RSA | KOR x CZE |
|--------------|:---------:|:---------:|
| Adriano | 2 x 2 | 1 x 1 |
| Alisson | 2 x 1 | 1 x 3 |
| Bruno Zenci | 1 x 1 | 0 x 1 |
| Diego Franqueiro | 2 x 2 | 2 x 0 |
| Dyego | 2 x 0 | 1 x 1 |
| Fabricio | 2 x 0 | 2 x 1 |
| Felipe | 2 x 1 | 1 x 0 |
| Felipe Teodoro | 2 x 1 | 1 x 2 |
| Gabriel | 1 x 1 | 0 x 2 |
| Hiago Caetano | 2 x 0 | 1 x 1 |
| Joaninha | 2 x 1 | 3 x 1 |
| Machado | 1 x 0 | 2 x 1 |
| Mec | 3 x 1 | 0 x 0 |
| Nelson | 1 x 2 | 1 x 1 |
| Paulinho | 1 x 3 | 1 x 2 |
| Ribeiro | 2 x 0 | 1 x 1 |
| Ricardo PT | 3 x 1 | 2 x 1 |

> Mandante x visitante. 17/17 palpitaram os 2 jogos — nenhum WO no dia 1.

### Resultados oficiais — Dia 1 (FIFA)
| Jogo | Placar | Status |
|------|--------|--------|
| Mexico x Africa do Sul | 2 x 0 | encerrado |
| Republica da Coreia x Tchequia | — | agendado (22:00) |

### Pontos apurados — Mexico 2x0 Africa do Sul (sem classico: cravada=2, acerto=1)
| Participante | Palpite | Pontos |
|--------------|:-------:|:------:|
| Dyego | 2 x 0 | 2 (cravada) |
| Fabricio | 2 x 0 | 2 (cravada) |
| Hiago Caetano | 2 x 0 | 2 (cravada) |
| Ribeiro | 2 x 0 | 2 (cravada) |
| Alisson | 2 x 1 | 1 |
| Felipe | 2 x 1 | 1 |
| Felipe Teodoro | 2 x 1 | 1 |
| Joaninha | 2 x 1 | 1 |
| Machado | 1 x 0 | 1 |
| Mec | 3 x 1 | 1 |
| Ricardo PT | 3 x 1 | 1 |
| Adriano | 2 x 2 | 0 |
| Bruno Zenci | 1 x 1 | 0 |
| Diego Franqueiro | 2 x 2 | 0 |
| Gabriel | 1 x 1 | 0 |
| Nelson | 1 x 2 | 0 |
| Paulinho | 1 x 3 | 0 |

> KOR x CZE ainda nao apurado. Usar estes numeros no mockup pra ficar realista.

---

## DECISOES

- **Sem classico** nesta competicao — todos os jogos pontuam 1 (acerto)
  / 2 (cravada). Flag `classico` fica no sistema mas default false
- **Resultados:** sempre manual (admin lanca). Sem auto-sync / API
  de resultados — decisao fechada

## PENDENCIAS / CONFIRMAR

- [ ] Lista de 17 e final, ou entram mais?
- [ ] Selecao campea de cada um (palpite separado, prazo 11/06 23:59)
- [x] Torneio inteiro carregado (104 jogos / 22 rodadas). Mata-mata
      placeholder — preencher times reais conforme classificacao.

---

*Documento vivo. Fonte oficial: FIFA scores-fixtures. Atualizar a cada rodada.*
