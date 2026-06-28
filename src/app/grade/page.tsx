/**
 * /grade — Grade de Palpites (publica, sem login).
 *
 * Matriz densa participante x jogo: 1a coluna fixa (sticky) com o nome do
 * participante + total geral de pontos; demais colunas = jogos da rodada
 * filtrada (?rodada=<id>, default = primeira por ordem). Cada celula mostra o
 * placar palpitado e os pontos do palpite, via <CelulaGrade>.
 *
 * Server Component: busca os dados PUBLICOS (anon / RLS) com createClient().
 * thin client / fat server — nenhuma logica sensivel aqui, so leitura e render.
 */

import LadoTime from "@/components/LadoTime";
import CelulaGrade, { type EstadoCelula } from "@/components/CelulaGrade";
import PublicBottomNav from "@/components/PublicBottomNav";
import PublicHeader from "@/components/PublicHeader";
import { createAnonClient } from "@/lib/supabase/anon";
import { buscarTodos } from "@/lib/supabase/paginacao";
import SeletorRodadas from "./SeletorRodadas";
import type {
  Config,
  Jogo,
  ParticipantePublico,
  Palpite,
  Rodada,
  Selecao,
} from "@/lib/types";
import Link from "next/link";

// Leitura publica (RLS). Sempre fresca: o cache ISR fazia palpites recem
// salvos pelo admin nao aparecerem (revalidatePath nao furava o cache de
// forma confiavel). Render dinamico garante que a grade reflita o DB.
export const dynamic = "force-dynamic";

/** Mapa codigo -> selecao, para resolver bandeiras/nomes nas colunas. */
function indexarSelecoes(selecoes: Selecao[]): Map<string, Selecao> {
  return new Map(selecoes.map((s) => [s.codigo, s]));
}

/** Horario abreviado (HH:MM) do jogo, em pt-BR. */
function formatarHora(dataHora: string): string {
  const d = new Date(dataHora);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}

/**
 * Decide o estado visual da celula a partir do palpite (ou ausencia) e do
 * contexto do jogo (invalidado). Ordem de precedencia conforme o prompt:
 * invalidado -> vazio -> wo -> cravada -> acerto/erro.
 */
function estadoCelula(
  palpite: Palpite | undefined,
  jogoInvalidado: boolean,
): EstadoCelula {
  if (jogoInvalidado) return "invalidado";
  if (!palpite) return "vazio";
  if (palpite.wo) return "wo";
  if (palpite.cravada) return "cravada";
  return palpite.pontos > 0 ? "acerto" : "erro";
}

export default async function GradePage({
  searchParams,
}: {
  searchParams: Promise<{ rodada?: string }>;
}) {
  const { rodada: rodadaParam } = await searchParams;
  const supabase = createAnonClient();

  // Dados base: rodadas (filtro), selecoes (colunas), participantes (linhas),
  // config (campeao real p/ futuro), e TODOS os palpites (p/ total geral).
  const [
    { data: rodadasData },
    { data: selecoesData },
    { data: participantesData },
    todosPalpites,
    { data: jogosDatasData },
  ] = await Promise.all([
    supabase
      .from("rodadas")
      .select("*")
      .order("ordem", { ascending: true })
      .order("created_at", { ascending: true })
      .returns<Rodada[]>(),
    supabase.from("selecoes").select("*").returns<Selecao[]>(),
    supabase
      .from("participantes_publico")
      .select("*")
      .order("nome", { ascending: true })
      .returns<ParticipantePublico[]>(),
    // Paginado: o Total geral soma TODOS os palpites (> 1000, teto do
    // PostgREST). Sem isso a grade vinha com celulas vazias e total errado.
    buscarTodos<Palpite>((from, to) =>
      supabase
        .from("palpites")
        .select("*")
        .order("id", { ascending: true })
        .range(from, to),
    ),
    // Datas de todos os jogos (leve) p/ achar a "rodada de hoje".
    supabase
      .from("jogos")
      .select("rodada_id, data_hora")
      .returns<{ rodada_id: string; data_hora: string }[]>(),
  ]);

  const rodadas = rodadasData ?? [];
  const selecoes = selecoesData ?? [];
  const participantes = participantesData ?? [];
  const porCodigo = indexarSelecoes(selecoes);

  // Rodada "atual": a primeira (em ordem) cujo ultimo jogo ainda nao passou.
  // Se a Copa ja acabou, cai na ultima rodada.
  const agora = Date.now();
  const ultimoJogoPorRodada = new Map<string, number>();
  for (const j of jogosDatasData ?? []) {
    const t = new Date(j.data_hora).getTime();
    const max = ultimoJogoPorRodada.get(j.rodada_id);
    if (max === undefined || t > max) ultimoJogoPorRodada.set(j.rodada_id, t);
  }
  const rodadaAtual =
    rodadas.find((r) => {
      const max = ultimoJogoPorRodada.get(r.id);
      return max !== undefined && max >= agora;
    }) ??
    rodadas[rodadas.length - 1] ??
    null;

  // Rodada selecionada: o query string (se valido); senao a rodada de hoje.
  const rodadaSelecionada =
    rodadas.find((r) => r.id === rodadaParam) ?? rodadaAtual ?? rodadas[0] ?? null;

  // Jogos da rodada filtrada (colunas da grade).
  let jogos: Jogo[] = [];
  if (rodadaSelecionada) {
    const { data: jogosData } = await supabase
      .from("jogos")
      .select("*")
      .eq("rodada_id", rodadaSelecionada.id)
      .order("data_hora", { ascending: true })
      .returns<Jogo[]>();
    jogos = jogosData ?? [];
  }

  // Total GERAL por participante (soma de pontos de todos os palpites; jogos
  // invalidados ja zeram pontos na apuracao do servidor).
  const totalPorParticipante = new Map<string, number>();
  for (const p of todosPalpites) {
    totalPorParticipante.set(
      p.participante_id,
      (totalPorParticipante.get(p.participante_id) ?? 0) + p.pontos,
    );
  }

  // Indice de palpite por (participante, jogo) — so dos jogos exibidos.
  const idsJogosExibidos = new Set(jogos.map((j) => j.id));
  const palpitePorChave = new Map<string, Palpite>();
  for (const p of todosPalpites) {
    if (idsJogosExibidos.has(p.jogo_id)) {
      palpitePorChave.set(`${p.participante_id}::${p.jogo_id}`, p);
    }
  }

  // Um jogo conta como invalidado se ele proprio OU sua rodada estao invalidados.
  const rodadaInvalidada = rodadaSelecionada?.invalidada ?? false;

  // Indicador de rodada (X de N) p/ o cabecalho do filtro.
  const idxRodada = rodadaSelecionada
    ? rodadas.findIndex((r) => r.id === rodadaSelecionada.id)
    : -1;
  const rodadaAnterior = idxRodada > 0 ? rodadas[idxRodada - 1] : null;
  const rodadaProxima =
    idxRodada >= 0 && idxRodada < rodadas.length - 1
      ? rodadas[idxRodada + 1]
      : null;

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-background">
      <PublicHeader />

      <main className="flex-1 w-full max-w-md mx-auto flex flex-col overflow-hidden pb-[calc(theme(spacing.bottom-nav-height)+1rem)]">
        {/* Seletor de rodada */}
        <div className="flex-none px-edge-margin py-3 bg-surface-container-low flex justify-between items-center border-b border-border">
          {rodadaAnterior ? (
            <Link
              href={`/grade?rodada=${rodadaAnterior.id}`}
              aria-label="Rodada anterior"
              className="text-text-secondary hover:text-primary transition-colors p-1"
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                chevron_left
              </span>
            </Link>
          ) : (
            <span className="w-9 p-1 text-disabled" aria-hidden="true">
              <span className="material-symbols-outlined">chevron_left</span>
            </span>
          )}

          <div className="flex flex-col items-center min-w-0 px-2">
            <span className="text-table-header font-table-header uppercase text-text-secondary tracking-widest">
              {rodadaSelecionada
                ? `Rodada ${idxRodada + 1} de ${rodadas.length}`
                : "Sem rodadas"}
            </span>
            <span className="text-body-lg font-headline-md text-on-surface truncate max-w-full">
              {rodadaSelecionada?.nome ?? "—"}
              {rodadaInvalidada ? " (invalidada)" : ""}
            </span>
          </div>

          {rodadaProxima ? (
            <Link
              href={`/grade?rodada=${rodadaProxima.id}`}
              aria-label="Proxima rodada"
              className="text-text-secondary hover:text-primary transition-colors p-1"
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                chevron_right
              </span>
            </Link>
          ) : (
            <span className="w-9 p-1 text-disabled" aria-hidden="true">
              <span className="material-symbols-outlined">chevron_right</span>
            </span>
          )}
        </div>

        {/* Chips rolaveis: pula direto pra qualquer rodada (• = rodada de hoje) */}
        <SeletorRodadas
          rodadas={rodadas.map((r) => ({ id: r.id, nome: r.nome }))}
          selecionadaId={rodadaSelecionada?.id ?? null}
          atualId={rodadaAtual?.id ?? null}
          basePath="/grade"
        />

        {/* Matriz densa: 1a coluna sticky, demais = jogos da rodada */}
        {participantes.length === 0 || jogos.length === 0 ? (
          <div className="flex-1 flex items-center justify-center px-edge-margin py-12 text-center">
            <p className="text-body-md text-text-secondary">
              {participantes.length === 0
                ? "Nenhum participante cadastrado ainda."
                : "Nenhum jogo nesta rodada."}
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-auto no-scrollbar relative w-full bg-background">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-max">
              <thead className="sticky top-0 z-30 bg-surface border-b border-border">
                <tr>
                  {/* Cabecalho da coluna fixa (participante) */}
                  <th className="sticky left-0 z-40 bg-surface px-edge-margin py-2 border-r border-border min-w-[120px] max-w-[150px] shadow-[2px_0_4px_-2px_rgba(0,0,0,0.5)]">
                    <span className="text-table-header font-table-header uppercase text-text-secondary block">
                      Participante
                    </span>
                    <span className="text-[10px] text-tertiary mt-0.5 block">
                      Total
                    </span>
                  </th>

                  {/* Cabecalhos dos jogos (clicaveis) */}
                  {jogos.map((jogo) => {
                    const casa = jogo.time_casa_cod
                      ? (porCodigo.get(jogo.time_casa_cod) ?? null)
                      : null;
                    const fora = jogo.time_fora_cod
                      ? (porCodigo.get(jogo.time_fora_cod) ?? null)
                      : null;
                    const placarReal =
                      jogo.placar_casa !== null && jogo.placar_fora !== null
                        ? `${jogo.placar_casa}-${jogo.placar_fora}`
                        : null;

                    return (
                      <th
                        key={jogo.id}
                        className="px-2 py-2 min-w-[84px] text-center border-r border-border/50"
                      >
                        <Link
                          href={`/jogo/${jogo.id}`}
                          className="flex flex-col items-center gap-1 group/col"
                        >
                          <span className="text-[10px] text-text-secondary">
                            {formatarHora(jogo.data_hora)}
                          </span>
                          <div className="flex items-center gap-1">
                            {casa ? (
                              <LadoTime selecao={casa} width={16} />
                            ) : (
                              <span className="text-table-header font-table-header text-text-secondary truncate max-w-[60px]">
                                {jogo.rotulo_casa ?? "A definir"}
                              </span>
                            )}
                            <span className="text-[9px] text-text-secondary">
                              x
                            </span>
                            {fora ? (
                              <LadoTime selecao={fora} width={16} />
                            ) : (
                              <span className="text-table-header font-table-header text-text-secondary truncate max-w-[60px]">
                                {jogo.rotulo_fora ?? "A definir"}
                              </span>
                            )}
                          </div>
                          <span
                            className={`text-[10px] font-bold px-1.5 rounded tabular-data ${
                              placarReal
                                ? "text-primary bg-primary-container"
                                : "text-text-secondary bg-surface-variant"
                            }`}
                          >
                            {placarReal ?? "? - ?"}
                          </span>
                        </Link>
                      </th>
                    );
                  })}

                  {/* Padding final do scroll */}
                  <th className="w-4 px-2" aria-hidden="true" />
                </tr>
              </thead>

              <tbody className="text-data-cell font-data-cell">
                {participantes.map((part, i) => {
                  const zebra = i % 2 === 0 ? "bg-surface" : "bg-zebra";
                  const total = totalPorParticipante.get(part.id) ?? 0;

                  return (
                    <tr
                      key={part.id}
                      className={`h-row-height-dense ${zebra} border-b border-border/30 hover:bg-surface-variant transition-colors group`}
                    >
                      {/* Coluna fixa: nome + total geral */}
                      <td
                        className={`sticky left-0 z-20 ${zebra} group-hover:bg-surface-variant transition-colors px-edge-margin border-r border-border shadow-[2px_0_4px_-2px_rgba(0,0,0,0.5)]`}
                      >
                        <div className="flex flex-col justify-center h-full min-w-[120px] max-w-[150px]">
                          <span className="truncate font-semibold text-on-surface">
                            {part.nome}
                          </span>
                          <span className="text-[11px] text-tertiary tabular-data">
                            {total} pts
                          </span>
                        </div>
                      </td>

                      {/* Celulas dos jogos */}
                      {jogos.map((jogo) => {
                        const palpite = palpitePorChave.get(
                          `${part.id}::${jogo.id}`,
                        );
                        const invalidado = rodadaInvalidada || jogo.invalidado;
                        const estado = estadoCelula(palpite, invalidado);

                        return (
                          <td
                            key={jogo.id}
                            className="text-center px-2 border-r border-border/20 relative"
                          >
                            <CelulaGrade
                              estado={estado}
                              casa={palpite?.palpite_casa}
                              fora={palpite?.palpite_fora}
                              pontos={palpite?.pontos}
                            />
                          </td>
                        );
                      })}

                      <td className="w-4 px-2" aria-hidden="true" />
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <PublicBottomNav />
    </div>
  );
}
