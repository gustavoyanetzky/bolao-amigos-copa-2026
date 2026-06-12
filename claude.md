# Regras do Projeto — Bolao Copa do Mundo FIFA

*Gerenciador single-admin de bolao da Copa. Veja `prd.md` e `spec.md`.*
*Frente: pessoal (confirmar). Processo: `01_Servicos - Criacao de Sites/`.*

---

## Contexto rapido
App operado por UM admin. Palpitadores nao logam — o admin lanca
palpites e resultados; o sistema calcula pontos e publica o ranking
acumulado da Copa num painel publico read-only. Pagamento e controle
manual (admin marca pago/nao-pago). Resultados digitados na mao.

## Arquitetura
- Stack: Next.js (App Router) + Supabase + Vercel + Cloudinary (opcional)
- Linguagem: TypeScript strict
- Estilo: Tailwind CSS
- Padrao: thin client / fat server
  - Frontend: so captura intencoes e renderiza
  - Backend (Server Actions / Route Handlers): toda logica de negocio
  - Calculo de pontuacao SEMPRE no servidor, nunca no client
  - NUNCA expor chaves, secrets ou logica no frontend

## Seguranca (nao negociavel)
- Todas as chaves em `.env.local` (nunca commitar; `.gitignore` sempre)
- Service role key so no servidor. Anon key no client
- Supabase RLS ativo em TODAS as tabelas (ver `spec.md` secao 4)
- Ranking publico expoe so colunas nao sensiveis (nome, pontos).
  NUNCA expor contato nem status de pagamento no publico
- Rotas `/admin/*` protegidas por middleware de auth
- Validacao de input no servidor (placar inteiro >= 0)
- Auth via Supabase Auth (nunca custom)

## Regras de negocio criticas
- Pontuacao e DERIVADA (placar real vs palpite). Nunca editar `pontos`
  na mao — sempre via funcao `pontosDoPalpite`
- Pontos por jogo (tiers excludentes):
  - Normal: cravada(placar exato)=2, acerto resultado=1, erro=0
  - Classico: cravada=4, acerto=3, erro=0 (flag `classico` por jogo)
- WO = MANUAL. Admin marca ausencia (recebe palpites no WhatsApp) =
  -1 por jogo. Sem linha de palpite = nada registrado (nao e WO)
- Invalidacao: admin pode invalidar jogo ou rodada inteira. Invalidado
  anula tudo: 0 pontos, 0 cravada, 0 WO (como se nao existisse)
- Rodada = agrupamento MANUAL do admin (tabela `rodadas`). prazo_palpite
  e so referencia visual (nao trava, nao calcula nada)
- Campeao: +5 no fim, so se acertar a selecao campea (prazo do palpite
  travado em `config.prazo_campeao`; aplica quando admin seta `campeao_real`)
- Premiacao = arrecadado (pagos x valor_cota) dividido 60/30/10
- Recalcular pontos ao: lancar/editar resultado (jogo afetado) e ao
  editar `config` de pontuacao (todos os palpites)
- Mata-mata = placeholder: jogo entra com time_*_cod null + rotulo de
  vaga ("1o A", "Venc. Jogo 73"); admin troca pelo time real quando os
  grupos definirem. Pontua igual (placar; sem classico). UI: LadoTime
- Um palpite por participante por jogo (UNIQUE)
- Premio e da Copa inteira: ranking = soma acumulada, nao por rodada
- Desempate (ordem): pontos desc -> cravadas desc -> WO asc ->
  acerto do campeao -> nome asc

## Organizacao de codigo
- Rotas conforme arvore em `spec.md` secao 5
- Server Actions em `app/actions/` por entidade
- Logica de pontuacao isolada em `lib/pontuacao.ts` (funcao pura, testavel)
- Componentes reutilizaveis em `/components`
- Nunca duplicar codigo — importar componentes existentes

## Modo de trabalho
- Eu (Gustavo) sou o orquestrador. Claude Code e os agentes executam
- Spec antes de codar. Nunca vibe coding
- Uma issue por vez (ver ordem em `spec.md` secao 6)
- `/clear` entre plan e execute
- Dupla revisao antes de integrar
- Git commit granular por issue
- Effort segue o RISCO: schema/RLS/auth/pontuacao = effort alto;
  scaffold de tela a partir de issue clara = baixo

## Comandos
- Dev: `pnpm dev`
- TypeCheck: `pnpm typecheck`
- Build: `pnpm build`
- Deploy: `git push` (Vercel automatico)

## Checklist de seguranca (a cada issue)
- [ ] Nenhuma chave/secret no frontend
- [ ] `.env.local` no `.gitignore`
- [ ] RLS ativo nas tabelas tocadas
- [ ] Escrita via Server Action, validada no servidor
- [ ] Publico nao ve contato/pagamento
- [ ] `/admin/*` exige auth
