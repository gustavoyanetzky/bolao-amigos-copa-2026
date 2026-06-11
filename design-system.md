# DESIGN SYSTEM — Bolao Amigos FC

*Tokens reais extraidos dos mockups Stitch (`mockups/*.html`).*
*Fonte da verdade visual para o codigo. Mobile-first, dark.*
*Base: `design-brief.md`. Criado em: 2026-06-11*

---

## 1. CONFIG TAILWIND (dropar em `tailwind.config.ts`)

```ts
// theme.extend
colors: {
  // marca / base
  "brand-navy-deep": "#0B0B1F",   // body background
  "brand-cream":     "#F4F0DD",   // titulos / destaque de marca
  "background":      "#111125",
  "surface":         "#16163A",
  "surface-variant": "#333349",
  "surface-container-low":     "#19192e",
  "surface-container":         "#1e1e32",
  "surface-container-high":    "#28283d",
  "surface-container-highest": "#333349",
  "zebra":  "#12122F",            // linha alternada de tabela
  "border": "#272663",
  "outline": "#918f9c",
  "outline-variant": "#464651",
  "disabled": "#5B5A86",
  // texto
  "text-primary":   "#ECEAF6",
  "text-secondary": "#9D9BC4",
  "on-surface":     "#e2e0fc",
  // primaria (indigo)
  "primary":           "#c2c1ff",
  "primary-container": "#353487",
  "on-primary-container": "#a2a2fc",
  "on-primary":        "#262478",
  // status
  "success-emerald": "#10B981",   // cravada
  "error-red":       "#EF4444",   // WO / erro
  "tertiary":        "#f0c049",   // ouro / acento
  // medalhas
  "medal-gold":   "#FFD700",
  "medal-silver": "#C0C0C0",
  "medal-bronze": "#CD7F32",
},
borderRadius: {
  DEFAULT: "0.125rem", lg: "0.25rem", xl: "0.5rem", full: "0.75rem",
},
spacing: {
  "edge-margin": "1rem",
  "row-height-dense": "2.5rem",
  "gutter-table": "0.5rem",
  "stack-compact": "0.25rem",
  "touch-target-min": "2.75rem",   // 44px
  "header-height": "3.5rem",       // 56px
  "bottom-nav-height": "4rem",     // 64px
},
fontFamily: { sans: ["Inter", "sans-serif"] },  // tudo Inter
fontSize: {
  "headline-lg": ["20px", {lineHeight:"28px", letterSpacing:"-0.02em", fontWeight:"600"}],
  "headline-md": ["18px", {lineHeight:"24px", fontWeight:"600"}],
  "headline-md-mobile": ["16px", {lineHeight:"22px", fontWeight:"700"}],
  "body-lg": ["16px", {lineHeight:"22px", fontWeight:"600"}],
  "body-md": ["14px", {lineHeight:"20px", fontWeight:"400"}],
  "data-cell": ["13px", {lineHeight:"18px", fontWeight:"500"}],
  "table-header": ["11px", {lineHeight:"16px", letterSpacing:"0.05em", fontWeight:"700"}],
  "label-sm": ["12px", {lineHeight:"16px", fontWeight:"500"}],
},
```

```css
/* globals.css */
body { background: #0B0B1F; color: #ECEAF6; font-family: Inter, sans-serif;
       -webkit-font-smoothing: antialiased; }
.tabular-data { font-variant-numeric: tabular-nums; }  /* TODA coluna numerica */
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
```

---

## 2. FONTES E ICONES

- **Fonte:** Inter (400/500/600/700) via Google Fonts (`next/font` no codigo)
- **Icones:** Material Symbols Outlined. Usados: `leaderboard`
  (classificacao), `sports_soccer` (resultados), `grid_view` (grade),
  `workspace_premium` (medalha/premio). `FILL 1` para preenchido
- Numeros sempre com `.tabular-data`

---

## 3. ESTRUTURA DE TELA (mobile)

```
body: bg-brand-navy-deep, text-text-primary, max-w-md mx-auto,
      pt-header-height, pb-bottom-nav-height, flex flex-col
header: sticky top-0 h-14, bg-surface, border-b border-border,
        escudo (32px, rounded-full, fundo cream) + titulo brand-cream
main:   flex-1, gap-4, p-edge-margin, overflow-y-auto no-scrollbar
nav:    fixed bottom-0 h-16, bg-surface, border-t border-border,
        3 abas publicas (Classificacao/Resultados/Grade)
```
Admin: mesma casca; nav inferior com Dashboard/Users/Jogos/Palpites/Config.

---

## 4. COMPONENTES (receitas dos mockups)

### Card de premiacao
`bg-surface rounded-xl border border-border p-3`; header
`text-table-header uppercase`; 3 colunas (1/2/3) com `workspace_premium`
em gold/silver/bronze + `60% / 30% / 10%` em `brand-cream tabular-data`.

### Tabela densa (classificacao)
Container `bg-surface rounded-xl border border-border overflow-hidden`.
Header sticky `grid grid-cols-[32px_1fr_40px] bg-surface-container-high
text-table-header text-text-secondary`.
Linhas `divide-y divide-border`, zebra alternando `bg-surface` / `bg-zebra`.
Linha: POS (medalha nos top3) · Nome (`body-md`, bold no top3) com
sublinha `J · Cr · WO` em `text-[10px]` (Cr verde, WO vermelho quando >0) ·
PTS `headline-md brand-cream tabular-data`.

### Celula de grade
Estados por cor: cravada `success-emerald`, WO `error-red` (mostra "WO"/-1),
invalidado `disabled` riscado, vazio "—". Placar em cima, pontos embaixo.
1a coluna (nome) sticky; header de coluna (jogo) clicavel -> detalhe.

### Detalhe do jogo
Cabecalho: bandeiras + times + placar grande + status. Lista de palpites
`grid` (Nome | Palpite chip | Pts). Chip verde=cravada, badge vermelho=WO.

### Inputs de palpite (admin)
Dois campos numericos (casa x fora) + checkbox WO por linha; teclado
numerico (`inputmode="numeric"`). Botao salvar fixo no rodape.
Toggles (pago/classico/invalidado) e botoes destrutivos com confirmacao.

### Bottom nav
`fixed bottom-0 h-16`; aba ativa `bg-primary-container
text-on-primary-container rounded-full`; inativa `text-text-secondary`.

---

## 5. BANDEIRAS

`<img src="https://flagcdn.com/{iso2}.svg">` (ex: mx, za, br; Escocia
`gb-sct`, Inglaterra `gb-eng`). Tamanho ~20px em listas, ~28px no detalhe.
Codigos em `dados-bolao.md`.

---

## 6. AJUSTES vs MOCKUP (aplicar no codigo)

- Titulo curto: **"Bolao Amigos FC"** (confirmado)
- Tudo PT-BR (mockup tinha textos em ingles)
- Premiacao 60/30/10 em todas as telas (Dashboard veio 50/30/20)
- Pontuacao real 1/2 (sem classico); grade do mockup veio 5/3/2
- Trocar placeholders por dados reais (`dados-bolao.md`)

---

*Documento vivo. Tokens canonicos do projeto. Ver `mockups/` para HTML.*
