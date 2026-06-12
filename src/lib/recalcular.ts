import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { pontosDoPalpite } from "./pontuacao";
import type { Config, Jogo, Palpite, Rodada } from "./types";

/**
 * Recalculo de pontos dos palpites (server-side).
 * Pontos sao DERIVADOS — nunca editados na mao. Estas funcoes recomputam
 * `pontos`/`cravada` a partir de placar real x palpite, via pontosDoPalpite.
 *
 * Disparar quando: lancar/editar resultado, invalidar/revalidar jogo ou
 * rodada, ou editar a config de pontuacao (recalcularTudo).
 *
 * O client recebido ja carrega a sessao do admin (RLS autoriza a escrita).
 */

/** Recalcula os palpites de um unico jogo. */
export async function recalcularJogo(
  supabase: SupabaseClient,
  jogoId: string,
): Promise<void> {
  const { data: jogo } = await supabase
    .from("jogos")
    .select("*")
    .eq("id", jogoId)
    .single<Jogo>();
  if (!jogo) return;

  const { data: rodada } = await supabase
    .from("rodadas")
    .select("invalidada")
    .eq("id", jogo.rodada_id)
    .single<Pick<Rodada, "invalidada">>();

  const { data: config } = await supabase
    .from("config")
    .select("*")
    .eq("id", 1)
    .single<Config>();
  if (!config) return;

  const { data: palpites } = await supabase
    .from("palpites")
    .select("*")
    .eq("jogo_id", jogoId)
    .returns<Palpite[]>();

  const rodadaInfo = { invalidada: rodada?.invalidada ?? false };

  for (const pa of palpites ?? []) {
    const { pontos, cravada } = pontosDoPalpite(pa, jogo, rodadaInfo, config);
    if (pontos !== pa.pontos || cravada !== pa.cravada) {
      await supabase
        .from("palpites")
        .update({ pontos, cravada })
        .eq("id", pa.id);
    }
  }
}

/** Recalcula todos os palpites de todos os jogos de uma rodada. */
export async function recalcularRodada(
  supabase: SupabaseClient,
  rodadaId: string,
): Promise<void> {
  const { data: jogos } = await supabase
    .from("jogos")
    .select("id")
    .eq("rodada_id", rodadaId)
    .returns<Pick<Jogo, "id">[]>();
  for (const j of jogos ?? []) {
    await recalcularJogo(supabase, j.id);
  }
}

/** Recalcula o bolao inteiro (usar apos editar a config de pontuacao). */
export async function recalcularTudo(supabase: SupabaseClient): Promise<void> {
  const { data: jogos } = await supabase
    .from("jogos")
    .select("id")
    .returns<Pick<Jogo, "id">[]>();
  for (const j of jogos ?? []) {
    await recalcularJogo(supabase, j.id);
  }
}
