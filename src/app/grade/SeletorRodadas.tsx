"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

/**
 * Faixa horizontal de chips de rodada (mobile-first, rolavel). Cada chip e um
 * Link p/ <basePath>?rodada=<id> — navegacao server-side, sem estado client.
 * Ao montar, centraliza o chip ativo na viewport (evita rolar ate achar).
 * Reusado por /grade e /resultados (so muda o basePath).
 *
 * • marca a "rodada de hoje" (atualId) quando ela nao e a selecionada.
 */
interface RodadaChip {
  id: string;
  nome: string;
}

export default function SeletorRodadas({
  rodadas,
  selecionadaId,
  atualId,
  basePath,
}: {
  rodadas: RodadaChip[];
  selecionadaId: string | null;
  atualId: string | null;
  basePath: string;
}) {
  const ativoRef = useRef<HTMLAnchorElement | null>(null);

  // Centraliza o chip selecionado a cada navegacao (sem rolar a pagina).
  useEffect(() => {
    ativoRef.current?.scrollIntoView({
      block: "nearest",
      inline: "center",
    });
  }, [selecionadaId]);

  if (rodadas.length === 0) return null;

  return (
    <nav
      aria-label="Rodadas"
      className="flex-none overflow-x-auto no-scrollbar border-b border-border bg-surface-container-low"
    >
      <div className="flex w-max gap-1.5 px-edge-margin py-2">
        {rodadas.map((r) => {
          const ativa = r.id === selecionadaId;
          const ehAtual = r.id === atualId;
          return (
            <Link
              key={r.id}
              href={`${basePath}?rodada=${r.id}`}
              ref={ativa ? ativoRef : undefined}
              aria-current={ativa ? "page" : undefined}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-label-sm font-medium transition-colors ${
                ativa
                  ? "border-primary bg-primary text-on-primary"
                  : "border-border bg-surface text-text-secondary hover:bg-surface-variant hover:text-text-primary"
              }`}
            >
              {r.nome}
              {ehAtual && !ativa && (
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                  aria-label="rodada de hoje"
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
