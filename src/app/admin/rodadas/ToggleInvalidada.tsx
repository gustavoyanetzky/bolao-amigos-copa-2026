"use client";

import { useRef, useState, useEffect } from "react";
import { alternarInvalidada } from "@/app/actions/rodadas";

/**
 * Toggle "Invalidada" com confirmacao.
 * Ao tentar INVALIDAR (passar a desconsiderar a rodada), abre um <dialog>
 * pedindo confirmacao. Revalidar (voltar a valer) e direto, sem dialogo.
 * O submit chama a Server Action `alternarInvalidada`, que persiste o
 * novo estado e recalcula os palpites.
 */
export default function ToggleInvalidada({
  id,
  invalidada,
}: {
  id: string;
  invalidada: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  const alvo = !invalidada; // estado desejado ao acionar

  return (
    <>
      {/* Revalidar (rodada esta invalidada -> voltar a valer): direto. */}
      {invalidada ? (
        <form action={alternarInvalidada}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="invalidada" value="false" />
          <button
            type="submit"
            className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-label-sm font-medium text-text-secondary transition-colors hover:text-primary"
          >
            <span
              className="material-symbols-outlined text-[18px]"
              aria-hidden
            >
              restore
            </span>
            Revalidar
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-1 rounded-lg border border-error-red/40 px-2 py-1 text-label-sm font-medium text-error-red transition-colors hover:bg-error-red/10"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden>
            block
          </span>
          Invalidar
        </button>
      )}

      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        className="m-auto w-full max-w-sm rounded-xl border border-border bg-surface-container-high p-0 text-text-primary backdrop:bg-brand-navy-deep/80 backdrop:backdrop-blur-sm"
      >
        <div className="flex flex-col gap-4 p-6">
          <div className="flex items-center gap-3 text-error-red">
            <span className="material-symbols-outlined text-3xl" aria-hidden>
              warning
            </span>
            <h3 className="text-headline-md-mobile font-bold">
              Invalidar rodada?
            </h3>
          </div>
          <p className="text-body-md text-text-secondary">
            Todos os palpites desta rodada serão desconsiderados da
            classificação e os pontos serão recalculados. Deseja prosseguir?
          </p>
          <div className="mt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg px-4 py-2 text-data-cell font-medium text-text-secondary transition-colors hover:bg-surface-variant"
            >
              Cancelar
            </button>
            <form action={alternarInvalidada}>
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="invalidada" value={String(alvo)} />
              <button
                type="submit"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-error-red/50 bg-error-red/15 px-4 py-2 text-data-cell font-bold text-error-red transition-colors hover:bg-error-red hover:text-white"
              >
                Sim, invalidar
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </>
  );
}
