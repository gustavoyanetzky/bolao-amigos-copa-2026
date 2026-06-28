import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { carregarRankingLive } from "./ranking-live";

/**
 * Movimento do ranking (setas subiu/caiu na home).
 *
 * Referencia = posicoes no FIM DO DIA ANTERIOR. A tabela ranking_snapshot
 * guarda essa referencia. Ela e atualizada de forma preguicosa: no PRIMEIRO
 * resultado de cada dia (horario de Brasilia), antes de aplicar o resultado,
 * congelamos as posicoes atuais (= fim do dia anterior) como nova referencia.
 * Assim, ao longo do dia, o movimento exibido = referencia - posicao atual.
 */

/** Dia-calendario em Brasilia (YYYY-MM-DD) de um instante. */
function diaBrasilia(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/**
 * Se a referencia ainda nao foi capturada HOJE (Brasilia), congela as posicoes
 * atuais como nova referencia. Deve ser chamada ANTES de aplicar um resultado
 * novo, p/ a referencia refletir o fim do dia anterior.
 */
export async function atualizarSnapshotSeNovoDia(
  supabase: SupabaseClient,
): Promise<void> {
  const { data: ultimo } = await supabase
    .from("ranking_snapshot")
    .select("capturado_em")
    .order("capturado_em", { ascending: false })
    .limit(1)
    .maybeSingle<{ capturado_em: string }>();

  const hoje = diaBrasilia(new Date());
  if (ultimo && diaBrasilia(new Date(ultimo.capturado_em)) === hoje) {
    return; // ja temos referencia de hoje
  }

  const linhas = await carregarRankingLive(supabase);
  if (linhas.length === 0) return;

  const agora = new Date().toISOString();
  const rows = linhas.map((l) => ({
    participante_id: l.id,
    posicao: l.posicao,
    capturado_em: agora,
  }));

  await supabase
    .from("ranking_snapshot")
    .upsert(rows, { onConflict: "participante_id" });
}
