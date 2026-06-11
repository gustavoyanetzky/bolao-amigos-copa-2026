# DESIGN BRIEF — Bolao Clube dos Amigos Copa 2026

*Guia visual aprovado. Input para o Google Stitch e para a UI.*
*Base: `prd.md`, `spec.md`. Criado em: 2026-06-11*

---

## 1. IDENTIDADE

- **Nome exibido:** Bolao - Clube dos Amigos - Copa 2026
- **Logo/escudo:** `logo do grupo de amigos.jpeg` — escudo "AMIGOS
  FUTEBOL CLUBE" (fundado 2000). Indigo-marinho + creme, bola de
  futebol, louros e estrelas. E a ancora visual da marca
- **Personalidade:** placar de campeonato, data-heavy, direto ao ponto.
  Quem abre quer ver numero: quem ta na frente, quantos pontos, os palpites
- **Tom:** esportivo, serio, sem firula. Compacto > decorativo

---

## 2. DIRECAO VISUAL

- **Estilo:** planilha densa / tabela de campeonato classica
- **Modo:** dark mode (unico no MVP)
- **Paleta base:** indigo-marinho do escudo + creme/marfim + neutros escuros
  (ancorada nas cores da logo do Amigos Futebol Clube)
- **Densidade:** alta. Muita info por tela, padding compacto, linhas zebradas,
  numeros alinhados (tabular). Cabecalho de tabela fixo (sticky) ao rolar

---

## 3. TOKENS DE COR (dark)

| Uso | Cor | Hex aprox |
|-----|-----|-----------|
| Fundo base | indigo quase preto | #0B0B1F |
| Superficie (cards, tabela) | indigo escuro | #16163A |
| Superficie alt (zebra) | #12122F | |
| Borda / divisor | #272663 | |
| Primaria (indigo da marca) | indigo | #353487 |
| Primaria clara / hover | indigo claro | #4B49B3 |
| Marca / destaque (creme) | marfim do escudo | #F4F0DD |
| Texto principal | quase branco | #ECEAF6 |
| Texto secundario | indigo-cinza | #9D9BC4 |
| Sucesso / cravada | emerald | #10B981 |
| Alerta / WO | red | #EF4444 |
| Premio top 3 | ouro | #E0B23C |
| Invalidado (apagado) | indigo-cinza riscado | #5B5A86 |

> A primaria e o indigo do escudo (#353487). O creme (#F4F0DD) e a cor
> de marca para titulos, logo e detalhes de destaque sobre o fundo escuro.

### Semantica nas tabelas
- **Cravada** (placar exato): celula com tom verde/emerald
- **WO**: celula vermelha, valor "-1" ou marca "WO"
- **Invalidado**: celula cinza, texto riscado, "—"
- **Classico**: badge azul/ouro discreto no jogo
- **Top 3**: linha com leve realce + medalha (ouro/prata/bronze)

---

## 4. TIPOGRAFIA

- **Fonte UI:** Inter (ou system sans). Limpa, otima pra densidade
- **Numeros:** usar `font-variant-numeric: tabular-nums` em todas as
  colunas numericas (alinhamento perfeito)
- **Hierarquia compacta:**
  - Titulo painel: 18-20px semibold
  - Cabecalho de coluna: 11-12px uppercase, tracking, slate-400
  - Celula de dado: 13-14px
  - Numero de destaque (pontos totais): 15-16px semibold

---

## 5. LAYOUT

### Logo / escudo
- **Header:** escudo do Amigos FC a esquerda do titulo, tamanho pequeno
  (32-40px), em todas as telas (publico e admin)
- **Login:** escudo maior (96-128px) centralizado acima do form
- **Favicon / PWA:** derivar do escudo
- O fundo escuro indigo conversa direto com as cores do escudo —
  manter o escudo sobre superficie escura, sem caixa branca em volta

### Publico
- **Header fixo:** escudo + nome do bolao + nav (Classificacao /
  Resultados / Grade) + "ultima atualizacao"
- **/ (Classificacao):** tabela densa — colunas: Pos · Nome · J · Pts · Cr · WO
  (· Campea apos prazo). Top 3 destacados. Card de premiacao (60/30/10) ao lado/topo
- **/resultados:** lista por rodada; cada jogo em linha compacta
  (time x time · placar · badges classico/invalidado)
- **/grade:** matriz — linhas = participantes (sticky 1a coluna), colunas =
  jogos (sticky header). Celula = placar palpitado + pontos; cores semanticas.
  Scroll horizontal no mobile

### Admin
- **Shell (mobile):** bottom tabs / menu hamburguer (Dashboard,
  Participantes, Rodadas, Jogos, Palpites, Config) + botao sair.
  Sidebar so no desktop (consequencia, nao foco)
- Mesma linguagem visual (dark, azul, denso), formularios compactos,
  tabelas editaveis inline quando possivel
- Acoes destrutivas (excluir, invalidar) com confirmacao

---

## 6. COMPONENTES-CHAVE

- TabelaDensa (zebra, sticky header, tabular-nums)
- CelulaGrade (estados: palpite/cravada/erro/WO/invalidado/vazio)
- BadgeClassico, BadgeInvalidado, MedalhaTop3
- CardPremiacao (60/30/10)
- Toggle (pago, classico, invalidado, WO)
- FormCompacto (participante, jogo, rodada, resultado, config)

---

## 7. MOBILE-FIRST (prioridade)

App e usado **no celular**. Desenhar para telas pequenas primeiro
(referencia: 390 x 844). Desktop e so consequencia.

- **Navegacao publica:** bottom tab bar fixa (Classificacao · Resultados
  · Grade) — polegar alcanca facil
- **Navegacao admin:** bottom tabs ou menu hamburguer; nada de sidebar
  fixa larga no mobile
- **Tabelas densas no celular:**
  - Classificacao: linha mostra Pos · Nome · Pts em destaque; Cr/WO
    secundarios (menores). Scroll horizontal so se precisar
  - Grade (matriz): 1a coluna (nome) fixa + scroll horizontal; filtro
    "por rodada/dia" para reduzir colunas na tela
  - Detalhe do jogo: formato ideal pro celular (lista vertical)
- **Alvos de toque >= 44px**, espacamento confortavel apesar da densidade
- **Formularios admin:** campos full-width, teclado numerico nos placares
- Numeros tabulares e tipografia legivel mesmo em tela pequena

---

## 8. REFERENCIAS

- Tabelas de classificacao tipo Cartola FC / placar de campeonato
- Apps de resultado esportivo (SofaScore, FlashScore) — densidade e dark
- Dashboards data-heavy (linhas zebradas, numeros tabulares)

---

## 9. PROMPT-BASE PARA O STITCH

> Veja o prompt pronto para gerar as telas em `docs-stitch-prompt.md`
> (ou colar direto no Stitch). Gerar todas as telas do `prd.md` secao 7.

---

*Documento vivo. Aprovacao do cliente trava mudancas visuais (novo orcamento).*
