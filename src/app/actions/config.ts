"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { recalcularTudo } from "@/lib/recalcular";

/**
 * Server Actions da feature CONFIG (singleton id=1).
 * Toda validacao acontece aqui (servidor). Mutacoes revalidam /admin/config e /.
 */

export interface ActionResult {
  ok: boolean;
  erro?: string;
}

/** Le um inteiro >= 0 de um FormData; aceita negativos so se permitirNegativo. */
function lerInteiro(
  fd: FormData,
  campo: string,
  { permitirNegativo = false }: { permitirNegativo?: boolean } = {},
): number | null {
  const bruto = fd.get(campo);
  if (typeof bruto !== "string" || bruto.trim() === "") return null;
  const n = Number(bruto);
  if (!Number.isInteger(n)) return null;
  if (!permitirNegativo && n < 0) return null;
  return n;
}

/**
 * Atualiza as regras de pontuacao e DEPOIS recalcula todo o bolao.
 * pts_wo pode ser negativo (penalidade); os demais sao inteiros >= 0.
 */
export async function salvarPontuacao(fd: FormData): Promise<ActionResult> {
  const pts_acerto = lerInteiro(fd, "pts_acerto");
  const pts_cravada = lerInteiro(fd, "pts_cravada");
  const pts_acerto_classico = lerInteiro(fd, "pts_acerto_classico");
  const pts_cravada_classico = lerInteiro(fd, "pts_cravada_classico");
  const pts_campeao = lerInteiro(fd, "pts_campeao");
  const pts_wo = lerInteiro(fd, "pts_wo", { permitirNegativo: true });

  if (
    pts_acerto === null ||
    pts_cravada === null ||
    pts_acerto_classico === null ||
    pts_cravada_classico === null ||
    pts_campeao === null ||
    pts_wo === null
  ) {
    return { ok: false, erro: "Preencha todos os pontos com inteiros válidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("config")
    .update({
      pts_acerto,
      pts_cravada,
      pts_acerto_classico,
      pts_cravada_classico,
      pts_campeao,
      pts_wo,
    })
    .eq("id", 1);

  if (error) {
    return { ok: false, erro: "Não foi possível salvar a pontuação." };
  }

  await recalcularTudo(supabase);

  revalidatePath("/admin/config");
  revalidatePath("/");
  return { ok: true };
}

/**
 * Atualiza a distribuicao da premiacao (%) e o valor da cota (opcional).
 * pct_1 + pct_2 + pct_3 DEVE somar 100.
 */
export async function salvarPremiacao(fd: FormData): Promise<ActionResult> {
  const pct_1 = lerInteiro(fd, "pct_1");
  const pct_2 = lerInteiro(fd, "pct_2");
  const pct_3 = lerInteiro(fd, "pct_3");

  if (pct_1 === null || pct_2 === null || pct_3 === null) {
    return { ok: false, erro: "Informe as três porcentagens (inteiros ≥ 0)." };
  }
  if (pct_1 + pct_2 + pct_3 !== 100) {
    return { ok: false, erro: "As porcentagens precisam somar exatamente 100%." };
  }

  // valor_cota opcional: vazio -> null; senao numero >= 0.
  const cotaBruto = fd.get("valor_cota");
  let valor_cota: number | null = null;
  if (typeof cotaBruto === "string" && cotaBruto.trim() !== "") {
    const n = Number(cotaBruto);
    if (!Number.isFinite(n) || n < 0) {
      return { ok: false, erro: "Valor da cota inválido." };
    }
    valor_cota = n;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("config")
    .update({ pct_1, pct_2, pct_3, valor_cota })
    .eq("id", 1);

  if (error) {
    return { ok: false, erro: "Não foi possível salvar a premiação." };
  }

  revalidatePath("/admin/config");
  revalidatePath("/");
  return { ok: true };
}

/** Atualiza o prazo final do palpite de campeao (datetime). */
export async function salvarPrazoCampeao(fd: FormData): Promise<ActionResult> {
  const bruto = fd.get("prazo_campeao");
  if (typeof bruto !== "string" || bruto.trim() === "") {
    return { ok: false, erro: "Informe o prazo do palpite de campeão." };
  }
  const prazo = new Date(bruto);
  if (Number.isNaN(prazo.getTime())) {
    return { ok: false, erro: "Data/hora do prazo inválida." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("config")
    .update({ prazo_campeao: prazo.toISOString() })
    .eq("id", 1);

  if (error) {
    return { ok: false, erro: "Não foi possível salvar o prazo." };
  }

  revalidatePath("/admin/config");
  revalidatePath("/");
  return { ok: true };
}

/**
 * Define (ou limpa) a selecao campea real. Passar o codigo FIFA ou null.
 * O bonus de campeao e derivado no ranking a partir deste campo.
 */
export async function definirCampeaoReal(fd: FormData): Promise<ActionResult> {
  const bruto = fd.get("campeao_real");
  const codigo =
    typeof bruto === "string" && bruto.trim() !== "" ? bruto.trim() : null;

  const supabase = await createClient();

  // Se veio um codigo, valida que a selecao existe.
  if (codigo !== null) {
    const { data: selecao } = await supabase
      .from("selecoes")
      .select("codigo")
      .eq("codigo", codigo)
      .maybeSingle<{ codigo: string }>();
    if (!selecao) {
      return { ok: false, erro: "Seleção inválida." };
    }
  }

  const { error } = await supabase
    .from("config")
    .update({ campeao_real: codigo })
    .eq("id", 1);

  if (error) {
    return { ok: false, erro: "Não foi possível definir o campeão real." };
  }

  revalidatePath("/admin/config");
  revalidatePath("/");
  return { ok: true };
}
