"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Icon from "@/components/Icon";
import { criarJogo, type JogoActionState } from "@/app/actions/jogos";
import { INPUT_CLASS, MensagemErro, SubmitButton } from "./ui";

/**
 * Form "Adicionar jogo" (colapsavel). Client pequeno: dirige a Server Action
 * criarJogo via useActionState. Os selects sao alimentados pelas tabelas
 * rodadas/selecoes lidas no Server Component pai.
 */

interface RodadaOpcao {
  id: string;
  nome: string;
}
interface SelecaoOpcao {
  codigo: string;
  nome: string;
}

const FASES = [
  { valor: "grupos", rotulo: "Fase de grupos" },
  { valor: "oitavas", rotulo: "Oitavas" },
  { valor: "quartas", rotulo: "Quartas" },
  { valor: "semi", rotulo: "Semifinal" },
  { valor: "final", rotulo: "Final" },
] as const;

export default function FormJogo({
  rodadas,
  selecoes,
  rodadaPadrao,
}: {
  rodadas: RodadaOpcao[];
  selecoes: SelecaoOpcao[];
  rodadaPadrao: string | null;
}) {
  const [aberto, setAberto] = useState(false);
  const [state, formAction] = useActionState<JogoActionState, FormData>(
    criarJogo,
    undefined,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const erroAnterior = useRef<string | undefined>(undefined);

  // Sucesso = action voltou sem erro depois de um submit -> limpa e fecha.
  useEffect(() => {
    if (state === undefined && erroAnterior.current !== undefined) {
      formRef.current?.reset();
      setAberto(false);
    }
    erroAnterior.current = state?.error;
  }, [state]);

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-surface px-4 py-3 text-body-md font-medium text-text-secondary transition-colors hover:border-primary hover:text-primary"
      >
        <Icon name="add" size={20} />
        Adicionar jogo
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-body-lg font-semibold text-text-primary">
          Novo jogo
        </h2>
        <button
          type="button"
          onClick={() => setAberto(false)}
          className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary hover:bg-surface-variant"
          aria-label="Fechar"
        >
          <Icon name="close" size={18} />
        </button>
      </div>

      <Campo label="Rodada">
        <select
          name="rodada_id"
          defaultValue={rodadaPadrao ?? ""}
          required
          className={INPUT_CLASS}
        >
          {rodadas.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nome}
            </option>
          ))}
        </select>
      </Campo>

      <div className="grid grid-cols-2 gap-3">
        <Campo label="Seleção casa">
          <select name="time_casa_cod" required className={INPUT_CLASS}>
            <option value="">—</option>
            {selecoes.map((s) => (
              <option key={s.codigo} value={s.codigo}>
                {s.nome}
              </option>
            ))}
          </select>
        </Campo>
        <Campo label="Seleção fora">
          <select name="time_fora_cod" required className={INPUT_CLASS}>
            <option value="">—</option>
            {selecoes.map((s) => (
              <option key={s.codigo} value={s.codigo}>
                {s.nome}
              </option>
            ))}
          </select>
        </Campo>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Campo label="Fase">
          <select name="fase" defaultValue="grupos" className={INPUT_CLASS}>
            <option value="">—</option>
            {FASES.map((f) => (
              <option key={f.valor} value={f.valor}>
                {f.rotulo}
              </option>
            ))}
          </select>
        </Campo>
        <Campo label="Grupo (opcional)">
          <input
            name="grupo"
            type="text"
            maxLength={2}
            placeholder="A"
            className={`${INPUT_CLASS} uppercase`}
          />
        </Campo>
      </div>

      <Campo label="Data e hora">
        <input
          name="data_hora"
          type="datetime-local"
          required
          className={INPUT_CLASS}
        />
      </Campo>

      <MensagemErro mensagem={state?.error} />

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={() => setAberto(false)}
          className="rounded px-3 py-1.5 text-label-sm font-medium text-text-secondary hover:text-text-primary"
        >
          Cancelar
        </button>
        <SubmitButton pendingLabel="Criando…">Criar jogo</SubmitButton>
      </div>
    </form>
  );
}

/** Wrapper de campo rotulado. */
function Campo({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-table-header uppercase text-text-secondary">
        {label}
      </span>
      {children}
    </label>
  );
}
