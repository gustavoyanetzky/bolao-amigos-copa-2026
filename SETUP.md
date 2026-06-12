# SETUP — Plugar serviços (Bolão Amigos FC)

*Projeto pessoal. Contas pessoais (separadas da Meryan).*
*Passos que SO voce pode fazer (login). Depois eu assumo.*

---

## 1. GitHub (repo privado pessoal)

O `gh` daqui nao le o token (keyring do macOS trava). Escolha um:

**Opção A — re-autenticar o gh (recomendado):**
No prompt do Claude Code, rode:
```
! gh auth login
```
Siga: GitHub.com → HTTPS → autentica no navegador. Depois me avisa
"gh ok" que eu crio o repo e dou push.

**Opção B — criar na mão:**
1. github.com → New repository → nome `bolao-amigos-copa-2026` → **Private** → Create (sem README).
2. Me manda a URL do repo. Eu adiciono o remote e faço push.

---

## 2. Supabase (conta + projeto pessoal)

1. supabase.com → entrar com sua conta **pessoal** (nao a Meryan).
2. New project:
   - Name: `bolao-amigos-copa-2026`
   - Database password: gere forte e **guarde** (Bloco de Notas).
   - Region: `South America (São Paulo)` se houver, senão `East US`.
3. Espera provisionar (~2 min).
4. Pega as chaves em **Project Settings → API**:
   - `Project URL`            → vira `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key        → vira `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key       → vira `SUPABASE_SERVICE_ROLE_KEY` (SECRETO)
5. **Me manda as 3** (vou colocar no `.env.local`, que nunca commita).

### Aplicar schema + seed
Quando o projeto existir, no Supabase: **SQL Editor → New query**:
- Cola e roda `supabase/migrations/0001_init.sql` (cria tabelas + RLS).
- Cola e roda `supabase/seed.sql` (48 seleções, 17 participantes, jogos).
(Ou, se preferir, me passa a connection string que eu te guio.)

### Criar o admin (login)
- **Authentication → Users → Add user** → email + senha do organizador.
- Esse e o unico login do app. Guarda no Bloco de Notas.

---

## 3. Vercel (conta + projeto pessoal)

*Depois do GitHub e Supabase prontos.*
1. vercel.com → entrar com conta **pessoal**.
2. Add New → Project → importa o repo `bolao-amigos-copa-2026`.
3. Em Environment Variables, cola as 3 do Supabase (mesmos nomes).
4. Deploy. (Eu valido o build e a Onda seguinte.)

---

## O que me devolver (resumo)
- [ ] "gh ok" **ou** URL do repo GitHub
- [ ] As 3 chaves do Supabase (URL + anon + service_role)
- [ ] Confirmar que rodou as 2 migrations no SQL Editor
- [ ] Email/senha do admin criado (ou so confirma que criou)

Com isso eu: configuro `.env.local`, conecto o repo, valido o banco e
disparo a **Onda 1** (libs + componentes + auth) com tudo integrado.

> Secrets: `service_role` e senhas ficam so no `.env.local` (gitignored)
> e nas env vars da Vercel. Nunca no GitHub.
