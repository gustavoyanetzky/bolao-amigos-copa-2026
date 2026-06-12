"use client";

import { useRef, useState, useEffect } from "react";
import { excluirRodada } from "@/app/actions/rodadas";

/**
 * Botao de excluir rodada com confirmacao (<dialog>).
 * Aviso que jogos e palpites da rodada caem junto (ON DELETE CASCADE).
 */
export default function BotaoExcluir({
  id,
  nome,
}: {
  id: string;
  nome: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label="Excluir rodada"
        onClick={() => setOpen(true)}
        className="p-1 text-text-secondary transition-colors hover:text-error-red"
      >
        <span className="material-symbols-outlined text-[20px]" aria-hidden>
          delete
        </span>
      </button>

      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        className="m-auto w-full max-w-sm rounded-xl border border-border bg-surface-container-high p-0 text-text-primary backdrop:bg-brand-navy-deep/80 backdrop:backdrop-blur-sm"
      >
        <div className="flex flex-col gap-4 p-6">
          <div className="flex items-center gap-3 text-error-red">
            <span className="material-symbols-outlined text-3xl" aria-hidden>
              delete
            </span>
            <h3 className="text-headline-md-mobile font-bold">
              Excluir rodada?
            </h3>
          </div>
          <p className="text-body-md text-text-secondary">
            A rodada <span className="font-bold text-on-surface">{nome}</span> e
            todos os seus jogos e palpites serão removidos permanentemente. Essa
            ação não pode ser desfeita.
          </p>
          <div className="mt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg px-4 py-2 text-data-cell font-medium text-text-secondary transition-colors hover:bg-surface-variant"
            >
              Cancelar
            </button>
            <form action={excluirRodada}>
              <input type="hidden" name="id" value={id} />
              <button
                type="submit"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-error-red/50 bg-error-red/15 px-4 py-2 text-data-cell font-bold text-error-red transition-colors hover:bg-error-red hover:text-white"
              >
                Sim, excluir
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </>
  );
}
