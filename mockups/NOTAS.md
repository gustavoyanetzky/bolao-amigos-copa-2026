# NOTAS DOS MOCKUPS (Stitch)

*Origem: projeto Stitch 1165986186522904335. HTML em `mockups/*.html`.*
*UI aprovada estruturalmente. Itens abaixo = ajustes na fase de codigo,*
*nao redesign.*

## Telas (11)
01 Classificacao (home) · 02 Resultados · 03 Grade de palpites ·
04 Detalhe do jogo · 05 Login admin · 06 Dashboard admin ·
07 Participantes · 08 Rodadas · 09 Jogos · 10 Lancar palpites · 11 Config

## Ajustes a aplicar no codigo
1. Idioma: traduzir tudo pra PT-BR (ha textos em ingles: "Updated Xm ago",
   "Match Details", "Sorted by Pts", "Prize Pool", "Pending Actions",
   "Manage Users/Matches", "Enter Scores").
2. Premiacao: padronizar 60/30/10 em TODAS as telas (Dashboard veio 50/30/20).
3. Pontuacao na Grade: usar esquema real 1 (acerto) / 2 (cravada), sem
   classico. Mockup veio com +5/+3/+2 (esquema antigo). Detalhe do jogo
   ja veio correto (2/1).
4. Bandeiras: trocar placeholders coloridos por bandeiras reais
   (flagcdn.com/{iso2}, ver `dados-bolao.md`).
5. Dados: substituir nomes/numeros placeholder pelos 17 participantes
   reais e jogos oficiais (seed em `dados-bolao.md`).
6. Titulo: definir entre "Bolao Amigos FC" (curto) e
   "Bolao - Clube dos Amigos - Copa 2026".

## Observacao
Mockups sao referencia visual. Codigo final segue `spec.md` +
`architecture.md` (Next.js + Supabase), nao o HTML do Stitch direto.
