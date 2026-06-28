/**
 * /jogo/[id] — detalhe de um jogo (tela publica, sem login).
 *
 * Server Component async: busca o jogo (por id), as duas selecoes (bandeiras),
 * a rodada (p/ saber invalidacao), os palpites do jogo e os participantes
 * (via VIEW participantes_publico — nunca a tabela crua). Tudo com o cliente
 * anon de '@/lib/supabase/server' (RLS publico).
 *
 * thin client / fat server: a pagina so renderiza dados ja carregados/ordenados.
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import Badge from "@/components/Badge";
import Bandeira from "@/components/Bandeira";
import Icon from "@/components/Icon";
import PublicBottomNav from "@/components/PublicBottomNav";
import PublicHeader from "@/components/PublicHeader";
import { createAnonClient } from "@/lib/supabase/anon";
import type {
  Fase,
  Jogo,
  Palpite,
  ParticipantePublico,
  Rodada,
  Selecao,
} from "@/lib/types";

// Leitura publica (RLS). Sempre fresca: o cache ISR fazia mudancas recem
// salvas pelo admin nao aparecerem. Render dinamico garante reflexo do DB.
export const dynamic = "force-dynamic";

const ROTULO_FASE: Record<Fase, string> = {
  grupos: "Fase de grupos",
  "16avos": "16-avos de final",
  oitavas: "Oitavas de final",
  quartas: "Quartas de final",
  semi: "Semifinal",
  terceiro: "Disputa de 3º lugar",
  final: "Final",
};

/** Formata "11/06 20:00" a partir do timestamp ISO (timezone Sao Paulo). */
function formatarDataHora(iso: string): string {
  const d = new Date(iso);
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
  return `${data} ${hora}`;
}

/** Linha de palpite ja preparada p/ render (resolve nome, ordena). */
interface LinhaPalpite {
  id: string;
  nome: string;
  wo: boolean;
  cravada: boolean;
  pontos: number;
  palpiteCasa: number | null;
  palpiteFora: number | null;
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAnonClient();

  // Jogo: se nao existe, 404.
  const { data: jogo } = await supabase
    .from("jogos")
    .select("*")
    .eq("id", id)
    .maybeSingle<Jogo>();

  if (!jogo) notFound();

  // Demais dados em paralelo: selecoes dos 2 times, rodada, palpites, nomes.
  const [
    { data: selecoesData },
    { data: rodadaData },
    { data: palpitesData },
    { data: participantesData },
  ] = await Promise.all([
    supabase
      .from("selecoes")
      .select("*")
      .in(
        "codigo",
        [jogo.time_casa_cod, jogo.time_fora_cod].filter(
          (c): c is string => c !== null,
        ),
      )
      .returns<Selecao[]>(),
    supabase
      .from("rodadas")
      .select("*")
      .eq("id", jogo.rodada_id)
      .maybeSingle<Rodada>(),
    supabase
      .from("palpites")
      .select("*")
      .eq("jogo_id", id)
      .returns<Palpite[]>(),
    supabase
      .from("participantes_publico")
      .select("*")
      .returns<ParticipantePublico[]>(),
  ]);

  const selecoes = selecoesData ?? [];
  const casa = selecoes.find((s) => s.codigo === jogo.time_casa_cod) ?? null;
  const fora = selecoes.find((s) => s.codigo === jogo.time_fora_cod) ?? null;

  // Invalidado se o proprio jogo OU a rodada estiverem anulados.
  const invalidado = jogo.invalidado || (rodadaData?.invalidada ?? false);

  const nomePorId = new Map(
    (participantesData ?? []).map((p) => [p.id, p.nome]),
  );

  // Monta + ordena: pontos desc, depois nome (pt-BR).
  const palpites: LinhaPalpite[] = (palpitesData ?? [])
    .map((p) => ({
      id: p.id,
      nome: nomePorId.get(p.participante_id) ?? "—",
      wo: p.wo,
      cravada: p.cravada,
      pontos: p.pontos,
      palpiteCasa: p.palpite_casa,
      palpiteFora: p.palpite_fora,
    }))
    .sort((a, b) => {
      if (a.pontos !== b.pontos) return b.pontos - a.pontos;
      return a.nome.localeCompare(b.nome, "pt-BR");
    });

  const nomeCasa = casa?.nome ?? jogo.rotulo_casa ?? "A definir";
  const nomeFora = fora?.nome ?? jogo.rotulo_fora ?? "A definir";
  const rotuloFase = jogo.fase ? ROTULO_FASE[jogo.fase] : null;
  const dataHora = formatarDataHora(jogo.data_hora);

  // Subtitulo: fase + grupo + data.
  const partesSubtitulo = [
    rotuloFase,
    jogo.grupo ? `Grupo ${jogo.grupo}` : null,
    dataHora,
  ].filter(Boolean) as string[];

  return (
    <div className="min-h-screen w-full max-w-md mx-auto bg-background flex flex-col">
      <PublicHeader />

      <main className="flex-1 w-full pb-[calc(theme(spacing.bottom-nav-height)+1rem)]">
        {/* Voltar */}
        <div className="px-edge-margin pt-3">
          <Link
            href="/resultados"
            className="inline-flex items-center gap-1 text-label-sm font-label-sm text-text-secondary hover:text-primary transition-colors -ml-1"
          >
            <Icon name="arrow_back" size={18} />
            Resultados
          </Link>
        </div>

        {/* Cabecalho do jogo */}
        <section className="bg-surface border-y border-border mt-3 p-4 flex flex-col items-center gap-3">
          <div className="text-label-sm font-label-sm text-text-secondary uppercase tracking-wider text-center">
            {partesSubtitulo.join(" • ")}
          </div>

          <div className="flex items-center justify-between w-full max-w-[300px]">
            {/* Casa */}
            <div className="flex flex-col items-center gap-2 w-24 min-w-0">
              {casa ? (
                <Bandeira
                  iso2={casa.iso2}
                  nome={nomeCasa}
                  width={48}
                  height={36}
                  className="border-2 border-border"
                />
              ) : null}
              <span
                className={`text-body-lg font-body-lg text-center leading-tight truncate w-full ${
                  casa ? "text-text-primary" : "text-text-secondary"
                }`}
              >
                {nomeCasa}
              </span>
            </div>

            {/* Placar / horario */}
            <div className="flex flex-col items-center gap-1 shrink-0 px-2">
              {jogo.encerrado ? (
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-headline-lg text-primary tabular-nums">
                    {jogo.placar_casa ?? 0}
                  </span>
                  <span className="text-text-secondary font-bold">-</span>
                  <span className="text-3xl font-headline-lg text-primary tabular-nums">
                    {jogo.placar_fora ?? 0}
                  </span>
                </div>
              ) : (
                <>
                  <span className="text-headline-md font-headline-md text-primary">
                    {dataHora.split(" ")[1]}
                  </span>
                  <span className="text-label-sm font-label-sm text-text-secondary uppercase tracking-wide">
                    A realizar
                  </span>
                </>
              )}
            </div>

            {/* Fora */}
            <div className="flex flex-col items-center gap-2 w-24 min-w-0">
              {fora ? (
                <Bandeira
                  iso2={fora.iso2}
                  nome={nomeFora}
                  width={48}
                  height={36}
                  className="border-2 border-border"
                />
              ) : null}
              <span
                className={`text-body-lg font-body-lg text-center leading-tight truncate w-full ${
                  fora ? "text-text-primary" : "text-text-secondary"
                }`}
              >
                {nomeFora}
              </span>
            </div>
          </div>

          {/* Selos de estado */}
          {(jogo.classico || invalidado) && (
            <div className="flex items-center gap-2">
              {jogo.classico && <Badge variante="classico" />}
              {invalidado && <Badge variante="invalidado" />}
            </div>
          )}
        </section>

        {/* Lista de palpites */}
        <section className="mt-4 px-edge-margin">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-headline-md font-headline-md text-primary">
              Palpites ({palpites.length})
            </h2>
            <span className="text-label-sm font-label-sm text-text-secondary">
              Ordenado por Pts
            </span>
          </div>

          {palpites.length === 0 ? (
            <p className="rounded-xl border border-border bg-surface p-4 text-center text-body-md text-text-secondary">
              Nenhum palpite registrado para este jogo.
            </p>
          ) : (
            <div className="bg-surface rounded-xl border border-border overflow-hidden">
              {/* Cabecalho da tabela */}
              <div className="flex items-center px-4 h-10 border-b border-border bg-surface-container-high text-table-header font-table-header text-text-secondary">
                <div className="flex-1">PARTICIPANTE</div>
                <div className="w-20 text-center">PALPITE</div>
                <div className="w-12 text-right">PTS</div>
              </div>

              {/* Corpo */}
              <div className="flex flex-col">
                {palpites.map((p, i) => {
                  const zebra = i % 2 === 1;
                  return (
                    <div
                      key={p.id}
                      className={`flex items-center px-4 h-row-height-dense border-b border-border last:border-b-0 transition-colors hover:bg-surface-variant ${
                        zebra ? "bg-zebra" : "bg-surface"
                      }`}
                    >
                      {/* Nome */}
                      <div
                        className={`flex-1 text-data-cell font-data-cell text-text-primary truncate pr-2 ${
                          p.wo ? "opacity-50" : ""
                        }`}
                      >
                        {p.nome}
                      </div>

                      {/* Palpite */}
                      <div className="w-20 flex justify-center">
                        {p.wo ? (
                          <Badge variante="wo" className="rounded">
                            WO
                          </Badge>
                        ) : (
                          <span
                            className={`px-2 py-0.5 rounded text-data-cell font-data-cell ${
                              p.cravada
                                ? "bg-success-emerald text-white"
                                : "bg-surface-container text-text-secondary"
                            }`}
                          >
                            {p.palpiteCasa ?? 0}x{p.palpiteFora ?? 0}
                          </span>
                        )}
                      </div>

                      {/* Pontos */}
                      <div
                        className={`w-12 text-right font-bold text-data-cell ${
                          p.wo
                            ? "text-error-red"
                            : p.cravada
                              ? "text-success-emerald"
                              : p.pontos > 0
                                ? "text-tertiary"
                                : "text-text-secondary"
                        }`}
                      >
                        {p.wo
                          ? p.pontos
                          : p.pontos > 0
                            ? `+${p.pontos}`
                            : p.pontos}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </main>

      <PublicBottomNav />
    </div>
  );
}
