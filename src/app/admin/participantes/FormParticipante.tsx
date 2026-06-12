"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import Icon from "@/components/Icon";
import {
  atualizarParticipante,
  criarParticipante,
  type ResultadoAcao,
} from "@/app/actions/participantes";
import type { Participante, Selecao } from "@/lib/types";

/**
 * FormParticipante — bottom sheet de criacao/edicao.
 * Modo "criar": renderiza um FAB que abre a folha vazia.
 * Modo "editar": exposto via prop `aberto`/`onFechar` (controlado pela linha).
 */

type Modo = "criar" | "editar";

interface FormParticipanteProps {
  modo: Modo;
  selecoes: Selecao[];
  prazoExpirado: boolean;
  /** So no modo editar. */
  participante?: Participante;
  /** Controle externo (modo editar). */
  aberto?: boolean;
  onFechar?: () => void;
}

function BotaoSalvar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-body-lg font-semibold text-on-primary transition-colors hover:bg-primary/90 disabled:opacity-60"
    >
      <Icon name="save" size={20} />
      {pending ? "Salvando..." : "Salvar participante"}
    </button>
  );
}

export default function FormParticipante({
  modo,
  selecoes,
  prazoExpirado,
  participante,
  aberto: abertoExterno,
  onFechar,
}: FormParticipanteProps) {
  const [abertoInterno, setAbertoInterno] = useState(false);
  const controlado = modo === "editar";
  const aberto = controlado ? !!abertoExterno : abertoInterno;

  const acao = modo === "criar" ? criarParticipante : atualizarParticipante;
  const [estado, formAction] = useActionState<ResultadoAcao | null, FormData>(
    acao,
    null,
  );

  // Fechar a folha quando a acao concluir com sucesso.
  useEffect(() => {
    if (estado?.ok) {
      fechar();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado]);

  function fechar() {
    if (controlado) {
      onFechar?.();
    } else {
      setAbertoInterno(false);
    }
  }

  return (
    <>
      {/* FAB so no modo criar */}
      {modo === "criar" && (
        <button
          type="button"
          onClick={() => setAbertoInterno(true)}
          aria-label="Adicionar participante"
          className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-lg transition-transform active:scale-90 md:bottom-8 md:right-[calc(50%-220px)]"
        >
          <Icon name="add" size={30} />
        </button>
      )}

      {aberto && (
        <>
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Fechar"
            onClick={fechar}
            className="fixed inset-0 z-50 bg-black/60"
          />
          {/* Bottom sheet */}
          <div className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[90dvh] flex-col rounded-t-2xl bg-surface-container-high shadow-2xl md:max-w-md">
            {/* Handle */}
            <div className="flex justify-center pb-2 pt-3">
              <div className="h-1.5 w-12 rounded-full bg-outline-variant" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <h3 className="text-headline-md font-semibold text-text-primary">
                {modo === "criar" ? "Novo participante" : "Editar participante"}
              </h3>
              <button
                type="button"
                onClick={fechar}
                aria-label="Fechar"
                className="rounded-full p-2 text-text-secondary transition-colors hover:bg-surface-variant"
              >
                <Icon name="close" size={22} />
              </button>
            </div>

            <form
              action={formAction}
              className="flex flex-col gap-5 overflow-y-auto p-5"
            >
              {modo === "editar" && participante && (
                <input type="hidden" name="id" value={participante.id} />
              )}

              {/* Erro */}
              {estado && !estado.ok && estado.erro && (
                <p className="rounded-lg border border-error-red/40 bg-error-red/15 px-3 py-2 text-label-sm text-error-red">
                  {estado.erro}
                </p>
              )}

              {/* Nome */}
              <div>
                <label
                  htmlFor="nome"
                  className="mb-2 block text-label-sm font-medium text-text-secondary"
                >
                  Nome completo
                </label>
                <input
                  id="nome"
                  name="nome"
                  type="text"
                  required
                  defaultValue={participante?.nome ?? ""}
                  placeholder="Ex: João Silva"
                  className="block w-full rounded-lg border border-border bg-surface p-2.5 text-body-md text-text-primary placeholder-text-secondary/50 focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Contato */}
              <div>
                <label
                  htmlFor="contato"
                  className="mb-2 block text-label-sm font-medium text-text-secondary"
                >
                  Contato (WhatsApp)
                </label>
                <input
                  id="contato"
                  name="contato"
                  type="tel"
                  defaultValue={participante?.contato ?? ""}
                  placeholder="(11) 99999-9999"
                  className="block w-full rounded-lg border border-border bg-surface p-2.5 text-body-md text-text-primary placeholder-text-secondary/50 focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Selecao campea */}
              <div>
                <label
                  htmlFor="selecao_campea"
                  className="mb-2 block text-label-sm font-medium text-text-secondary"
                >
                  Seleção campeã (palpite)
                </label>
                <select
                  id="selecao_campea"
                  name="selecao_campea"
                  defaultValue={participante?.selecao_campea ?? ""}
                  disabled={prazoExpirado}
                  className="block w-full appearance-none rounded-lg border border-border bg-surface p-2.5 text-body-md text-text-primary focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-60"
                >
                  <option value="">— Sem palpite —</option>
                  {selecoes.map((s) => (
                    <option key={s.codigo} value={s.codigo}>
                      {s.emoji ? `${s.emoji} ` : ""}
                      {s.nome}
                    </option>
                  ))}
                </select>
                {prazoExpirado && (
                  <p className="mt-1.5 text-label-sm text-text-secondary">
                    Prazo encerrado — palpite de campeã bloqueado.
                  </p>
                )}
              </div>

              {/* Status pago (somente na criacao) */}
              {modo === "criar" && (
                <label className="mt-1 flex cursor-pointer items-center justify-between rounded-lg border border-border bg-surface p-4">
                  <span>
                    <span className="block text-body-md text-text-primary">
                      Status de pagamento
                    </span>
                    <span className="mt-0.5 block text-label-sm text-text-secondary">
                      Taxa de inscrição confirmada
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    name="pago"
                    className="h-6 w-6 cursor-pointer rounded accent-success-emerald"
                  />
                </label>
              )}

              {/* Footer */}
              <div className="border-t border-border pt-4">
                <BotaoSalvar />
              </div>
            </form>
          </div>
        </>
      )}
    </>
  );
}
