"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { salvarPontuacao, type ActionResult } from "@/app/actions/config";
import type { Config } from "@/lib/types";

const estadoInicial: ActionResult = { ok: false };

async function acao(
  _prev: ActionResult,
  fd: FormData,
): Promise<ActionResult> {
  return salvarPontuacao(fd);
}

function CampoNum({
  label,
  name,
  defaultValue,
  permitirNegativo = false,
  destrutivo = false,
}: {
  label: string;
  name: string;
  defaultValue: number;
  permitirNegativo?: boolean;
  destrutivo?: boolean;
}) {
  return (
    <div className="flex flex-col gap-stack-compact">
      <label
        htmlFor={`pont-${name}`}
        className="text-label-sm font-medium text-text-secondary"
      >
        {label}
      </label>
      <input
        id={`pont-${name}`}
        name={name}
        type="number"
        step={1}
        min={permitirNegativo ? undefined : 0}
        defaultValue={defaultValue}
        inputMode="numeric"
        required
        className={`tabular-data w-full rounded-lg border px-3 py-2 text-body-md focus:outline-none focus:ring-1 ${
          destrutivo
            ? "border-error-red/50 bg-error-red/10 text-error-red focus:border-error-red focus:ring-error-red"
            : "border-border bg-surface-container text-text-primary focus:border-primary-container focus:ring-primary-container"
        }`}
      />
    </div>
  );
}

function BotaoSalvar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-container py-4 font-bold text-on-primary-container shadow-lg transition-colors hover:bg-primary-container/80 active:scale-[0.98] disabled:opacity-60"
    >
      <span
        className={`material-symbols-outlined ${pending ? "animate-spin" : ""}`}
        aria-hidden="true"
      >
        sync
      </span>
      {pending ? "Recalculando…" : "Salvar e recalcular"}
    </button>
  );
}

export default function FormPontuacao({ config }: { config: Config }) {
  const [estado, formAction] = useActionState(acao, estadoInicial);

  return (
    <form action={formAction} className="flex flex-col gap-4 p-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <CampoNum
          label="Placar exato (cravada)"
          name="pts_cravada"
          defaultValue={config.pts_cravada}
        />
        <CampoNum
          label="Acerto do resultado"
          name="pts_acerto"
          defaultValue={config.pts_acerto}
        />
        <CampoNum
          label="Cravada em clássico"
          name="pts_cravada_classico"
          defaultValue={config.pts_cravada_classico}
        />
        <CampoNum
          label="Acerto em clássico"
          name="pts_acerto_classico"
          defaultValue={config.pts_acerto_classico}
        />
        <CampoNum
          label="Bônus de campeão"
          name="pts_campeao"
          defaultValue={config.pts_campeao}
        />
        <CampoNum
          label="Penalidade W.O."
          name="pts_wo"
          defaultValue={config.pts_wo}
          permitirNegativo
          destrutivo
        />
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-error-red/30 bg-error-red/10 p-3">
        <span
          className="material-symbols-outlined mt-0.5 text-base text-error-red"
          aria-hidden="true"
        >
          warning
        </span>
        <p className="text-label-sm text-text-secondary">
          Alterar as regras de pontuação recalcula toda a classificação
          existente. Pode levar alguns segundos.
        </p>
      </div>

      {estado.erro && (
        <p className="text-label-sm text-error-red" role="alert">
          {estado.erro}
        </p>
      )}
      {estado.ok && !estado.erro && (
        <p className="text-label-sm text-success-emerald" role="status">
          Pontuação salva e classificação recalculada.
        </p>
      )}

      <BotaoSalvar />
    </form>
  );
}
