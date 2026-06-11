# PRD — Bolao Copa do Mundo FIFA 2026

*Requisitos do produto. Base para spec, arquitetura e codigo.*
*Projeto rapido. Stack padrao do guia de Criacao de Sites.*
*Criado em: 2026-06-11*

---

## 1. VISAO GERAL

Gerenciador do bolao da Copa do Mundo FIFA 2026, operado por um unico
administrador. O admin recebe os palpites pelo WhatsApp e lanca no app:
participantes, rodadas, jogos, palpites e resultados. Os palpitadores
**nao acessam o sistema**.

Existe um **painel publico** (sem login), estilo tabela de campeonato:
classificacao, resultados dos jogos e os palpites de cada participante.
A premiacao em dinheiro e dividida entre os 3 primeiros (60/30/10) — o
valor e combinado no grupo, fora do app.

### Em uma frase
> O admin lanca palpites e resultados; o sistema aplica as regras do
> bolao e publica a classificacao da Copa num painel publico.

### Plataforma
> **Mobile-first.** Os amigos consultam pelo celular. UI/UX desenhada
> para telas pequenas primeiro (toque, scroll, densidade adaptada);
> desktop e consequencia, nao o foco.

---

## 2. PERSONAS

| Persona | Acesso | O que faz |
|---------|--------|-----------|
| **Admin (organizador)** | Login (Supabase Auth) | Lanca tudo: participantes, rodadas, jogos, palpites, resultados, WO, selecao campea. Marca pagos. Invalida jogo/rodada. Configura pontuacao |
| **Palpitador** | Nenhum (envia palpite por WhatsApp) | Consulta o painel publico |
| **Publico** | Painel publico (read-only) | Ve classificacao, resultados e palpites |

---

## 3. OBJETIVO PRINCIPAL

Centralizar e automatizar a apuracao do bolao da Copa:
- Acabar com a planilha manual de pontuacao
- Calcular pontos conforme as regras (resultado, cravada, classico, WO, campeao)
- Classificacao publica sempre atualizada, transparente
- Controlar quem pagou (so para definir os premiados)

**Nao-objetivo (fora de escopo):**
- Palpitador logar / lancar proprio palpite (admin lanca tudo)
- Pagamento dentro do app (combinado no grupo)
- Integracao com API de resultados (admin digita)
- Multiplos boloes (um bolao unico)

---

## 4. REGRAS DO BOLAO (oficiais)

### 4.1 — Palpite de selecao campea
- Cada palpitador escolhe **uma selecao campea**
- **Prazo:** 11/06/2026 23:59 (depois, travado)
- Vale **+5 pontos** ao termino da Copa, se acertar
- Admin registra a escolha de cada participante

### 4.2 — Pontuacao por jogo

| Situacao | Jogo normal | Classico |
|----------|-------------|----------|
| Acertar vitoria ou empate (resultado certo) | 1 | 3 |
| Cravar vitoria ou empate (placar exato) | 2 | 4 |
| Errar | 0 | 0 |

- "Cravar" = placar exato. Tiers excludentes (cravada nao soma com acerto)
- Palpite de mata-mata vale **so o tempo normal (90min)** — sem
  prorrogacao nem penaltis
- **Classico** = marca por jogo (botao do admin). **Nesta competicao
  nao ha classicos** — todos pontuam 1/2. A flag fica no sistema para
  uso futuro, default desligada

### 4.3 — WO (ausencia de palpite) — MANUAL
- Palpitador que nao enviar palpite leva **−1 ponto** naquele jogo
- O admin recebe os palpites pelo WhatsApp; quando alguem nao envia,
  **o admin marca WO manualmente** naquele jogo, para aquele participante
- WO nao e automatico — e uma marca explicita do admin

### 4.4 — Invalidacao (admin)
- O admin pode **invalidar um jogo** ou uma **rodada inteira**
- Jogo/rodada invalidado **nao conta pra ninguem**: zero pontos, zero
  cravada e **zero WO**. E como se o(s) jogo(s) nao existisse(m)

### 4.5 — Prazo de palpite por rodada
- Cada rodada (agrupamento de jogos definido pelo admin) tem um
  **horario de recebimento de palpite**
- Esse horario e **so referencia visual** — nao trava nada e nao
  calcula WO. O admin segue podendo lancar palpites e resultados depois

### 4.6 — Premiacao
- 🥇 1º: **60%** · 🥈 2º: **30%** · 🥉 3º: **10%**
- O **valor arrecadado e combinado no grupo, fora do app**. O painel
  mostra so os percentuais (sem R$, a menos que o admin opte por
  preencher um valor)

### 4.7 — Criterios de desempate (em ordem)
1. Maior numero de pontos
2. Maior numero de **cravadas** (placares exatos)
3. **Menor** numero de WO
4. Acerto do campeao

### 4.8 — Classificacao
- Soma dos pontos dos palpites (com regra de classico) − WO + bonus de
  campeao (no fim). Jogos invalidados nao entram
- Acumulada da Copa inteira. Publica, sem login

### 4.9 — Pagamento
- Status `pago` (sim/nao) por participante, marcado pelo admin.
  Controle manual, so para identificar os premiados

---

## 5. RODADAS, JOGOS E AGRUPAMENTO

- **Rodada** = agrupamento **manual** feito pelo admin. O admin cria a
  rodada, define o nome, o horario de palpite (visual) e quais jogos
  entram nela
- Rodada pode ser invalidada (anula todos os seus jogos)
- Cada jogo pertence a uma rodada, tem flag de classico e flag de
  invalidado individual

---

## 6. PAINEL PUBLICO (estilo tabela de campeonato)

Mostra **tudo**, transparente:
- **Classificacao:** posicao, nome, jogos, pontos, cravadas, WO
- **Resultados:** jogos por rodada com placar e **bandeiras** dos times
- **Detalhe do jogo:** clicar num jogo abre os palpites de **todos** os
  participantes para aquele jogo (placar + pontos no jogo)
- **Grade de palpites:** o placar que cada participante palpitou em
  cada jogo, e quantos pontos fez
- **Selecao campea** de cada um (apos o prazo)
- **Premiacao** (percentuais 60/30/10)

> Bandeiras: cada selecao tem codigo/bandeira (tabela `selecoes`).
> Times exibidos com bandeira em jogos, resultados e detalhe.

---

## 7. PAGINAS

### Area Admin (requer login)
| Pagina | Funcao |
|--------|--------|
| Login | Autenticacao (Supabase Auth) |
| Dashboard | Resumo: participantes, pagos, rodadas, jogos, pendencias |
| Participantes | CRUD + pago + selecao campea |
| Rodadas | CRUD de rodadas + prazo (visual) + invalidar rodada |
| Jogos | CRUD + marcar classico + invalidar jogo + lancar resultado |
| Palpites | Lancar/editar palpites + marcar WO (por jogo ou participante) |
| Configuracao | Pontuacao, %s premiacao, prazo campeao, campeao real |

### Area Publica (sem login)
| Pagina | Funcao |
|--------|--------|
| Classificacao (home) | Tabela de campeonato + premiacao |
| Resultados | Jogos por rodada com placar + bandeiras (jogos clicaveis) |
| Detalhe do jogo | Palpites de todos os participantes para um jogo |
| Grade de palpites | Matriz participante x jogo (placar + pontos) |

---

## 8. FUNCIONALIDADES (priorizadas)

### MVP
- [ ] Login admin
- [ ] CRUD participantes + pago + selecao campea
- [ ] CRUD rodadas + prazo (visual) + invalidar rodada
- [ ] CRUD jogos + marcar classico + invalidar jogo
- [ ] Lancar resultado
- [ ] Lancar palpites + marcar WO manual
- [ ] Calculo de pontos (resultado, cravada, classico, WO, invalidacao)
- [ ] Bonus de campeao (+5 no fim)
- [ ] Classificacao publica com desempate correto
- [ ] Resultados publicos por rodada
- [ ] Grade de palpites publica
- [ ] Premiacao (percentuais)
- [ ] Config de pontuacao e premiacao

### Fase 2
- [ ] Importacao em massa do torneio inteiro (104 jogos + mata-mata)
- [ ] Valor da cota opcional (mostrar R$)

> Resultados sao SEMPRE lancados manualmente pelo admin. Sem auto-sync /
> API de resultados (decisao fechada).

### Fora de escopo
- Login de palpitador, pagamento no app, API de resultados, multi-bolao

---

## 9. STACK

| Camada | Tecnologia |
|--------|-----------|
| Linguagem | TypeScript (strict) |
| Framework | Next.js (App Router) |
| Estilo | Tailwind CSS |
| Banco + Auth | Supabase (PostgreSQL + Auth + RLS) |
| Hospedagem | Vercel |
| Imagens (opcional) | Cloudinary — so se usar bandeiras |

---

## 10. PONTOS EM ABERTO

| # | Questao | Default |
|---|---------|---------|
| 1 | Identidade visual (nome do bolao, cores, tom) | A definir no design-brief / Stitch |
| 2 | Selecao campea aparece no publico quando? | Apos o prazo (11/06 23:59) |
| 3 | Empate total (incl. campeao) no fim | Empate mesmo / decisao do organizador |

---

## 11. CRITERIO DE PRONTO (MVP)

- Admin loga e lanca participantes, rodadas, jogos, palpites, WO e resultados
- Pontos saem certos (resultado, cravada, classico); WO debita −1;
  jogo/rodada invalidado zera tudo; campeao soma +5 no fim
- Painel publico abre sem login: classificacao, resultados e grade de
  palpites, com desempate correto e premiacao em %
- Deploy na Vercel, RLS ativo, nenhuma chave no frontend, publico nao
  ve contato/pagamento individual

---

*Documento vivo. Complementos: `spec.md` (tecnico), `claude.md` (regras agente).*
