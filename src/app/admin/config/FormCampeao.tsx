"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  salvarPrazoCampeao,
  definirCampeaoReal,
  type ActionResult,
} from "@/app/actions/config";
import type { Config, Selecao } from "@/lib/types";

const estadoInicial: ActionResult = { ok: false };

async function acaoPrazo(
  _prev: ActionResult,
  fd: FormData,
): Promise<ActionResult> {
  return salvarPrazoCampeao(fd);
}

async function acaoCampeao(
  _prev: ActionResult,
  fd: FormData,
): Promise<ActionResult> {
  return definirCampeaoReal(fd);
}

/** ISO -> valor aceito por <input type="datetime-local"> (local time). */
function paraInputLocal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

function BotaoSalvar({ rotulo }: { rotulo: string }) {
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
      {pending ? "Salvando…" : rotulo}
    </button>
  );
}

function Feedback({ estado, sucesso }: { estado: ActionResult; sucesso: string }) {
  if (estado.erro) {
    return (
      <p className="text-label-sm text-error-red" role="alert">
        {estado.erro}
      </p>
    );
  }
  if (estado.ok) {
    return (
      <p className="text-label-sm text-success-emerald" role="status">
        {sucesso}
      </p>
    );
  }
  return null;
}

export default function FormCampeao({
  config,
  selecoes,
}: {
  config: Config;
  selecoes: Selecao[];
}) {
  const [estPrazo, actPrazo] = useActionState(acaoPrazo, estadoInicial);
  const [estCampeao, actCampeao] = useActionState(acaoCampeao, estadoInicial);

  return (
    <div className="flex flex-col gap-6 p-4">
      <form action={actPrazo} className="flex flex-col gap-3">
        <div className="flex flex-col gap-stack-compact">
          <label
            htmlFor="prazo_campeao"
            className="text-label-sm font-medium text-text-secondary"
          >
            Prazo final para o palpite de campeão
          </label>
          <input
            id="prazo_campeao"
            name="prazo_campeao"
            type="datetime-local"
            required
            defaultValue={paraInputLocal(config.prazo_campeao)}
            className="w-full rounded-lg border border-border bg-surface-container px-3 py-2 text-body-md text-text-primary focus:border-primary-container focus:outline-none focus:ring-1 focus:ring-primary-container"
          />
        </div>
        <Feedback estado={estPrazo} sucesso="Prazo salvo." />
        <BotaoSalvar rotulo="Salvar prazo" />
      </form>

      <div className="h-px bg-border" />

      <form action={actCampeao} className="flex flex-col gap-3">
        <div className="flex flex-col gap-stack-compact">
          <label
            htmlFor="campeao_real"
            className="text-label-sm font-medium text-text-secondary"
          >
            Campeão real (final)
          </label>
          <select
            id="campeao_real"
            name="campeao_real"
            defaultValue={config.campeao_real ?? ""}
            className="w-full appearance-none rounded-lg border border-border bg-surface-container px-3 py-2 text-body-md text-text-primary focus:border-primary-container focus:outline-none focus:ring-1 focus:ring-primary-container"
          >
            <option value="">Aguardando definição…</option>
            {selecoes.map((s) => (
              <option key={s.codigo} value={s.codigo}>
                {s.emoji ? `${s.emoji} ` : ""}
                {s.nome}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-text-secondary">
            Definir o campeão aplica o bônus de campeão (+{config.pts_campeao})
            a quem acertou. Deixe em branco para limpar.
          </p>
        </div>
        <Feedback estado={estCampeao} sucesso="Campeão real definido." />
        <BotaoSalvar rotulo="Definir campeão" />
      </form>
    </div>
  );
}
