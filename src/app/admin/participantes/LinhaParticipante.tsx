"use client";

import { useState, useTransition } from "react";
import Bandeira from "@/components/Bandeira";
import Icon from "@/components/Icon";
import { excluirParticipante } from "@/app/actions/participantes";
import type { Participante, Selecao } from "@/lib/types";
import FormParticipante from "./FormParticipante";
import TogglePago from "./TogglePago";

/**
 * LinhaParticipante — card denso de um participante.
 * Mostra nome, contato, selecao campea (bandeira + nome), toggle pago,
 * e acoes de editar/excluir. Editar abre o FormParticipante controlado.
 */

interface LinhaParticipanteProps {
  participante: Participante;
  selecoes: Selecao[];
  prazoExpirado: boolean;
  zebra: boolean;
}

export default function LinhaParticipante({
  participante,
  selecoes,
  prazoExpirado,
  zebra,
}: LinhaParticipanteProps) {
  const [editando, setEditando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [excluindo, startExcluir] = useTransition();

  const campea =
    participante.selecao_campea != null
      ? selecoes.find((s) => s.codigo === participante.selecao_campea)
      : undefined;

  function excluir() {
    startExcluir(async () => {
      await excluirParticipante(participante.id);
      setConfirmando(false);
    });
  }

  return (
    <>
      <li
        className={`group flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:border-primary-container ${
          zebra ? "bg-zebra" : "bg-surface"
        }`}
      >
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-body-lg font-semibold text-text-primary">
              {participante.nome}
            </span>
            {!participante.pago && (
              <span className="shrink-0 rounded bg-error-red/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-error-red">
                Pendente
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-label-sm text-text-secondary">
            <span className="flex items-center gap-1">
              <Icon name="sports_soccer" size={14} />
              {campea ? (
                <span className="flex items-center gap-1">
                  <Bandeira iso2={campea.iso2} nome={campea.nome} width={16} />
                  {campea.nome}
                </span>
              ) : (
                "Sem palpite"
              )}
            </span>
            {participante.contato && (
              <span className="flex items-center gap-1">
                <Icon name="call" size={14} />
                {participante.contato}
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <TogglePago id={participante.id} pago={participante.pago} />
          <button
            type="button"
            onClick={() => setEditando(true)}
            aria-label={`Editar ${participante.nome}`}
            className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-surface-variant hover:text-primary"
          >
            <Icon name="edit" size={20} />
          </button>
          <button
            type="button"
            onClick={() => setConfirmando(true)}
            aria-label={`Excluir ${participante.nome}`}
            className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-surface-variant hover:text-error-red"
          >
            <Icon name="delete" size={20} />
          </button>
        </div>
      </li>

      {/* Form de edicao (controlado) */}
      <FormParticipante
        modo="editar"
        selecoes={selecoes}
        prazoExpirado={prazoExpirado}
        participante={participante}
        aberto={editando}
        onFechar={() => setEditando(false)}
      />

      {/* Confirmacao de exclusao */}
      {confirmando && (
        <>
          <button
            type="button"
            aria-label="Cancelar"
            onClick={() => setConfirmando(false)}
            className="fixed inset-0 z-50 bg-black/60"
          />
          <div className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-sm -translate-y-1/2 rounded-2xl border border-border bg-surface-container-high p-5 shadow-2xl md:left-1/2 md:right-auto md:-translate-x-1/2">
            <h3 className="text-headline-md font-semibold text-text-primary">
              Excluir participante?
            </h3>
            <p className="mt-2 text-body-md text-text-secondary">
              <span className="font-semibold text-text-primary">
                {participante.nome}
              </span>{" "}
              e todos os seus palpites serão removidos. Esta ação não pode ser
              desfeita.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmando(false)}
                disabled={excluindo}
                className="flex-1 rounded-lg border border-border py-2.5 text-body-md font-medium text-text-secondary transition-colors hover:bg-surface-variant disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={excluir}
                disabled={excluindo}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-error-red py-2.5 text-body-md font-semibold text-white transition-colors hover:bg-error-red/90 disabled:opacity-60"
              >
                <Icon name="delete" size={18} />
                {excluindo ? "Excluindo..." : "Excluir"}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
