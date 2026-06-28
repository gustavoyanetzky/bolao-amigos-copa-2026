"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { recalcularJogo } from "@/lib/recalcular";
import { propagarVencedor } from "@/lib/bracket";
import type { Fase } from "@/lib/types";

/**
 * Server Actions da feature JOGOS (admin).
 * thin client / fat server: toda validacao acontece aqui (inteiros >= 0,
 * campos obrigatorios, normalizacao de fase/grupo). A escrita passa pela
 * sessao do admin (RLS autoriza). Pontos sao DERIVADOS — qualquer mudanca
 * que afete pontuacao chama recalcularJogo().
 *
 * Convencao de retorno: { error } em falha de validacao; undefined em
 * sucesso. As paginas afetadas sao revalidadas ao fim.
 */

export type JogoActionState = { error: string } | undefined;

const FASES_VALIDAS: Fase[] = [
  "grupos",
  "16avos",
  "oitavas",
  "quartas",
  "semi",
  "terceiro",
  "final",
];

/** Revalida as rotas impactadas por mudancas em jogos. */
function revalidarJogos(): void {
  revalidatePath("/admin/jogos");
  revalidatePath("/");
  revalidatePath("/resultados");
  revalidatePath("/grade");
  revalidatePath("/jogo/[id]", "page");
}

/** Le um inteiro >= 0 do FormData. Vazio/ausente -> null (se permitido). */
function lerInteiroNaoNegativo(
  valor: FormDataEntryValue | null,
): { ok: true; valor: number } | { ok: false } {
  const txt = String(valor ?? "").trim();
  if (txt === "") return { ok: false };
  // Apenas digitos (sem sinal, sem ponto): garante inteiro >= 0.
  if (!/^\d+$/.test(txt)) return { ok: false };
  const n = Number(txt);
  if (!Number.isInteger(n) || n < 0) return { ok: false };
  return { ok: true, valor: n };
}

/** Normaliza fase: string vazia/invalida -> null. */
function normalizarFase(valor: FormDataEntryValue | null): Fase | null {
  const txt = String(valor ?? "").trim();
  if (txt === "") return null;
  return FASES_VALIDAS.includes(txt as Fase) ? (txt as Fase) : null;
}

/** Normaliza grupo: maiusculo, vazio -> null. */
function normalizarGrupo(valor: FormDataEntryValue | null): string | null {
  const txt = String(valor ?? "")
    .trim()
    .toUpperCase();
  return txt === "" ? null : txt;
}

/** Normaliza data_hora: aceita datetime-local; vazio -> erro no chamador. */
function normalizarDataHora(valor: FormDataEntryValue | null): string | null {
  const txt = String(valor ?? "").trim();
  if (txt === "") return null;
  const d = new Date(txt);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

// ---------------------------------------------------------------------------
// CRIAR
// ---------------------------------------------------------------------------

export async function criarJogo(
  _prevState: JogoActionState,
  formData: FormData,
): Promise<JogoActionState> {
  const rodada_id = String(formData.get("rodada_id") ?? "").trim();
  const time_casa_cod = String(formData.get("time_casa_cod") ?? "").trim();
  const time_fora_cod = String(formData.get("time_fora_cod") ?? "").trim();
  const fase = normalizarFase(formData.get("fase"));
  const grupo = normalizarGrupo(formData.get("grupo"));
  const data_hora = normalizarDataHora(formData.get("data_hora"));

  if (!rodada_id) return { error: "Selecione a rodada." };
  if (!time_casa_cod || !time_fora_cod) {
    return { error: "Selecione as duas seleções." };
  }
  if (time_casa_cod === time_fora_cod) {
    return { error: "As seleções devem ser diferentes." };
  }
  if (!data_hora) return { error: "Informe uma data e hora válidas." };

  const supabase = await createClient();
  const { error } = await supabase.from("jogos").insert({
    rodada_id,
    fase,
    grupo,
    time_casa_cod,
    time_fora_cod,
    data_hora,
  });

  if (error) return { error: "Não foi possível criar o jogo." };

  revalidarJogos();
  return undefined;
}

// ---------------------------------------------------------------------------
// EDITAR (metadados — sem placar/encerrado aqui)
// ---------------------------------------------------------------------------

export async function atualizarJogo(
  _prevState: JogoActionState,
  formData: FormData,
): Promise<JogoActionState> {
  const id = String(formData.get("id") ?? "").trim();
  const rodada_id = String(formData.get("rodada_id") ?? "").trim();
  const time_casa_cod = String(formData.get("time_casa_cod") ?? "").trim();
  const time_fora_cod = String(formData.get("time_fora_cod") ?? "").trim();
  const fase = normalizarFase(formData.get("fase"));
  const grupo = normalizarGrupo(formData.get("grupo"));
  const data_hora = normalizarDataHora(formData.get("data_hora"));

  if (!id) return { error: "Jogo inválido." };
  if (!rodada_id) return { error: "Selecione a rodada." };
  if (!time_casa_cod || !time_fora_cod) {
    return { error: "Selecione as duas seleções." };
  }
  if (time_casa_cod === time_fora_cod) {
    return { error: "As seleções devem ser diferentes." };
  }
  if (!data_hora) return { error: "Informe uma data e hora válidas." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("jogos")
    .update({
      rodada_id,
      fase,
      grupo,
      time_casa_cod,
      time_fora_cod,
      data_hora,
    })
    .eq("id", id);

  if (error) return { error: "Não foi possível salvar o jogo." };

  // Mudanca de rodada pode trocar o vinculo de invalidacao da rodada.
  await recalcularJogo(supabase, id);

  revalidarJogos();
  return undefined;
}

// ---------------------------------------------------------------------------
// EXCLUIR
// ---------------------------------------------------------------------------

export async function excluirJogo(id: string): Promise<void> {
  const jogoId = String(id ?? "").trim();
  if (!jogoId) return;

  const supabase = await createClient();
  // Palpites do jogo caem por ON DELETE CASCADE (schema).
  await supabase.from("jogos").delete().eq("id", jogoId);

  revalidarJogos();
}

// ---------------------------------------------------------------------------
// TOGGLES (classico / invalidado) — leem o estado atual e invertem
// ---------------------------------------------------------------------------

export async function alternarClassico(id: string): Promise<void> {
  const jogoId = String(id ?? "").trim();
  if (!jogoId) return;

  const supabase = await createClient();
  const { data: atual } = await supabase
    .from("jogos")
    .select("classico")
    .eq("id", jogoId)
    .single<{ classico: boolean }>();
  if (!atual) return;

  const { error } = await supabase
    .from("jogos")
    .update({ classico: !atual.classico })
    .eq("id", jogoId);
  if (error) return;

  // Pontuacao de classico difere — recomputa palpites do jogo.
  await recalcularJogo(supabase, jogoId);

  revalidarJogos();
}

export async function alternarInvalidado(id: string): Promise<void> {
  const jogoId = String(id ?? "").trim();
  if (!jogoId) return;

  const supabase = await createClient();
  const { data: atual } = await supabase
    .from("jogos")
    .select("invalidado")
    .eq("id", jogoId)
    .single<{ invalidado: boolean }>();
  if (!atual) return;

  const { error } = await supabase
    .from("jogos")
    .update({ invalidado: !atual.invalidado })
    .eq("id", jogoId);
  if (error) return;

  // Invalidar/revalidar zera ou restaura os pontos do jogo.
  await recalcularJogo(supabase, jogoId);

  revalidarJogos();
}

// ---------------------------------------------------------------------------
// LANCAR / EDITAR RESULTADO
// ---------------------------------------------------------------------------

export async function lancarResultado(
  _prevState: JogoActionState,
  formData: FormData,
): Promise<JogoActionState> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "Jogo inválido." };

  const casa = lerInteiroNaoNegativo(formData.get("placar_casa"));
  const fora = lerInteiroNaoNegativo(formData.get("placar_fora"));

  if (!casa.ok || !fora.ok) {
    return { error: "Placar deve ser inteiro maior ou igual a zero." };
  }

  const supabase = await createClient();

  // Mata-mata precisa de vencedor: em empate, exige penaltis (sem empate
  // nos penaltis). Fora do mata-mata, empate e valido e penaltis fica null.
  const { data: jogoAtual } = await supabase
    .from("jogos")
    .select("fase")
    .eq("id", id)
    .single<{ fase: Fase | null }>();
  const mataMata = jogoAtual?.fase != null && jogoAtual.fase !== "grupos";
  const empate = casa.valor === fora.valor;

  let penaltis_casa: number | null = null;
  let penaltis_fora: number | null = null;
  if (mataMata && empate) {
    const pc = lerInteiroNaoNegativo(formData.get("penaltis_casa"));
    const pf = lerInteiroNaoNegativo(formData.get("penaltis_fora"));
    if (!pc.ok || !pf.ok) {
      return {
        error: "Empate no mata-mata: informe os pênaltis das duas seleções.",
      };
    }
    if (pc.valor === pf.valor) {
      return { error: "Os pênaltis não podem empatar — defina um vencedor." };
    }
    penaltis_casa = pc.valor;
    penaltis_fora = pf.valor;
  }

  const { error } = await supabase
    .from("jogos")
    .update({
      placar_casa: casa.valor,
      placar_fora: fora.valor,
      penaltis_casa,
      penaltis_fora,
      encerrado: true,
    })
    .eq("id", id);

  if (error) return { error: "Não foi possível lançar o resultado." };

  // Resultado lancado/editado -> recomputa pontos dos palpites do jogo.
  await recalcularJogo(supabase, id);
  // Mata-mata: propaga o vencedor (e o perdedor das semis) pro jogo seguinte.
  await propagarVencedor(supabase, id);

  revalidarJogos();
  return undefined;
}
