"use client";

import { useState, useTransition } from "react";
import LadoTime from "@/components/LadoTime";
import {
  marcarFaltantesWOParticipante,
  marcarWO,
  salvarPalpite,
} from "@/app/actions/palpites";
import type { LinhaJogoPalpite } from "./tipos";

/** Estado editavel local de cada linha (jogo) do grid. */
interface EstadoLinha {
  jogoId: string;
  casa: string; // string p/ permitir vazio durante edicao
  fora: string;
  wo: boolean;
  encerrado: boolean;
  pontos: number;
  cravada: boolean;
}

/** Sanitiza entrada de placar: so digitos, max 2 chars. */
function sanitizar(v: string): string {
  return v.replace(/\D/g, "").slice(0, 2);
}

/** Converte LadoJogo p/ a prop `selecao` do LadoTime (ou null = rotulo). */
function selecaoDe(lado: LinhaJogoPalpite["casa"]) {
  if (!lado.codigo) return null;
  return { codigo: lado.codigo, nome: lado.nome ?? lado.codigo, iso2: lado.iso2 };
}

/**
 * Grid de lancamento de palpites de UM palpiteiro numa rodada (modo
 * "Por palpiteiro"). Cada linha e um jogo da rodada: placar casa x fora +
 * toggle WO. Reusa as Server Actions salvarPalpite/marcarWO (sao por
 * participante/jogo). Botao "marcar faltantes como WO" cobre so esta rodada.
 */
export default function GridPalpiteiro({
  participanteId,
  participanteNome,
  linhas,
}: {
  participanteId: string;
  participanteNome: string;
  linhas: LinhaJogoPalpite[];
}) {
  const [estado, setEstado] = useState<EstadoLinha[]>(() =>
    linhas.map((l) => ({
      jogoId: l.jogoId,
      casa: l.palpiteCasa !== null ? String(l.palpiteCasa) : "",
      fora: l.palpiteFora !== null ? String(l.palpiteFora) : "",
      wo: l.wo,
      encerrado: l.encerrado,
      pontos: l.pontos,
      cravada: l.cravada,
    })),
  );
  const [pendingSalvar, startSalvar] = useTransition();
  const [pendingWO, startFaltantes] = useTransition();
  const [feedback, setFeedback] = useState<
    { tipo: "ok" | "erro"; msg: string } | null
  >(null);

  // Mapa jogoId -> dados de render (confronto/hora), p/ uso fora do estado.
  const linhaPorId = new Map(linhas.map((l) => [l.jogoId, l]));

  function atualizar(id: string, patch: Partial<EstadoLinha>) {
    setEstado((prev) =>
      prev.map((l) => (l.jogoId === id ? { ...l, ...patch } : l)),
    );
    setFeedback(null);
  }

  function toggleWO(id: string, checked: boolean) {
    setEstado((prev) =>
      prev.map((l) =>
        l.jogoId === id
          ? checked
            ? { ...l, wo: true, casa: "", fora: "" }
            : { ...l, wo: false }
          : l,
      ),
    );
    setFeedback(null);
  }

  function salvarTudo() {
    // Validacao client (espelha o servidor): linhas nao-WO precisam de ambos
    // os placares quando ha qualquer um preenchido.
    for (const l of estado) {
      if (l.wo) continue;
      const temAlgum = l.casa !== "" || l.fora !== "";
      if (!temAlgum) continue; // sem palpite e sem WO -> ignorado
      if (l.casa === "" || l.fora === "") {
        const lin = linhaPorId.get(l.jogoId);
        const rotulo = lin
          ? `${lin.casa.codigo ?? lin.casa.rotulo ?? "?"} x ${lin.fora.codigo ?? lin.fora.rotulo ?? "?"}`
          : "este jogo";
        setFeedback({
          tipo: "erro",
          msg: `Preencha os dois placares de ${rotulo} ou marque WO.`,
        });
        return;
      }
    }

    startSalvar(async () => {
      let salvos = 0;
      for (const l of estado) {
        if (l.wo) {
          const r = await marcarWO(participanteId, l.jogoId);
          if (!r.ok) {
            setFeedback({ tipo: "erro", msg: r.error });
            return;
          }
          salvos++;
          continue;
        }
        if (l.casa === "" && l.fora === "") continue; // nada a salvar
        const casa = Number(l.casa);
        const fora = Number(l.fora);
        const r = await salvarPalpite(participanteId, l.jogoId, casa, fora);
        if (!r.ok) {
          setFeedback({ tipo: "erro", msg: r.error });
          return;
        }
        salvos++;
      }
      setFeedback({
        tipo: "ok",
        msg:
          salvos > 0
            ? `${salvos} palpite(s) salvos.`
            : "Nenhum palpite para salvar.",
      });
    });
  }

  function faltantesWO() {
    startFaltantes(async () => {
      const ids = estado.map((l) => l.jogoId);
      const r = await marcarFaltantesWOParticipante(participanteId, ids);
      if (!r.ok) {
        setFeedback({ tipo: "erro", msg: r.error });
        return;
      }
      // Marca localmente como WO os jogos que ainda nao tinham nada preenchido.
      setEstado((prev) =>
        prev.map((l) =>
          !l.wo && l.casa === "" && l.fora === "" ? { ...l, wo: true } : l,
        ),
      );
      setFeedback({ tipo: "ok", msg: "Faltantes da rodada marcados como WO." });
    });
  }

  const ocupado = pendingSalvar || pendingWO;

  return (
    <div className="flex flex-col gap-3">
      {/* Cabecalho do palpiteiro */}
      <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-edge-margin py-3">
        <span
          className="material-symbols-outlined text-[20px] text-primary"
          aria-hidden="true"
        >
          person
        </span>
        <span className="text-body-lg font-semibold text-text-primary">
          {participanteNome}
        </span>
      </div>

      {/* Tabela */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-surface-container-high px-edge-margin py-2">
          <span className="flex-1 text-table-header font-bold uppercase tracking-wide text-text-secondary">
            Jogo
          </span>
          <div className="flex items-center gap-4">
            <span className="w-[7.5rem] text-center text-table-header font-bold uppercase tracking-wide text-text-secondary">
              Placar
            </span>
            <span className="w-10 text-center text-table-header font-bold uppercase tracking-wide text-text-secondary">
              WO
            </span>
          </div>
        </div>

        {/* Linhas */}
        <div className="divide-y divide-border">
          {estado.map((l, i) => {
            const lin = linhaPorId.get(l.jogoId);
            if (!lin) return null;
            const casaCod = lin.casa.codigo ?? lin.casa.rotulo ?? "—";
            const foraCod = lin.fora.codigo ?? lin.fora.rotulo ?? "—";
            return (
              <div
                key={l.jogoId}
                className={`flex items-center justify-between px-edge-margin py-2.5 ${
                  i % 2 === 1 ? "bg-zebra" : "bg-surface"
                }`}
              >
                <div
                  className={`flex min-w-0 flex-1 flex-col gap-0.5 ${
                    l.wo ? "opacity-50" : ""
                  }`}
                >
                  <span className="text-[10px] text-text-secondary">
                    {lin.hora}
                    {lin.encerrado ? " · encerrado" : ""}
                  </span>
                  <div
                    className={`flex min-w-0 items-center gap-1.5 ${
                      l.wo ? "line-through" : ""
                    }`}
                  >
                    <LadoTime selecao={selecaoDe(lin.casa)} rotulo={lin.casa.rotulo} width={18} />
                    <span className="text-[10px] text-text-secondary">x</span>
                    <LadoTime selecao={selecaoDe(lin.fora)} rotulo={lin.fora.rotulo} width={18} />
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-4">
                  <div className="flex w-[7.5rem] items-center justify-center gap-1">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={2}
                      aria-label={`Placar ${casaCod}`}
                      value={l.casa}
                      disabled={l.wo || ocupado}
                      onChange={(e) =>
                        atualizar(l.jogoId, { casa: sanitizar(e.target.value) })
                      }
                      placeholder="–"
                      className="h-11 w-11 rounded-lg border border-border bg-surface text-center text-body-lg font-semibold text-text-primary tabular-data focus:border-primary-container focus:outline-none focus:ring-1 focus:ring-primary-container disabled:bg-surface-variant disabled:text-text-secondary"
                    />
                    <span className="text-body-md text-text-secondary">x</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={2}
                      aria-label={`Placar ${foraCod}`}
                      value={l.fora}
                      disabled={l.wo || ocupado}
                      onChange={(e) =>
                        atualizar(l.jogoId, { fora: sanitizar(e.target.value) })
                      }
                      placeholder="–"
                      className="h-11 w-11 rounded-lg border border-border bg-surface text-center text-body-lg font-semibold text-text-primary tabular-data focus:border-primary-container focus:outline-none focus:ring-1 focus:ring-primary-container disabled:bg-surface-variant disabled:text-text-secondary"
                    />
                  </div>
                  <div className="flex w-10 justify-center">
                    <input
                      type="checkbox"
                      aria-label={`Marcar WO em ${casaCod} x ${foraCod}`}
                      checked={l.wo}
                      disabled={ocupado}
                      onChange={(e) => toggleWO(l.jogoId, e.target.checked)}
                      className="h-5 w-5 cursor-pointer appearance-none rounded border-2 border-border bg-transparent transition-colors checked:border-error-red checked:bg-error-red disabled:opacity-50"
                      style={{
                        backgroundImage: l.wo
                          ? "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z'/%3E%3C/svg%3E\")"
                          : undefined,
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "center",
                        backgroundSize: "contain",
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Acao rapida */}
        <div className="border-t border-border px-edge-margin py-3">
          <button
            type="button"
            onClick={faltantesWO}
            disabled={ocupado}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-border py-2 text-label-sm font-medium text-text-secondary transition-colors hover:bg-surface-variant disabled:opacity-60"
          >
            <span
              className="material-symbols-outlined text-[18px]"
              aria-hidden="true"
            >
              {pendingWO ? "progress_activity" : "warning"}
            </span>
            Marcar faltantes da rodada como WO
          </button>
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <p
          className={`flex items-center gap-1.5 text-label-sm ${
            feedback.tipo === "ok" ? "text-success-emerald" : "text-error-red"
          }`}
          role="status"
        >
          <span
            className="material-symbols-outlined text-[16px]"
            aria-hidden="true"
          >
            {feedback.tipo === "ok" ? "check_circle" : "error"}
          </span>
          {feedback.msg}
        </p>
      )}

      {/* Salvar */}
      <button
        type="button"
        onClick={salvarTudo}
        disabled={ocupado}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-body-lg font-semibold text-on-primary transition-colors hover:bg-primary/90 disabled:opacity-60"
      >
        <span
          className="material-symbols-outlined text-[20px]"
          aria-hidden="true"
        >
          {pendingSalvar ? "progress_activity" : "save"}
        </span>
        {pendingSalvar ? "Salvando…" : "Salvar palpites"}
      </button>
    </div>
  );
}
