// /resultados — jogos agrupados por rodada (na ordem da rodada).
// Cada jogo e um card clicavel -> /jogo/[id] (detalhe dos palpites).
// Server Component publico: le 'rodadas', 'jogos' e 'selecoes' (anon, RLS publico).

import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import PublicBottomNav from "@/components/PublicBottomNav";
import Bandeira from "@/components/Bandeira";
import Badge from "@/components/Badge";
import Icon from "@/components/Icon";
import { createClient } from "@/lib/supabase/server";
import type { Jogo, Rodada, Selecao } from "@/lib/types";

// Sempre dados frescos (placares/encerrado mudam no admin).
export const dynamic = "force-dynamic";

// Formata "2026-06-11..." em "11/06" (data curta, pt-BR).
function formatarPrazo(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  }).format(d);
}

// Formata horario "HH:mm" (pt-BR) a partir do data_hora do jogo.
function formatarHora(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "--:--";
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export default async function ResultadosPage() {
  const supabase = await createClient();

  const [rodadasRes, jogosRes, selecoesRes] = await Promise.all([
    supabase
      .from("rodadas")
      .select("id, nome, ordem, prazo_palpite, invalidada, created_at")
      .order("ordem", { ascending: true }),
    supabase
      .from("jogos")
      .select(
        "id, rodada_id, fase, grupo, time_casa_cod, time_fora_cod, classico, invalidado, data_hora, placar_casa, placar_fora, encerrado, created_at",
      )
      .order("data_hora", { ascending: true }),
    supabase.from("selecoes").select("codigo, nome, iso2, emoji"),
  ]);

  const rodadas: Rodada[] = rodadasRes.data ?? [];
  const jogos: Jogo[] = jogosRes.data ?? [];
  const selecoes: Selecao[] = selecoesRes.data ?? [];

  // Indexa selecoes por codigo FIFA p/ nome + bandeira.
  const selecaoPorCodigo = new Map<string, Selecao>();
  for (const s of selecoes) selecaoPorCodigo.set(s.codigo, s);

  // Agrupa jogos por rodada (preservando a ordem por data_hora dentro da rodada).
  const jogosPorRodada = new Map<string, Jogo[]>();
  for (const j of jogos) {
    const lista = jogosPorRodada.get(j.rodada_id);
    if (lista) lista.push(j);
    else jogosPorRodada.set(j.rodada_id, [j]);
  }

  return (
    <>
      <PublicHeader />

      <main className="flex-1 overflow-y-auto no-scrollbar pb-[calc(var(--spacing-bottom-nav-height)+1rem)]">
        {rodadas.length === 0 ? (
          <p className="text-body-md text-text-secondary text-center p-edge-margin mt-8">
            Nenhuma rodada cadastrada ainda.
          </p>
        ) : (
          rodadas.map((rodada) => {
            const jogosDaRodada = jogosPorRodada.get(rodada.id) ?? [];
            const prazo = rodada.prazo_palpite
              ? formatarPrazo(rodada.prazo_palpite)
              : null;

            return (
              <section key={rodada.id}>
                {/* Cabecalho de rodada (sticky) */}
                <div className="sticky top-0 z-40 bg-surface-container/95 backdrop-blur-sm border-b border-border px-edge-margin py-1.5 flex items-center justify-between shadow-sm">
                  <h2 className="text-table-header font-table-header text-text-secondary uppercase tracking-wider truncate">
                    {rodada.nome}
                    {prazo ? ` — ${prazo}` : ""}
                  </h2>
                  <span className="text-label-sm font-label-sm text-outline shrink-0 pl-2">
                    {jogosDaRodada.length}{" "}
                    {jogosDaRodada.length === 1 ? "jogo" : "jogos"}
                  </span>
                </div>

                {/* Lista de jogos */}
                {jogosDaRodada.length === 0 ? (
                  <p className="text-label-sm text-text-secondary px-edge-margin py-3">
                    Sem jogos nesta rodada.
                  </p>
                ) : (
                  <div className="flex flex-col gap-gutter-table p-gutter-table">
                    {jogosDaRodada.map((jogo) => {
                      const casa = selecaoPorCodigo.get(jogo.time_casa_cod);
                      const fora = selecaoPorCodigo.get(jogo.time_fora_cod);
                      const invalidado =
                        jogo.invalidado || rodada.invalidada;

                      return (
                        <Link
                          key={jogo.id}
                          href={`/jogo/${jogo.id}`}
                          className="w-full text-left bg-surface border border-border rounded-lg p-4 relative flex flex-col gap-3 hover:bg-surface-variant transition-colors duration-200 active:scale-[0.99] group"
                        >
                          {/* Linha de status */}
                          <div className="flex justify-between items-center w-full gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-label-sm font-label-sm text-text-secondary group-hover:text-primary transition-colors truncate">
                                {jogo.grupo
                                  ? `Grupo ${jogo.grupo}`
                                  : jogo.fase ?? "Jogo"}
                              </span>
                              {jogo.classico ? (
                                <Badge variante="classico" />
                              ) : null}
                              {invalidado ? (
                                <Badge variante="invalidado" />
                              ) : null}
                            </div>

                            {/* Pill de status */}
                            {jogo.encerrado ? (
                              <div className="bg-success-emerald/10 border border-success-emerald/30 text-success-emerald text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide flex items-center gap-1 shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-success-emerald" />
                                Encerrado
                              </div>
                            ) : (
                              <div className="bg-surface-variant border border-outline-variant text-text-secondary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide flex items-center gap-1 shrink-0">
                                <Icon name="schedule" size={10} />
                                Aberto
                              </div>
                            )}
                          </div>

                          {/* Linha de placar */}
                          <div className="flex justify-between items-center w-full px-2">
                            {/* Time casa */}
                            <div className="flex flex-col items-center gap-1 w-20">
                              <Bandeira
                                iso2={casa?.iso2 ?? null}
                                nome={casa?.nome ?? jogo.time_casa_cod}
                                width={20}
                              />
                              <span className="text-data-cell font-data-cell text-on-surface truncate w-full text-center">
                                {jogo.time_casa_cod}
                              </span>
                            </div>

                            {/* Caixa central: placar (encerrado) ou horario */}
                            {jogo.encerrado ? (
                              <div className="bg-surface-container-high border border-border rounded-lg flex items-center justify-center px-6 py-2 shadow-inner">
                                <span className="text-headline-lg font-headline-lg text-brand-cream tabular-data tracking-widest">
                                  {jogo.placar_casa ?? 0} - {jogo.placar_fora ?? 0}
                                </span>
                              </div>
                            ) : (
                              <div className="bg-surface-container border border-border rounded-lg flex flex-col items-center justify-center px-4 py-1.5">
                                <span className="text-headline-md font-headline-md text-text-secondary tabular-data">
                                  {formatarHora(jogo.data_hora)}
                                </span>
                                <span className="text-[10px] font-medium text-outline">
                                  {formatarPrazo(jogo.data_hora)}
                                </span>
                              </div>
                            )}

                            {/* Time fora */}
                            <div className="flex flex-col items-center gap-1 w-20">
                              <Bandeira
                                iso2={fora?.iso2 ?? null}
                                nome={fora?.nome ?? jogo.time_fora_cod}
                                width={20}
                              />
                              <span className="text-data-cell font-data-cell text-on-surface truncate w-full text-center">
                                {jogo.time_fora_cod}
                              </span>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })
        )}
      </main>

      <PublicBottomNav />
    </>
  );
}
