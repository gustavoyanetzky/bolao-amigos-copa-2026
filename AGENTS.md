<!-- GERADO por 00_Kit/bin/kit — não editar à mão -->
# AGENTS.md — Bolao

Porta de entrada para agentes que **não** são o Claude Code (Codex, Antigravity).
O Claude Code lê o `CLAUDE.md` desta pasta.

## Leia primeiro, nesta ordem

1. **`../00_Kit/AGENTS.md`** — base compartilhada: design, backend, arquitetura, harness,
   skills e agentes. **Canônico.**
   Se o caminho relativo não resolver: `/Users/macbookpro/Code/00_Kit/AGENTS.md`
2. **`CLAUDE.md`** desta pasta — regras duras do projeto.
3. `docs/` — decisões, PRD e spec deste projeto.
4. **`design-decisions.md`** — direção visual travada. **Leia antes de qualquer tela.**

## Não negociáveis

- Antes de qualquer UI: direção visual travada. Sem ela a saída cai no default genérico.
- Não re-escolha ferramenta — pnpm, Node 24, TS strict, Tailwind v4 já estão
  decididos no Kit (`harness/padrao-de-trabalho.md`).
- Nunca grave chave, token ou senha em doc, config ou código.
- Português em código, variável, rota e commit. Datas `AAAA-MM-DD`.

Sem acesso de leitura ao Kit? **peça ao Gustavo — não invente o conteúdo.**
