"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { JogoOpcao } from "./tipos";

/**
 * Seletor de jogo (modo "Por jogo"). Ao trocar, navega para
 * /admin/palpites?jogo=<id> (Server Component re-busca os dados do jogo).
 * Client component pequeno: so estado de navegacao/pending.
 */
export default function SeletorJogo({
  opcoes,
  jogoSelecionadoId,
}: {
  opcoes: JogoOpcao[];
  jogoSelecionadoId: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (opcoes.length === 0) return null;

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor="seletor-jogo"
        className="text-table-header font-bold uppercase tracking-wide text-text-secondary"
      >
        Jogo
      </label>
      <div className="relative">
        <select
          id="seletor-jogo"
          value={jogoSelecionadoId ?? ""}
          disabled={pending}
          onChange={(e) => {
            const id = e.target.value;
            startTransition(() => {
              router.push(`/admin/palpites?jogo=${id}`);
            });
          }}
          className="w-full appearance-none rounded-lg border border-border bg-surface px-3 py-2.5 pr-10 text-body-md text-text-primary focus:border-primary-container focus:outline-none focus:ring-1 focus:ring-primary-container disabled:opacity-60"
        >
          {opcoes.map((o) => (
            <option key={o.id} value={o.id}>
              {o.rodadaNome} · {o.casaCod} x {o.foraCod}
              {o.encerrado ? " (encerrado)" : ""}
            </option>
          ))}
        </select>
        <span
          className="material-symbols-outlined pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[20px] text-text-secondary"
          aria-hidden="true"
        >
          {pending ? "progress_activity" : "expand_more"}
        </span>
      </div>
    </div>
  );
}
