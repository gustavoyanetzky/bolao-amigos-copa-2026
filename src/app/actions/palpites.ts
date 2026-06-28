"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { recalcularJogo } from "@/lib/recalcular";
import type { Palpite } from "@/lib/types";

/**
 * Server Actions de palpites (lancamento manual pelo admin + WO).
 *
 * Regras (thin client / fat server):
 * - Toda validacao acontece aqui (inteiros >= 0, IDs presentes).
 * - O registro de palpites e UPSERT sobre o UNIQUE (participante_id, jogo_id).
 * - Apos qualquer mutacao recalculamos os pontos/cravada do jogo via
 *   recalcularJogo (pontos sao DERIVADOS, nunca editados na mao).
 * - Sem linha (participante, jogo) = admin ainda nao registrou nada.
 */

/** Resultado padrao das actions (para feedback no client via useActionState). */
export type PalpiteState = { ok: true } | { ok: false; error: string };

/** Revalida as rotas afetadas por uma mutacao de palpite. */
function revalidarPalpites() {
  revalidatePath("/admin/palpites");
  revalidatePath("/");
  revalidatePath("/grade");
  revalidatePath("/resultados");
  revalidatePath("/jogo/[id]", "page");
}

/**
 * Converte um valor de placar vindo do form em inteiro >= 0.
 * Retorna null se invalido (vazio, NaN, negativo, nao inteiro).
 */
function parsePlacar(valor: FormDataEntryValue | null): number | null {
  if (valor === null) return null;
  const txt = String(valor).trim();
  if (txt === "") return null;
  const n = Number(txt);
  if (!Number.isInteger(n) || n < 0) return null;
  return n;
}

/**
 * Salva (UPSERT) o palpite de placar de um participante para um jogo.
 * wo = false; placares devem ser inteiros >= 0. Depois recalcula o jogo.
 */
export async function salvarPalpite(
  participanteId: string,
  jogoId: string,
  palpiteCasa: number,
  palpiteFora: number,
): Promise<PalpiteState> {
  if (!participanteId || !jogoId) {
    return { ok: false, error: "Participante e jogo são obrigatórios." };
  }
  if (
    !Number.isInteger(palpiteCasa) ||
    !Number.isInteger(palpiteFora) ||
    palpiteCasa < 0 ||
    palpiteFora < 0
  ) {
    return { ok: false, error: "Placares devem ser inteiros maiores ou iguais a 0." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("palpites").upsert(
    {
      participante_id: participanteId,
      jogo_id: jogoId,
      palpite_casa: palpiteCasa,
      palpite_fora: palpiteFora,
      wo: false,
    },
    { onConflict: "participante_id,jogo_id" },
  );

  if (error) {
    return { ok: false, error: "Não foi possível salvar o palpite." };
  }

  await recalcularJogo(supabase, jogoId);
  revalidarPalpites();
  return { ok: true };
}

/**
 * Marca WO (ausencia) de um participante num jogo: UPSERT com wo=true e
 * placares null. Depois recalcula o jogo (aplica pts_wo).
 */
export async function marcarWO(
  participanteId: string,
  jogoId: string,
): Promise<PalpiteState> {
  if (!participanteId || !jogoId) {
    return { ok: false, error: "Participante e jogo são obrigatórios." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("palpites").upsert(
    {
      participante_id: participanteId,
      jogo_id: jogoId,
      palpite_casa: null,
      palpite_fora: null,
      wo: true,
    },
    { onConflict: "participante_id,jogo_id" },
  );

  if (error) {
    return { ok: false, error: "Não foi possível marcar o WO." };
  }

  await recalcularJogo(supabase, jogoId);
  revalidarPalpites();
  return { ok: true };
}

/**
 * Remove o registro de um participante num jogo (volta ao estado "sem
 * palpite" = nao pontua e nao e WO). Depois recalcula o jogo.
 */
export async function limparPalpite(
  participanteId: string,
  jogoId: string,
): Promise<PalpiteState> {
  if (!participanteId || !jogoId) {
    return { ok: false, error: "Participante e jogo são obrigatórios." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("palpites")
    .delete()
    .eq("participante_id", participanteId)
    .eq("jogo_id", jogoId);

  if (error) {
    return { ok: false, error: "Não foi possível limpar o palpite." };
  }

  await recalcularJogo(supabase, jogoId);
  revalidarPalpites();
  return { ok: true };
}

/**
 * Atalho (modo "Por palpiteiro"): marca como WO os jogos da lista em que o
 * participante ainda NAO tem registro (palpite nem WO). Nunca sobrescreve quem
 * ja tem palpite. Recalcula cada jogo afetado. Helper manual — nunca automatico.
 */
export async function marcarFaltantesWOParticipante(
  participanteId: string,
  jogoIds: string[],
): Promise<PalpiteState> {
  if (!participanteId) {
    return { ok: false, error: "Participante é obrigatório." };
  }
  if (jogoIds.length === 0) {
    return { ok: true };
  }

  const supabase = await createClient();

  const { data: existentes, error: errPalp } = await supabase
    .from("palpites")
    .select("jogo_id")
    .eq("participante_id", participanteId)
    .in("jogo_id", jogoIds)
    .returns<Pick<Palpite, "jogo_id">[]>();
  if (errPalp) {
    return { ok: false, error: "Não foi possível carregar palpites existentes." };
  }

  const jaTem = new Set((existentes ?? []).map((p) => p.jogo_id));
  const faltantes = jogoIds.filter((id) => !jaTem.has(id));

  if (faltantes.length > 0) {
    const linhas = faltantes.map((jogoId) => ({
      participante_id: participanteId,
      jogo_id: jogoId,
      palpite_casa: null,
      palpite_fora: null,
      wo: true,
    }));
    const { error } = await supabase.from("palpites").insert(linhas);
    if (error) {
      return { ok: false, error: "Não foi possível marcar os faltantes como WO." };
    }
    for (const jogoId of faltantes) {
      await recalcularJogo(supabase, jogoId);
    }
  }

  revalidarPalpites();
  return { ok: true };
}

/**
 * Atalho: marca como WO todos os participantes que ainda NAO tem registro
 * (palpite nem WO) para o jogo. Nunca sobrescreve quem ja tem palpite.
 * Depois recalcula o jogo. Helper manual — nunca automatico.
 */
export async function marcarFaltantesWO(jogoId: string): Promise<PalpiteState> {
  if (!jogoId) {
    return { ok: false, error: "Jogo é obrigatório." };
  }

  const supabase = await createClient();

  const { data: participantes, error: errPart } = await supabase
    .from("participantes")
    .select("id")
    .returns<{ id: string }[]>();
  if (errPart) {
    return { ok: false, error: "Não foi possível carregar participantes." };
  }

  const { data: existentes, error: errPalp } = await supabase
    .from("palpites")
    .select("participante_id")
    .eq("jogo_id", jogoId)
    .returns<Pick<Palpite, "participante_id">[]>();
  if (errPalp) {
    return { ok: false, error: "Não foi possível carregar palpites existentes." };
  }

  const jaTem = new Set((existentes ?? []).map((p) => p.participante_id));
  const faltantes = (participantes ?? []).filter((p) => !jaTem.has(p.id));

  if (faltantes.length > 0) {
    const linhas = faltantes.map((p) => ({
      participante_id: p.id,
      jogo_id: jogoId,
      palpite_casa: null,
      palpite_fora: null,
      wo: true,
    }));
    const { error } = await supabase.from("palpites").insert(linhas);
    if (error) {
      return { ok: false, error: "Não foi possível marcar os faltantes como WO." };
    }
  }

  await recalcularJogo(supabase, jogoId);
  revalidarPalpites();
  return { ok: true };
}
