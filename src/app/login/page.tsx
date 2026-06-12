"use client";

import Image from "next/image";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { login, type LoginState } from "./actions";

/**
 * Botao Entrar — desabilita e mostra estado enquanto a action roda.
 * useFormStatus precisa ficar num filho do <form>.
 */
function BotaoEntrar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary-container py-3 text-body-lg font-semibold text-on-primary-container transition-colors hover:bg-primary-container/80 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Entrando..." : "Entrar"}
      <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
        arrow_forward
      </span>
    </button>
  );
}

/**
 * /login — acesso administrativo.
 * Client Component: captura email+senha e chama a Server Action de login.
 * Toda a autenticacao roda no servidor (thin client / fat server).
 */
export default function LoginPage() {
  const [state, formAction] = useActionState<LoginState, FormData>(
    login,
    undefined,
  );

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background p-edge-margin text-text-primary">
      {/* brilho radial de fundo */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 0%, #353487 0%, transparent 60%)",
        }}
      />

      <div className="z-10 flex w-full max-w-sm flex-col items-center space-y-8">
        {/* escudo + titulo */}
        <div className="flex flex-col items-center">
          <div className="mb-4 h-[110px] w-[110px]">
            <Image
              src="/escudo.jpg"
              alt="Escudo do Bolão Amigos FC"
              width={110}
              height={110}
              priority
              className="h-full w-full rounded-full object-contain shadow-xl drop-shadow-xl"
            />
          </div>
          <h1 className="text-center text-headline-lg font-semibold text-text-primary">
            Bolão Amigos FC
          </h1>
          <p className="mt-1 text-center text-body-md text-text-secondary">
            Acesso Administrativo
          </p>
        </div>

        {/* card do formulario */}
        <div className="w-full rounded-xl border border-border bg-surface p-6 shadow-xl">
          <form action={formAction} className="space-y-5">
            <div className="space-y-1">
              <label
                htmlFor="email"
                className="block text-label-sm font-medium text-text-secondary"
              >
                Email Administrador
              </label>
              <div className="relative">
                <span
                  className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-text-secondary"
                  aria-hidden="true"
                >
                  mail
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="admin@amigosfc.com"
                  className="w-full rounded-lg border border-border bg-surface-container-low py-3 pl-10 pr-4 text-body-md text-text-primary transition-colors placeholder:text-disabled focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="password"
                className="block text-label-sm font-medium text-text-secondary"
              >
                Senha
              </label>
              <div className="relative">
                <span
                  className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-text-secondary"
                  aria-hidden="true"
                >
                  lock
                </span>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-border bg-surface-container-low py-3 pl-10 pr-4 text-body-md text-text-primary transition-colors placeholder:text-disabled focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* area de erro */}
            {state?.error ? (
              <p
                role="alert"
                className="flex items-center gap-2 rounded-lg border border-error-red/40 bg-error-red/10 px-3 py-2 text-label-sm text-error-red"
              >
                <span
                  className="material-symbols-outlined text-[18px]"
                  aria-hidden="true"
                >
                  error
                </span>
                {state.error}
              </p>
            ) : null}

            <BotaoEntrar />
          </form>
        </div>
      </div>
    </main>
  );
}
