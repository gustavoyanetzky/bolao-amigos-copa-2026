import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  classificar,
  type LinhaRanking,
  type ParticipanteRanking,
  type PalpiteRanking,
} from "./ranking";
import { buscarTodos } from "./supabase/paginacao";

/**
 * Calcula o ranking ATUAL (mesma logica/desempate de classificar) a partir do
 * estado do banco. Usado p/ capturar a referencia do "movimento" do ranking
 * (snapshot). Reusa classificar() p/ as posicoes baterem com a home.
 */
export async function carregarRankingLive(
  supabase: SupabaseClient,
): Promise<LinhaRanking[]> {
  const [
    { data: config },
    { data: participantes },
    palpites,
    { data: jogos },
    { data: rodadas },
  ] = await Promise.all([
    supabase
      .from("config")
      .select("pts_campeao, campeao_real")
      .eq("id", 1)
      .single<{ pts_campeao: number; campeao_real: string | null }>(),
    supabase
      .from("participantes_publico")
      .select("id, nome, selecao_campea")
      .returns<ParticipanteRanking[]>(),
    buscarTodos<PalpiteRanking>((from, to) =>
      supabase
        .from("palpites")
        .select("participante_id, jogo_id, pontos, cravada, wo")
        .order("id", { ascending: true })
        .range(from, to),
    ),
    supabase
      .from("jogos")
      .select("id, invalidado, rodada_id")
      .returns<{ id: string; invalidado: boolean; rodada_id: string }[]>(),
    supabase
      .from("rodadas")
      .select("id, invalidada")
      .returns<{ id: string; invalidada: boolean }[]>(),
  ]);

  if (!config) return [];

  const rodadasInvalidadas = new Set(
    (rodadas ?? []).filter((r) => r.invalidada).map((r) => r.id),
  );
  const jogosInvalidadosIds = new Set<string>(
    (jogos ?? [])
      .filter((j) => j.invalidado || rodadasInvalidadas.has(j.rodada_id))
      .map((j) => j.id),
  );

  return classificar({
    participantes: participantes ?? [],
    palpites,
    jogosInvalidadosIds,
    config: { pts_campeao: config.pts_campeao },
    campeaoReal: config.campeao_real,
  });
}
