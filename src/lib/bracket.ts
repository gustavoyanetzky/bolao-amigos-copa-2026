import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Jogo } from "./types";

/**
 * Chaveamento do mata-mata (server-side).
 *
 * Cada jogo de mata-mata aponta (no schema) para o proximo jogo via
 * `avanca_para_jogo_id` + `avanca_para_slot` (casa/fora). As semifinais
 * tambem apontam o PERDEDOR para o jogo de 3o lugar (`perdedor_para_jogo_id`,
 * no mesmo slot do avanco). Ao encerrar um jogo, o codigo do time vencedor
 * (e do perdedor, nas semis) e propagado para o slot do jogo seguinte.
 *
 * Vencedor = placar; se empate, penaltis. Pontos dos palpites NAO mudam por
 * causa de penaltis (palpite e sobre o placar) — isso vive em pontuacao.ts.
 */

type JogoVencedor = Pick<
  Jogo,
  | "time_casa_cod"
  | "time_fora_cod"
  | "placar_casa"
  | "placar_fora"
  | "penaltis_casa"
  | "penaltis_fora"
  | "encerrado"
>;

/** Vencedor de um jogo de mata-mata. null se ainda indefinido. */
export function vencedorCod(j: JogoVencedor): string | null {
  if (!j.encerrado || j.placar_casa === null || j.placar_fora === null) {
    return null;
  }
  if (j.placar_casa > j.placar_fora) return j.time_casa_cod;
  if (j.placar_fora > j.placar_casa) return j.time_fora_cod;
  // Empate no tempo normal -> decide nos penaltis.
  if (j.penaltis_casa === null || j.penaltis_fora === null) return null;
  if (j.penaltis_casa > j.penaltis_fora) return j.time_casa_cod;
  if (j.penaltis_fora > j.penaltis_casa) return j.time_fora_cod;
  return null;
}

/** Perdedor: o outro time, quando o vencedor esta definido. */
export function perdedorCod(j: JogoVencedor): string | null {
  const v = vencedorCod(j);
  if (v === null) return null;
  return v === j.time_casa_cod ? j.time_fora_cod : j.time_casa_cod;
}

type JogoChave = JogoVencedor & {
  avanca_para_jogo_id: string | null;
  avanca_para_slot: "casa" | "fora" | null;
  perdedor_para_jogo_id: string | null;
};

const COLS_CHAVE =
  "time_casa_cod, time_fora_cod, placar_casa, placar_fora, penaltis_casa, penaltis_fora, encerrado, avanca_para_jogo_id, avanca_para_slot, perdedor_para_jogo_id";

/**
 * Propaga o resultado de um jogo de mata-mata para o(s) jogo(s) seguinte(s):
 * vencedor -> avanca_para; perdedor (semis) -> perdedor_para (3o lugar). Se o
 * vencedor ainda nao esta definido (ou foi desfeito), o slot adiante e limpo.
 *
 * Cascateia: ao trocar o time de um jogo seguinte, repropaga a partir dele —
 * mantem a consistencia se um resultado anterior for editado. `visitados`
 * impede reprocessar o mesmo jogo (o bracket e um DAG; guarda por seguranca).
 */
export async function propagarVencedor(
  supabase: SupabaseClient,
  jogoId: string,
  visitados: Set<string> = new Set(),
): Promise<void> {
  if (visitados.has(jogoId)) return;
  visitados.add(jogoId);

  const { data: j } = await supabase
    .from("jogos")
    .select(COLS_CHAVE)
    .eq("id", jogoId)
    .single<JogoChave>();
  if (!j || !j.avanca_para_slot) return;

  const slot = j.avanca_para_slot;
  if (j.avanca_para_jogo_id) {
    await aplicarSlot(supabase, j.avanca_para_jogo_id, slot, vencedorCod(j), visitados);
  }
  if (j.perdedor_para_jogo_id) {
    await aplicarSlot(supabase, j.perdedor_para_jogo_id, slot, perdedorCod(j), visitados);
  }
}

/** Escreve `cod` no slot do jogo alvo (so se mudou) e repropaga a partir dele. */
async function aplicarSlot(
  supabase: SupabaseClient,
  alvoId: string,
  slot: "casa" | "fora",
  cod: string | null,
  visitados: Set<string>,
): Promise<void> {
  const { data: alvo } = await supabase
    .from("jogos")
    .select("time_casa_cod, time_fora_cod")
    .eq("id", alvoId)
    .single<Pick<Jogo, "time_casa_cod" | "time_fora_cod">>();
  if (!alvo) return;

  const atual = slot === "casa" ? alvo.time_casa_cod : alvo.time_fora_cod;
  if (atual === cod) return;

  const patch =
    slot === "casa" ? { time_casa_cod: cod } : { time_fora_cod: cod };
  await supabase.from("jogos").update(patch).eq("id", alvoId);

  await propagarVencedor(supabase, alvoId, visitados);
}
