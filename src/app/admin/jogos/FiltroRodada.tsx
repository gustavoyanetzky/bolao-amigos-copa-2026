"use client";

import { useRouter } from "next/navigation";

/**
 * Filtro horizontal de rodadas. Trocar de chip navega para
 * /admin/jogos?rodada=<id> (a busca dos jogos acontece no Server Component).
 * Client minimo: so navegacao, sem estado de dados.
 */

interface RodadaOpcao {
  id: string;
  nome: string;
}

export default function FiltroRodada({
  rodadas,
  selecionada,
}: {
  rodadas: RodadaOpcao[];
  selecionada: string | null;
}) {
  const router = useRouter();

  return (
    <div className="no-scrollbar -mx-edge-margin flex gap-2 overflow-x-auto px-edge-margin pb-1">
      {rodadas.map((r) => {
        const ativa = r.id === selecionada;
        return (
          <button
            key={r.id}
            type="button"
            aria-pressed={ativa}
            onClick={() =>
              router.push(`/admin/jogos?rodada=${encodeURIComponent(r.id)}`)
            }
            className={`whitespace-nowrap rounded-full border px-4 py-1.5 text-label-sm font-medium transition-colors ${
              ativa
                ? "border-primary bg-primary-container/30 font-bold text-primary"
                : "border-border text-text-secondary hover:bg-surface-variant"
            }`}
          >
            {r.nome}
          </button>
        );
      })}
    </div>
  );
}
