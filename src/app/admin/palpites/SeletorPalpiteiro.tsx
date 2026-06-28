"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { PalpiteiroOpcao } from "./tipos";

/**
 * Seletor de palpiteiro (modo "Por palpiteiro"). Ao trocar, navega para
 * /admin/palpites?modo=palpiteiro&part=<id>&rodada=<id> preservando a rodada
 * atual (Server Component re-busca os jogos daquele palpiteiro/rodada).
 */
export default function SeletorPalpiteiro({
  opcoes,
  selecionadoId,
  rodadaId,
}: {
  opcoes: PalpiteiroOpcao[];
  selecionadoId: string | null;
  rodadaId: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (opcoes.length === 0) return null;

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor="seletor-palpiteiro"
        className="text-table-header font-bold uppercase tracking-wide text-text-secondary"
      >
        Palpiteiro
      </label>
      <div className="relative">
        <select
          id="seletor-palpiteiro"
          value={selecionadoId ?? ""}
          disabled={pending}
          onChange={(e) => {
            const id = e.target.value;
            const rodada = rodadaId ? `&rodada=${rodadaId}` : "";
            startTransition(() => {
              router.push(`/admin/palpites?modo=palpiteiro&part=${id}${rodada}`);
            });
          }}
          className="w-full appearance-none rounded-lg border border-border bg-surface px-3 py-2.5 pr-10 text-body-md text-text-primary focus:border-primary-container focus:outline-none focus:ring-1 focus:ring-primary-container disabled:opacity-60"
        >
          {opcoes.map((o) => (
            <option key={o.id} value={o.id}>
              {o.nome}
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
