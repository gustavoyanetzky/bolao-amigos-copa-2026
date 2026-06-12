"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { recalcularRodada } from "@/lib/recalcular";

/**
 * Server Actions de rodadas (CRUD + invalidar).
 * Padrao thin client / fat server: toda validacao acontece aqui.
 * Pontos sao derivados — ao alternar `invalidada`, recalculamos os palpites
 * de todos os jogos da rodada via recalcularRodada (apos persistir o flag).
 *
 * O client server-side ja carrega a sessao do admin (RLS autoriza a escrita).
 */

export type RodadaState = { error: string } | { ok: true } | undefined;

/** Normaliza prazo_palpite vindo de <input type="datetime-local"> ("" -> null). */
function parsePrazo(valor: FormDataEntryValue | null): string | null {
  const s = String(valor ?? "").trim();
  return s === "" ? null : s;
}

/** Le e valida `nome` (obrigatorio, nao vazio). */
function parseNome(valor: FormDataEntryValue | null): string | null {
  const s = String(valor ?? "").trim();
  return s === "" ? null : s;
}

/** Le e valida `ordem` (inteiro >= 0). Retorna null se invalido. */
function parseOrdem(valor: FormDataEntryValue | null): number | null {
  const s = String(valor ?? "").trim();
  if (s === "") return 0;
  const n = Number(s);
  if (!Number.isInteger(n) || n < 0) return null;
  return n;
}

function revalidar() {
  revalidatePath("/admin/rodadas");
  revalidatePath("/");
}

/** Cria uma nova rodada. */
export async function criarRodada(
  _prevState: RodadaState,
  formData: FormData,
): Promise<RodadaState> {
  const nome = parseNome(formData.get("nome"));
  if (!nome) return { error: "Informe o nome da rodada." };

  const ordem = parseOrdem(formData.get("ordem"));
  if (ordem === null) return { error: "Ordem deve ser um inteiro >= 0." };

  const prazo_palpite = parsePrazo(formData.get("prazo_palpite"));

  const supabase = await createClient();
  const { error } = await supabase
    .from("rodadas")
    .insert({ nome, ordem, prazo_palpite, invalidada: false });

  if (error) return { error: "Nao foi possivel criar a rodada." };

  revalidar();
  return { ok: true };
}

/** Atualiza nome / ordem / prazo de uma rodada. */
export async function atualizarRodada(
  _prevState: RodadaState,
  formData: FormData,
): Promise<RodadaState> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "Rodada invalida." };

  const nome = parseNome(formData.get("nome"));
  if (!nome) return { error: "Informe o nome da rodada." };

  const ordem = parseOrdem(formData.get("ordem"));
  if (ordem === null) return { error: "Ordem deve ser um inteiro >= 0." };

  const prazo_palpite = parsePrazo(formData.get("prazo_palpite"));

  const supabase = await createClient();
  const { error } = await supabase
    .from("rodadas")
    .update({ nome, ordem, prazo_palpite })
    .eq("id", id);

  if (error) return { error: "Nao foi possivel salvar a rodada." };

  revalidar();
  return { ok: true };
}

/** Exclui uma rodada (jogos/palpites caem por ON DELETE CASCADE). */
export async function excluirRodada(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("rodadas").delete().eq("id", id);

  revalidar();
}

/**
 * Alterna o flag `invalidada` da rodada e DEPOIS recalcula os palpites
 * de todos os jogos dela (pontos sao derivados de invalidada x placar).
 * `invalidada` chega como string ("true"/"false") = estado-alvo desejado.
 */
export async function alternarInvalidada(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  const invalidada = String(formData.get("invalidada") ?? "") === "true";

  const supabase = await createClient();
  const { error } = await supabase
    .from("rodadas")
    .update({ invalidada })
    .eq("id", id);
  if (error) return;

  // Recalculo apos persistir o novo estado.
  await recalcularRodada(supabase, id);

  revalidar();
}
