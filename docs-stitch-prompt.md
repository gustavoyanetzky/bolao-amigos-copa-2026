# PROMPT FINAL PARA O GOOGLE STITCH — Bolao Clube dos Amigos Copa 2026

*MOBILE-FIRST. Cole no Stitch para gerar os mockups.*
*Base: `prd.md`, `spec.md`, `design-brief.md`, `dados-bolao.md`.*
*Suba o escudo `logo do grupo de amigos.jpeg` como asset e peca pra usar
no header/login. Aprovar UI com o grupo antes de codar.*

---

## CONTEXTO GLOBAL (colar primeiro / em toda tela)

```
Gere telas de CELULAR (mobile-first), frame de smartphone 390x844.
Tudo desenhado para o polegar: navegacao em barra inferior, alvos de
toque grandes (>=44px), scroll vertical natural.

App: painel de um bolao da Copa do Mundo FIFA 2026, nome
"Bolao - Clube dos Amigos - Copa 2026". O grupo tem um escudo de futebol
("Amigos Futebol Clube", 2000) — usar o escudo no topo (pequeno ~32px) e
grande na tela de login. Sem caixa branca em volta do escudo.

ESTILO: planilha densa / tabela de campeonato de futebol, data-heavy,
porem adaptada pra celular. DARK MODE. Paleta ancorada no escudo:
indigo-marinho + creme.

CORES:
- fundo #0B0B1F, superficie #16163A, zebra #12122F, borda #272663
- indigo primario #353487 (hover/ativo #4B49B3)
- creme de marca (titulos/detalhes) #F4F0DD
- texto #ECEAF6, secundario #9D9BC4
- verde cravada #10B981, vermelho WO #EF4444, ouro top3/premio #E0B23C

TIPOGRAFIA: Inter. Numeros com tabular-nums (alinhados). Cabecalho de
coluna 11px uppercase cinza. Linhas zebradas, cabecalhos fixos (sticky).
Bandeiras das selecoes ao lado dos times (~18-20px), via codigo do pais.

NAV PUBLICA: bottom tab bar fixa com 3 abas: Classificacao | Resultados
| Grade. NAV ADMIN: bottom tabs/hamburguer (sem sidebar larga no mobile).

DADOS REAIS pra usar (Copa 2026, dia 1, Grupo A):
- Participantes (17): Adriano, Alisson, Bruno Zenci, Diego Franqueiro,
  Dyego, Fabricio, Felipe, Felipe Teodoro, Gabriel, Hiago Caetano,
  Joaninha, Machado, Mec, Nelson, Paulinho, Ribeiro, Ricardo PT.
- Jogos dia 1: Mexico 2x0 Africa do Sul (encerrado); Republica da
  Coreia x Tchequia (agendado, 22:00). Sem classicos.
```

---

## TELAS PUBLICAS (sem login)

### 1. Classificacao (home, aba 1)
```
Tela mobile, dark, densa. Topo: escudo (~32px) + "Bolao - Clube dos
Amigos - Copa 2026" + "atualizado ha X min".
Card de premiacao compacto: 1o 60% | 2o 30% | 3o 10% (ouro/prata/bronze).
Lista de classificacao (estilo tabela de campeonato), cada linha:
  [Pos] Nome ............... [Pts em destaque]
  abaixo, menor: J 1 · Cr 0 · WO 0
Top 3 com leve realce e medalha. Pts em creme/branco, semibold, grande.
Toque na linha abre detalhe do participante (futuro). Bottom tab bar:
Classificacao (ativa) | Resultados | Grade.
Exemplo: 1o Dyego 2pts (cravou Mexico 2x0); demais com 1 ou 0.
```

### 2. Resultados (aba 2)
```
Tela mobile, dark. Lista de jogos agrupada por RODADA/DIA, cada dia com
titulo (ex "Dia 1 — 11/06") e horario. Cada jogo = card clicavel:
  [bandeira] Mexico   2
  [bandeira] Africa do Sul  0     [encerrado]
Jogo agendado mostra horario no lugar do placar. Badge cinza para
"agendado", verde para "encerrado". (Sem badge de classico nesta copa.)
Tocar no card abre o detalhe do jogo (tela 4). Bottom tab bar.
```

### 3. Grade de palpites (aba 3)
```
Tela mobile, dark, matriz densa. 1a coluna FIXA com nome do participante;
colunas = jogos (cabecalho com bandeiras, ex "MEX x RSA"), com scroll
horizontal. Cabecalho de cada coluna e tocavel -> detalhe do jogo.
Cada celula: placar palpitado em cima, pontos embaixo (pequeno).
Cores: cravada verde, WO vermelho "-1", invalidado cinza riscado,
sem palpite "—". Acima da matriz, um seletor "Dia/Rodada" pra limitar
colunas na tela. Coluna final ou chip por linha = total de Pts.
Bottom tab bar.
```

### 4. Detalhe do jogo (abre ao tocar num jogo)
```
Tela mobile, dark. Cabecalho do jogo:
  [bandeira] Mexico  2  x  0  Africa do Sul [bandeira]
  fase/grupo · data/hora · status (encerrado)
Abaixo, lista vertical com o palpite de CADA participante neste jogo:
  Nome ............ Palpite (2x0) ...... +Pts
Ordenar por pontos do jogo (desc). Cravada em verde, WO em vermelho
"-1". Topo com botao voltar. Exemplo: Dyego/Fabricio/Hiago/Ribeiro 2x0
= +2 (verde); Alisson/Felipe/... 2x1 = +1; Adriano 2x2 = 0.
```

---

## TELAS ADMIN (apos login)

Mesma linguagem dark/indigo/densa, mobile. Navegacao admin por bottom
tabs ou menu. Acoes destrutivas (excluir, invalidar) pedem confirmacao.

### 5. Login
```
Tela mobile dark centralizada. Escudo grande (~110px) no topo. Card:
titulo do bolao, campo email, campo senha, botao indigo "Entrar",
area de erro. Simples.
```

### 6. Dashboard admin
```
Tela mobile dark. Saudacao + escudo pequeno. Grid 2 colunas de cards de
resumo: Participantes 17 | Pagos X | Rodadas Y | Jogos Z |
Sem resultado N. Card de premiacao (60/30/10). Lista de pendencias
(jogos passados sem resultado; participantes sem selecao campea).
Atalhos grandes para Participantes, Jogos, Palpites.
```

### 7. Participantes
```
Tela mobile dark. Busca no topo. Lista de participantes, cada item =
card: Nome em destaque; chips: Pago (toggle verde/cinza), Campea (texto).
Acoes editar/excluir no item. Botao flutuante "+ Adicionar".
Form (bottom sheet): nome, contato, pago, selecao campea.
```

### 8. Rodadas
```
Tela mobile dark. Lista de rodadas: Nome (ex "Dia 1 — 11/06"), nº de
jogos, prazo (so visual), toggle Invalidada. Botao "+ Nova rodada"
(form: nome, ordem, prazo). Acao "Invalidar rodada" com confirmacao.
```

### 9. Jogos
```
Tela mobile dark. Filtro por rodada no topo. Lista de jogos, cada card:
[bandeira] Casa x Fora [bandeira], data, status. Acoes: lancar resultado
(mini-form placar casa x fora com teclado numerico), marcar classico
(toggle), invalidar (toggle), editar, excluir. Botao "+ Adicionar jogo"
(form: rodada, fase, grupo, time casa, time fora, data).
```

### 10. Palpites
```
Tela mobile dark — lancamento rapido. Seletor de modo (Por jogo | Por
participante) e seletor do item. Modo "Por jogo": escolhe o jogo, aparece
lista de participantes; cada linha tem dois campos numericos (casa x
fora) e um toggle "WO". Botao "Marcar faltantes como WO". Salvar fixo no
rodape. Cravada fica verde, WO vermelho. Teclado numerico nos placares.
```

### 11. Config
```
Tela mobile dark, formulario em secoes (accordion):
- Pontuacao: acerto (1), cravada (2), acerto classico (3), cravada
  classico (4), campeao (+5), WO (-1).
- Premiacao: % 1o/2o/3o (somam 100); valor da cota (opcional).
- Campeao: prazo do palpite; campo "campeao real" (define no fim).
Botao "Salvar e recalcular" com aviso de que recalcula tudo.
```

---

## ORDEM SUGERIDA NO STITCH

1. Classificacao (home) — define a linguagem visual mobile
2. Detalhe do jogo — valida o fluxo de tocar e ver palpites
3. Grade de palpites — tela mais densa no celular
4. Resultados
5. Login + Dashboard admin
6. Demais telas admin

Depois de aprovar: extrair `design-system.md` (cores, fontes,
espacamentos, componentes) para a fase de codigo.
```
