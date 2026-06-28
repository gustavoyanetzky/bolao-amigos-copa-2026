import { createClient } from "@/lib/supabase/server";
import type { Rodada } from "@/lib/types";
import FormRodada from "./FormRodada";
import ToggleInvalidada from "./ToggleInvalidada";
import BotaoExcluir from "./BotaoExcluir";

/**
 * /admin/rodadas — gerenciamento de rodadas (CRUD + invalidar).
 * Server Component: busca as rodadas e a contagem de jogos de cada uma,
 * renderiza uma tabela densa com nome, ordem, prazo (so referencia),
 * nº de jogos e o toggle de invalidada. Mutacoes via Server Actions.
 */

export const dynamic = "force-dynamic";

/** Formata prazo_palpite (timestamptz) -> "dd/mm às hh:mm" pt-BR. */
function formatarPrazo(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const data = d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
  const hora = d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
  return `${data} às ${hora}`;
}

export default async function RodadasPage() {
  const supabase = await createClient();

  const { data: rodadasData } = await supabase
    .from("rodadas")
    .select("*")
    .order("ordem", { ascending: true })
    .order("created_at", { ascending: true })
    .returns<Rodada[]>();

  const rodadas = rodadasData ?? [];

  // Contagem de jogos por rodada (uma query, agrega no servidor de app).
  const { data: jogosRodada } = await supabase
    .from("jogos")
    .select("rodada_id")
    .returns<{ rodada_id: string }[]>();

  const contagem = new Map<string, number>();
  for (const j of jogosRodada ?? []) {
    contagem.set(j.rodada_id, (contagem.get(j.rodada_id) ?? 0) + 1);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Cabecalho */}
      <div className="flex items-end justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-headline-lg font-semibold text-brand-cream">
            Rodadas
          </h1>
          <p className="mt-1 text-label-sm text-text-secondary">
            Crie, edite e invalide rodadas do bolão.
          </p>
        </div>
        <FormRodada trigger="novo" />
      </div>

      {rodadas.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <span
            className="material-symbols-outlined text-[40px] text-text-secondary"
            aria-hidden
          >
            event_busy
          </span>
          <p className="max-w-xs text-body-md text-text-secondary">
            Nenhuma rodada cadastrada ainda. Use “Nova rodada” para começar.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          {/* Cabecalho da tabela */}
          <div className="grid grid-cols-[1fr_auto] items-center gap-2 bg-surface-container-high px-3 py-2 text-table-header uppercase tracking-wider text-text-secondary">
            <span>Rodada</span>
            <span className="text-right">Ações</span>
          </div>

          <ul className="divide-y divide-border">
            {rodadas.map((r, i) => {
              const nJogos = contagem.get(r.id) ?? 0;
              return (
                <li
                  key={r.id}
                  className={`relative grid grid-cols-[1fr_auto] items-center gap-2 px-3 py-3 ${
                    i % 2 === 1 ? "bg-zebra" : "bg-surface"
                  }`}
                >
                  {/* Indicador lateral de estado */}
                  <span
                    aria-hidden
                    className={`absolute inset-y-0 left-0 w-1 ${
                      r.invalidada ? "bg-error-red" : "bg-success-emerald"
                    }`}
                  />

                  <div className="min-w-0 pl-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3
                        className={`truncate text-body-lg ${
                          r.invalidada
                            ? "text-on-surface line-through decoration-error-red/50"
                            : "text-on-surface"
                        }`}
                      >
                        {r.nome}
                      </h3>
                      {r.invalidada ? (
                        <span className="rounded-full border border-error-red/50 bg-error-red/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-error-red">
                          Invalidada
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-label-sm text-text-secondary">
                      <span className="inline-flex items-center gap-1">
                        <span
                          className="material-symbols-outlined text-[14px]"
                          aria-hidden
                        >
                          tag
                        </span>
                        Ordem {r.ordem}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <span
                          className="material-symbols-outlined text-[14px]"
                          aria-hidden
                        >
                          sports_soccer
                        </span>
                        {nJogos} {nJogos === 1 ? "jogo" : "jogos"}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <span
                          className="material-symbols-outlined text-[14px]"
                          aria-hidden
                        >
                          schedule
                        </span>
                        {formatarPrazo(r.prazo_palpite)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <ToggleInvalidada id={r.id} invalidada={r.invalidada} />
                    <FormRodada trigger="editar" rodada={r} />
                    <BotaoExcluir id={r.id} nome={r.nome} />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
