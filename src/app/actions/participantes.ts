"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Config } from "@/lib/types";

/**
 * Server Actions da feature PARTICIPANTES.
 * Toda validacao acontece aqui (servidor). O client recebido carrega a
 * sessao do admin — RLS autoriza a escrita.
 *
 * Apos mutar, revalidamos /admin/participantes.
 */

const ROTA = "/admin/participantes";

export interface ResultadoAcao {
  ok: boolean;
  erro?: string;
}

/** Normaliza string vinda do form: trim e null se vazia. */
function textoOuNull(valor: FormDataEntryValue | null): string | null {
  if (typeof valor !== "string") return null;
  const t = valor.trim();
  return t.length > 0 ? t : null;
}

/** Cria um participante. Espera campos: nome (obrigatorio), contato, selecao_campea, pago. */
export async function criarParticipante(
  _prevState: ResultadoAcao | null,
  formData: FormData,
): Promise<ResultadoAcao> {
  const nome = textoOuNull(formData.get("nome"));
  if (!nome) {
    return { ok: false, erro: "Informe o nome do participante." };
  }

  const contato = textoOuNull(formData.get("contato"));
  const selecaoCampea = textoOuNull(formData.get("selecao_campea"));
  const pago = formData.get("pago") === "on" || formData.get("pago") === "true";

  const supabase = await createClient();

  // Se vier campea no cadastro, respeitar o prazo.
  if (selecaoCampea) {
    const bloqueio = await prazoCampeaoExpirado(supabase);
    if (bloqueio) {
      return { ok: false, erro: bloqueio };
    }
  }

  const { error } = await supabase.from("participantes").insert({
    nome,
    contato,
    selecao_campea: selecaoCampea,
    campea_em: selecaoCampea ? new Date().toISOString() : null,
    pago,
    pago_em: pago ? new Date().toISOString() : null,
  });

  if (error) {
    return { ok: false, erro: "Nao foi possivel criar o participante." };
  }

  revalidatePath(ROTA);
  return { ok: true };
}

/** Atualiza nome/contato/selecao_campea de um participante. */
export async function atualizarParticipante(
  _prevState: ResultadoAcao | null,
  formData: FormData,
): Promise<ResultadoAcao> {
  const id = textoOuNull(formData.get("id"));
  if (!id) {
    return { ok: false, erro: "Participante invalido." };
  }

  const nome = textoOuNull(formData.get("nome"));
  if (!nome) {
    return { ok: false, erro: "Informe o nome do participante." };
  }

  const contato = textoOuNull(formData.get("contato"));
  const selecaoCampea = textoOuNull(formData.get("selecao_campea"));

  const supabase = await createClient();

  // Buscar o estado atual para saber se a campea esta mudando.
  const { data: atual } = await supabase
    .from("participantes")
    .select("selecao_campea, campea_em")
    .eq("id", id)
    .single<{ selecao_campea: string | null; campea_em: string | null }>();

  const campeaMudou = (atual?.selecao_campea ?? null) !== selecaoCampea;

  // So aplicar regra de prazo se a selecao campea estiver sendo alterada.
  if (campeaMudou) {
    const bloqueio = await prazoCampeaoExpirado(supabase);
    if (bloqueio) {
      return { ok: false, erro: bloqueio };
    }
  }

  const patch: Record<string, unknown> = { nome, contato };
  if (campeaMudou) {
    patch.selecao_campea = selecaoCampea;
    patch.campea_em = selecaoCampea ? new Date().toISOString() : null;
  }

  const { error } = await supabase
    .from("participantes")
    .update(patch)
    .eq("id", id);

  if (error) {
    return { ok: false, erro: "Nao foi possivel salvar as alteracoes." };
  }

  revalidatePath(ROTA);
  return { ok: true };
}

/** Exclui um participante (cascata limpa palpites). */
export async function excluirParticipante(id: string): Promise<ResultadoAcao> {
  if (!id) {
    return { ok: false, erro: "Participante invalido." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("participantes")
    .delete()
    .eq("id", id);

  if (error) {
    return { ok: false, erro: "Nao foi possivel excluir o participante." };
  }

  revalidatePath(ROTA);
  return { ok: true };
}

/** Alterna o status de pagamento, ajustando pago_em. */
export async function alternarPago(
  id: string,
  pago: boolean,
): Promise<ResultadoAcao> {
  if (!id) {
    return { ok: false, erro: "Participante invalido." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("participantes")
    .update({
      pago,
      pago_em: pago ? new Date().toISOString() : null,
    })
    .eq("id", id);

  if (error) {
    return { ok: false, erro: "Nao foi possivel atualizar o pagamento." };
  }

  revalidatePath(ROTA);
  return { ok: true };
}

/**
 * Define (ou limpa, com codigo=null) a selecao campea de um participante.
 * Bloqueia se config.prazo_campeao ja passou.
 */
export async function definirCampea(
  id: string,
  codigo: string | null,
): Promise<ResultadoAcao> {
  if (!id) {
    return { ok: false, erro: "Participante invalido." };
  }

  const supabase = await createClient();

  const bloqueio = await prazoCampeaoExpirado(supabase);
  if (bloqueio) {
    return { ok: false, erro: bloqueio };
  }

  const { error } = await supabase
    .from("participantes")
    .update({
      selecao_campea: codigo,
      campea_em: codigo ? new Date().toISOString() : null,
    })
    .eq("id", id);

  if (error) {
    return { ok: false, erro: "Nao foi possivel definir a selecao campea." };
  }

  revalidatePath(ROTA);
  return { ok: true };
}

/**
 * Le config.prazo_campeao e retorna uma mensagem de erro se ja passou,
 * ou null se ainda esta dentro do prazo.
 */
async function prazoCampeaoExpirado(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<string | null> {
  const { data: config } = await supabase
    .from("config")
    .select("prazo_campeao")
    .eq("id", 1)
    .single<Pick<Config, "prazo_campeao">>();

  if (!config?.prazo_campeao) return null;

  const prazo = new Date(config.prazo_campeao).getTime();
  if (Number.isNaN(prazo)) return null;

  if (Date.now() > prazo) {
    return "Prazo para definir a seleção campeã já encerrou.";
  }
  return null;
}
