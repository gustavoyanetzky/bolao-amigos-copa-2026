"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Badge from "@/components/Badge";
import Bandeira from "@/components/Bandeira";
import Icon from "@/components/Icon";
import {
  alternarClassico,
  alternarInvalidado,
  atualizarJogo,
  excluirJogo,
  lancarResultado,
  type JogoActionState,
} from "@/app/actions/jogos";
import type { Jogo } from "@/lib/types";
import {
  INPUT_CLASS,
  isoParaInputLocal,
  MensagemErro,
  SubmitButton,
} from "./ui";

/**
 * Card de um jogo no admin. Concentra as acoes da feature sobre um jogo:
 * lancar/editar resultado (mini-form casa x fora), toggles classico/anulado,
 * editar metadados e excluir. Cada acao usa sua Server Action; toggles e
 * excluir vao por <form action={...}>, os forms com validacao por
 * useActionState (mensagem de erro inline).
 */

interface SelecaoLite {
  codigo: string;
  nome: string;
}
interface RodadaLite {
  id: string;
  nome: string;
}

const FASES = [
  { valor: "grupos", rotulo: "Fase de grupos" },
  { valor: "16avos", rotulo: "16-avos" },
  { valor: "oitavas", rotulo: "Oitavas" },
  { valor: "quartas", rotulo: "Quartas" },
  { valor: "semi", rotulo: "Semifinal" },
  { valor: "terceiro", rotulo: "3º lugar" },
  { valor: "final", rotulo: "Final" },
] as const;

const FMT_DATA = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export default function LinhaJogo({
  jogo,
  casa,
  fora,
  rotuloFase,
  rodadas,
  selecoes,
}: {
  jogo: Jogo;
  casa: { codigo: string; nome: string; iso2: string | null } | null;
  fora: { codigo: string; nome: string; iso2: string | null } | null;
  rotuloFase: string | null;
  rodadas: RodadaLite[];
  selecoes: SelecaoLite[];
}) {
  const [editando, setEditando] = useState(false);

  const dataLabel = (() => {
    const d = new Date(jogo.data_hora);
    return Number.isNaN(d.getTime()) ? "—" : FMT_DATA.format(d);
  })();

  const grupoFaseLabel = [rotuloFase, jogo.grupo ? `Grupo ${jogo.grupo}` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="relative flex flex-col overflow-hidden rounded-xl border border-border bg-surface">
      {/* Header: data + status + badges */}
      <div className="flex items-center justify-between gap-2 border-b border-border/60 bg-surface-container px-3 py-2">
        <div className="flex items-center gap-1.5 text-label-sm text-text-secondary">
          <Icon name="calendar_today" size={15} />
          <span className="tabular-data">{dataLabel}</span>
          {grupoFaseLabel && (
            <span className="text-text-secondary/70">· {grupoFaseLabel}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {jogo.classico && <Badge variante="classico" />}
          {jogo.invalidado && <Badge variante="invalidado" />}
          <StatusPill encerrado={jogo.encerrado} invalidado={jogo.invalidado} />
        </div>
      </div>

      {/* Corpo: times + placar / mini-form de resultado */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between gap-2">
          <TimeBloco selecao={casa} rotulo={jogo.rotulo_casa} />
          <PlacarResultado jogo={jogo} />
          <TimeBloco selecao={fora} rotulo={jogo.rotulo_fora} />
        </div>
      </div>

      {/* Acoes: toggles + editar/excluir */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-surface-container-low px-3 py-2">
        <div className="flex items-center gap-3">
          <ToggleAcao
            id={jogo.id}
            ativo={jogo.classico}
            action={alternarClassico}
            corAtivo="text-tertiary"
            label="Clássico"
          />
          <ToggleAcao
            id={jogo.id}
            ativo={jogo.invalidado}
            action={alternarInvalidado}
            corAtivo="text-error-red"
            label="Anular"
          />
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setEditando((v) => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-variant hover:text-primary"
            aria-label="Editar jogo"
            aria-pressed={editando}
          >
            <Icon name="edit" size={18} />
          </button>
          <BotaoExcluir id={jogo.id} />
        </div>
      </div>

      {/* Form de edicao de metadados (colapsavel) */}
      {editando && (
        <FormEditarJogo
          jogo={jogo}
          rodadas={rodadas}
          selecoes={selecoes}
          aoFechar={() => setEditando(false)}
        />
      )}
    </article>
  );
}

// ---------------------------------------------------------------------------
// Subcomponentes apresentacionais / interativos
// ---------------------------------------------------------------------------

function TimeBloco({
  selecao,
  rotulo,
}: {
  selecao: { codigo: string; nome: string; iso2: string | null } | null;
  rotulo: string | null;
}) {
  // Mata-mata sem time definido: mostra o rotulo de vaga (texto, sem bandeira).
  if (!selecao) {
    return (
      <div className="flex w-[34%] flex-col items-center justify-center gap-2">
        <span className="text-body-md leading-tight text-text-secondary text-center">
          {rotulo ?? "A definir"}
        </span>
      </div>
    );
  }
  return (
    <div className="flex w-[34%] flex-col items-center gap-2">
      <Bandeira iso2={selecao.iso2} nome={selecao.nome} width={40} />
      <span className="text-body-lg font-semibold leading-tight text-text-primary">
        {selecao.codigo}
      </span>
    </div>
  );
}

function StatusPill({
  encerrado,
  invalidado,
}: {
  encerrado: boolean;
  invalidado: boolean;
}) {
  if (invalidado) return null;
  const label = encerrado ? "Encerrado" : "Aberto";
  const classes = encerrado
    ? "bg-success-emerald/15 text-success-emerald border-success-emerald/40"
    : "bg-surface-variant text-text-secondary border-border";
  return (
    <span
      className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${classes}`}
    >
      {label}
    </span>
  );
}

/** Placar: mini-form casa x fora (lancar/editar resultado). */
function PlacarResultado({ jogo }: { jogo: Jogo }) {
  const [state, formAction] = useActionState<JogoActionState, FormData>(
    lancarResultado,
    undefined,
  );

  return (
    <form
      action={formAction}
      className="flex w-[32%] flex-col items-center gap-1.5"
    >
      <input type="hidden" name="id" value={jogo.id} />
      <div className="flex items-center justify-center gap-1.5">
        <input
          name="placar_casa"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={2}
          defaultValue={jogo.placar_casa ?? ""}
          aria-label="Placar casa"
          className="h-11 w-11 rounded-lg border border-border bg-surface-container-low text-center text-headline-md font-semibold tabular-data text-text-primary outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
        <span className="text-body-md text-text-secondary">x</span>
        <input
          name="placar_fora"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={2}
          defaultValue={jogo.placar_fora ?? ""}
          aria-label="Placar fora"
          className="h-11 w-11 rounded-lg border border-border bg-surface-container-low text-center text-headline-md font-semibold tabular-data text-text-primary outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>
      <SubmitButton
        pendingLabel="…"
        className="bg-primary px-3 py-1 text-on-primary hover:opacity-90"
      >
        {jogo.encerrado ? "Editar" : "Lançar"}
      </SubmitButton>
      <MensagemErro mensagem={state?.error} />
    </form>
  );
}

/** Toggle (clássico/anular) que dispara uma Server Action por bind do id. */
function ToggleAcao({
  id,
  ativo,
  action,
  corAtivo,
  label,
}: {
  id: string;
  ativo: boolean;
  action: (id: string) => Promise<void>;
  corAtivo: string;
  label: string;
}) {
  const acaoComId = action.bind(null, id);
  return (
    <form action={acaoComId}>
      <button
        type="submit"
        aria-pressed={ativo}
        className={`flex items-center gap-1.5 text-label-sm font-medium transition-colors ${
          ativo ? corAtivo : "text-text-secondary hover:text-text-primary"
        }`}
      >
        <Icon
          name={ativo ? "check_box" : "check_box_outline_blank"}
          size={18}
        />
        {label}
      </button>
    </form>
  );
}

/** Excluir com confirmacao no client antes de disparar a Server Action. */
function BotaoExcluir({ id }: { id: string }) {
  const acaoComId = excluirJogo.bind(null, id);
  return (
    <form
      action={acaoComId}
      onSubmit={(e) => {
        if (
          !window.confirm(
            "Excluir este jogo? Os palpites vinculados serão removidos.",
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-variant hover:text-error-red"
        aria-label="Excluir jogo"
      >
        <Icon name="delete" size={18} />
      </button>
    </form>
  );
}

/** Form de edicao dos metadados do jogo (rodada, fase, grupo, times, data). */
function FormEditarJogo({
  jogo,
  rodadas,
  selecoes,
  aoFechar,
}: {
  jogo: Jogo;
  rodadas: RodadaLite[];
  selecoes: SelecaoLite[];
  aoFechar: () => void;
}) {
  const [state, formAction] = useActionState<JogoActionState, FormData>(
    atualizarJogo,
    undefined,
  );
  const erroAnterior = useRef<string | undefined>(undefined);

  // Sucesso (sem erro apos submit) -> fecha o editor.
  useEffect(() => {
    if (state === undefined && erroAnterior.current !== undefined) {
      aoFechar();
    }
    erroAnterior.current = state?.error;
  }, [state, aoFechar]);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 border-t border-border bg-surface-container-low p-4"
    >
      <input type="hidden" name="id" value={jogo.id} />

      <Campo label="Rodada">
        <select
          name="rodada_id"
          defaultValue={jogo.rodada_id}
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
          <select
            name="time_casa_cod"
            defaultValue={jogo.time_casa_cod ?? ""}
            required
            className={INPUT_CLASS}
          >
            <option value="">—</option>
            {selecoes.map((s) => (
              <option key={s.codigo} value={s.codigo}>
                {s.nome}
              </option>
            ))}
          </select>
        </Campo>
        <Campo label="Seleção fora">
          <select
            name="time_fora_cod"
            defaultValue={jogo.time_fora_cod ?? ""}
            required
            className={INPUT_CLASS}
          >
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
          <select
            name="fase"
            defaultValue={jogo.fase ?? ""}
            className={INPUT_CLASS}
          >
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
            defaultValue={jogo.grupo ?? ""}
            placeholder="A"
            className={`${INPUT_CLASS} uppercase`}
          />
        </Campo>
      </div>

      <Campo label="Data e hora">
        <input
          name="data_hora"
          type="datetime-local"
          defaultValue={isoParaInputLocal(jogo.data_hora)}
          required
          className={INPUT_CLASS}
        />
      </Campo>

      <MensagemErro mensagem={state?.error} />

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={aoFechar}
          className="rounded px-3 py-1.5 text-label-sm font-medium text-text-secondary hover:text-text-primary"
        >
          Cancelar
        </button>
        <SubmitButton pendingLabel="Salvando…">Salvar</SubmitButton>
      </div>
    </form>
  );
}

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
