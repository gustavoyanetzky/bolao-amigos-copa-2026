"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  criarRodada,
  atualizarRodada,
  type RodadaState,
} from "@/app/actions/rodadas";
import type { Rodada } from "@/lib/types";

/**
 * Form de criar/editar rodada num <dialog> modal.
 * Client Component pequeno: gerencia abertura, pending e erro de validacao.
 * `rodada` ausente = criar; presente = editar.
 */

function BotaoSalvar({ rotulo }: { rotulo: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-primary px-4 py-2 text-data-cell font-bold text-on-primary transition-opacity hover:opacity-90 disabled:opacity-60"
    >
      {pending ? "Salvando..." : rotulo}
    </button>
  );
}

/** Converte ISO/timestamptz -> valor de <input type="datetime-local"> (sem segundos). */
function paraInputLocal(iso: string | null): string {
  if (!iso) return "";
  // Mantem o offset local: usa o proprio Date.
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

export default function FormRodada({
  rodada,
  trigger,
}: {
  rodada?: Rodada;
  trigger: "novo" | "editar";
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  const action = rodada ? atualizarRodada : criarRodada;
  const [state, formAction] = useActionState<RodadaState, FormData>(
    action,
    undefined,
  );

  // Sincroniza <dialog> com o estado.
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  // Sucesso -> fecha o modal.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fechar o <dialog> depois do sucesso da action; refatorar para estado derivado e tarefa propria.
    if (state && "ok" in state && state.ok) setOpen(false);
  }, [state]);

  const erro = state && "error" in state ? state.error : null;

  return (
    <>
      {trigger === "novo" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-data-cell font-bold text-on-primary shadow-sm transition-opacity hover:opacity-90"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden>
            add
          </span>
          Nova rodada
        </button>
      ) : (
        <button
          type="button"
          aria-label="Editar rodada"
          onClick={() => setOpen(true)}
          className="p-1 text-text-secondary transition-colors hover:text-primary"
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden>
            edit
          </span>
        </button>
      )}

      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        className="m-auto w-full max-w-sm rounded-xl border border-border bg-surface-container-high p-0 text-text-primary backdrop:bg-brand-navy-deep/80 backdrop:backdrop-blur-sm"
      >
        <form action={formAction} className="flex flex-col gap-4 p-6">
          <h3 className="text-headline-md-mobile font-bold text-brand-cream">
            {rodada ? "Editar rodada" : "Nova rodada"}
          </h3>

          {rodada ? (
            <input type="hidden" name="id" value={rodada.id} />
          ) : null}

          <label className="flex flex-col gap-1">
            <span className="text-label-sm font-medium text-text-secondary">
              Nome
            </span>
            <input
              name="nome"
              type="text"
              required
              defaultValue={rodada?.nome ?? ""}
              placeholder="Rodada 1 — Grupos 11/06"
              className="rounded-lg border border-border bg-surface px-3 py-2 text-body-md text-on-surface outline-none focus:border-primary"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-label-sm font-medium text-text-secondary">
              Ordem
            </span>
            <input
              name="ordem"
              type="number"
              min={0}
              step={1}
              defaultValue={rodada?.ordem ?? 0}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-body-md text-on-surface outline-none focus:border-primary"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-label-sm font-medium text-text-secondary">
              Prazo de palpite{" "}
              <span className="text-disabled">(só referência visual)</span>
            </span>
            <input
              name="prazo_palpite"
              type="datetime-local"
              defaultValue={paraInputLocal(rodada?.prazo_palpite ?? null)}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-body-md text-on-surface outline-none focus:border-primary [color-scheme:dark]"
            />
          </label>

          {erro ? (
            <p className="text-data-cell font-medium text-error-red">{erro}</p>
          ) : null}

          <div className="mt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg px-4 py-2 text-data-cell font-medium text-text-secondary transition-colors hover:bg-surface-variant"
            >
              Cancelar
            </button>
            <BotaoSalvar rotulo={rodada ? "Salvar" : "Criar"} />
          </div>
        </form>
      </dialog>
    </>
  );
}
