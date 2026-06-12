// Tela CLASSIFICACAO (home publica "/").
// Server Component async: busca dados publicos via createClient() (anon, RLS),
// computa o ranking com a lib pura classificar()/premiacao() e renderiza a
// tabela densa conforme mockup 01-classificacao-home.html.

import Bandeira from "@/components/Bandeira";
import CardPremiacao from "@/components/CardPremiacao";
import MedalhaPos from "@/components/MedalhaPos";
import PublicBottomNav from "@/components/PublicBottomNav";
import PublicHeader from "@/components/PublicHeader";
import {
  classificar,
  premiacao,
  type PalpiteRanking,
  type ParticipanteRanking,
} from "@/lib/ranking";
import { createAnonClient } from "@/lib/supabase/anon";
import type { Config, ParticipantePublico, Selecao } from "@/lib/types";

// Leitura publica (RLS): cacheavel via ISR, revalidada on-demand pelas actions.
export const revalidate = 60;

export default async function Home() {
  const supabase = createAnonClient();

  // Carrega os dados publicos em paralelo (anon le so o que o RLS libera).
  const [
    { data: config },
    { data: participantes },
    { data: palpites },
    { data: jogos },
    { data: rodadas },
    { data: selecoes },
  ] = await Promise.all([
    supabase
      .from("config")
      .select(
        "pts_campeao, campeao_real, pct_1, pct_2, pct_3, valor_cota, prazo_campeao",
      )
      .eq("id", 1)
      .single<Pick<
        Config,
        | "pts_campeao"
        | "campeao_real"
        | "pct_1"
        | "pct_2"
        | "pct_3"
        | "valor_cota"
        | "prazo_campeao"
      >>(),
    supabase
      .from("participantes_publico")
      .select("id, nome, selecao_campea")
      .returns<ParticipantePublico[]>(),
    supabase
      .from("palpites")
      .select("participante_id, jogo_id, pontos, cravada, wo")
      .returns<PalpiteRanking[]>(),
    supabase
      .from("jogos")
      .select("id, invalidado, rodada_id")
      .returns<{ id: string; invalidado: boolean; rodada_id: string }[]>(),
    supabase
      .from("rodadas")
      .select("id, invalidada")
      .returns<{ id: string; invalidada: boolean }[]>(),
    supabase
      .from("selecoes")
      .select("codigo, nome, iso2, emoji")
      .returns<Selecao[]>(),
  ]);

  // Sem config nao ha como ranquear — exibe estado vazio defensivo.
  if (!config) {
    return (
      <>
        <PublicHeader atualizado="agora" />
        <main className="flex-1 flex flex-col items-center justify-center gap-3 p-edge-margin text-center pb-[calc(theme(spacing.bottom-nav-height)+1rem)]">
          <p className="text-body-md text-text-secondary">
            Classificação indisponível no momento.
          </p>
        </main>
        <PublicBottomNav />
      </>
    );
  }

  // Conjunto de jogos invalidados: jogo.invalidado OU rodada do jogo invalidada.
  const rodadasInvalidadas = new Set(
    (rodadas ?? []).filter((r) => r.invalidada).map((r) => r.id),
  );
  const jogosInvalidadosIds = new Set<string>(
    (jogos ?? [])
      .filter((j) => j.invalidado || rodadasInvalidadas.has(j.rodada_id))
      .map((j) => j.id),
  );

  // Mapa codigo FIFA -> selecao (p/ bandeira do campeao palpitado).
  const selecaoPorCodigo = new Map<string, Selecao>(
    (selecoes ?? []).map((s) => [s.codigo, s]),
  );

  const participantesRanking: ParticipanteRanking[] = (participantes ?? []).map(
    (p) => ({ id: p.id, nome: p.nome, selecao_campea: p.selecao_campea }),
  );

  // Ranking ordenado e desempatado (logica pura no servidor).
  const linhas = classificar({
    participantes: participantesRanking,
    palpites: palpites ?? [],
    jogosInvalidadosIds,
    config: { pts_campeao: config.pts_campeao },
    campeaoReal: config.campeao_real,
  });

  // Premiacao publica: so percentuais (pago e privado -> pagosCount 0,
  // valorCota null deixa premios ocultos).
  const prem = premiacao({
    pagosCount: 0,
    valorCota: config.valor_cota ?? null,
    pct1: config.pct_1,
    pct2: config.pct_2,
    pct3: config.pct_3,
  });

  // Quantidade de palpites (J) por participante.
  const jogosPorParticipante = new Map<string, number>();
  for (const pp of palpites ?? []) {
    jogosPorParticipante.set(
      pp.participante_id,
      (jogosPorParticipante.get(pp.participante_id) ?? 0) + 1,
    );
  }

  // So revela a selecao campea palpitada apos o prazo do campeao.
  const prazoPassou =
    config.prazo_campeao != null &&
    new Date(config.prazo_campeao).getTime() <= Date.now();

  // selecao_campea palpitada por participante (p/ bandeira pos-prazo).
  const campeaPorParticipante = new Map<string, string | null>(
    (participantes ?? []).map((p) => [p.id, p.selecao_campea]),
  );

  return (
    <>
      <PublicHeader atualizado="agora" />
      <main className="flex-1 flex flex-col gap-4 p-edge-margin overflow-y-auto pb-[calc(theme(spacing.bottom-nav-height)+1rem)]">
        <CardPremiacao
          pct1={prem.percentuais[0]}
          pct2={prem.percentuais[1]}
          pct3={prem.percentuais[2]}
        />

        {/* Tabela de classificacao densa */}
        <section className="bg-surface rounded-xl border border-border flex flex-col overflow-hidden">
          {/* Header sticky */}
          <div className="grid grid-cols-[32px_1fr_40px] items-center px-3 py-2 bg-surface-container-high border-b border-border sticky top-0 z-10">
            <div className="text-table-header font-table-header text-text-secondary text-center">
              POS
            </div>
            <div className="text-table-header font-table-header text-text-secondary pl-2">
              PARTICIPANTE
            </div>
            <div className="text-table-header font-table-header text-brand-cream text-right pr-1">
              PTS
            </div>
          </div>

          {/* Corpo zebrado */}
          <div className="flex flex-col w-full divide-y divide-border">
            {linhas.length === 0 ? (
              <div className="px-3 py-6 text-center text-body-md text-text-secondary">
                Nenhum participante ainda.
              </div>
            ) : (
              linhas.map((linha, i) => {
                const fundo = i % 2 === 0 ? "bg-surface" : "bg-zebra";
                const topo3 = linha.posicao <= 3;
                const jogosFeitos = jogosPorParticipante.get(linha.id) ?? 0;
                const semPalpites = jogosFeitos === 0;

                // Bandeira do campeao palpitado (so apos prazo).
                const codCampea = campeaPorParticipante.get(linha.id) ?? null;
                const selCampea = codCampea
                  ? selecaoPorCodigo.get(codCampea)
                  : undefined;

                return (
                  <div
                    key={linha.id}
                    className={`grid grid-cols-[32px_1fr_40px] items-center px-3 py-3 ${fundo} hover:bg-surface-variant transition-colors duration-150`}
                  >
                    {/* Posicao / medalha */}
                    <MedalhaPos posicao={linha.posicao} />

                    {/* Participante + sublinha de stats */}
                    <div className="flex flex-col pl-2 min-w-0">
                      <span className="flex items-center gap-1.5 min-w-0">
                        {prazoPassou && selCampea ? (
                          <Bandeira
                            iso2={selCampea.iso2}
                            nome={selCampea.nome}
                            width={18}
                          />
                        ) : null}
                        <span
                          className={`text-body-md font-body-md truncate text-text-primary ${
                            topo3 ? "font-bold" : "font-medium"
                          } ${semPalpites ? "opacity-50" : ""}`}
                        >
                          {linha.nome}
                        </span>
                      </span>
                      <div className="flex items-center text-[10px] text-text-secondary gap-2 mt-0.5 tabular-data">
                        <span>J {jogosFeitos}</span>
                        <span className="w-1 h-1 rounded-full bg-border" />
                        <span
                          className={
                            linha.cravadas > 0 ? "text-success-emerald" : ""
                          }
                        >
                          Cr {linha.cravadas}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-border" />
                        <span
                          className={linha.wo > 0 ? "text-error-red" : ""}
                        >
                          WO {linha.wo}
                        </span>
                      </div>
                    </div>

                    {/* Pontos */}
                    <div className="text-right flex items-center justify-end pr-1">
                      <span
                        className={`tabular-data ${
                          topo3
                            ? "text-headline-md font-headline-md text-brand-cream"
                            : "text-body-lg font-body-lg text-brand-cream opacity-90"
                        }`}
                      >
                        {linha.total}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>
      <PublicBottomNav />
    </>
  );
}
