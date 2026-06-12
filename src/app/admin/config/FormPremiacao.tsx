"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { salvarPremiacao, type ActionResult } from "@/app/actions/config";
import type { Config } from "@/lib/types";

const estadoInicial: ActionResult = { ok: false };

async function acao(
  _prev: ActionResult,
  fd: FormData,
): Promise<ActionResult> {
  return salvarPremiacao(fd);
}

function CampoPct({
  posicao,
  name,
  defaultValue,
  cor,
  valor,
  onChange,
}: {
  posicao: string;
  name: string;
  defaultValue: number;
  cor: string;
  valor: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex min-w-[100px] flex-1 flex-col items-center gap-1 rounded-lg border border-border bg-surface-container p-3">
      <span className={`font-bold ${cor}`}>{posicao}</span>
      <input
        name={name}
        type="number"
        step={1}
        min={0}
        max={100}
        inputMode="numeric"
        required
        defaultValue={defaultValue}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        aria-label={`Percentual ${posicao} lugar`}
        className="tabular-data w-16 rounded border border-border bg-surface py-1 text-center text-body-md text-text-primary focus:border-primary-container focus:outline-none"
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
      className="flex items-center justify-center gap-2 self-start rounded-xl bg-primary-container px-6 py-3 font-bold text-on-primary-container transition-colors hover:bg-primary-container/80 active:scale-[0.98] disabled:opacity-60"
    >
      <span className="material-symbols-outlined text-base" aria-hidden="true">
        save
      </span>
      {pending ? "Salvando…" : "Salvar premiação"}
    </button>
  );
}

export default function FormPremiacao({ config }: { config: Config }) {
  const [estado, formAction] = useActionState(acao, estadoInicial);
  const [p1, setP1] = useState(config.pct_1);
  const [p2, setP2] = useState(config.pct_2);
  const [p3, setP3] = useState(config.pct_3);
  const soma = p1 + p2 + p3;
  const somaOk = soma === 100;

  return (
    <form action={formAction} className="flex flex-col gap-5 p-4">
      <div className="flex flex-col gap-stack-compact">
        <label
          htmlFor="valor_cota"
          className="text-label-sm font-medium text-text-secondary"
        >
          Valor da cota (R$) — opcional
        </label>
        <input
          id="valor_cota"
          name="valor_cota"
          type="number"
          step="0.01"
          min={0}
          inputMode="decimal"
          defaultValue={config.valor_cota ?? ""}
          placeholder="ex: 150.00"
          className="tabular-data w-full max-w-[200px] rounded-lg border border-border bg-surface-container px-3 py-2 text-body-md text-text-primary focus:border-primary-container focus:outline-none focus:ring-1 focus:ring-primary-container"
        />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-label-sm font-medium text-text-secondary">
            Distribuição do prêmio (%)
          </label>
          <span
            className={`tabular-data text-label-sm font-bold ${
              somaOk ? "text-success-emerald" : "text-error-red"
            }`}
          >
            {soma}% / 100%
          </span>
        </div>
        <div className="flex flex-wrap gap-3">
          <CampoPct
            posicao="1º"
            name="pct_1"
            defaultValue={config.pct_1}
            cor="text-tertiary"
            valor={p1}
            onChange={setP1}
          />
          <CampoPct
            posicao="2º"
            name="pct_2"
            defaultValue={config.pct_2}
            cor="text-text-secondary"
            valor={p2}
            onChange={setP2}
          />
          <CampoPct
            posicao="3º"
            name="pct_3"
            defaultValue={config.pct_3}
            cor="text-medal-bronze"
            valor={p3}
            onChange={setP3}
          />
        </div>
        {!somaOk && (
          <p className="mt-2 text-label-sm text-error-red">
            As porcentagens precisam somar exatamente 100%.
          </p>
        )}
      </div>

      {estado.erro && (
        <p className="text-label-sm text-error-red" role="alert">
          {estado.erro}
        </p>
      )}
      {estado.ok && !estado.erro && (
        <p className="text-label-sm text-success-emerald" role="status">
          Premiação salva.
        </p>
      )}

      <BotaoSalvar />
    </form>
  );
}
