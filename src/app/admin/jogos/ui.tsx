"use client";

import { useFormStatus } from "react-dom";

/**
 * Pecas de UI client compartilhadas pelos forms desta pasta.
 * Mantem os forms enxutos e o estado de "pending" consistente.
 */

/** Classe base de <input>/<select> dos forms desta feature. */
export const INPUT_CLASS =
  "w-full rounded-lg border border-border bg-surface-container-low px-3 py-2 text-body-md text-text-primary outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary";

/** Botao de submit que reflete o estado pending do form que o contem. */
export function SubmitButton({
  children,
  pendingLabel,
  className,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex items-center justify-center gap-1 rounded text-label-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
        className ?? "bg-primary px-3 py-1.5 text-on-primary hover:opacity-90"
      }`}
    >
      {pending ? (pendingLabel ?? "Salvando…") : children}
    </button>
  );
}

/** Mensagem de erro padronizada das actions. */
export function MensagemErro({ mensagem }: { mensagem?: string }) {
  if (!mensagem) return null;
  return (
    <p className="text-label-sm font-medium text-error-red" role="alert">
      {mensagem}
    </p>
  );
}

/**
 * Converte ISO -> valor para <input type="datetime-local"> (sem timezone),
 * usando o fuso local do navegador. Em "" retorna "".
 */
export function isoParaInputLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}
