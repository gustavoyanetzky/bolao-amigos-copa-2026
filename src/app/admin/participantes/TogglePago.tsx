"use client";

import { useState, useTransition } from "react";
import { alternarPago } from "@/app/actions/participantes";

/**
 * TogglePago — switch otimista do status de pagamento.
 * Chama a Server Action alternarPago; reverte o estado visual se falhar.
 */

interface TogglePagoProps {
  id: string;
  pago: boolean;
}

export default function TogglePago({ id, pago }: TogglePagoProps) {
  const [ligado, setLigado] = useState(pago);
  const [pending, startTransition] = useTransition();

  function alternar() {
    const proximo = !ligado;
    setLigado(proximo); // otimista
    startTransition(async () => {
      const res = await alternarPago(id, proximo);
      if (!res.ok) {
        setLigado(!proximo); // reverte
      }
    });
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">
        Pago
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={ligado}
        aria-label="Alternar status de pagamento"
        disabled={pending}
        onClick={alternar}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:opacity-60 ${
          ligado ? "bg-success-emerald" : "bg-outline-variant"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            ligado ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
